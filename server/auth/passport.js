import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'aw1.db');
const db = new sqlite3.Database(dbPath);

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, password_hash AS passwordHash, coins FROM users WHERE username = ?',
      [username],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, coins FROM users WHERE id = ?',
      [id],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

// Strategia username+password
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) return done(null, false, { message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: 'Invalid credentials' });
      // Riduciamo i dati dell’utente nella sessione
      return done(null, { id: user.id, username: user.username, coins: user.coins });
    } catch (err) {
      return done(err);
    }
  })
);

// Cosa mettiamo nella sessione
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Come ricostruiamo l’utente a ogni richiesta
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware di comodo per proteggere le API
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

export default passport;
