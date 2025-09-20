import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { get, all, run, withTransaction } from '../lib/db.js';
import { ensureLoggedIn } from '../auth/passport.js';
import { costForLetter, isVowel } from '../lib/costs.js';

// ═══════════════════════════════════════════════════════════════════════════════════
// CONFIGURAZIONE E SETUP
// ═══════════════════════════════════════════════════════════════════════════════════

const GAME_TIMER_MS = 60_000; // Timer partite autenticate (60 secondi)
const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════════
// FUNZIONI UTILITY GENERICHE
// Operazioni di base utilizzate in tutto il modulo
// ═══════════════════════════════════════════════════════════════════════════════════

function nowMs() { return Date.now(); }
function timeLeft(expiresAt) { return Math.max(0, expiresAt - nowMs()); }
function up(ch) { return (ch || '').toUpperCase(); }

// Calcola posizioni degli spazi nella frase
function computeSpacesIndexes(phraseText) {
  const out = [];
  for (let i = 0; i < phraseText.length; i++) if (phraseText[i] === ' ') out.push(i);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// FUNZIONI DATABASE E LOGICA DI GIOCO
// Operazioni specifiche per la gestione delle partite
// ═══════════════════════════════════════════════════════════════════════════════════

// Lettura monete utente dal database
async function readCoins(userId) {
  const u = await get('SELECT coins FROM users WHERE id = ?', [userId]);
  return u?.coins ?? 0;
}

// Recupera indici delle posizioni con lettere già rivelate
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

// Mappa lettere rivelate con posizioni (protezione anti-cheat)
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

// Carica partita completa con testo frase dal database
async function loadGameWithPhrase(gameId) {
  return await get(
    `SELECT g.*, p.text AS phraseText
     FROM games g JOIN phrases p ON g.phraseId = p.id
     WHERE g.id = ?`,
    [gameId]
  );
}

// Gestisce timeout automatico con applicazione penalità
async function applyTimeoutIfNeeded(game, userId) {
  if (game.status !== 'running') return null;
  if (nowMs() < game.expiresAt) return null;

  // Applica penalità di 20 monete (o tutte se insufficienti)
  await withTransaction(async () => {
    const u = await get('SELECT coins FROM users WHERE id = ?', [userId]);
    const penalty = Math.min(20, u.coins);
    await run(`UPDATE games SET status='timeout', coinsDelta = coinsDelta - ? WHERE id = ?`, [penalty, game.id]);
    await run(`UPDATE users SET coins = coins - ? WHERE id = ?`, [penalty, userId]);
  });

  return await loadGameWithPhrase(game.id);
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ENDPOINT API - GESTIONE PARTITE
// Tutte le route per creare, gestire e terminare le partite autenticate
// ═══════════════════════════════════════════════════════════════════════════════════

// POST / - Creazione nuova partita autenticata
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const user = await get('SELECT id, coins FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    console.log(`\x1b[33m[DEBUG] Utente ${req.user.id} sta tentando di creare una partita con ${user.coins} monete\x1b[0m`);
    
    if (user.coins <= 0) {
      console.log(`\x1b[31m[ERROR 403] MONETE INSUFFICIENTI: Utente ${req.user.id} ha ${user.coins} monete (minimo richiesto: 1)\x1b[0m`);
      return res.status(403).json({ error: '💸 Non hai abbastanza monete per iniziare una partita! 🎮' });
    }

    // Seleziona frase casuale per modalità autenticata
    const phrase = await get(
      "SELECT id, text FROM phrases WHERE mode = 'auth' ORDER BY RANDOM() LIMIT 1"
    );
    if (!phrase) return res.status(500).json({ error: 'No phrase available' });

    const startedAt = nowMs();
    const expiresAt = startedAt + GAME_TIMER_MS;

    const ins = await run(
      `INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
       VALUES (?, ?, 'running', ?, ?, 0, 0, 0)`,
      [user.id, phrase.id, startedAt, expiresAt]
    );

    console.log(`\x1b[32m[Game ${ins.lastID}] Frase scelta: "${phrase.text}"\x1b[0m`);

    return res.status(201).json({
      gameId: ins.lastID,
      status: 'running',
      phraseLength: phrase.text.length,
      spaces: computeSpacesIndexes(phrase.text),
      revealed: [],
      hasUsedVowel: false,
      timeLeft: GAME_TIMER_MS,
      coins: user.coins
    });
  } catch (err) { next(err); }
});

// GET /:id - Recupera stato attuale partita
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

      // Verifica timeout e applica penalità se necessario
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
          : {}, // Mappa lettere solo durante gioco (sicurezza anti-cheat)
        hasUsedVowel: !!game.hasUsedVowel,
        timeLeft: game.status === 'running' ? timeLeft(game.expiresAt) : 0,
        coins: await readCoins(req.user.id),
      };

      // Mostra frase completa solo a gioco terminato
      if (game.status !== 'running') payload.phrase = game.phraseText;
      return res.json(payload);
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────────
// ENDPOINT AZIONI DI GIOCO
// ─────────────────────────────────────────────────────────────────────────────────

// POST /:id/guess-letter - Indovina singola lettera
router.post('/:id/guess-letter',
  ensureLoggedIn,
  [
    param('id').isInt({ min: 1 }),
    body('letter').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Gestione errori specifici per validazione input
        if (req.body.letter === undefined || req.body.letter === null) {
          return res.status(400).json({ error: '🚫 Carattere mancante! Inserisci una lettera valida (A-Z) 📝' });
        }
        if (typeof req.body.letter !== 'string' || req.body.letter.length !== 1) {
          return res.status(400).json({ error: '⚠️ Inserisci solo un carattere alla volta! 📝' });
        }
        if (!/^[A-Za-z]$/.test(req.body.letter)) {
          return res.status(400).json({ error: '🚫 Carattere non valido! Usa solo lettere A-Z 🔤' });
        }
        return res.status(400).json({ error: '❌ Input non valido! 🚨' });
      }

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

      // Controlla se lettera già tentata in precedenza, costo 0 nessun cambiamento
      const prev = await get(
        'SELECT 1 FROM game_letters WHERE gameId = ? AND letter = ? LIMIT 1',
        [gameId, letter]
      );
      if (prev) {
        return res.json({
          revealedIndexes: [],
          costApplied: 0,
          coins: await readCoins(req.user.id),
          hasUsedVowel: !!game.hasUsedVowel,
          timeLeft: timeLeft(game.expiresAt)
        });
      }

      // Calcolo costi e verifica presenza lettera nella frase
      let cost = costForLetter(letter);
      let hit = false;

      const present = game.phraseText.toUpperCase().includes(letter);
      if (!present) cost = cost * 2; // Raddoppia costo per lettera sbagliata
      else hit = true;

      // Vincolo: massimo una vocale per partita
      if (isVowel(letter) && game.hasUsedVowel) {
        return res.status(400).json({ error: 'Solo una vocale per partita' });
      }

      // Controllo disponibilità monete
      const coinsNow = await readCoins(req.user.id);
      if (coinsNow <= 0) {
        return res.status(403).json({ error: 'No coins left for letters' });
      }
      
      // Se costo supera monete disponibili, usa tutte le monete rimaste (caso costo raddoppiato anche)
      const actualCost = Math.min(cost, coinsNow);
      
      if (actualCost < cost) {
        console.log(`[Game ${gameId}] Monete insufficienti per il costo raddoppiato: costo teorico ${cost}, monete disponibili ${coinsNow}, costo applicato ${actualCost}`);
      }

      // Transazione atomica per aggiornamento stato partita
      await withTransaction(async () => {
        if (isVowel(letter)) {
          await run('UPDATE games SET hasUsedVowel = 1 WHERE id = ?', [gameId]);
        }
        // sottrai monete (usa actualCost, non cost teorico)
        await run('UPDATE users SET coins = coins - ? WHERE id = ?', [actualCost, req.user.id]);
        // logga il tentativo con il costo effettivamente applicato
        await run(
          `INSERT INTO game_letters(gameId, letter, wasHit, costApplied)
           VALUES (?, ?, ?, ?)`,
          [gameId, letter, hit ? 1 : 0, actualCost]
        );
        // aggiorna contatore spesa nella partita (informativo)
        await run('UPDATE games SET coinsSpent = coinsSpent + ? WHERE id = ?', [actualCost, gameId]);
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
        costApplied: actualCost,
        coins: coinsNow - actualCost,
        hasUsedVowel: isVowel(letter) ? true : !!game.hasUsedVowel,
        timeLeft: timeLeft(game.expiresAt)
      });
    } catch (err) { next(err); }
  }
);

// POST /:id/guess-phrase - Indovina frase completa
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

      // Verifica timeout prima del tentativo
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
        // Vittoria: assegna premio di 100 monete
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
        // Tentativo fallito: continua partita senza penalità
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

// POST /:id/abandon - Abbandona partita corrente
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

      // Se partita già terminata, restituisci stato attuale
      if (game.status !== 'running') {
        return res.json({
          status: game.status,
          phrase: game.phraseText
        });
      }

      // Abbandono volontario senza penalità monete
      await run(`UPDATE games SET status='abandoned' WHERE id = ?`, [gameId]);

      return res.json({
        status: 'abandoned',
        phrase: game.phraseText
      });
    } catch (err) { next(err); }
  }
);

export default router;
