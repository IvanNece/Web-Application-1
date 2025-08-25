import { Router } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * POST /api/sessions
 * Login con username e password.
 * Ritorna { id, username, coins } se ok; 401 se credenziali errate; 400 se payload invalido.
 */
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
        // Importante: ritorniamo solo dati necessari (principio "no informazioni non necessarie")
        return res.json({ id: user.id, username: user.username, coins: user.coins });
      });
    })(req, res, next);
  }
);

/**
 * GET /api/sessions/current
 * Stato di autenticazione: ritorna l’utente o 401 se non autenticato.
 */
router.get('/current', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // req.user proviene da deserializeUser: { id, username, coins }
    return res.json(req.user);
  }
  return res.status(401).json({ error: 'Not authenticated' });
});

/**
 * DELETE /api/sessions/current
 * Logout: invalida la sessione.
 */
router.delete('/current', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(204).end();
  });
});

export default router;
