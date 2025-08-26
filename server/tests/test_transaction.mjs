import { get, all, run } from './lib/db.js';
import { withTransaction } from './lib/db.js';

console.log('🧪 TEST MANUALE SISTEMA MONETE\n');

// Test: aggiungo manualmente una spesa
const testUserId = 3; // player
const testGameId = 2;
const testCost = 5;

console.log('PRIMA del test:');
const userBefore = await get('SELECT coins FROM users WHERE id = ?', [testUserId]);
const gameBefore = await get('SELECT coinsSpent FROM games WHERE id = ?', [testGameId]);
console.log(`User ${testUserId}: ${userBefore?.coins} monete`);
console.log(`Game ${testGameId}: ${gameBefore?.coinsSpent} spesi`);

console.log('\n🔄 Eseguo transazione test...');
try {
  await withTransaction(async () => {
    await run('UPDATE users SET coins = coins - ? WHERE id = ?', [testCost, testUserId]);
    await run('UPDATE games SET coinsSpent = coinsSpent + ? WHERE id = ?', [testCost, testGameId]);
  });
  console.log('✅ Transazione completata');
} catch (err) {
  console.log('❌ Errore transazione:', err.message);
}

console.log('\nDOPO il test:');
const userAfter = await get('SELECT coins FROM users WHERE id = ?', [testUserId]);
const gameAfter = await get('SELECT coinsSpent FROM games WHERE id = ?', [testGameId]);
console.log(`User ${testUserId}: ${userAfter?.coins} monete`);
console.log(`Game ${testGameId}: ${gameAfter?.coinsSpent} spesi`);

console.log('\n🔄 Ripristino stato originale...');
await withTransaction(async () => {
  await run('UPDATE users SET coins = coins + ? WHERE id = ?', [testCost, testUserId]);
  await run('UPDATE games SET coinsSpent = coinsSpent - ? WHERE id = ?', [testCost, testGameId]);
});
console.log('✅ Stato ripristinato');
