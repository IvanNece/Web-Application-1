import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { get, all, run, withTransaction } from '../lib/db.js';
import { ensureLoggedIn } from '../auth/passport.js';
import { costForLetter, isVowel } from '../lib/costs.js';

const router = Router();

/* ========== Utils comuni ========== */
function nowMs() { return Date.now(); }
function timeLeft(expiresAt) { return Math.max(0, expiresAt - nowMs()); }
function up(ch) { return (ch || '').toUpperCase(); }

function computeSpacesIndexes(phraseText) {
  const out = [];
  for (let i = 0; i < phraseText.length; i++) if (phraseText[i] === ' ') out.push(i);
  return out;
}

async function readCoins(userId) {
  const u = await get('SELECT coins FROM users WHERE id = ?', [userId]);
  return u?.coins ?? 0;
}

async function collectRevealedIndexes(gameId, phraseText) {
  const rows = await all(
    `SELECT DISTINCT letter FROM game_letters WHERE gameId = ? AND wasHit = 1`,
    [gameId]
  );
  const hits = new Set(rows.map(r => r.letter.toUpperCase()));
  const revealed = [];
  for (let i = 0; i < phraseText.length; i++) {
    const ch = phraseText[i];
    if (ch !== ' ' && hits.has(ch.toUpperCase())) revealed.push(i);
  }
  return revealed;
}

// Nuova funzione per raccogliere le lettere rivelate con le loro posizioni (anti-cheat safe)
async function collectRevealedLetters(gameId, phraseText) {
  const rows = await all(
    `SELECT DISTINCT letter FROM game_letters WHERE gameId = ? AND wasHit = 1`,
    [gameId]
  );
  const hits = new Set(rows.map(r => r.letter.toUpperCase()));
  const revealedMap = {};
  
  for (let i = 0; i < phraseText.length; i++) {
    const ch = phraseText[i];
    if (ch !== ' ' && hits.has(ch.toUpperCase())) {
      revealedMap[i] = ch.toUpperCase();
    }
  }
  return revealedMap;
}

async function loadGameWithPhrase(gameId) {
  return await get(
    `SELECT g.*, p.text AS phraseText
     FROM games g JOIN phrases p ON g.phraseId = p.id
     WHERE g.id = ?`,
    [gameId]
  );
}

async function applyTimeoutIfNeeded(game, userId) {
  if (game.status !== 'running') return null;
  if (nowMs() < game.expiresAt) return null;

  // timeout: penalità 20 (o tutte se <20)
  await withTransaction(async () => {
    const u = await get('SELECT coins FROM users WHERE id = ?', [userId]);
    const penalty = Math.min(20, u.coins);
    await run(`UPDATE games SET status='timeout', coinsDelta = coinsDelta - ? WHERE id = ?`, [penalty, game.id]);
    await run(`UPDATE users SET coins = coins - ? WHERE id = ?`, [penalty, userId]);
  });

  return await loadGameWithPhrase(game.id);
}

/* ========== Crea partita ========== */
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const user = await get('SELECT id, coins FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.coins <= 0) return res.status(403).json({ error: 'Not enough coins to start a game' });

    const phrase = await get(
      "SELECT id, text FROM phrases WHERE mode = 'auth' ORDER BY RANDOM() LIMIT 1"
    );
    if (!phrase) return res.status(500).json({ error: 'No phrase available' });

    const startedAt = nowMs();
    const expiresAt = startedAt + 60_000;

    const ins = await run(
      `INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
       VALUES (?, ?, 'running', ?, ?, 0, 0, 0)`,
      [user.id, phrase.id, startedAt, expiresAt]
    );

    return res.status(201).json({
      gameId: ins.lastID,
      status: 'running',
      phraseLength: phrase.text.length,
      spaces: computeSpacesIndexes(phrase.text),
      revealed: [],
      hasUsedVowel: false,
      timeLeft: 60_000,
      coins: user.coins
    });
  } catch (err) { next(err); }
});

/* ========== Stato partita ========== */
router.get('/:id',
  ensureLoggedIn,
  [param('id').isInt({ min: 1 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game id' });

      let game = await loadGameWithPhrase(req.params.id);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      if (game.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      // timeout?
      const t = await applyTimeoutIfNeeded(game, req.user.id);
      if (t) game = t;

      const payload = {
        gameId: game.id,
        status: game.status,
        phraseLength: game.phraseText.length,
        spaces: computeSpacesIndexes(game.phraseText),
        revealed: await collectRevealedIndexes(game.id, game.phraseText),
        revealedLetters: game.status === 'running' 
          ? await collectRevealedLetters(game.id, game.phraseText)
          : {}, // Solo durante il gioco per anti-cheat
        hasUsedVowel: !!game.hasUsedVowel,
        timeLeft: game.status === 'running' ? timeLeft(game.expiresAt) : 0,
        coins: await readCoins(req.user.id),
      };

      if (game.status !== 'running') payload.phrase = game.phraseText;
      return res.json(payload);
    } catch (err) { next(err); }
  }
);

/* ========== Indovina lettera ========== */
router.post('/:id/guess-letter',
  ensureLoggedIn,
  [
    param('id').isInt({ min: 1 }),
    body('letter').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });

      const gameId = Number(req.params.id);
      let game = await loadGameWithPhrase(gameId);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      if (game.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      // timeout?
      const t = await applyTimeoutIfNeeded(game, req.user.id);
      if (t) {
        return res.status(409).json({
          error: 'Game already ended (timeout)',
          status: t.status, phrase: t.phraseText
        });
      }
      if (game.status !== 'running') {
        return res.status(409).json({ error: `Game already ended (${game.status})` });
      }

      const letter = up(req.body.letter);

      // Se lettera già tentata → costo 0, nessun cambiamento
      const prev = await get(
        'SELECT 1 FROM game_letters WHERE gameId = ? AND letter = ? LIMIT 1',
        [gameId, letter]
      );
      if (prev) {
        return res.json({
          revealedIndexes: [], // niente di nuovo
          costApplied: 0,
          coins: await readCoins(req.user.id),
          hasUsedVowel: !!game.hasUsedVowel,
          timeLeft: timeLeft(game.expiresAt)
        });
      }

      // Regole di costo
      let cost = costForLetter(letter);   // vocali=10, consonanti 5→1
      let hit = false;

      const present = game.phraseText.toUpperCase().includes(letter);
      if (!present) cost = cost * 2; // raddoppio su miss
      else hit = true;

      // Vincolo "una sola vocale"
      if (isVowel(letter) && game.hasUsedVowel) {
        return res.status(400).json({ error: 'Only one vowel per game' });
      }

      // Monete sufficienti?
      const coinsNow = await readCoins(req.user.id);
      if (coinsNow <= 0) {
        return res.status(403).json({ error: 'No coins left for letters' });
      }
      if (cost > coinsNow) {
        return res.status(403).json({ error: 'Not enough coins' });
      }

      // Applica effetti in transazione
      await withTransaction(async () => {
        // segna uso vocale
        if (isVowel(letter)) {
          await run('UPDATE games SET hasUsedVowel = 1 WHERE id = ?', [gameId]);
        }
        // sottrai monete
        await run('UPDATE users SET coins = coins - ? WHERE id = ?', [cost, req.user.id]);
        // logga il tentativo
        await run(
          `INSERT INTO game_letters(gameId, letter, wasHit, costApplied, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          [gameId, letter, hit ? 1 : 0, cost, nowMs()]
        );
        // aggiorna contatore spesa nella partita (informativo)
        await run('UPDATE games SET coinsSpent = coinsSpent + ? WHERE id = ?', [cost, gameId]);
      });

      // Calcola indici rivelati SOLO per questa lettera (non tutti)
      const revealedIndexes = [];
      if (hit) {
        const P = game.phraseText;
        for (let i = 0; i < P.length; i++) if (P[i].toUpperCase() === letter) revealedIndexes.push(i);
      }

      return res.json({
        revealedIndexes,
        revealed: await collectRevealedIndexes(gameId, game.phraseText),
        revealedLetters: await collectRevealedLetters(gameId, game.phraseText),
        costApplied: cost,
        coins: coinsNow - cost,
        hasUsedVowel: isVowel(letter) ? true : !!game.hasUsedVowel,
        timeLeft: timeLeft(game.expiresAt)
      });
    } catch (err) { next(err); }
  }
);

/* ========== Indovina frase intera ========== */
router.post('/:id/guess-phrase',
  ensureLoggedIn,
  [
    param('id').isInt({ min: 1 }),
    body('attempt').isString().trim().isLength({ min: 1 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });

      const gameId = Number(req.params.id);
      let game = await loadGameWithPhrase(gameId);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      if (game.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      // timeout?
      const t = await applyTimeoutIfNeeded(game, req.user.id);
      if (t) {
        return res.status(409).json({
          error: 'Game already ended (timeout)',
          status: t.status, phrase: t.phraseText
        });
      }
      if (game.status !== 'running') {
        return res.status(409).json({ error: `Game already ended (${game.status})` });
      }

      const attempt = (req.body.attempt || '').toUpperCase();
      const target  = game.phraseText.toUpperCase();

      if (attempt === target) {
        // Vittoria: +100 monete
        await withTransaction(async () => {
          await run(`UPDATE games SET status='won', coinsDelta = coinsDelta + 100 WHERE id = ?`, [gameId]);
          await run(`UPDATE users SET coins = coins + 100 WHERE id = ?`, [req.user.id]);
        });
        return res.json({
          result: 'win',
          status: 'won',
          coinsDelta: +100,
          phrase: game.phraseText
        });
      } else {
        // Sbagliata: nessuna penalità
        return res.json({
          result: 'wrong',
          status: 'running',
          message: 'Not the correct phrase',
          timeLeft: timeLeft(game.expiresAt),
          coins: await readCoins(req.user.id) 
        });
      }
    } catch (err) { next(err); }
  }
);

/* ========== Abbandona ========== */
router.post('/:id/abandon',
  ensureLoggedIn,
  [param('id').isInt({ min: 1 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game id' });

      const gameId = Number(req.params.id);
      let game = await loadGameWithPhrase(gameId);
      if (!game) return res.status(404).json({ error: 'Game not found' });
      if (game.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      // Se già finita, restituisco stato attuale
      if (game.status !== 'running') {
        return res.json({
          status: game.status,
          phrase: game.phraseText
        });
      }

      // Abbandono senza penalità
      await run(`UPDATE games SET status='abandoned' WHERE id = ?`, [gameId]);

      return res.json({
        status: 'abandoned',
        phrase: game.phraseText
      });
    } catch (err) { next(err); }
  }
);

export default router;
