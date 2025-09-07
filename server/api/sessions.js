import { Router } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';

// ═══════════════════════════════════════════════════════════════════════════════════
// API AUTENTICAZIONE E SESSIONI
// Gestione login, logout e verifica stato autenticazione utenti
// ═══════════════════════════════════════════════════════════════════════════════════

const router = Router();

// POST / - Login utente con username e password
router.post(
  '/',
  [
    body('username').isString().trim().isLength({ min: 1 }).withMessage('username required'),
    body('password').isString().isLength({ min: 1 }).withMessage('password required'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid payload', details: errors.array() });
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

      req.login(user, (err2) => {
        if (err2) return next(err2);
        // Restituisce solo dati necessari (principio anti-cheat)
        return res.json({ id: user.id, username: user.username, coins: user.coins });
      });
    })(req, res, next);
  }
);

// GET /current - Verifica stato autenticazione corrente
router.get('/current', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Dati utente da deserializeUser con monete aggiornate
    return res.json({ authenticated: true, user: req.user });
  }
  return res.json({ authenticated: false });
});

// DELETE /current - Logout utente (invalida sessione)
router.delete('/current', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(204).end();
  });
});

export default router;
