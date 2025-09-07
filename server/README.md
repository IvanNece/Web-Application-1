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
# OPPURE usando npm script:
npm run dev
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
- **Repository Pattern**: Astrazione database con transazioni

---

# 📡 Server-side — API HTTP Complete

> **Note Generali:**
> - Tutte le risposte sono in formato **JSON**
> - Timestamp in **millisecondi** (`timeLeft`, `startedAt`, `expiresAt`)
> - Rotte autenticate richiedono **cookie di sessione valido**
> - Gestione errori consistente con codici HTTP semantici
> - **Validazione rigorosa**: tutti gli input vengono validati con express-validator
> - **Sanitizzazione automatica**: prevenzione XSS e SQL injection
> - **Rate limiting**: protezione contro spam e attacchi DoS

---

## 🔐 Sessioni & Autenticazione

### `POST /api/sessions` — Login
Autentica un utente e crea una sessione sicura.

**Request:**
```json
{ "username": "novice", "password": "NoviceUser123!" }
```

**Response 200:**
```json
{ "id": 1, "username": "novice", "coins": 100 }
```
*Imposta automaticamente cookie di sessione HttpOnly*

**Validazione:**
- Username: stringa non vuota, max 50 caratteri, solo caratteri alfanumerici
- Password: stringa non vuota, min 8 caratteri

**Errori:** 400 (input), 401 (credenziali), 500 (server)

---

### `GET /api/sessions/current` — Stato Sessione
Verifica autenticazione e restituisce dati utente correnti.

**Response (Autenticato):**
```json
{
  "authenticated": true,
  "user": { "id": 1, "username": "novice", "coins": 95 }
}
```

**Response (Non autenticato):**
```json
{ "authenticated": false }
```

---

### `DELETE /api/sessions/current` — Logout
Invalida sessione corrente e rimuove cookie.

**Response:** `204 No Content`

---

## 🎮 Partite — Utenti Autenticati (`/api/games`)

> **Regole Monete:**
> - Vocali: 10 monete (max 1 per partita) | Consonanti: 1-5 monete per frequenza
> - Miss penalty: costo raddoppiato | Vittoria: +100 | Timeout: -20 | Abbandono: 0

### Sistema Costi Lettere
```javascript
// Vocali (10 monete, max 1 per partita)
VOCALI: A, E, I, O, U → 10 monete

// Consonanti per frequenza (costo base + raddoppio se miss)
COSTO 5: T, N, H, S     // Più frequenti
COSTO 4: R, L, D, C     // Alta frequenza  
COSTO 3: M, W, Y, F     // Media frequenza
COSTO 2: G, P, B, V     // Bassa frequenza
COSTO 1: K, J, X, Q, Z  // Lettere rare
```

---

### `POST /api/games` — Crea Partita
**Auth:** Richiesta | **Prerequisito:** Almeno 1 moneta

**Response 201:**
```json
{
  "gameId": 123, "status": "running", "phraseLength": 42,
  "spaces": [8, 14, 26, 35], "revealed": [], "revealedLetters": {},
  "hasUsedVowel": false, "timeLeft": 60000, "coins": 95
}
```

**Validazione:** Controllo automatico saldo monete utente
**Errori:** 403 (monete insufficienti), 500 (creazione)

---

### `GET /api/games/:id` — Stato Partita
**Auth:** Richiesta + Ownership

**Response (In corso):**
```json
{
  "gameId": 123, "status": "running", "phraseLength": 42,
  "spaces": [8, 14, 26, 35], "revealed": [0, 15, 16, 17],
  "revealedLetters": { "0": "B", "15": "T", "16": "H", "17": "E" },
  "hasUsedVowel": true, "timeLeft": 45230
}
```

**Response (Terminata):** Aggiunge `"phrase": "testo completo"`

**Validazione:** Controllo ownership partita, gestione timeout automatico
**Errori:** 403 (non proprietario), 404 (non trovata), 409 (scaduta)

---

### `POST /api/games/:id/guess-letter` — Tenta Lettera
**Request:**
```json
{ "letter": "A" }
```

**Response (Hit):**
```json
{
  "revealedIndexes": [5, 12, 28], "revealed": [0, 5, 12, 15, 16, 17, 28],
  "revealedLetters": { "0": "B", "5": "A", "12": "A", "15": "T", "16": "H", "17": "E", "28": "A" },
  "costApplied": 10, "coins": 85, "hasUsedVowel": true, "timeLeft": 43100
}
```

**Validazione:**
- Letter: singolo carattere A-Z
- Controllo lettera già utilizzata (gratuita se già tentata)
- Limite vocali (max 1 per partita)
- Saldo monete sufficiente

**Comportamenti speciali:**
- Lettera già usata: `costApplied: 0`
- Monete insufficienti: addebita tutto il saldo residuo
- Miss: costo raddoppiato

**Errori:** 400 (lettera non valida/vocale extra), 409 (partita non attiva)

---

### `POST /api/games/:id/guess-phrase` — Tenta Frase
**Request:**
```json
{ "attempt": "be kind to yourself every single day" }
```

**Response (Vittoria):**
```json
{
  "result": "win", "status": "won", "coinsDelta": 100,
  "phrase": "be kind to yourself every single day", "coins": 195
}
```

**Response (Errore):**
```json
{
  "result": "wrong", "status": "running",
  "message": "Tentativo non corretto", "timeLeft": 35600, "coins": 85
}
```

**Validazione:**
- Attempt: stringa non vuota, max 100 caratteri
- Controllo case-insensitive
- Nessuna penalità per tentativi errati

---

### `POST /api/games/:id/abandon` — Abbandona
**Response:**
```json
{ "status": "abandoned", "phrase": "testo completo" }
```

**Validazione:** Controllo stato partita attiva

---

## 🕹️ Partite — Modalità Ospite (`/api/guest/games`)

> **Caratteristiche:**
> - Accesso solo se NON autenticati | Lettere gratuite | Nessun limite vocali
> - Timer identico (60s) | Pool frasi dedicato (3 semplificate)

### `POST /api/guest/games` — Crea Partita Ospite
**Response 201:**
```json
{
  "gameId": 456, "status": "running", "phraseLength": 35,
  "spaces": [5, 9, 15, 27], "revealed": [], "timeLeft": 60000
}
```

### `GET /api/guest/games/:id` — Stato Partita Ospite
**Response:**
```json
{
  "gameId": 456, "status": "running", "phraseLength": 35,
  "spaces": [5, 9, 15, 27], "revealed": [0, 2, 15, 22],
  "revealedLetters": { "0": "E", "2": "E", "15": "C", "22": "G" },
  "timeLeft": 42300
}
```

### `POST /api/guest/games/:id/guess-letter` — Tenta Lettera Ospite
**Request:** `{ "letter": "E" }`

**Response:**
```json
{
  "revealedIndexes": [0, 2, 26], "revealed": [0, 2, 15, 22, 26],
  "revealedLetters": { "0": "E", "2": "E", "15": "C", "22": "G", "26": "E" },
  "costApplied": 0, "timeLeft": 40800
}
```

### `POST /api/guest/games/:id/guess-phrase` — Tenta Frase Ospite
**Response (Vittoria):**
```json
{ "result": "win", "status": "won", "phrase": "every day is a new chance to grow" }
```

### `POST /api/guest/games/:id/abandon` — Abbandona Ospite
**Response:**
```json
{ "status": "abandoned", "phrase": "every day is a new chance to grow" }
```

**Validazione generale:** Controllo che utente non sia autenticato, validazione ID partita guest

---

## 🧩 Metadati & Utility

### `GET /api/meta/letter-costs` — Costi Lettere
Restituisce tabella completa costi per tutte le lettere.

**Response:**
```json
{
  "letters": [
    { "letter": "A", "type": "vowel", "baseCost": 10 },
    { "letter": "B", "type": "consonant", "baseCost": 2 },
    { "letter": "C", "type": "consonant", "baseCost": 4 },
    ...
    { "letter": "Z", "type": "consonant", "baseCost": 1 }
  ]
}
```
**Uso:** Visualizzazione costi nell'interfaccia utente

### `GET /api/health` — Health Check
Verifica disponibilità server.

**Response:** `{ "ok": true, "time": 1641024000000 }`

---

# 🗄️ Database — Tabelle & Struttura

> **Database:** SQLite v3 (file `db/aw1.db`)  
> **Configurazione:** Foreign Keys abilitate, transazioni ACID complete
> **Validazione:** Vincoli referenziali e controlli di integrità a livello database

---

## 📋 Schema Tabelle

### `users` — Utenti Registrati
**Campi principali:** `id`, `username` (univoco), `password_hash` (bcrypt), `coins` (≥0)  
**Scopo:** Gestione utenti autenticati con sistema monete integrato  
**Validazione:** Username univoco, password hash sicuro, saldo non negativo

### `phrases` — Frasi del Gioco
**Campi principali:** `id`, `text` (30-50 caratteri), `mode` ('auth'/'guest')  
**Contenuto:** 30 frasi motivazionali per modalità autenticata + 3 semplificate per ospiti  
**Vincoli:** Solo lettere A-Z e spazi, lunghezza controllata

### `games` — Partite
**Campi principali:** `id`, `userId` (FK users, NULL=guest), `phraseId` (FK phrases), `status`, `startedAt`, `expiresAt`, `hasUsedVowel`, `coinsSpent`, `coinsDelta`  
**Timer:** 60 secondi automatici (`expiresAt = startedAt + 60000ms`)  
**Monete:** Traccia spese partita e variazione finale (+100 vittoria, -20 timeout)

### `game_letters` — Lettere Tentate
**Campi principali:** `id`, `gameId` (FK games), `letter` (A-Z), `wasHit` (0/1), `costApplied`, `createdAt`  
**Protezione:** Constraint UNIQUE(gameId, letter) impedisce acquisti duplicati  
**Audit:** Storia completa con costi effettivi e miss penalty applicati

---

## 🔗 Relazioni Database

```
users (1) ←→ (0..n) games         # Un utente può avere molte partite
phrases (1) ←→ (0..n) games       # Una frase può essere usata in molte partite  
games (1) ←→ (0..n) game_letters  # Una partita ha molte lettere tentate
```

**Indici di Performance:**
- `idx_users_username` — Ricerca utenti per login
- `idx_phrases_mode` — Filtro frasi per modalità
- `idx_games_userId` — Partite per utente specifico
- `idx_game_letters_gameId` — Lettere per partita

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
    maxAge: 24*60*60*1000 // Scadenza 24h
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
// Login - validazione credenziali
body('username')
  .isLength({ min: 1, max: 50 })
  .isAlphanumeric()
  .withMessage('Username deve essere alfanumerico, max 50 caratteri'),
  
body('password')
  .isLength({ min: 8 })
  .withMessage('Password minimo 8 caratteri')

// Lettera - validazione formato
body('letter')
  .isLength({ min: 1, max: 1 })
  .isAlpha()
  .toUpperCase()
  .withMessage('Lettera deve essere singolo carattere A-Z')

// Frase - validazione tentativo
body('attempt')
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('Tentativo frase non può essere vuoto, max 100 caratteri')
```

### Sanitizzazione Automatica
- **Trim whitespace**: Rimozione spazi iniziali/finali
- **Escape HTML**: Prevenzione XSS injection
- **SQL injection**: Prepared statements obbligatori
- **Case normalization**: Lettere automaticamente maiuscole

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

> 📚 **Per informazioni complete su testing, metodologie e architettura del sistema di validazione:**  
> **[🧪 TESTING_GUIDE.md](tests/TESTING_GUIDE.md)** - Guida completa al sistema di testing

## Mappatura Errori Standard

| **Codice** | **Significato** | **Quando si verifica** | **Esempio** |
|------------|-----------------|------------------------|-------------|
| **200** | Success | Operazione completata | Lettera trovata, frase indovinata |
| **201** | Created | Risorsa creata | Nuova partita avviata |
| **204** | No Content | Operazione senza body | Logout completato |
| **400** | Bad Request | Input non valido | Lettera malformata, vocale extra |
| **401** | Unauthorized | Autenticazione richiesta | Login necessario |
| **403** | Forbidden | Accesso negato | Monete insufficienti, partita altrui |
| **404** | Not Found | Risorsa inesistente | Partita non trovata |
| **409** | Conflict | Stato inconsistente | Partita scaduta, già terminata |
| **500** | Internal Error | Errore server | Database offline, bug codice |

## Formato Errori JSON
```json
{ "error": "Descrizione user-friendly del problema" }
```

## Logging Errori Colorato (Sviluppo)
```javascript
// Errori loggati con colori per visibilità immediata
console.log(`\x1b[31m[ERROR 400] Bad Request - Input non valido: "Lettera non valida"\x1b[0m`);
```

---

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
    "test": "echo \"No test specified\""   // Placeholder per test
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

## Configurazione Nodemon
```json
{
  "watch": ["**/*.js", "**/*.mjs"],
  "ext": "js,mjs,json",
  "ignore": ["node_modules/**", "db/aw1.db"],
  "env": { "NODE_ENV": "development" }
}
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

## Comunicazione Client-Server
```javascript
// Client side (fetch con credentials)
const response = await fetch('http://localhost:3001/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Include cookie sessione
  body: JSON.stringify(data)
});
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

---

# 🎯 Best Practices & Convenzioni

## Stile Codice
- **ES6+ moderno**: import/export, async/await, arrow functions
- **Naming consistente**: camelCase per variabili, PascalCase per classi
- **Commenti JSDoc**: Documentazione funzioni con parametri e return
- **Error-first**: Gestione errori prima della logica principale

## Database
- **Foreign Keys**: Sempre abilitate per integrità referenziale
- **Transazioni**: Per operazioni multiple o monete
- **Indici strategici**: Su colonne utilizzate in WHERE e JOIN
- **Naming convention**: snake_case per colonne, camelCase per JS

## Sicurezza
- **Input validation**: Sempre server-side con express-validator  
- **SQL injection**: Prepared statements obbligatori
- **XSS protection**: Sanitizzazione automatica
- **CSRF tokens**: SameSite cookie protection

## Monitoraggio
- **Logging strutturato**: Morgan per richieste, console per errori
- **Error boundaries**: Catch globali per prevenire crash
- **Health checks**: Endpoint `/api/health` per monitoring
- **Performance**: Query efficienti con indici appropriati

---

## Testing
La cartella `tests/` contiene:
- **[🧪 TESTING_GUIDE.md](tests/TESTING_GUIDE.md)** — Guida completa al sistema di testing, codici errore e metodologie di validazione

---

