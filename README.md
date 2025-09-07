# Exam #3: "Indovina la Frase"
## Student: s345147 NECERINI IVAN 

## Requisiti di Sistema

- Node.js 22.x (LTS)
- npm
- nodemon (installato globalmente): `npm install -g nodemon`

⚠️ **IMPORTANTE**: Se nodemon non è installato globalmente, il comando `nodemon index.mjs` fallirà. In tal caso, usare `npm run dev` dalla directory server che utilizza la versione locale di nodemon.

## Installazione e Avvio

1. **Installare le dipendenze**:
   ```bash
   cd server
   npm install
   cd ../client  
   npm install
   ```

2. **Inizializzare il database**:
   ```bash
   cd server
   npm run initdb
   ```

3. **Avviare l'applicazione** (come richiesto dalle specifiche):
   ```bash
   # Terminal 1 - Server
   cd server
   nodemon index.mjs
   
   # Terminal 2 - Client  
   cd client
   npm run dev
   ```

## React Client Application Routes

- Route `/`: Homepage con opzioni di gioco (autenticato/guest) e logout
- Route `/login`: Pagina di login per utenti registrati
- Route `/game`: Gioco autenticato con sistema monete e timer
- Route `/guest`: Gioco ospite senza registrazione (3 frasi dedicate)

## API Server

### Autenticazione
- POST `/api/sessions` - Login con username/password
- GET `/api/sessions/current` - Verifica stato autenticazione
- DELETE `/api/sessions/current` - Logout

### Giochi Autenticati  
- POST `/api/games` - Crea nuova partita (costo 10 monete)
- GET `/api/games/:gameId` - Stato partita corrente
- POST `/api/games/:gameId/guess-letter` - Indovina lettera
- POST `/api/games/:gameId/guess-phrase` - Indovina frase
- POST `/api/games/:gameId/abandon` - Abbandona partita

### Giochi Guest
- POST `/api/guest/games` - Crea partita guest (gratuita)
- GET `/api/guest/games/:gameId` - Stato partita guest
- POST `/api/guest/games/:gameId/guess-letter` - Indovina lettera guest
- POST `/api/guest/games/:gameId/guess-phrase` - Indovina frase guest
- POST `/api/guest/games/:gameId/abandon` - Abbandona partita guest

### Metadati
- GET `/api/meta/phrases/count` - Conteggio frasi per modalità

## Database Tables

- Table `users` - contiene id, username, password_hash (bcrypt), coins
- Table `phrases` - contiene id, text, mode ('auth'|'guest')
- Table `games` - contiene userId, phraseId, status, timer, monete spese/guadagnate
- Table `game_letters` - contiene gameId, letter, isCorrect per tracking lettere

## Main React Components

- `Game` (in `Game.jsx`): Componente principale per giochi autenticati con gestione monete e timer
- `GuestGame` (in `GuestGame.jsx`): Componente per giochi ospite senza registrazione
- `VirtualKeyboard` (in `VirtualKeyboard.jsx`): Tastiera virtuale per input lettere
- `GameHeader` (in `GameHeader.jsx`): Header con informazioni utente e stato gioco
- `PhraseDisplay` (in `PhraseDisplay.jsx`): Visualizzazione frase con lettere rivelate
- `GameControls` (in `GameControls.jsx`): Controlli per input lettere e frasi
- `FeedbackSystem` (in `FeedbackSystem.jsx`): Sistema notifiche e feedback utente

## Custom Hooks

- `useGameLogic`: Logica condivisa per gestione stato gioco
- `useApiCalls`: Centralizzazione chiamate API per entrambe le modalità  
- `useGameTimer`: Gestione timer partita con notifiche automatiche

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- **novice** / NoviceUser123! (100 monete - nessuna partita giocata)
- **empty** / EmptyCoins456@ (0 monete - senza fondi) 
- **player** / PlayerGame789# (180 monete - con storico partite)
