/*
 * ========================================
 * MODULO DATABASE - INDOVINA LA FRASE
 * ========================================
 * 
 * Wrapper per SQLite3 con supporto Promise
 * Fornisce funzioni unificate per query, aggiornamenti e transazioni
 * Gestisce la connessione al database e le operazioni CRUD
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// CONFIGURAZIONE DATABASE
// ==========================================
// Abilita output verbose per debugging
sqlite3.verbose();

// Costruisce il percorso assoluto del database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'aw1.db');

// ==========================================
// CONNESSIONE DATABASE
// ==========================================
const db = new sqlite3.Database(dbPath);

// Abilita il supporto per foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// ==========================================
// FUNZIONI DATABASE CON PROMISE
// ==========================================

/**
 * Esegue una query che restituisce una singola riga
 * @param {string} sql - Query SQL da eseguire
 * @param {Array} params - Parametri per la query preparata
 * @returns {Promise<Object|undefined>} Prima riga del risultato
 */
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

/**
 * Esegue una query che restituisce multiple righe
 * @param {string} sql - Query SQL da eseguire
 * @param {Array} params - Parametri per la query preparata
 * @returns {Promise<Array>} Array di righe risultanti
 */
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

/**
 * Esegue una query di modifica (INSERT, UPDATE, DELETE)
 * @param {string} sql - Query SQL da eseguire
 * @param {Array} params - Parametri per la query preparata
 * @returns {Promise<Object>} Oggetto con lastID e changes
 */
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // contiene lastID, changes
    });
  });
}

/**
 * Esegue multiple operazioni in una transazione atomica
 * Garantisce che tutte le operazioni vengano completate o annullate insieme
 * @param {Function} fn - Funzione async che contiene le operazioni da eseguire
 * @returns {Promise<any>} Risultato della funzione eseguita
 * @throws {Error} Se qualsiasi operazione nella transazione fallisce
 */
export async function withTransaction(fn) {
  try {
    await run('BEGIN IMMEDIATE');    // Inizia transazione con lock immediato
    const result = await fn();       // Esegue le operazioni richieste
    await run('COMMIT');             // Conferma tutte le modifiche
    return result;
  } catch (err) {
    await run('ROLLBACK');           // Annulla tutte le modifiche in caso di errore
    throw err;                       // Rilancia l'errore per gestione upstream
  }
}
