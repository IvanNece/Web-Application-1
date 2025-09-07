/*
 * ========================================
 * SCRIPT INIZIALIZZAZIONE DATABASE
 * ========================================
 * 
 * Script per ricreare completamente il database SQLite
 * Include schema, seed data e utenti di test con password hash bcrypt
 * Utile per sviluppo, testing e reset completo del sistema
 */

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

// ==========================================
// CONFIGURAZIONE DATABASE
// ==========================================
sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'aw1.db');

// ==========================================
// FUNZIONI HELPER DATABASE
// ==========================================

/**
 * Apre una connessione al database SQLite
 * @returns {sqlite3.Database} Istanza database
 */
function openDb() {
  return new sqlite3.Database(dbPath);
}

/**
 * Esegue una query di modifica con Promise wrapper
 * @param {sqlite3.Database} db - Istanza database
 * @param {string} sql - Query SQL da eseguire
 * @param {Array} params - Parametri per prepared statement
 * @returns {Promise<Object>} Risultato con lastID e changes
 */
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * Esegue script SQL multipli (per schema e seed)
 * @param {sqlite3.Database} db - Istanza database
 * @param {string} sql - Script SQL completo
 * @returns {Promise<void>}
 */
function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

// ==========================================
// FUNZIONE PRINCIPALE DI INIZIALIZZAZIONE
// ==========================================

/**
 * Ricrea completamente il database con schema, seed data e utenti di test
 * Processo: schema -> frasi -> utenti con password hash -> partite esempio
 */
async function main() {
  const db = openDb();
  try {
    // ==========================================
    // CARICAMENTO FILE SQL
    // ==========================================
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf-8');

    // ==========================================
    // CREAZIONE SCHEMA DATABASE
    // ==========================================
    console.log('Recreating schema...');
    await exec(db, schema);

    // ==========================================
    // INSERIMENTO FRASI
    // ==========================================
    console.log('Seeding phrases...');
    await exec(db, seed);

    // ==========================================
    // CREAZIONE UTENTI DI TEST
    // ==========================================
    console.log('Seeding users with bcrypt hashes...');
    const saltRounds = 10;
    
    // Password complesse per evitare warning browser su credenziali deboli
    const passwords = {
      novice: 'NoviceUser123!',   // Utente nuovo senza partite
      empty: 'EmptyCoins456@',    // Utente senza monete
      player: 'PlayerGame789#'    // Utente con storico partite
    };

    // ==========================================
    // GENERAZIONE HASH PASSWORD
    // ==========================================
    const [h1, h2, h3] = await Promise.all([
      bcrypt.hash(passwords.novice, saltRounds),
      bcrypt.hash(passwords.empty, saltRounds),
      bcrypt.hash(passwords.player, saltRounds),
    ]);

    // ==========================================
    // OUTPUT CREDENZIALI PER SVILUPPATORI
    // ==========================================
    console.log('\nCREDENZIALI UTENTI DI TEST:');
    console.log('Username: novice   | Password: NoviceUser123!  | Monete: 100');
    console.log('Username: empty    | Password: EmptyCoins456@  | Monete: 0');
    console.log('Username: player   | Password: PlayerGame789#  | Monete: 180\n');

    // ==========================================
    // INSERIMENTO UTENTI NEL DATABASE
    // ==========================================
    await run(db, 'DELETE FROM users');
    // Utente novizio: nessuna partita giocata, monete default
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['novice', h1, 100]);
    // Utente senza monete: per testare gestione monete insufficienti
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['empty', h2, 0]);
    // Utente esperto: con storico partite e monete accumulate
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['player', h3, 180]);

    // ==========================================
    // CREAZIONE PARTITE DI ESEMPIO
    // ==========================================
    console.log('Creating sample games for "player"...');
    // Utilizzano le prime due frasi del seed per creare uno storico
    const now = Date.now();
    const minute = 60_000;

    // Trova l'ID dell'utente "player" per le foreign key
    const playerId = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE username = ?', ['player'], (err, row) => {
        if (err) reject(err); else resolve(row.id);
      });
    });

    // Partita vittoriosa: +100 monete, nessuna lettera tentata (indovinata subito)
    await run(db, `
      INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
      VALUES (?, ?, 'won', ?, ?, 0, 0, 100)
    `, [playerId, 1, now - 10*minute, now - 9*minute]);

    // Partita scaduta per timeout: -20 monete di penalità
    await run(db, `
      INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
      VALUES (?, ?, 'timeout', ?, ?, 0, 0, -20)
    `, [playerId, 2, now - 8*minute, now - 7*minute]);

    console.log('Done. DB ready at db/aw1.db');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    db.close();
  }
}

// ==========================================
// ESECUZIONE SCRIPT
// ==========================================
main();
