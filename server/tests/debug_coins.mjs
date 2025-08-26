import { get, all } from './lib/db.js';

console.log('=== STATO ATTUALE DATABASE ===\n');

// Controllo utenti
console.log('📋 UTENTI:');
const users = await all('SELECT id, username, coins FROM users ORDER BY id');
users.forEach(u => console.log(`  ${u.id}: ${u.username} -> ${u.coins} monete`));

console.log('\n🎮 ULTIME 10 PARTITE:');
const games = await all(`
  SELECT g.id, g.userId, u.username, g.status, g.coinsSpent, g.coinsDelta, g.startedAt 
  FROM games g 
  JOIN users u ON g.userId = u.id 
  ORDER BY g.startedAt DESC 
  LIMIT 10
`);
games.forEach(g => {
  const date = new Date(g.startedAt).toLocaleString();
  console.log(`  Game ${g.id}: ${g.username} | ${g.status} | Spesi: ${g.coinsSpent} | Delta: ${g.coinsDelta} | ${date}`);
});

console.log('\n💰 TRANSAZIONI MONETE (ultime 5 partite):');
const transactions = await all(`
  SELECT 
    g.id as gameId, 
    u.username, 
    g.status, 
    g.coinsSpent, 
    g.coinsDelta,
    (g.coinsDelta - g.coinsSpent) as netChange
  FROM games g 
  JOIN users u ON g.userId = u.id 
  WHERE g.status != 'running'
  ORDER BY g.startedAt DESC 
  LIMIT 5
`);
transactions.forEach(t => {
  console.log(`  ${t.username}: Game ${t.gameId} (${t.status}) | Spesi: ${t.coinsSpent} | Guadagnati: ${t.coinsDelta} | NETTO: ${t.netChange}`);
});
