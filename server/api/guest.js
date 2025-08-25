import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { get, all, run } from '../lib/db.js';

const router = Router();

function nowMs() { return Date.now(); }
function timeLeft(expiresAt) { return Math.max(0, expiresAt - nowMs()); }
function up(s) { return (s || '').toUpperCase(); }

function computeSpacesIndexes(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) if (text[i] === ' ') out.push(i);
  return out;
}

async function loadGame(gameId) {
  return await get(
    `SELECT g.*, p.text AS phraseText
     FROM games g JOIN phrases p ON g.phraseId = p.id
     WHERE g.id = ?`,
    [gameId]
  );
}

/* Crea partita guest */
router.post('/games', async (req, res, next) => {
  try {
    const phrase = await get(
      "SELECT id, text FROM phrases WHERE mode='guest' ORDER BY RANDOM() LIMIT 1"
    );
    if (!phrase) return res.status(500).json({ error: 'No guest phrase available' });

    const startedAt = nowMs();
    const expiresAt = startedAt + 60_000;

    const ins = await run(
      `INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
       VALUES (NULL, ?, 'running', ?, ?, 0, 0, 0)`,
      [phrase.id, startedAt, expiresAt]
    );

    return res.status(201).json({
      gameId: ins.lastID,
      status: 'running',
      phraseLength: phrase.text.length,
      spaces: computeSpacesIndexes(phrase.text),
      revealed: [],
      timeLeft: 60_000
    });
  } catch (err) { next(err); }
});

/* Stato partita guest (nessuna autenticazione, versione semplificata) */
router.get('/games/:id', [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game id' });

    const game = await loadGame(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    // timeout (senza penalità)
    if (game.status === 'running' && nowMs() >= game.expiresAt) {
      await run(`UPDATE games SET status='timeout' WHERE id = ?`, [game.id]);
      const updated = await loadGame(game.id);
      return res.json({
        gameId: updated.id,
        status: 'timeout',
        phraseLength: updated.phraseText.length,
        spaces: computeSpacesIndexes(updated.phraseText),
        revealed: await collectRevealedIndexes(updated.id, updated.phraseText),
        timeLeft: 0,
        phrase: updated.phraseText
      });
    }

    return res.json({
      gameId: game.id,
      status: game.status,
      phraseLength: game.phraseText.length,
      spaces: computeSpacesIndexes(game.phraseText),
      revealed: await collectRevealedIndexes(game.id, game.phraseText),
      timeLeft: game.status === 'running' ? timeLeft(game.expiresAt) : 0,
      ...(game.status !== 'running' ? { phrase: game.phraseText } : {})
    });
  } catch (err) { next(err); }
});

/* Indovina lettera guest: COSTO ZERO, nessuna regola "una sola vocale" */
router.post('/games/:id/guess-letter',
  [
    param('id').isInt({ min: 1 }),
    body('letter').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });

      const gameId = Number(req.params.id);
      const game = await loadGame(gameId);
      if (!game) return res.status(404).json({ error: 'Game not found' });

      if (game.status !== 'running') {
        return res.status(409).json({ error: `Game already ended (${game.status})` });
      }
      if (nowMs() >= game.expiresAt) {
        await run(`UPDATE games SET status='timeout' WHERE id = ?`, [gameId]);
        return res.status(409).json({ error: 'Game already ended (timeout)' });
      }

      const letter = up(req.body.letter);
      const prev = await get(
        'SELECT 1 FROM game_letters WHERE gameId = ? AND letter = ? LIMIT 1',
        [gameId, letter]
      );
      if (prev) {
        return res.json({ revealedIndexes: [], costApplied: 0, timeLeft: timeLeft(game.expiresAt) });
      }

      const hit = game.phraseText.toUpperCase().includes(letter) ? 1 : 0;

      await run(
        `INSERT INTO game_letters(gameId, letter, wasHit, costApplied, createdAt)
         VALUES (?, ?, ?, 0, ?)`,
        [gameId, letter, hit, nowMs()]
      );

      const revealedIndexes = [];
      if (hit) {
        const P = game.phraseText.toUpperCase();
        for (let i = 0; i < P.length; i++) if (P[i] === letter) revealedIndexes.push(i);
      }

      return res.json({ revealedIndexes, costApplied: 0, timeLeft: timeLeft(game.expiresAt) });
    } catch (err) { next(err); }
  }
);

/* Indovina frase guest */
router.post('/games/:id/guess-phrase',
  [param('id').isInt({ min: 1 }), body('attempt').isString().trim().isLength({ min: 1 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });

      const gameId = Number(req.params.id);
      const game = await loadGame(gameId);
      if (!game) return res.status(404).json({ error: 'Game not found' });

      if (game.status !== 'running') {
        return res.status(409).json({ error: `Game already ended (${game.status})` });
      }
      if (nowMs() >= game.expiresAt) {
        await run(`UPDATE games SET status='timeout' WHERE id = ?`, [gameId]);
        const t = await loadGame(gameId);
        return res.json({ result: 'timeout', status: 'timeout', phrase: t.phraseText });
      }

      const attempt = up(req.body.attempt);
      const target  = up(game.phraseText);
      if (attempt === target) {
        await run(`UPDATE games SET status='won' WHERE id = ?`, [gameId]);
        return res.json({ result: 'win', status: 'won', phrase: game.phraseText });
      } else {
        return res.json({ result: 'wrong', status: 'running', message: 'Not the correct phrase', timeLeft: timeLeft(game.expiresAt) });
      }
    } catch (err) { next(err); }
  }
);

/* Abbandona guest */
router.post('/games/:id/abandon', [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game id' });

    const gameId = Number(req.params.id);
    const game = await loadGame(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (game.status !== 'running') {
      return res.json({ status: game.status, phrase: game.phraseText });
    }
    await run(`UPDATE games SET status='abandoned' WHERE id = ?`, [gameId]);
    return res.json({ status: 'abandoned', phrase: game.phraseText });
  } catch (err) { next(err); }
});

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

export default router;
