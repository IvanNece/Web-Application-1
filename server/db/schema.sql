/*
 * ========================================
 * SCHEMA DATABASE - INDOVINA LA FRASE
 * ========================================
 * 
 * Definisce la struttura del database SQLite per il gioco "Indovina la Frase"
 * Include tabelle per utenti, frasi, partite e lettere giocate
 */

-- ==========================================
-- CONFIGURAZIONE DATABASE
-- ==========================================
PRAGMA foreign_keys = ON;

-- ==========================================
-- PULIZIA TABELLE ESISTENTI
-- ==========================================
-- Eliminazione in ordine corretto per rispettare le foreign key
DROP TABLE IF EXISTS game_letters;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS phrases;

-- ==========================================
-- TABELLA UTENTI
-- ==========================================
-- Memorizza gli account degli utenti registrati
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- Identificatore univoco
  username TEXT UNIQUE NOT NULL,           -- Nome utente univoco
  password_hash TEXT NOT NULL,             -- Hash della password (bcrypt)
  coins INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0)  -- Monete per giocare
);

-- ==========================================
-- TABELLA FRASI
-- ==========================================
-- Contiene le frasi da indovinare per modalità autenticata e guest
CREATE TABLE phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- Identificatore univoco
  text TEXT NOT NULL,                      -- Testo della frase (30-50 caratteri)
  mode TEXT NOT NULL CHECK (mode IN ('auth','guest')),  -- Modalità: autenticata o ospite
  CHECK (length(text) BETWEEN 30 AND 50)  -- Vincolo lunghezza frase
  -- Nota: il vincolo "solo lettere e spazi" lo garantiremo in seed e nelle API
);

-- ==========================================
-- TABELLA PARTITE
-- ==========================================
-- Memorizza le partite in corso e completate
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- Identificatore univoco partita
  userId INTEGER NULL,                     -- ID utente (NULL per guest)
  phraseId INTEGER NOT NULL,               -- ID frase da indovinare
  status TEXT NOT NULL CHECK (status IN ('running','won','timeout','abandoned','ended')),  -- Stato partita
  startedAt INTEGER NOT NULL,              -- Timestamp inizio (epoch ms)
  expiresAt INTEGER NOT NULL,              -- Timestamp scadenza (epoch ms)
  hasUsedVowel INTEGER NOT NULL DEFAULT 0 CHECK (hasUsedVowel IN (0,1)),  -- Flag uso vocale
  coinsSpent INTEGER NOT NULL DEFAULT 0,   -- Monete spese nella partita
  coinsDelta INTEGER NOT NULL DEFAULT 0,   -- Variazione monete (premio/penalità)
  FOREIGN KEY (userId) REFERENCES users(id),     -- Collegamento utente
  FOREIGN KEY (phraseId) REFERENCES phrases(id)  -- Collegamento frase
);

-- ==========================================
-- TABELLA LETTERE GIOCATE
-- ==========================================
-- Traccia le singole lettere tentate in ogni partita
CREATE TABLE game_letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- Identificatore univoco
  gameId INTEGER NOT NULL,                 -- ID partita di riferimento
  letter TEXT NOT NULL CHECK (length(letter)=1 AND letter BETWEEN 'A' AND 'Z'),  -- Lettera maiuscola
  wasHit INTEGER NOT NULL CHECK (wasHit IN (0,1)),    -- Flag lettera presente/assente
  costApplied INTEGER NOT NULL,            -- Costo applicato per questa lettera
  createdAt INTEGER NOT NULL,              -- Timestamp tentativo
  FOREIGN KEY (gameId) REFERENCES games(id)  -- Collegamento partita
);

-- ==========================================
-- INDICI PER OTTIMIZZAZIONE
-- ==========================================
-- Migliorano le performance delle query più frequenti
CREATE INDEX idx_users_username ON users(username);           -- Ricerca utenti per nome
CREATE INDEX idx_phrases_mode ON phrases(mode);               -- Filtro frasi per modalità
CREATE INDEX idx_games_userId ON games(userId);               -- Partite per utente
CREATE INDEX idx_games_phraseId ON games(phraseId);           -- Partite per frase
CREATE INDEX idx_game_letters_gameId ON game_letters(gameId); -- Lettere per partita

-- ==========================================
-- VINCOLI UNIVOCITÀ
-- ==========================================
-- Evita duplicati della stessa lettera nella stessa partita
CREATE UNIQUE INDEX IF NOT EXISTS ux_game_letters_game_letter
  ON game_letters(gameId, letter);
