import { get } from '../lib/db.js';

console.log('🔍 CONTROLLO FOREIGN KEYS\n');

const fkStatus = await get('PRAGMA foreign_keys');
console.log('Foreign keys enabled:', fkStatus.foreign_keys === 1 ? '✅ SÌ' : '❌ NO');

const schema = await get('PRAGMA table_info(games)');
console.log('Struttura tabella games:', schema);

// Controlla se il PRAGMA è nel schema
console.log('\n📄 Schema SQL:');
const fs = await import('fs');
const schemaContent = fs.readFileSync('../server/db/schema.sql', 'utf-8');
console.log(schemaContent.includes('PRAGMA foreign_keys = ON') ? '✅ PRAGMA trovato' : '❌ PRAGMA mancante');
