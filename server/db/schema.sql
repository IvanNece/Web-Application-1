PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS game_letters;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS phrases;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0)
);

CREATE TABLE phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('auth','guest')),
  CHECK (length(text) BETWEEN 30 AND 50)
  -- Nota: il vincolo "solo lettere e spazi" lo garantiremo in seed e nelle API
);

CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NULL,
  phraseId INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','won','timeout','abandoned','ended')),
  startedAt INTEGER NOT NULL,  -- epoch ms
  expiresAt INTEGER NOT NULL,  -- epoch ms
  hasUsedVowel INTEGER NOT NULL DEFAULT 0 CHECK (hasUsedVowel IN (0,1)),
  coinsSpent INTEGER NOT NULL DEFAULT 0,
  coinsDelta INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (phraseId) REFERENCES phrases(id)
);

CREATE TABLE game_letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameId INTEGER NOT NULL,
  letter TEXT NOT NULL CHECK (length(letter)=1 AND letter BETWEEN 'A' AND 'Z'),
  wasHit INTEGER NOT NULL CHECK (wasHit IN (0,1)),
  costApplied INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (gameId) REFERENCES games(id)
);

-- Indici utili
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_phrases_mode ON phrases(mode);
CREATE INDEX idx_games_userId ON games(userId);
CREATE INDEX idx_games_phraseId ON games(phraseId);
CREATE INDEX idx_game_letters_gameId ON game_letters(gameId);

-- Evita duplicati della stessa lettera sullo stesso game
CREATE UNIQUE INDEX IF NOT EXISTS ux_game_letters_game_letter
  ON game_letters(gameId, letter);
