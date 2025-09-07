/*
 * ========================================
 * TEST: VERIFICA FOREIGN KEY CONSTRAINTS
 * ========================================
 * 
 * Controlla che le foreign key siano correttamente attive nel database
 * Verifica la presenza del PRAGMA nel file schema.sql
 * Assicura l'integrità referenziale tra le tabelle
 */

import { get } from '../lib/db.js';

console.log('CONTROLLO FOREIGN KEYS\n');

// Verifica stato PRAGMA foreign_keys nel database attivo
const fkStatus = await get('PRAGMA foreign_keys');
console.log('Foreign keys enabled:', fkStatus.foreign_keys === 1 ? 'SI' : 'NO');

// Ispeziona struttura tabella games per verifica schema
const schema = await get('PRAGMA table_info(games)');
console.log('Struttura tabella games:', schema);

// Controlla presenza PRAGMA nel file schema.sql
console.log('\nSchema SQL:');
const fs = await import('fs');
const schemaContent = fs.readFileSync('../server/db/schema.sql', 'utf-8');
console.log(schemaContent.includes('PRAGMA foreign_keys = ON') ? 'PRAGMA trovato' : 'PRAGMA mancante');
