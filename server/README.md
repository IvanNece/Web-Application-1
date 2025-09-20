# Indovina la Frase — **Server Backend** (Node.js/Express)

> **Backend completo** del progetto AW1 2024/25 – Esame #3 "Indovina la Frase".  
> Server Express.js con API REST sicure, autenticazione Passport, sistema monete intelligente, timer automatici e protezioni anti-cheat complete.

---

## 📌 Panoramica del Sistema

Questo server implementa il backend completo per il gioco "Indovina la Frase" con le seguenti caratteristiche principali:

- **Due modalità di gioco**: utenti autenticati con sistema monete vs modalità ospite gratuita
- **Sistema costi intelligente**: lettere con prezzi variabili basati su frequenza linguistica 
- **Timer automatico**: 60 secondi per partita con gestione timeout server-side
- **Sicurezza anti-cheat**: validazioni rigorose, controlli ownership, no leak informazioni
- **Database transazionale**: SQLite con integrità referenziale e operazioni atomiche
- **Architettura RESTful**: API semantiche con autenticazione basata su sessione

## 🚀 **Avvio Rapido**

```bash
# 1. Posizionati nella cartella server
cd server

# 2. Installa dipendenze
npm install

# 3. Inizializza database con utenti demo e frasi
npm run initdb

# 4. Avvia server in modalità sviluppo
nodemon index.mjs
```

**Server attivo su:** `http://localhost:3001`  
**Comando principale:** `cd server; nodemon index.mjs`

### Utenti di Test Preconfigurati
```
Username: novice   | Password: NoviceUser123!  | Monete: 100  (nuovo utente)
Username: empty    | Password: EmptyCoins456@  | Monete: 0    (test monete esaurite)
Username: player   | Password: PlayerGame789#  | Monete: 180  (con storico partite)
```

---

## 🗂️ **Struttura del Progetto**

```
server/
├─ index.mjs                 # Entry point: Express app, middleware, routing
├─ nodemon.json              # Configurazione nodemon per sviluppo
├─ package.json              # Dipendenze, script, metadata progetto
│
├─ api/                      # Router API REST
│  ├─ sessions.js            #    Autenticazione: login, logout, stato sessione
│  ├─ games.js               #    Partite utenti autenticati (con monete)
│  ├─ guest.js               #    Partite modalità ospite (senza monete)
│  └─ meta.js                #    Metadati di sistema (costi lettere)
│
├─ auth/                     # Sistema autenticazione
│  └─ passport.js            #    Strategia Local, middleware, serializzazione
│
├─ lib/                      # Librerie e utilities
│  ├─ db.js                  #    Database: wrapper SQLite con Promise e transazioni
│  └─ costs.js               #    Sistema costi lettere, logica frequenze linguistiche
│
├─ db/                       # Database SQLite
│  ├─ schema.sql             #    Schema tabelle, indici, vincoli
│  ├─ seed.sql               #    Frasi del gioco (30 autenticati + 3 ospiti)
│  └─ aw1.db                 #    File database (auto-generato)
│
├─ scripts/                  # Script utility
│  └─ initdb.mjs             #    Inizializzazione database completa
│
└─ tests/                    # Suite di test e debugging
   ├─ *.http                 #    Test API con REST Client
   ├─ *.mjs                  #    Script di test automatizzati
   └─ *_GUIDE.md             #    Guide per testing e debugging
```

---

## 🛠️ **Stack Tecnologico**

### Core Framework
- **Node.js 22.x LTS** — Runtime JavaScript ad alte prestazioni
- **Express 4.21+** — Framework web minimalista e veloce
- **ES6 Modules** — Import/export moderni per codice pulito

### Database & Persistenza
- **SQLite 3** — Database embedded, zero-configuration
- **sqlite3 5.1+** — Driver Node.js nativo e performante
- **Transazioni ACID** — Operazioni atomiche garantite
- **Foreign Keys** — Integrità referenziale completa

### Autenticazione & Sicurezza
- **Passport.js 0.7** — Framework autenticazione modulare
- **passport-local** — Strategia username/password locale
- **express-session** — Gestione sessioni sicure con cookie
- **bcryptjs** — Hash password con salt (10 rounds)
- **CORS configurato** — Solo origin autorizzato con credentials

### Validazione & Middleware
- **express-validator** — Validazione e sanitizzazione robusta
- **Morgan** — Logging richieste HTTP con colori per debugging

### Pattern Architetturali
- **Architettura "Due Server"**: Client React (5173) ↔ API Server (3001)
- **RESTful API Design**: Endpoints semantici, verbi HTTP appropriati
- **Session-based Auth**: Cookie HttpOnly, SameSite=Lax, Secure in prod

---

# 📡 Server-side — API HTTP Complete

> **Note Generali:**
> - Tutte le risposte sono in formato **JSON**
> - Timestamp in **millisecondi** (`timeLeft`, `startedAt`, `expiresAt`)
> - Rotte autenticate richiedono **cookie di sessione valido**
> - Headers richiesti: `Content-Type: application/json` per POST requests
> - **Validazione rigorosa**: tutti gli input vengono validati con express-validator
> - **Sanitizzazione automatica**: prevenzione XSS e SQL injection
> - **Rate limiting**: protezione contro spam e attacchi DoS
> - **Errori 500**: Tutte le API possono restituire `500 Internal Server Error` per errori server non gestiti

---

## 🔐 Sessioni & Autenticazione

### `POST /api/sessions` — Login Utente
Autentica un utente e crea una sessione sicura con cookie HttpOnly.

**Endpoint:** `POST /api/sessions`  
**Auth:** Non richiesta  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "username": "novice",
  "password": "NoviceUser123!"
}
```

**Request Schema:**
- `username` (string, required): Nome utente, minimo 1 carattere
- `password` (string, required): Password utente, minimo 1 carattere

**Response 200 - Success:**
```json
{
  "id": 1,
  "username": "novice", 
  "coins": 100
}
```
*Imposta automaticamente cookie di sessione `aw1.sid` HttpOnly*

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid payload",
  "details": [
    { "msg": "username required", "param": "username" },
    { "msg": "password required", "param": "password" }
  ]
}
```

**Response 401 - Unauthorized:**
```json
{
  "error": "Credenziali non valide"
}
```

**Possibili Errori di Validazione:**
- Username vuoto
- Password vuota
- Credenziali errate
- Utente non esistente

---

### `GET /api/sessions/current` — Verifica Stato Sessione
Controlla se l'utente è attualmente autenticato e restituisce i suoi dati.

**Endpoint:** `GET /api/sessions/current`  
**Auth:** Non richiesta (verifica sessione)  
**Query Parameters:** Nessuno

**Response 200 - Utente Autenticato:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "novice",
    "coins": 95
  }
}
```

**Response 200 - Utente Non Autenticato:**
```json
{
  "authenticated": false
}
```

---

### `DELETE /api/sessions/current` — Logout Utente
Invalida la sessione corrente e rimuove il cookie di autenticazione.

**Endpoint:** `DELETE /api/sessions/current`  
**Auth:** Cookie di sessione  
**Body:** Nessuno

**Response 204 - No Content:**
*Nessun body di risposta, cookie rimosso*

---

## 🎮 Partite — Utenti Autenticati (`/api/games`)

> **Regole Sistema Monete:**
> - **Costo lettere:** Vocali 10 monete (max 1), Consonanti 1-5 monete per frequenza
> - **Penalità miss:** Costo raddoppiato per lettere sbagliate
> - **Premi:** +100 monete per vittoria, -20 monete per timeout, 0 per abbandono

### Sistema Costi Lettere Intelligente
```javascript
// Vocali (10 monete base, max 1 per partita)
VOCALI: A, E, I, O, U → 10 monete base

// Consonanti per frequenza linguistica (costo base + raddoppio se miss)
COSTO 5: T, N, H, S     // Lettere più frequenti
COSTO 4: R, L, D, C     // Alta frequenza  
COSTO 3: M, W, Y, F     // Media frequenza
COSTO 2: G, P, B, V     // Bassa frequenza
COSTO 1: K, J, X, Q, Z  // Lettere rare

// Esempi calcolo finale:
// Lettera T presente: 5 monete
// Lettera T assente: 10 monete (5 × 2)
// Vocale A presente: 10 monete  
// Vocale A assente: 20 monete (10 × 2)
```

---

### `POST /api/games` — Crea Nuova Partita
Crea una nuova partita per l'utente autenticato con frase casuale.

**Endpoint:** `POST /api/games`  
**Auth:** Cookie di sessione richiesto  
**Content-Type:** `application/json`  
**Body:** Nessuno

**Prerequisiti:**
- Utente autenticato con sessione valida
- Saldo minimo: 1 moneta (per permettere almeno un tentativo)

**Response 201 - Created:**
```json
{
  "gameId": 123,
  "status": "running",
  "phraseLength": 42,
  "spaces": [8, 14, 26, 35],
  "revealed": [],
  "revealedLetters": {},
  "hasUsedVowel": false,
  "timeLeft": 60000,
  "coins": 95
}
```

**Response Schema:**
- `gameId` (number): ID univoco partita creata
- `status` (string): Stato partita, sempre "running" alla creazione
- `phraseLength` (number): Lunghezza totale frase in caratteri
- `spaces` (array): Indici posizioni spazi nella frase
- `revealed` (array): Indici lettere rivelate (vuoto all'inizio)
- `revealedLetters` (object): Mappa posizione → lettera (vuoto all'inizio)
- `hasUsedVowel` (boolean): Flag uso vocale (false all'inizio)
- `timeLeft` (number): Millisecondi rimanenti (60000 = 60s)
- `coins` (number): Saldo monete aggiornato dell'utente

**Response 403 - Forbidden:**
```json
{
  "error": "💸 Non hai abbastanza monete per iniziare una partita! 🎮"
}
```

---

### `GET /api/games/:id` — Recupera Stato Partita
Restituisce lo stato attuale di una partita specifica dell'utente.

**Endpoint:** `GET /api/games/:id`  
**Auth:** Cookie di sessione richiesto  
**Path Parameters:**
- `id` (number, required): ID univoco della partita

**Response 200 - Partita In Corso:**
```json
{
  "gameId": 123,
  "status": "running",
  "phraseLength": 42,
  "spaces": [8, 14, 26, 35],
  "revealed": [0, 15, 16, 17],
  "revealedLetters": {
    "0": "B",
    "15": "T", 
    "16": "H",
    "17": "E"
  },
  "hasUsedVowel": true,
  "timeLeft": 45230,
  "coins": 85
}
```

**Response 200 - Partita Terminata:**
```json
{
  "gameId": 123,
  "status": "won",
  "phraseLength": 42,
  "spaces": [8, 14, 26, 35],
  "revealed": [0, 2, 4, 8, 15, 16, 17, 22, 24, 28, 35],
  "revealedLetters": {},
  "hasUsedVowel": true,
  "timeLeft": 0,
  "coins": 195,
  "phrase": "be kind to yourself every single day"
}
```

**Comportamenti Automatici:**
- **Timeout automatico:** Se `timeLeft ≤ 0`, applica status "timeout" e penalità -20 monete
- **Frase nascosta:** Campo `phrase` presente solo se status ≠ "running" (sicurezza anti-cheat)
- **revealedLetters:** Mappa vuota se partita terminata (ottimizzazione)

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid game id"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Forbidden"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "be kind to yourself every single day"
}
```

---

### `POST /api/games/:id/guess-letter` — Tenta Lettera Singola
Acquista e tenta una lettera specifica nella partita corrente.

**Endpoint:** `POST /api/games/:id/guess-letter`  
**Auth:** Cookie di sessione richiesto  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita

**Request Body:**
```json
{
  "letter": "A"
}
```

**Request Schema:**
- `letter` (string, required): Singolo carattere A-Z (case insensitive)

**Response 200 - Lettera Trovata (Hit):**
```json
{
  "revealedIndexes": [5, 12, 28],
  "revealed": [0, 5, 12, 15, 16, 17, 28],
  "revealedLetters": {
    "0": "B",
    "5": "A", 
    "12": "A",
    "15": "T",
    "16": "H", 
    "17": "E",
    "28": "A"
  },
  "costApplied": 10,
  "coins": 85,
  "hasUsedVowel": true,
  "timeLeft": 43100
}
```

**Response 200 - Lettera Non Trovata (Miss):**
```json
{
  "revealedIndexes": [],
  "revealed": [0, 15, 16, 17],
  "revealedLetters": {
    "0": "B",
    "15": "T",
    "16": "H", 
    "17": "E"
  },
  "costApplied": 20,
  "coins": 65,
  "hasUsedVowel": true,
  "timeLeft": 41800
}
```

**Response 200 - Lettera Già Utilizzata:**
```json
{
  "revealedIndexes": [],
  "revealed": [0, 15, 16, 17],
  "revealedLetters": {
    "0": "B",
    "15": "T",
    "16": "H",
    "17": "E"
  },
  "costApplied": 0,
  "coins": 85,
  "hasUsedVowel": true,
  "timeLeft": 43100
}
```

**Response Schema:**
- `revealedIndexes` (array): Nuove posizioni rivelate da questa lettera
- `revealed` (array): Tutte le posizioni rivelate fino ad ora
- `revealedLetters` (object): Mappa completa posizione → lettera rivelata
- `costApplied` (number): Monete effettivamente spese per questo tentativo
- `coins` (number): Saldo monete aggiornato dell'utente
- `hasUsedVowel` (boolean): Flag aggiornato uso vocale
- `timeLeft` (number): Millisecondi rimanenti

**Logica Costi Applicata:**
- **Lettera nuova presente:** Costo base (1-10 monete)
- **Lettera nuova assente:** Costo base × 2 (penalità miss)
- **Lettera già usata:** Costo 0 (nessun addebito)
- **Monete insufficienti:** Addebita tutto il saldo residuo

**Response 400 - Bad Request:**
```json
{
  "error": "🚫 Carattere mancante! Inserisci una lettera valida (A-Z) 📝"
}
```
```json
{
  "error": "⚠️ Inserisci solo un carattere alla volta! 📝"
}
```
```json
{
  "error": "🚫 Carattere non valido! Usa solo lettere A-Z 🔤"
}
```
```json
{
  "error": "Solo una vocale per partita"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Forbidden"
}
```
```json
{
  "error": "No coins left for letters"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "be kind to yourself every single day"
}
```
```json
{
  "error": "Game already ended (won)"
}
```

---

### `POST /api/games/:id/guess-phrase` — Tenta Frase Completa
Tenta di indovinare l'intera frase per vincere immediatamente la partita.

**Endpoint:** `POST /api/games/:id/guess-phrase`  
**Auth:** Cookie di sessione richiesto  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita

**Request Body:**
```json
{
  "attempt": "be kind to yourself every single day"
}
```

**Request Schema:**
- `attempt` (string, required): Tentativo frase completa, 1-100 caratteri

**Response 200 - Frase Corretta (Vittoria):**
```json
{
  "result": "win",
  "status": "won", 
  "coinsDelta": 100,
  "phrase": "be kind to yourself every single day",
  "coins": 195
}
```

**Response 200 - Frase Errata:**
```json
{
  "result": "wrong",
  "status": "running",
  "message": "Not the correct phrase", 
  "timeLeft": 35600,
  "coins": 85
}
```

**Response Schema (Vittoria):**
- `result` (string): "win" per vittoria
- `status` (string): "won" stato finale partita
- `coinsDelta` (number): Monete guadagnate (+100)
- `phrase` (string): Frase completa rivelata
- `coins` (number): Saldo finale aggiornato

**Response Schema (Errore):**
- `result` (string): "wrong" per tentativo errato
- `status` (string): "running" partita continua
- `message` (string): Messaggio descrittivo
- `timeLeft` (number): Millisecondi rimanenti
- `coins` (number): Saldo attuale (nessuna penalità)

**Comportamento:**
- **Confronto case-insensitive:** "Hello World" = "hello world"
- **Nessuna penalità:** Tentativi errati non costano monete
- **Vittoria immediata:** +100 monete e status "won"
- **Partita continua:** Se sbagliato, permette altri tentativi

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid input"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Forbidden"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "be kind to yourself every single day"
}
```
```json
{
  "error": "Game already ended (won)"
}
```

---

### `POST /api/games/:id/abandon` — Abbandona Partita
Termina volontariamente la partita corrente senza penalità monetarie.

**Endpoint:** `POST /api/games/:id/abandon`  
**Auth:** Cookie di sessione richiesto  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita  
**Body:** Nessuno

**Response 200 - Abbandono Confermato:**
```json
{
  "status": "abandoned",
  "phrase": "be kind to yourself every single day"
}
```

**Response 200 - Partita Già Terminata:**
```json
{
  "status": "won",
  "phrase": "be kind to yourself every single day"
}
```

**Response Schema:**
- `status` (string): Stato finale partita ("abandoned", "won", "timeout")
- `phrase` (string): Frase completa rivelata

**Comportamento:**
- **Nessuna penalità:** Abbandono volontario non costa monete
- **Stato finale:** Partita impostata su "abandoned"
- **Frase rivelata:** Mostra soluzione completa
- **Idempotente:** Chiamate multiple su partita già terminata restituiscono stato attuale

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid game id"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Forbidden"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Game not found"
}
```

---

## 🕹️ Partite — Modalità Ospite (`/api/guest/games`)

> **Caratteristiche Modalità Guest:**
> - **Accesso:** Solo utenti NON autenticati (redirect se logged in)
> - **Costi:** Tutte le lettere gratuite, nessuna limitazione vocali
> - **Timer:** Identico modalità auth (60 secondi)
> - **Pool frasi:** 3 frasi semplificate dedicate agli ospiti
> - **Premi:** Nessun guadagno monetario (solo soddisfazione personale)

---

### `POST /api/guest/games` — Crea Partita Ospite
Crea una nuova partita gratuita per utenti non registrati.

**Endpoint:** `POST /api/guest/games`  
**Auth:** Nessuna (utente deve essere NON autenticato)  
**Content-Type:** `application/json`  
**Body:** Nessuno

**Prerequisiti:**
- Utente NON deve essere autenticato
- Pool frasi guest disponibili

**Response 201 - Created:**
```json
{
  "gameId": 456,
  "status": "running",
  "phraseLength": 35,
  "spaces": [5, 9, 15, 27],
  "revealed": [],
  "timeLeft": 60000
}
```

**Response Schema:**
- `gameId` (number): ID univoco partita guest
- `status` (string): Stato partita, sempre "running" alla creazione
- `phraseLength` (number): Lunghezza totale frase in caratteri
- `spaces` (array): Indici posizioni spazi nella frase
- `revealed` (array): Indici lettere rivelate (vuoto all'inizio)
- `timeLeft` (number): Millisecondi rimanenti (60000 = 60s)

**Campi Non Presenti (differenze da modalità auth):**
- `coins`: Non applicabile per ospiti
- `hasUsedVowel`: Nessun limite vocali per guest
- `revealedLetters`: Semplificazione per guest

**Response 403 - Forbidden:**
```json
{
  "error": "Guest mode not available for authenticated users"
}
```

---

### `GET /api/guest/games/:id` — Stato Partita Ospite
Recupera lo stato attuale di una partita guest specifica.

**Endpoint:** `GET /api/guest/games/:id`  
**Auth:** Nessuna (utente deve essere NON autenticato)  
**Path Parameters:**
- `id` (number, required): ID univoco della partita guest

**Response 200 - Partita In Corso:**
```json
{
  "gameId": 456,
  "status": "running",
  "phraseLength": 35,
  "spaces": [5, 9, 15, 27],
  "revealed": [0, 2, 15, 22],
  "revealedLetters": {
    "0": "E",
    "2": "E", 
    "15": "C",
    "22": "G"
  },
  "timeLeft": 42300
}
```

**Response 200 - Partita Terminata:**
```json
{
  "gameId": 456,
  "status": "won",
  "phraseLength": 35,
  "spaces": [5, 9, 15, 27],
  "revealed": [0, 2, 4, 5, 8, 15, 18, 22, 26, 28, 32],
  "revealedLetters": {},
  "timeLeft": 0,
  "phrase": "every day is a new chance to grow"
}
```

**Comportamenti Automatici:**
- **Timeout automatico:** Se `timeLeft ≤ 0`, applica status "timeout" (nessuna penalità)
- **Frase nascosta:** Campo `phrase` presente solo se status ≠ "running"
- **revealedLetters:** Mappa vuota se partita terminata

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid game id"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Guest mode not available for authenticated users"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Guest game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "every day is a new chance to grow"
}
```

---

### `POST /api/guest/games/:id/guess-letter` — Tenta Lettera Ospite
Tenta una lettera specifica nella partita guest (sempre gratuito).

**Endpoint:** `POST /api/guest/games/:id/guess-letter`  
**Auth:** Nessuna (utente deve essere NON autenticato)  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita guest

**Request Body:**
```json
{
  "letter": "E"
}
```

**Request Schema:**
- `letter` (string, required): Singolo carattere A-Z (case insensitive)

**Response 200 - Lettera Trovata:**
```json
{
  "revealedIndexes": [0, 2, 26],
  "revealed": [0, 2, 15, 22, 26],
  "revealedLetters": {
    "0": "E",
    "2": "E", 
    "15": "C",
    "22": "G",
    "26": "E"
  },
  "costApplied": 0,
  "timeLeft": 40800
}
```

**Response 200 - Lettera Non Trovata:**
```json
{
  "revealedIndexes": [],
  "revealed": [0, 2, 15, 22],
  "revealedLetters": {
    "0": "E",
    "2": "E",
    "15": "C", 
    "22": "G"
  },
  "costApplied": 0,
  "timeLeft": 39200
}
```

**Response 200 - Lettera Già Utilizzata:**
```json
{
  "revealedIndexes": [],
  "revealed": [0, 2, 15, 22],
  "revealedLetters": {
    "0": "E",
    "2": "E",
    "15": "C",
    "22": "G"
  },
  "costApplied": 0,
  "timeLeft": 40800
}
```

**Response Schema:**
- `revealedIndexes` (array): Nuove posizioni rivelate da questa lettera
- `revealed` (array): Tutte le posizioni rivelate fino ad ora
- `revealedLetters` (object): Mappa completa posizione → lettera rivelata
- `costApplied` (number): Sempre 0 per modalità guest
- `timeLeft` (number): Millisecondi rimanenti

**Caratteristiche Guest:**
- **Sempre gratuito:** `costApplied` sempre 0
- **Nessun limite vocali:** Possibili tentativi illimitati A,E,I,O,U
- **Stessa validazione:** Controllo carattere A-Z identico a modalità auth
- **Nessuna penalità miss:** Stesso costo per hit/miss

**Response 400 - Bad Request:**
```json
{
  "error": "🚫 Carattere mancante! Inserisci una lettera valida (A-Z) 📝"
}
```
```json
{
  "error": "⚠️ Inserisci solo un carattere alla volta! 📝"
}
```
```json
{
  "error": "🚫 Carattere non valido! Usa solo lettere A-Z 🔤"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Guest mode not available for authenticated users"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Guest game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "every day is a new chance to grow"
}
```

---

### `POST /api/guest/games/:id/guess-phrase` — Tenta Frase Ospite
Tenta di indovinare l'intera frase per completare la partita guest.

**Endpoint:** `POST /api/guest/games/:id/guess-phrase`  
**Auth:** Nessuna (utente deve essere NON autenticato)  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita guest

**Request Body:**
```json
{
  "attempt": "every day is a new chance to grow"
}
```

**Request Schema:**
- `attempt` (string, required): Tentativo frase completa, 1-100 caratteri

**Response 200 - Frase Corretta (Vittoria):**
```json
{
  "result": "win",
  "status": "won",
  "phrase": "every day is a new chance to grow"
}
```

**Response 200 - Frase Errata:**
```json
{
  "result": "wrong",
  "status": "running",
  "message": "Not the correct phrase",
  "timeLeft": 35600
}
```

**Response Schema (Vittoria):**
- `result` (string): "win" per vittoria
- `status` (string): "won" stato finale partita
- `phrase` (string): Frase completa rivelata

**Response Schema (Errore):**
- `result` (string): "wrong" per tentativo errato
- `status` (string): "running" partita continua
- `message` (string): Messaggio descrittivo
- `timeLeft` (number): Millisecondi rimanenti

**Differenze da Modalità Auth:**
- **Nessun guadagno monete:** Campo `coinsDelta` non presente
- **Nessun costo:** Tentativi sempre gratuiti
- **Stesso comportamento:** Logica vittoria/errore identica

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid input"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Guest mode not available for authenticated users"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Guest game not found"
}
```

**Response 409 - Conflict:**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "every day is a new chance to grow"
}
```

---

### `POST /api/guest/games/:id/abandon` — Abbandona Partita Ospite
Termina volontariamente la partita guest corrente.

**Endpoint:** `POST /api/guest/games/:id/abandon`  
**Auth:** Nessuna (utente deve essere NON autenticato)  
**Content-Type:** `application/json`  
**Path Parameters:**
- `id` (number, required): ID univoco della partita guest  
**Body:** Nessuno

**Response 200 - Abbandono Confermato:**
```json
{
  "status": "abandoned",
  "phrase": "every day is a new chance to grow"
}
```

**Response 200 - Partita Già Terminata:**
```json
{
  "status": "won",
  "phrase": "every day is a new chance to grow"
}
```

**Response Schema:**
- `status` (string): Stato finale partita ("abandoned", "won", "timeout")
- `phrase` (string): Frase completa rivelata

**Comportamento:**
- **Nessuna penalità:** Modalità guest non ha sistema monetario
- **Stato finale:** Partita impostata su "abandoned"
- **Frase rivelata:** Mostra soluzione completa
- **Idempotente:** Chiamate multiple restituiscono stato attuale

**Response 400 - Bad Request:**
```json
{
  "error": "Invalid game id"
}
```

**Response 403 - Forbidden:**
```json
{
  "error": "Guest mode not available for authenticated users"
}
```

**Response 404 - Not Found:**
```json
{
  "error": "Guest game not found"
}
```

---

## 🧩 Metadati & Utility

### `GET /api/meta/letter-costs` — Costi Lettere di Sistema
Restituisce la tabella completa dei costi per tutte le lettere dell'alfabeto.

**Endpoint:** `GET /api/meta/letter-costs`  
**Auth:** Non richiesta  
**Query Parameters:** Nessuno

**Response 200 - Success:**
```json
{
  "letters": [
    { "letter": "A", "type": "vowel", "baseCost": 10 },
    { "letter": "B", "type": "consonant", "baseCost": 2 },
    { "letter": "C", "type": "consonant", "baseCost": 4 },
    { "letter": "D", "type": "consonant", "baseCost": 4 },
    { "letter": "E", "type": "vowel", "baseCost": 10 },
    { "letter": "F", "type": "consonant", "baseCost": 3 },
    { "letter": "G", "type": "consonant", "baseCost": 2 },
    { "letter": "H", "type": "consonant", "baseCost": 5 },
    { "letter": "I", "type": "vowel", "baseCost": 10 },
    { "letter": "J", "type": "consonant", "baseCost": 1 },
    { "letter": "K", "type": "consonant", "baseCost": 1 },
    { "letter": "L", "type": "consonant", "baseCost": 4 },
    { "letter": "M", "type": "consonant", "baseCost": 3 },
    { "letter": "N", "type": "consonant", "baseCost": 5 },
    { "letter": "O", "type": "vowel", "baseCost": 10 },
    { "letter": "P", "type": "consonant", "baseCost": 2 },
    { "letter": "Q", "type": "consonant", "baseCost": 1 },
    { "letter": "R", "type": "consonant", "baseCost": 4 },
    { "letter": "S", "type": "consonant", "baseCost": 5 },
    { "letter": "T", "type": "consonant", "baseCost": 5 },
    { "letter": "U", "type": "vowel", "baseCost": 10 },
    { "letter": "V", "type": "consonant", "baseCost": 2 },
    { "letter": "W", "type": "consonant", "baseCost": 3 },
    { "letter": "X", "type": "consonant", "baseCost": 1 },
    { "letter": "Y", "type": "consonant", "baseCost": 3 },
    { "letter": "Z", "type": "consonant", "baseCost": 1 }
  ]
}
```

**Response Schema:**
- `letters` (array): Lista completa lettere con metadati
  - `letter` (string): Lettera maiuscola A-Z
  - `type` (string): Tipo lettera ("vowel" o "consonant")
  - `baseCost` (number): Costo base in monete

**Utilizzo:**
- **Frontend:** Visualizzazione costi nella tastiera virtuale
- **Sviluppo:** Debug e testing sistema costi
- **Documentazione:** Riferimento completo pricing

**Logica Costi Ricorda:**
- **Costo finale hit:** `baseCost` (se lettera presente)
- **Costo finale miss:** `baseCost × 2` (se lettera assente)
- **Modalità guest:** Sempre gratuito indipendentemente da `baseCost`

# 🗄️ Database — Tabelle & Struttura

> **Database:** SQLite v3 (file `db/aw1.db`)  
> **Configurazione:** Foreign Keys abilitate, transazioni ACID complete
> **Validazione:** Vincoli referenziali e controlli di integrità a livello database

---

## 📋 Schema Tabelle

### `users` — Gestione Utenti Registrati
**Scopo:** Gestisce gli account degli utenti autenticati con sistema monetario integrato per acquistare lettere durante le partite.

**Struttura Completa:**
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT): Identificatore univoco dell'utente, chiave primaria auto-incrementale
- `username` (TEXT UNIQUE NOT NULL): Nome utente univoco per login, utilizzato per l'autenticazione
- `password_hash` (TEXT NOT NULL): Hash bcrypt della password utente (saltRounds=10), mai memorizzata in chiaro
- `coins` (INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0)): Saldo monete per acquistare lettere, con vincolo non-negativo

**Validazioni e Vincoli:**
- Username univoco tramite constraint UNIQUE per evitare duplicati
- Saldo monete non può mai essere negativo (CHECK constraint)
- Password sempre hashata con bcrypt per sicurezza
- Valore di default 100 monete per nuovi utenti

### `phrases` — Pool Frasi da Indovinare
**Scopo:** Contiene tutte le frasi disponibili per il gioco, suddivise per modalità autenticata e guest con difficoltà differenziata.

**Struttura Completa:**
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT): Identificatore univoco della frase, chiave primaria auto-incrementale
- `text` (TEXT NOT NULL): Testo completo della frase da indovinare, solo lettere maiuscole e spazi
- `mode` (TEXT NOT NULL CHECK (mode IN ('auth','guest'))): Modalità di gioco per cui la frase è destinata

**Validazioni e Vincoli:**
- Lunghezza frase obbligatoria tra 30 e 50 caratteri (CHECK constraint)
- Mode limitato a 'auth' o 'guest' tramite CHECK constraint
- Contenuto: 30 frasi motivazionali per utenti autenticati + 3 semplificate per ospiti
- Frasi auth più complesse e varie, frasi guest più semplici e accessibili

### `games` — Stato e Cronologia Partite
**Scopo:** Traccia tutte le partite attive e completate, gestendo timer automatico, economia delle monete e stati di gioco per utenti registrati e ospiti.

**Struttura Completa:**
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT): Identificatore univoco della partita, chiave primaria auto-incrementale
- `userId` (INTEGER NULL, FK → users.id): Collegamento all'utente proprietario, NULL per partite guest
- `phraseId` (INTEGER NOT NULL, FK → phrases.id): Riferimento alla frase da indovinare per questa partita
- `status` (TEXT NOT NULL CHECK (status IN ('running','won','timeout','abandoned','ended'))): Stato corrente della partita
  - `running`: Partita in corso, timer attivo
  - `won`: Partita vinta dall'utente, +100 monete se auth
  - `timeout`: Scaduto il timer (60s), -20 monete penalty se auth
  - `abandoned`: Abbandonata volontariamente, nessuna penalty
  - `ended`: Stato generico di chiusura
- `startedAt` (INTEGER NOT NULL): Timestamp Unix (millisecondi) di inizio partita
- `expiresAt` (INTEGER NOT NULL): Timestamp Unix (millisecondi) di scadenza automatica (startedAt + 60000ms)
- `hasUsedVowel` (INTEGER NOT NULL DEFAULT 0 CHECK (hasUsedVowel IN (0,1))): Flag booleano uso vocale (0=no, 1=sì), limite 1 vocale per partita auth
- `coinsSpent` (INTEGER NOT NULL DEFAULT 0): Totale monete spese per lettere durante questa partita
- `coinsDelta` (INTEGER NOT NULL DEFAULT 0): Variazione finale saldo utente (+100 vittoria, -20 timeout, 0 abbandono)

**Logica Timer e Economia:**
- Timer fisso 60 secondi per tutte le partite
- Sistema monetario solo per utenti autenticati (userId NOT NULL)
- Partite guest (userId NULL) sempre gratuite
- Controllo automatico scadenza quando `Date.now() > expiresAt`

### `game_letters` — Audit Trail Lettere Tentate
**Scopo:** Mantiene cronologia completa di ogni lettera tentata in ogni partita, con tracciamento costi applicati e risultati per audit e prevenzione duplicati.

**Struttura Completa:**
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT): Identificatore univoco del tentativo lettera, chiave primaria auto-incrementale
- `gameId` (INTEGER NOT NULL, FK → games.id): Riferimento alla partita di appartenenza
- `letter` (TEXT NOT NULL CHECK (length(letter)=1 AND letter BETWEEN 'A' AND 'Z'))`: Lettera tentata, singolo carattere maiuscolo A-Z
- `wasHit` (INTEGER NOT NULL CHECK (wasHit IN (0,1)))`: Risultato tentativo (0=miss, 1=hit), indica se la lettera era presente nella frase
- `costApplied` (INTEGER NOT NULL)`: Monete effettivamente addebitate per questo tentativo (può essere 0 per duplicati o guest)

**Protezioni e Validazioni:**
- Constraint UNIQUE(gameId, letter) impedisce acquisti duplicati della stessa lettera
- Validazione lettera singola maiuscola A-Z
- wasHit booleano per tracking accurato hit/miss rate
- costApplied traccia il costo effettivo (baseCost per hit, baseCost×2 per miss, 0 per duplicati/guest)

---

## 🔗 Relazioni Database

```
users (1) ←→ (0..n) games         # Un utente può avere molte partite (NULL per guest)
phrases (1) ←→ (0..n) games       # Una frase può essere usata in molte partite simultanee  
games (1) ←→ (0..n) game_letters  # Una partita traccia molte lettere tentate
```

**Relazioni Dettagliate:**
- **users → games**: Relazione 1:N con supporto guest (userId NULL), ON DELETE comportamento definito da business logic
- **phrases → games**: Relazione 1:N permettendo riutilizzo frasi in partite multiple, distribuzione casuale
- **games → game_letters**: Relazione 1:N con cascading per cronologia completa, vincolo univocità lettera/partita

**Indici di Performance:**
- `idx_users_username` — Ottimizza ricerca utenti durante login e autenticazione
- `idx_phrases_mode` — Accelera filtro frasi per modalità ('auth'/'guest') nella selezione casuale
- `idx_games_userId` — Migliora query cronologia partite per utente specifico  
- `idx_games_phraseId` — Ottimizza analisi utilizzo frasi e statistiche
- `idx_game_letters_gameId` — Accelera recupero lettere tentate per partita specifica

---

# 🔒 Sicurezza & Validazione Dati

## Autenticazione & Autorizzazione

### Cookie di Sessione Sicuri
```javascript
session({
  name: 'aw1.sid',
  secret: 'production-secret-key',
  cookie: {
    httpOnly: true,      // Impedisce accesso JavaScript client-side
    sameSite: 'lax',     // Protezione CSRF
    secure: true,        // HTTPS obbligatorio in produzione
  }
})
```

### CORS Restrictive
```javascript
cors({
  origin: 'http://localhost:5173',  // Solo client autorizzato
  credentials: true,                // Cookie inclusi nelle richieste
  methods: ['GET', 'POST', 'DELETE'], // Metodi limitati
  allowedHeaders: ['Content-Type']  // Header limitati
})
```

## Validazione Input con express-validator

### Validazione Parametri API
```javascript
// Login - validazione credenziali (api/sessions.js)
body('username')
  .isString()
  .trim()
  .isLength({ min: 1 })
  .withMessage('username required'),
  
body('password')
  .isString()
  .isLength({ min: 1 })
  .withMessage('password required')

// Lettera - validazione formato (api/games.js, api/guest.js)
body('letter')
  .isString()
  .isLength({ min: 1, max: 1 })
  .matches(/^[A-Za-z]$/)
  .withMessage('Carattere non valido! Usa solo lettere A-Z')

// Frase - validazione tentativo (api/games.js, api/guest.js)
body('attempt')
  .isString()
  .trim()
  .isLength({ min: 1 })
  .withMessage('Tentativo frase non può essere vuoto')

// Parametri URL - validazione ID partita
param('id')
  .isInt({ min: 1 })
  .withMessage('Game ID deve essere intero positivo')
```

### Gestione Errori Personalizzati
Il codice implementa messaggi di errore specifici e user-friendly:

```javascript
// Validazione lettera con messaggi emoji (games.js, guest.js)
if (req.body.letter === undefined || req.body.letter === null) {
  return res.status(400).json({ 
    error: '🚫 Carattere mancante! Inserisci una lettera valida (A-Z) 📝' 
  });
}
if (typeof req.body.letter !== 'string' || req.body.letter.length !== 1) {
  return res.status(400).json({ 
    error: '⚠️ Inserisci solo un carattere alla volta! 📝' 
  });
}
if (!/^[A-Za-z]$/.test(req.body.letter)) {
  return res.status(400).json({ 
    error: '🚫 Carattere non valido! Usa solo lettere A-Z 🔤' 
  });
}
```

## Controlli Business Logic

### Controlli di Ownership
- Partite utenti: accesso solo alle proprie tramite `userId` in sessione
- Partite guest: validazione che sia effettivamente guest (`userId IS NULL`)
- Cross-user protection: impossibile accedere a partite di altri utenti

### Prevenzione Data Leak
- Frase nascosta: mai inviata mentre `status='running'`
- Rivelazione graduale: solo lettere effettivamente acquistate
- Validazione server-side: tutti i controlli ripetuti lato server
- No shortcuts: impossibile bypassare costi o limiti dal client

### Integrità Economica
- Controlli transazionali: tutte le operazioni monete in transazione atomica
- Saldi non negativi: vincolo database `coins >= 0` sempre rispettato
- Doppio controllo: validazione monete prima e dopo operazioni
- Audit trail: ogni movimento monete tracciato in `coinsDelta`

---

# 🚦 Gestione Errori & Codici HTTP

> 📚 **Per informazioni complete su testing e metodologie:**  
> **[🧪 TESTING_GUIDE.md](tests/TESTING_GUIDE.md)** - Guida completa al sistema di testing

## Mappatura Codici HTTP

| **Codice** | **Significato** | **Quando** | **Esempio** |
|------------|-----------------|------------|-------------|
| **200** | Success | Operazione completata | Lettera trovata, frase indovinata |
| **201** | Created | Risorsa creata | Nuova partita avviata |
| **204** | No Content | Logout completato | Cookie rimosso |
| **400** | Bad Request | Input non valido | "🚫 Carattere non valido A-Z 🔤" |
| **401** | Unauthorized | Login richiesto | "Not authenticated" |
| **403** | Forbidden | Accesso negato | "💸 Monete insufficienti! 🎮" |
| **404** | Not Found | Risorsa inesistente | "Game not found" |
| **409** | Conflict | Stato inconsistente | "Game already ended (timeout)" |
| **500** | Internal Error | Errore server | "Internal Server Error" |

## Formato Risposte di Errore

### **Standard:**
```json
{ "error": "Descrizione user-friendly" }
```

### **Enhanced (409 Conflict):**
```json
{
  "error": "Game already ended (timeout)",
  "status": "timeout",
  "phrase": "frase completa"
}
```

## Esempi Errori Comuni

### **400 - Validazione Input:**
```json
{ "error": "🚫 Carattere mancante! Inserisci A-Z 📝" }
{ "error": "Solo una vocale per partita" }
{ "error": "Invalid game id" }
```

### **403 - Accesso Negato:**
```json
{ "error": "💸 Non hai abbastanza monete!" }
{ "error": "Guest mode not available for authenticated users" }
{ "error": "Forbidden" }
```

### **409 - Partita Terminata:**
```json
{ "error": "Game already ended (won)" }
{ "error": "Game already ended (abandoned)" }
```


# 🧪 Dati di Test & Seed

## Utenti Demo Preconfigurati

### novice (Nuovo Utente)
- **Username:** `novice` | **Password:** `NoviceUser123!` | **Monete:** 100
- **Scopo:** Test primo utilizzo, esperienza utente nuovo

### empty (Monete Esaurite)
- **Username:** `empty` | **Password:** `EmptyCoins456@` | **Monete:** 0
- **Scopo:** Verifica comportamento senza monete, blocchi accesso

### player (Utente Esperto)
- **Username:** `player` | **Password:** `PlayerGame789#` | **Monete:** 180
- **Scopo:** Test funzionalità complete, gestione partite multiple

## Pool Frasi

### Modalità Autenticata (30 frasi)
Frasi motivazionali da 30-50 caratteri:
- `"be kind to yourself every single day"`
- `"small steps lead to big changes ahead"`
- `"today is a good day to start fresh"`

### Modalità Ospite (3 frasi)
Frasi semplificate per visitatori:
- `"every day is a new chance to grow"` 
- `"be happy with who you are becoming"`
- `"be happy about the person you are today"`

## Partite di Esempio
Il database viene inizializzato con partite di esempio per l'utente `player`:
- **Partita vittoriosa**: Status `won`, +100 monete
- **Partita scaduta**: Status `timeout`, -20 monete

---

# ⚙️ Script e Configurazione

## Script NPM Disponibili

```json
{
  "scripts": {
    "dev": "nodemon index.mjs",           // Sviluppo con auto-restart
    "initdb": "node ./scripts/initdb.mjs", // Inizializzazione database
    "test": "echo \"Error: no test specified\" && exit 1"   // Placeholder per test
  }
}
```

## Inizializzazione Database
Lo script `initdb.mjs` esegue:

1. **Creazione schema** completo con vincoli e indici
2. **Popolamento frasi** per entrambe le modalità  
3. **Creazione utenti** con password hash bcrypt
4. **Partite di esempio** per testing avanzato
5. **Output credenziali** per sviluppatori

**Esecuzione:** `npm run initdb`

**Output tipico:**
```
Recreating schema...
Seeding phrases...
Seeding users with bcrypt hashes...

CREDENZIALI UTENTI DI TEST:
Username: novice   | Password: NoviceUser123!  | Monete: 100
Username: empty    | Password: EmptyCoins456@  | Monete: 0
Username: player   | Password: PlayerGame789#  | Monete: 180

Creating sample games for "player"...
Done. DB ready at db/aw1.db
```

---

# 📡 Architettura & Deployment

## Pattern "Due Server"
```
┌─────────────────┐         ┌─────────────────┐
│   Client React  │  HTTP   │   Server API    │
│  (Vite - 5173)  │ ←────→  │ (Express - 3001)│
│                 │  CORS   │                 │
│ • UI Components │         │ • REST Routes   │
│ • State Mgmt    │         │ • Auth Sessions │
│ • API Calls     │         │ • DB Operations │
└─────────────────┘         └─────────────────┘
                                      │
                               ┌─────────────┐
                               │   SQLite    │
                               │  (aw1.db)   │
                               └─────────────┘
```

## Flow Autenticazione Completo
```
1. Client → POST /api/sessions (username, password)
2. Server → Valida credenziali con bcrypt
3. Server → Crea sessione Passport  
4. Server → Imposta cookie HttpOnly
5. Client → Riceve dati utente + cookie
6. Client → Include cookie in richieste successive
7. Server → Deserializza utente da sessione
8. Server → Autorizza operazioni per utente
```


## Testing
La cartella `tests/` contiene:
- **[🧪 TESTING_GUIDE.md](tests/TESTING_GUIDE.md)** — Guida completa al sistema di testing, codici errore e metodologie di validazione

---

