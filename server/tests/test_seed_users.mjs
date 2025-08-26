import { get, all } from '../lib/db.js';

console.log('🧪 TEST 3 UTENTI SEED\n');

console.log('📋 VERIFICA UTENTI SEED:');
const users = await all('SELECT id, username, coins FROM users ORDER BY id');

if (users.length !== 3) {
  console.log(`❌ ERRORE: Trovati ${users.length} utenti invece di 3`);
} else {
  console.log('✅ Numero utenti corretto: 3');
}

users.forEach((user, i) => {
  console.log(`  ${i + 1}. ${user.username} (ID: ${user.id}) -> ${user.coins} monete`);
  
  // Verifica specifiche utenti seed
  if (user.username === 'empty' && user.coins !== 0) {
    console.log(`  ❌ ERRORE: ${user.username} dovrebbe avere 0 monete`);
  } else if (user.username !== 'empty' && user.coins < 0) {
    console.log(`  ❌ ERRORE: ${user.username} non può avere monete negative`);
  } else {
    console.log(`  ✅ ${user.username}: monete OK`);
  }
});

console.log('\n📋 VERIFICA FRASI DEDICATE:');
const authPhrases = await all('SELECT COUNT(*) as count FROM phrases WHERE mode = ?', ['auth']);
const guestPhrases = await all('SELECT COUNT(*) as count FROM phrases WHERE mode = ?', ['guest']);

console.log(`Frasi autenticate: ${authPhrases[0].count}`);
console.log(`Frasi guest: ${guestPhrases[0].count}`);

if (guestPhrases[0].count !== 3) {
  console.log('❌ ERRORE: Dovrebbero esserci esattamente 3 frasi guest');
} else {
  console.log('✅ Numero frasi guest corretto: 3');
}

if (authPhrases[0].count < 10) {
  console.log('⚠️  WARNING: Poche frasi autenticate per varietà di gioco');
} else {
  console.log('✅ Frasi autenticate sufficienti per varietà');
}

console.log('\n📋 TEST LOGIN UTENTI:');
// Simulazione test login (senza password, solo verifica esistenza)
const loginTests = ['novice', 'empty', 'player'];
for (const username of loginTests) {
  const user = await get('SELECT id, username FROM users WHERE username = ?', [username]);
  if (user) {
    console.log(`✅ ${username}: Utente trovato (ID: ${user.id})`);
  } else {
    console.log(`❌ ${username}: Utente NON trovato`);
  }
}

console.log('\n✅ Test 3 utenti seed completato!');
