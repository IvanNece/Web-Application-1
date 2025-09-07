# Server Backend - Indovina la Frase

## Panoramica Architettura

Server Express.js per il gioco "Indovina la Frase" dell'esame AW1 2024/25.
Implementa gameplay autenticato e guest, autenticazione basata su sessioni e database SQLite.
Segue il pattern "due server" separati (client React su porta 5173, API su porta 3001) con esposizione controllata dei dati per mantenere segreta la frase da indovinare.

## Stack Tecnologico

### Runtime e Framework
- **Runtime**: Node.js 22.x (LTS) con ES Modules
- **Framework Web**: Express.js per API REST
- **CORS**: Configurato per comunicazione cross-origin con client React
- **Logging**: Morgan per richieste HTTP, logging personalizzato per errori

### Autenticazione e Sicurezza  
- **Autenticazione**: Passport.js con strategia local (username/password)
- **Sessioni**: express-session con cookie httpOnly
- **Hash Password**: bcryptjs per sicurezza credenziali
- **Validazione**: express-validator per sanitizzazione input

### Database e Persistenza
- **Database**: SQLite file-based per semplicità e portabilità
- **Driver**: sqlite3 con wrapper Promise personalizzato
- **Schema**: Tabelle users, games, phrases, game_letters con foreign key
- **Transazioni**: Supporto ACID per operazioni atomiche

### Development Tools
- **Auto-restart**: nodemon per sviluppo
- **Testing**: File .http per REST Client (VS Code)
- **Debugging**: Logging colorato e healthcheck endpoint

## Struttura Progetto

```
server/
├── index.mjs                 # Entry point server Express con middleware
├── package.json             # Dipendenze e script npm
├── nodemon.json             # Configurazione auto-restart sviluppo
│
├── api/                     # Router API REST
│   ├── games.js            # Partite autenticate con sistema monete
│   ├── guest.js            # Partite guest senza autenticazione
│   ├── sessions.js         # Login/logout/status sessioni
│   └── meta.js             # Metadati sistema (costi lettere)
│
├── auth/                    # Sistema autenticazione
│   └── passport.js         # Configurazione Passport.js local strategy
│
├── lib/                     # Utility e helper
│   ├── db.js               # Wrapper SQLite con Promise
│   └── costs.js            # Sistema calcolo costi lettere
│
├── db/                      # Database e schema
│   ├── aw1.db              # Database SQLite (generato da initdb)
│   ├── schema.sql          # Struttura tabelle e vincoli
│   └── seed.sql            # Dati iniziali (frasi di gioco)
│
├── scripts/                 # Script manutenzione
│   └── initdb.mjs          # Inizializzazione database completa
│
└── tests/                   # Suite test e validazione
    ├── *.mjs               # Test automatizzati (vincoli, API, concorrenza)
    ├── *.http              # Collection REST Client
    └── *.md                # Documentazione testing
```

## Guida Rapida Sviluppose – Server (Backend)

Node.js + Express backend for the AW1 2024/25 exam project **“Indovina la Frase”**.  
It implements authenticated and guest gameplay, session-based authentication, and a SQLite database. The server follows the two-server pattern (client on Vite 5173, API on 3001) and exposes only data that are strictly necessary to avoid leaking the secret phrase.

---

## Tech Stack

- **Runtime**: Node.js 22.x (LTS), ES Modules
- **Web**: Express, CORS, morgan
- **Auth**: Passport.js (local strategy) + `express-session` (cookie session), `bcryptjs` for password hashing
- **Validation**: `express-validator`
- **DB**: SQLite (file-based) via `sqlite3` with small helper wrapper
- **Dev tooling**: nodemon, REST Client (`.http` files) to test APIs

---

## Guida Rapida Sviluppo

### Setup Iniziale
```bash
# Dalla root del repository
cd server
npm install                 # Installa dipendenze
npm run initdb             # Crea database con utenti di test
npm run dev                # Avvia server con auto-restart
```

### Utenti di Test Predefiniti
- **novice** / `NoviceUser123!` - Utente nuovo (100 monete)
- **empty** / `EmptyCoins456@` - Utente senza monete (0 monete)  
- **player** / `PlayerGame789#` - Utente con storico (180 monete)

### Endpoint Principali
- **API Server**: `http://localhost:3001`
- **Healthcheck**: `GET /api/health`
- **Autenticazione**: `POST /api/sessions` (login)
- **Partite Auth**: `POST /api/games` (richiede login)
- **Partite Guest**: `POST /api/guest/games` (libero accesso)

## Configurazioni Importanti

### CORS e Sicurezza
- Client autorizzato: `http://localhost:5173` (Vite dev server)
- Credential: Abilitati per cookie di sessione
- Cookie: httpOnly, SameSite=Lax, secure=false (sviluppo)

### Database SQLite
- File: `db/aw1.db` (creato automaticamente da initdb)
- Foreign Key: Abilitate per integrità referenziale
- Transazioni: ACID compliance per operazioni monete

### Sistema Monete
- Lettere rare (K,J,X,Q,Z): 1 moneta
- Lettere comuni (T,N,H,S): 5 monete  
- Vocali: 10 monete (una sola per partita)
- Vittoria: +100 monete
- Timeout: -20 monete

---

## Project Structure (server)

```
server/
│   package.json         # server dependencies & scripts
│   nodemon.json         # nodemon config (dev)
│   README.md            # backend documentation
│   index.mjs            # express app, CORS, session, routers, error/404, health
│
├── api/
│     games.js           # authenticated game routes
│     guest.js           # guest (no-login) routes
│     sessions.js        # login/current/logout
│     meta.js            # (optional) helper: letter-costs
│
├── auth/
│     passport.js        # local strategy + deserialization + ensureLoggedIn
│
├── db/
│     schema.sql         # schema definition (tables, indexes, FKs)
│     seed.sql           # initial data (users, phrases, sample games)
│     aw1.db             # generated database file (ignored by git)
│
├── lib/
│     db.js              # tiny wrapper: get/all/run/withTransaction
│     costs.js           # letter cost model (vowels=10, consonants 5→1)
│
├── scripts/
│     initdb.mjs         # drops & recreates schema, applies seed
│
└── tests/
      auth.http          # REST Client tests for API
      game.http          # REST Client tests for API
```

---

## Two-Server Pattern & Security Notes

- **Two servers**: client (Vite) on 5173, API on 3001; CORS `origin=http://localhost:5173` and `credentials:true`.
- **Authentication**: session cookie with Passport (serialize user id only, deserialize on each request).  
- **Anti-cheat**: while a game is `running`, the server never sends the phrase text. It only sends `phraseLength`, space positions, and revealed indexes. The full phrase is returned **only when the game finishes** (win/timeout/abandon).

---

## Database

### Tables

- **users**
  - `id` INTEGER PK
  - `username` TEXT UNIQUE
  - `password_hash` TEXT (bcrypt)
  - `coins` INTEGER NOT NULL (>= 0)
  - Purpose: registered players with coin balance.

- **phrases**
  - `id` INTEGER PK
  - `text` TEXT (english, 30–50 chars, letters+spaces, case-insensitive)
  - `mode` TEXT CHECK in (`auth`,`guest`)
  - Purpose: secret phrases pool, distinct for authenticated and guest modes.

- **games**
  - `id` INTEGER PK
  - `userId` INTEGER NULL (NULL for guest games) → FK users(id)
  - `phraseId` INTEGER NOT NULL → FK phrases(id)
  - `status` TEXT in (`running`,`won`,`timeout`,`abandoned`)
  - `startedAt` INTEGER (ms epoch), `expiresAt` INTEGER (ms epoch, +60s)
  - `hasUsedVowel` INTEGER (0/1)
  - `coinsSpent` INTEGER DEFAULT 0, `coinsDelta` INTEGER DEFAULT 0
  - Purpose: a game instance with timer and end-state bookkeeping.

- **game_letters**
  - `id` INTEGER PK
  - `gameId` INTEGER NOT NULL → FK games(id)
  - `letter` TEXT (A–Z uppercase)
  - `wasHit` INTEGER (0/1)
  - `costApplied` INTEGER (actual coins charged for that attempt)
  - `createdAt` INTEGER (ms epoch)
  - Purpose: audit trail for letter guesses and to compute revealed indexes.
  - **Index** (recommended): `UNIQUE(gameId, letter)` to avoid duplicates.

### Data Seed

- **Users**: three users covering exam scenarios
  - one with **no games yet**,
  - one with **0 coins**,
  - one with **some games played**.
- **Phrases**: **≥ 20** `auth` phrases + **3** dedicated `guest` phrases.
- **Sample games**: at least two games for the “active” user (e.g., one `won`, one `timeout`).

> Recreate the database anytime with `npm run initdb`.

---

## Letter Cost Model (as required in the brief)

- **Vowels** (`A E I O U`): fixed **10 coins** (only **one** vowel allowed per game).  
- **Consonants**: five cost tiers based on English frequency (STTMedia). Misses cost **double**.

  | Cost | Letters                    |
  |-----:|----------------------------|
  | 5    | T, N, H, S                 |
  | 4    | R, L, D, C                 |
  | 3    | M, W, Y, F                 |
  | 2    | G, P, B, V                 |
  | 1    | K, J, X, Q, Z              |

Implementation lives in `lib/costs.js`. The optional endpoint `GET /api/meta/letter-costs` exposes the cost table to the client.

---

## Game Rules

- Game lasts **60 seconds** (`expiresAt = startedAt + 60_000`).  
- **Authenticated mode**:
  - Create requires `coins > 0`.
  - Guessing a **letter**: charge base cost; **miss** → double; **duplicate** → cost 0; at most **one vowel** per game.
  - Guessing the **full phrase**: if exact (case-insensitive, spaces must match), status `won` and **+100 coins**; if wrong, no penalty.
  - **Timeout** (reached before win): status `timeout` and **-20 coins** (or remaining coins if < 20).
  - **Abandon**: ends without penalty.
- **Guest mode**:
  - No coins, no penalties, no vowel limit; otherwise the same state visibility and timer rules.

---

## API Reference

### Healthcheck
- **GET `/api/health`** → `{ ok: true, time }`

### Authentication (session-cookie)
- **POST `/api/sessions`** – Login  
  Body: `{ "username": "...", "password": "..." }` → `{ id, username, coins }`  
  Errors: `400` invalid payload, `401` invalid credentials.

- **GET `/api/sessions/current`** – Current user  
  → `{ id, username, coins }` or `401` if not logged in.

- **DELETE `/api/sessions/current`** – Logout  
  → `204 No Content`

### Games (authenticated users)
> All these routes require a valid session. A user can only access **own** games.

- **POST `/api/games`** – Create a game  
  → `{ gameId, status:'running', phraseLength, spaces[], revealed:[], hasUsedVowel:false, timeLeft, coins }`  
  Errors: `403` if `coins <= 0`.

- **GET `/api/games/:id`** – Game state  
  - If still running: `{ gameId, status, phraseLength, spaces[], revealed[], hasUsedVowel, timeLeft, coins }`  
  - If finished: adds `phrase` and `timeLeft: 0`.  
  - If the timer is already expired, the server **closes** to `timeout` (single time) and returns the finished payload (with penalty applied).  
  Errors: `400` invalid id, `403` forbidden (not owner), `404` not found.

- **POST `/api/games/:id/guess-letter`** – Buy a letter attempt  
  Body: `{ "letter": "A-Z" }`  
  → `{ revealedIndexes[], costApplied, coins, hasUsedVowel, timeLeft }`  
  Errors: `400` invalid input/second vowel, `403` no/insufficient coins, `404` not found, `409` game already ended.

- **POST `/api/games/:id/guess-phrase`** – Attempt the full phrase  
  Body: `{ "attempt": "..." }`  
  → On success: `{ result:'win', status:'won', coinsDelta:+100, phrase }`  
  → On wrong: `{ result:'wrong', status:'running', timeLeft, coins }`  
  Errors: `400` invalid input, `404` not found, `409` game already ended.

- **POST `/api/games/:id/abandon`** – Abandon game  
  → `{ status:'abandoned', phrase }` or current finished status.  
  Errors: `400` invalid id, `404` not found.

### Guest Games (no login, no coins)
- **POST `/api/guest/games`** – Create a guest game  
  → `{ gameId, status:'running', phraseLength, spaces[], revealed:[], timeLeft }`

- **GET `/api/guest/games/:id`** – Guest game state  
  Same shape as authenticated state; when finished, adds `phrase`.  
  Guarded so that only **guest** games are accessible (`userId IS NULL` and phrase `mode='guest'`).

- **POST `/api/guest/games/:id/guess-letter`** – Letter attempt (free)  
  Body: `{ "letter": "A-Z" }` → `{ revealedIndexes[], costApplied:0, timeLeft }`

- **POST `/api/guest/games/:id/guess-phrase`** – Full phrase attempt  
  Body: `{ "attempt": "..." }` → `{ result:'win'|'wrong'|'timeout', status, phrase? }`

- **POST `/api/guest/games/:id/abandon`** – Abandon guest game  
  → `{ status:'abandoned', phrase }`

### Meta (optional)
- **GET `/api/meta/letter-costs`** – Returns the 26 letters with `type` (vowel/consonant) and `baseCost`.

---

## Error Model & Status Codes

- `200 OK` – read or action succeeded (also used by GET state even if it transitions to `timeout`).
- `201 Created` – game creation.
- `204 No Content` – logout.
- `400 Bad Request` – validation failures (id not int, letter not [A–Z], missing body, second vowel, etc.).
- `401 Unauthorized` – no active session on protected routes.
- `403 Forbidden` – not your game, not enough coins, creating a game with `coins <= 0`, or accessing a non-guest game from guest endpoints.
- `404 Not Found` – resource does not exist.
- `409 Conflict` – action conflicts with current game state (e.g., guessing after game finished).
- `500 Internal Server Error` – unexpected errors (stack traces are logged server-side only).

---

## Testing the API (REST Client for VS Code)

A ready-to-use `tests/game.http` file is provided.  
Tips:
- Enable cookie persistence: `"rest-client.rememberCookiesForSubsequentRequests": true`.
- Run blocks in order: **login → create → use `{{gameId}}`** for subsequent requests.
- Example blocks cover: letter hit/miss/duplicate, vowel rule, wrong phrase (no penalty), abandon, guest flow.

---

## Credentials (seed users)

- `novice` / `password` – 100 coins, no games yet  
- `empty` / `password` – 0 coins (cannot create a new auth game)  
- `player` / `password` – has games in history

> Passwords are stored hashed (bcrypt + salt).

---

