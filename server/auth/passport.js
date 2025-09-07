// ═══════════════════════════════════════════════════════════════════════════════════
// CONFIGURAZIONE PASSPORT.JS - AUTENTICAZIONE UTENTI
// Sistema di autenticazione basato su sessioni cookie con strategia locale
// ═══════════════════════════════════════════════════════════════════════════════════

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─────────────────────────────────────────────────────────────────────────────────
// SETUP DATABASE SQLITE
// ─────────────────────────────────────────────────────────────────────────────────

sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'aw1.db');
const db = new sqlite3.Database(dbPath);

// ─────────────────────────────────────────────────────────────────────────────────
// FUNZIONI ACCESSO DATABASE UTENTI
// ─────────────────────────────────────────────────────────────────────────────────

// Recupera utente completo per fase di login (include password hash)
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, password_hash AS passwordHash, coins FROM users WHERE username = ?',
      [username],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

// Recupera utente per deserializzazione sessione (senza password hash)
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, coins FROM users WHERE id = ?',
      [id],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════
// CONFIGURAZIONE STRATEGIA PASSPORT LOCAL
// Gestione autenticazione username/password con hash bcrypt
// ═══════════════════════════════════════════════════════════════════════════════════

// Strategia di autenticazione locale (username + password)
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) return done(null, false, { message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: 'Invalid credentials' });
      // Restituisce solo dati essenziali per la sessione (sicurezza)
      return done(null, { id: user.id, username: user.username, coins: user.coins });
    } catch (err) {
      return done(err);
    }
  })
);

// ─────────────────────────────────────────────────────────────────────────────────
// GESTIONE SERIALIZZAZIONE SESSIONI
// ─────────────────────────────────────────────────────────────────────────────────

// Serializzazione: memorizza solo ID utente nel cookie di sessione
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione: ricostruisce oggetto utente ad ogni richiesta
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    done(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE DI PROTEZIONE API
// ═══════════════════════════════════════════════════════════════════════════════════

// Middleware per proteggere endpoint che richiedono autenticazione
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

export default passport;
