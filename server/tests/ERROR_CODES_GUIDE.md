# GUIDA CODICI DI ERRORE - INDOVINA LA FRASE

## Panoramica Sistema di Gestione Errori

Questa guida fornisce una mappa completa di tutti i codici di errore HTTP utilizzati nel server del gioco "Indovina la Frase". Il sistema implementa una gestione errori robusta con validazione server-side e feedback dettagliato per il client.

## Categorizzazione Codici di Errore

### Errori di Autenticazione (401-403)

#### **401 - Unauthorized**
- **Descrizione**: Utente non autenticato
- **Messaggio**: `Not authenticated`
- **Trigger**: Tentativo di accesso a endpoint protetti senza sessione valida
- **Soluzione**: Eseguire login tramite `/api/sessions`

#### **403 - Forbidden**
- **Descrizione**: Accesso negato per limitazioni specifiche
- **Casistiche**:
  - `Not enough coins to start a game` - Monete insufficienti per nuova partita
  - `No coins left for letters` - Monete insufficienti per tentare lettere
  - `Not enough coins` - Monete insufficienti generiche
  - `Forbidden (not a guest game)` - Tentativo accesso guest a partita autenticata
  - `logged in users cannot access guest games` - Utente loggato tenta modalità guest

### Errori di Validazione Input (400)

#### **400 - Bad Request**
- **Descrizione**: Dati forniti dal client non validi
- **Casistiche**:
  - `Invalid game id` - ID partita malformato o non numerico
  - `Invalid input` - Lettera o frase malformata
  - `Only one vowel per game` - Tentativo di usare seconda vocale

### Errori Risorse Non Trovate (404)

#### **404 - Not Found**
- **Casistiche**:
  - `Game not found` - Partita inesistente o non accessibile
  - `Not found` - Risorsa generica non trovata

### Conflitti Logica Business (409)

#### **409 - Conflict**
- **Descrizione**: Operazione non permessa per stato attuale
- **Casistiche**:
  - `Game already ended (won/lost/timeout)` - Partita già conclusa
  - `Game already ended (timeout)` - Partita scaduta per timeout

### Errori Interni Server (500)

#### **500 - Internal Server Error**
## Sistema di Logging e Architettura

### Logging Colorato nel Terminale

Il server implementa un sistema di logging avanzato che mostra messaggi di errore colorati in rosso per facilitare il debugging:

```
GET /api/games/abc 400 5.123 ms - 35
[ERROR 400] Bad Request - Input non valido: "Invalid game id"
```

### Architettura Server-First

Il progetto adotta un approccio "server-first" per la gestione degli errori:

- **Tutte le validazioni sono gestite dal SERVER**
- Frontend invia sempre le richieste al server per validazione
- Server valida e restituisce errori HTTP appropriati
- Frontend mostra errori ricevuti dal server
- **Nessuna validazione client-side** che blocchi le richieste

#### Vantaggi dell'Architettura:
- Tutti gli errori vengono loggati centralmente nel server
- Consistenza: stessa validazione per API e interfaccia utente
- Sicurezza: nessun bypass possibile della validazione
- Debug facilitato: tutti gli errori visibili nel terminale

## Metodologie di Testing

### Test Automatizzato
```bash
cd server
node tests/test_http_api_errors.mjs
```

### Test Manuali Browser

#### 401 - Not Authenticated
- Navigare a `http://localhost:3001/api/games/123` senza login

#### 403 - Not Enough Coins
- Login come utente "empty" (0 monete)
- Tentare di creare una nuova partita

#### 400 - Invalid Input
- Inviare lettera con caratteri speciali: `!@#`
- Utilizzare ID gioco non numerico: `/games/abc`

#### 404 - Game Not Found
- Accedere a partita inesistente: `/games/99999`

#### 409 - Conflict
- Completare una partita e tentare di continuare

### Test Frontend Integrato

Nel frontend, testare:
- Modifica manuale URL con ID non valido
- Gameplay fino a timeout e ulteriori tentativi
- Utilizzo ripetuto della stessa vocale
- Gameplay con monete insufficienti

## Localizzazione dei Codici nel Codebase

### File di Implementazione

- `server/api/games.js` - Errori giochi autenticati
- `server/api/guest.js` - Errori giochi ospite  
- `server/api/sessions.js` - Errori login/logout
- `server/auth/passport.js` - Errori autenticazione
