/*
 * ========================================
 * TEST: GESTIONE COMPLETA ERRORI HTTP
 * ========================================
 * 
 * Verifica sistematica di tutti i codici di errore HTTP del server
 * Testa validazione input, autenticazione, autorizzazione e business logic
 * Assicura che ogni scenario di errore restituisca il codice appropriato
 */

const BASE_URL = 'http://localhost:3001/api';
console.log('TEST CODICI DI ERRORE - Verifica gestione errori server');
console.log('========================================================');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Esegue una richiesta autenticata utilizzando le credenziali di test
 */
async function makeAuthenticatedRequest(url, options = {}) {
  // Login con utente "player" che ha monete sufficienti
  const loginResponse = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'player', password: 'PlayerGame789#' })
  });

  const setCookieHeaders = loginResponse.headers.get('set-cookie') || '';
  
  return await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: setCookieHeaders
    }
  });
}

/**
 * Testa uno scenario di errore specifico e verifica il codice di stato
 */
async function testError(testName, requestFn, expectedStatus, expectedErrorContains = null) {
  try {
    console.log(`\n🔍 Testing: ${testName}`);
    const response = await requestFn();
    const data = await response.json();
    
    if (response.status === expectedStatus) {
      console.log(`✅ Status ${expectedStatus} corretto`);
      if (expectedErrorContains && data.error && data.error.includes(expectedErrorContains)) {
        console.log(`✅ Messaggio errore corretto: "${data.error}"`);
      } else if (expectedErrorContains) {
        console.log(`⚠️ Messaggio errore diverso: "${data.error}"`);
      } else {
        console.log(`✅ Risposta: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ Status sbagliato. Atteso: ${expectedStatus}, Ricevuto: ${response.status}`);
      console.log(`   Risposta: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`❌ Errore nel test: ${error.message}`);
  }
}

// ESEGUI TUTTI I TEST
async function runAllTests() {
  console.log('\\n📋 MAPPA COMPLETA CODICI DI ERRORE:');
  console.log('=====================================');
  
  console.log('🔐 AUTENTICAZIONE:');
  console.log('  401 - Not authenticated');
  console.log('  403 - Forbidden / Not enough coins');
  
  console.log('\\n📝 VALIDAZIONE INPUT:');
  console.log('  400 - Invalid input/Bad request');
  
  console.log('\\n🔍 RISORSE:');
  console.log('  404 - Game not found / Resource not found');
  
  console.log('\\n⚖️ LOGICA BUSINESS:');
  console.log('  409 - Conflict (es: gioco già finito, vocale già usata)');
  
  console.log('\\n🖥️ SERVER:');
  console.log('  500 - Internal server error');

  console.log('\\n\\n🧪 INIZIO TEST PRATICI:');
  console.log('========================');

  // TEST 1: 401 - Richiesta senza autenticazione
  await testError(
    "401 - Accesso gioco senza login",
    () => fetch(`${BASE_URL}/games/123`),
    401,
    "Not authenticated"
  );

  // TEST 2: 400 - ID gioco non valido
  await testError(
    "400 - ID gioco non valido (lettere invece di numero)",
    () => makeAuthenticatedRequest(`${BASE_URL}/games/abc`),
    400,
    "Invalid"
  );

  // TEST 3: 404 - Gioco non esistente
  await testError(
    "404 - Gioco non esistente",
    () => makeAuthenticatedRequest(`${BASE_URL}/games/99999`),
    404,
    "not found"
  );

  // TEST 4: Creiamo un gioco per i test successivi
  console.log('\\n🎮 Creando gioco per test avanzati...');
  const createResponse = await makeAuthenticatedRequest(`${BASE_URL}/games`, {
    method: 'POST'
  });
  
  if (createResponse.status === 201) {
    const gameData = await createResponse.json();
    const gameId = gameData.gameId;
    console.log(`✅ Gioco creato: ID ${gameId}`);

    // TEST 5: 400 - Lettera non valida
    await testError(
      "400 - Lettera non valida (numero invece di lettera)",
      () => makeAuthenticatedRequest(`${BASE_URL}/games/${gameId}/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: '123' })
      }),
      400,
      "Invalid"
    );

    // TEST 6: 409 - Vocale già usata (dopo aver usato una vocale)
    console.log('\\n🔤 Usando prima una vocale...');
    const vowelResponse = await makeAuthenticatedRequest(`${BASE_URL}/games/${gameId}/letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letter: 'A' })
    });
    
    if (vowelResponse.status === 200) {
      console.log('✅ Prima vocale utilizzata');
      
      // Ora prova a usare un'altra vocale
      await testError(
        "409 - Seconda vocale (già usata una)",
        () => makeAuthenticatedRequest(`${BASE_URL}/games/${gameId}/letters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ letter: 'E' })
        }),
        400, // Il codice dovrebbe essere 400 per "Only one vowel per game"
        "one vowel"
      );
    }

    // TEST 7: Frase non valida
    await testError(
      "400 - Tentativo frase troppo corta",
      () => makeAuthenticatedRequest(`${BASE_URL}/games/${gameId}/phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: 'hi' })
      }),
      400,
      "Invalid"
    );

  } else {
    console.log(`❌ Impossibile creare gioco per test avanzati: ${createResponse.status}`);
  }

  // TEST 8: 403 - Accesso con utente senza monete
  console.log('\\n💰 Test con utente senza monete...');
  const emptyLoginResponse = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'empty', password: 'password' })
  });

  if (emptyLoginResponse.ok) {
    const emptyCookies = emptyLoginResponse.headers.get('set-cookie') || '';
    
    await testError(
      "403 - Creazione gioco senza monete",
      () => fetch(`${BASE_URL}/games`, {
        method: 'POST',
        headers: { Cookie: emptyCookies }
      }),
      403,
      "Not enough coins"
    );
  }

  // TEST 9: Guest API - Accesso da utente autenticato
  await testError(
    "403 - Utente autenticato accede API guest",
    () => makeAuthenticatedRequest(`${BASE_URL}/guest/games`),
    403,
    "logged in users cannot access guest"
  );

  console.log('\\n\\n📊 TEST COMPLETATI!');
  console.log('=====================');
  console.log('Tutti i codici di errore sono stati testati.');
  console.log('Verifica che tutti i messaggi siano chiari e i codici corretti.');
  
  process.exit(0);
}

// Avvia i test
runAllTests().catch(console.error);
