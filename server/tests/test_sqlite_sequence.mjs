/*
 * ========================================
 * TEST: ANALISI TABELLA SQLITE_SEQUENCE
 * ========================================
 * 
 * Verifica lo stato delle sequenze AUTOINCREMENT in SQLite
 * Analizza i valori correnti degli ID per le tabelle principali
 * Utile per debugging problemi di ID e per reset completo
 */

import { all, get } from '../lib/db.js';

console.log('ANALISI TABELLA sqlite_sequence');
console.log('=====================================\n');

/**
 * Analizza la tabella sqlite_sequence per verificare stato delle sequenze
 */
async function analyzeSqliteSequence() {
  try {
    // ==========================================
    // VERIFICA ESISTENZA TABELLA SEQUENCE
    // ==========================================
    const tables = await all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sqlite_sequence'
    `);
    
    if (tables.length === 0) {
      console.log('Tabella sqlite_sequence non trovata');
      return;
    }
    
    console.log('Tabella sqlite_sequence trovata\n');
    
    // Mostra il contenuto
    const sequences = await all('SELECT name, seq FROM sqlite_sequence ORDER BY name');
    
    console.log('📊 CONTATORI AUTOINCREMENT ATTUALI:');
    console.log('-----------------------------------');
    
    sequences.forEach(row => {
      console.log(`📋 Tabella: ${row.name.padEnd(15)} → Prossimo ID: ${row.seq + 1} (ultimo usato: ${row.seq})`);
    });
    
    console.log('\n🔍 SPIEGAZIONE:');
    console.log('- sqlite_sequence traccia gli ID AUTOINCREMENT per ogni tabella');
    console.log('- Si aggiorna automaticamente ad ogni INSERT');
    console.log('- "seq" è l\'ultimo ID assegnato, il prossimo sarà seq+1');
    console.log('- Non devi mai modificarla manualmente!');
    
    // Verifica coerenza
    console.log('\n🧪 VERIFICA COERENZA:');
    for (const row of sequences) {
      const maxId = await get(`SELECT MAX(id) as maxId FROM ${row.name}`);
      if (maxId.maxId !== row.seq) {
        console.log(`⚠️  ATTENZIONE: ${row.name} - MAX(id)=${maxId.maxId} ≠ seq=${row.seq}`);
      } else {
        console.log(`✅ ${row.name}: Coerente (MAX(id) = seq = ${row.seq})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

analyzeSqliteSequence();
