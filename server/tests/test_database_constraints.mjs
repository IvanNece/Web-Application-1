/*
 * ========================================
 * TEST: VINCOLI E INTEGRITÀ DATABASE
 * ========================================
 * 
 * Verifica il corretto funzionamento dei vincoli del database
 * Testa gestione errori per dati non validi e violazioni foreign key
 * Assicura robustezza del sistema di validazione dati
 */

import { get, all, run } from '../lib/db.js';

console.log('TEST GESTIONE ERRORI\n');

/**
 * Testa la gestione degli errori e la validazione dei vincoli
 */
async function testErrorHandling() {
  console.log('TEST 1: Controllo validazione dati');
  
  // ==========================================
  // TEST VINCOLI UTENTI
  // ==========================================
  // Test 1: Username duplicato (UNIQUE constraint)
  try {
    await run('INSERT INTO users(username, password_hash, coins) VALUES (?, ?, ?)', 
              ['player', 'test', 100]);
    console.log('ERRORE: Username duplicato dovrebbe fallire');
  } catch (err) {
    console.log('Username duplicato correttamente respinto:', err.message.substring(0, 50));
  }
  
  // Test 2: Monete negative (CHECK constraint)
  try {
    await run('UPDATE users SET coins = -10 WHERE id = 1');
    console.log('ERRORE: Monete negative dovrebbero fallire');
  } catch (err) {
    console.log('Constraint monete negative funziona:', err.message.substring(0, 50));
  }
  
  // ==========================================
  // TEST VINCOLI PARTITE
  // ==========================================
  // Test 3: Status gioco non valido (CHECK constraint)
  try {
    await run('INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [1, 1, 'invalid_status', Date.now(), Date.now() + 60000, 0, 0, 0]);
    console.log('ERRORE: Status non valido dovrebbe fallire');
  } catch (err) {
    console.log('Status gioco non valido respinto:', err.message.substring(0, 50));
  }
  
  console.log('\nTEST 2: Controllo integrità referenziale');
  
  // ==========================================
  // TEST FOREIGN KEY CONSTRAINTS
  // ==========================================
  // Test 4: Game con userId inesistente
  try {
    await run('INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [999, 1, 'running', Date.now(), Date.now() + 60000, 0, 0, 0]);
    console.log('ERRORE: userId inesistente dovrebbe fallire');
  } catch (err) {
    console.log('Foreign key userId funziona:', err.message.substring(0, 50));
  }
  
  // Test 5: Game con phraseId inesistente  
  try {
    await run('INSERT INTO games(userId, phraseId, status, startedAt, expiresAt, hasUsedVowel, coinsSpent, coinsDelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [1, 999, 'running', Date.now(), Date.now() + 60000, 0, 0, 0]);
    console.log('ERRORE: phraseId inesistente dovrebbe fallire');
  } catch (err) {
    console.log('✅ Foreign key phraseId funziona:', err.message.substring(0, 50));
  }
}

await testErrorHandling();
console.log('\n✅ Test gestione errori completato!');
