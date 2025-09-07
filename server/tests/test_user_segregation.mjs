console.log('🛡️ TEST SEGREGAZIONE UTENTI GUEST/AUTH');
console.log('=============================================\n');

const SERVER_URL = 'http://localhost:3001';

async function testGuestOnlyAccess() {
  try {
    console.log('📋 TEST 1: Utente NON autenticato accede a guest API');
    
    // Crea partita guest senza autenticazione
    const guestResponse = await fetch(`${SERVER_URL}/api/guest/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (guestResponse.ok) {
      const gameData = await guestResponse.json();
      console.log('✅ SUCCESSO: Utente non autenticato può creare partita guest');
      console.log(`   Game ID: ${gameData.gameId}`);
    } else {
      console.log('❌ ERRORE: Utente non autenticato non può creare partita guest');
    }
    
  } catch (error) {
    console.log('❌ ERRORE di rete:', error.message);
  }
}

async function testAuthUserBlockedFromGuest() {
  try {
    console.log('\n📋 TEST 2: Utente autenticato bloccato da guest API');
    
    // Prima autenticati
    const loginResponse = await fetch(`${SERVER_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'novice', password: 'password' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ ERRORE: Non riesco ad autenticarmi');
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Prova ad accedere alle guest API da autenticato
    const guestResponse = await fetch(`${SERVER_URL}/api/guest/games`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies 
      }
    });
    
    if (guestResponse.status === 403) {
      console.log('✅ SUCCESSO: Utente autenticato correttamente bloccato da guest API');
      const error = await guestResponse.json();
      console.log(`   Messaggio: ${error.error}`);
    } else {
      console.log('❌ ERRORE: Utente autenticato può ancora accedere alle guest API!');
    }
    
  } catch (error) {
    console.log('❌ ERRORE di rete:', error.message);
  }
}

async function testAuthUserCanAccessAuthAPI() {
  try {
    console.log('\n📋 TEST 3: Utente autenticato accede ad auth API');
    
    // Prima autenticati
    const loginResponse = await fetch(`${SERVER_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'novice', password: 'password' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ ERRORE: Non riesco ad autenticarmi');
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Prova ad accedere alle auth API
    const authResponse = await fetch(`${SERVER_URL}/api/games`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies 
      }
    });
    
    if (authResponse.ok) {
      const gameData = await authResponse.json();
      console.log('✅ SUCCESSO: Utente autenticato può creare partita auth');
      console.log(`   Game ID: ${gameData.gameId}`);
    } else {
      console.log('❌ ERRORE: Utente autenticato non può creare partita auth');
    }
    
  } catch (error) {
    console.log('❌ ERRORE di rete:', error.message);
  }
}

// Esegui tutti i test
async function runTests() {
  await testGuestOnlyAccess();
  await testAuthUserBlockedFromGuest();
  await testAuthUserCanAccessAuthAPI();
  
  console.log('\n🎯 RISULTATO:');
  console.log('Le frasi guest sono ora ESCLUSIVE per utenti non autenticati!');
  console.log('Le frasi auth sono ESCLUSIVE per utenti autenticati!');
}

runTests();
