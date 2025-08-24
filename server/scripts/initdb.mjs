import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'aw1.db');

function openDb() {
  return new sqlite3.Database(dbPath);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  const db = openDb();
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf-8');

    console.log('Recreating schema...');
    await exec(db, schema);

    console.log('Seeding phrases...');
    await exec(db, seed);

    console.log('Seeding users with bcrypt hashes...');
    const saltRounds = 10;
    const plain = 'password';

    const [h1, h2, h3] = await Promise.all([
      bcrypt.hash(plain, saltRounds),
      bcrypt.hash(plain, saltRounds),
      bcrypt.hash(plain, saltRounds),
    ]);

    await run(db, 'DELETE FROM users');
    // 1) nessuna partita, coins 100
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['novice', h1, 100]);
    // 2) monete finite (0)
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['empty', h2, 0]);
    // 3) ha giocato alcune partite, coins=180 (100 + 100 vittoria - 20 timeout)
    await run(db, 'INSERT INTO users(username, password_hash, coins) VALUES (?,?,?)', ['player', h3, 180]);

    console.log('Creating sample games for "player"...');
    // Prendiamo due frasi qualunque (id 1 e 2)
    const now = Date.now();
    const minute = 60_000;

    // Trova id utente "player"
    const playerId = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE username = ?', ['player'], (err, row) => {
        if (err) reject(err); else resolve(row.id);
      });
    });

    // Partita vinta (nessun tentativo lettera nel log, coinsDelta +100)
    await run(db, `
      INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta)
      VALUES (?, ?, 'won', ?, ?, 0, 0, 100)
    `, [playerId, 1, now - 10*minute, now - 9*minute]);

    // Partita finita per timeout (coinsDelta -20)
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

main();
