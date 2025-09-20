# Indovina la Frase — **Client Frontend** (React SPA)

> **Frontend completo** del progetto AW1 2024/25 – Esame #3 "Indovina la Frase".  
> Single Page Application React con routing avanzato, gestione stato globale, interfaccia utente reattiva e comunicazione API sicura con il server Express.

---

## 📌 Panoramica del Sistema

Questo client implementa il frontend completo per il gioco "Indovina la Frase" con le seguenti caratteristiche principali:

- **Single Page Application**: React 19 con routing seamless e gestione stato
- **Due modalità di gioco**: interfaccia utente adattiva per auth/guest
- **Timer interattivo**: countdown 60s con warning e alert automatici
- **Tastiera virtuale**: sistema costi dinamico e feedback visivo
- **Comunicazione sicura**: fetch con credentials per autenticazione cookie
- **UI responsiva**: design moderno con animazioni e feedback utente

## 🚀 Avvio Rapido

```bash
# Posizionati nella cartella client
cd client

# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev
```

**Client attivo su:** `http://localhost:5173`  
**Comando principale:** `cd client; npm run dev`

**Prerequisito:** Server backend attivo su `http://localhost:3001`

---

## 🗂️ Struttura del Progetto

```
client/
├─ index.html                # Template HTML base con Vite
├─ package.json              # Dipendenze React 19, Router 7, Vite 6
├─ vite.config.js            # Configurazione build e dev server
│
├─ src/
│  ├─ main.jsx               # Bootstrap React con StrictMode e Router
│  ├─ App.jsx                # Root component: routing, stato globale
│  ├─ App.css                # Stili specifici componente App
│  ├─ index.css              # Stili globali e importazioni CSS
│  │
│  ├─ pages/                 # Pagine principali dell'applicazione
│  │  ├─ HomePage.jsx        #    Dashboard: login/guest, saldo, navigazione
│  │  ├─ LoginPage.jsx       #    Form autenticazione con validazione
│  │  ├─ GamePage.jsx        #    Orchestrator partita autenticata
│  │  └─ GuestGamePage.jsx   #    Wrapper partita modalità ospite
│  │
│  ├─ components/            # Componenti principali di gioco
│  │  ├─ Game.jsx            #    Logica gioco autenticato completa
│  │  ├─ GuestGame.jsx       #    Gioco guest semplificato
│  │  └─ common/             # Componenti condivisi riutilizzabili
│  │     ├─ GameHeader.jsx   #       Header con logo e info utente
│  │     ├─ PhraseDisplay.jsx #       Griglia frase con spazi e lettere
│  │     ├─ VirtualKeyboard.jsx #     Tastiera con costi e stati
│  │     ├─ GameControls.jsx #       Input lettere e controlli partita
│  │     ├─ FeedbackSystem.jsx #     Sistema messaggi e notifiche
│  │     ├─ GameResultDisplay.jsx #  Risultati finali partita
│  │     └─ LoadingStateManager.jsx # Stati caricamento e spinner
│  │
│  ├─ hooks/                 # Hook personalizzati per logica business
│  │  ├─ useApiCalls.js      #    Comunicazione API e sincronizzazione
│  │  ├─ useGameLogic.js     #    Logica gioco centralizzata
│  │  ├─ useGameTimer.js     #    Timer con warning automatici
│  │  └─ useGameTransitions.js #   Transizioni e animazioni UI
│  │
│  ├─ styles/                # CSS modulari per componenti
│  │  ├─ base.css            #    Stili globali e reset
│  │  ├─ game-container.css  #    Layout principale gioco
│  │  ├─ game-interface.css  #    Interfaccia controlli utente
│  │  ├─ phrase-display.css  #    Griglia frase e caselle
│  │  ├─ virtual-keyboard.css #   Tastiera e pulsanti lettere
│  │  ├─ feedback-system.css #    Messaggi e toast notifications
│  │  └─ game-results.css    #    Schermate risultati finali
│  │
│  └─ assets/                # Risorse statiche
│     ├─ game-icon.svg       #    Icona principale gioco
│     ├─ game-icon-right.svg #    Icona decorativa destra
```

---

## 🛠️ Stack Tecnologico

### Core Framework
- **React 19.1.0** — Framework frontend con hook moderni
- **React DOM 19.1.0** — Rendering engine ottimizzato
- **React Router 7.8.2** — Routing declarativo e protezione route

### Build Tools & Development
- **Vite 6.3.5** — Build tool veloce e dev server HMR
- **@vitejs/plugin-react** — Plugin React con Fast Refresh
- **ESLint 9.25.0** — Linting avanzato con regole React

### Pattern Architetturali
- **Single Page Application**: Navigazione client-side senza reload
- **Component-Based Architecture**: Riusabilità e modularizzazione
- **Custom Hooks**: Logica business separata da presentazione

---

# 🌐 Client-side — Route dell'Applicazione

> **Routing con Protezione:**
> - Route pubbliche: accessibili senza autenticazione
> - Route protette: richiedono login con redirect automatico
> - Route esclusive: modalità incompatibili con redirect
> - Fallback: gestione URL non validi

---

## Route Principali

### `/` — HomePage (Dashboard)
**Stato:** Pubblico con logica adattiva  
**Componente:** `HomePage.jsx`

**Modalità utente autenticato:**
- Dashboard personalizzata con username e saldo monete
- Pulsante "Inizia Partita" per modalità a pagamento
- Pulsante logout con invalidazione sessione
- Alert se monete insufficienti con suggerimento modalità guest

**Modalità utente non autenticato:**
- Interfaccia scelta modalità con due opzioni principali
- Pulsante "Accedi" per registrazione/login
- Pulsante "Gioca come Ospite" per accesso gratuito

---

### `/login` — Pagina Autenticazione
**Stato:** Pubblico con protezione doppio login  
**Componente:** `LoginPage.jsx`

**Funzionalità:**
- Form controllato con validazione real-time
- Campi username e password obbligatori
- Gestione errori di autenticazione con feedback chiaro
- Loading state durante invio credenziali
- Redirect automatico alla homepage dopo login riuscito

**Protezione:** Se già autenticato → redirect automatico a `/`

---

### `/game` — Partita Autenticata
**Stato:** Protetto (solo utenti autenticati)  
**Componente:** `GamePage.jsx`

**Funzionalità:**
- Creazione automatica nuova partita tramite `POST /api/games`
- Verifica preventiva monete sufficienti (almeno 1 moneta)
- Caricamento componente `<Game/>` con stato completo
- Gestione errori creazione (monete esaurite, server offline)
- Interceptor fine partita per navigazione o nuova partita

**Protezione:** Se non autenticato → redirect automatico a `/login`

---

### `/guest` — Partita Modalità Ospite
**Stato:** Esclusivo (solo utenti NON autenticati)  
**Componente:** `GuestGamePage.jsx`

**Funzionalità:**
- Creazione partita guest tramite `POST /api/guest/games`
- Caricamento componente `<GuestGame/>` semplificato
- Navigazione "Torna alla Home" sempre disponibile
- Nessuna limitazione monete o vocali

**Protezione:** Se autenticato → redirect automatico a `/`

---

### `*` — Route Fallback
**Stato:** Fallback globale  
**Comportamento:** `<Navigate to="/" replace />`

Qualsiasi URL non riconosciuto viene automaticamente reindirizzato alla homepage senza mostrare pagine 404, mantenendo l'esperienza utente fluida.

---

# ⚛️ Principali Componenti React

## Componenti Pagina (Pages)

### `App` — Root Component
**Responsabilità:** Orchestrazione globale applicazione
- **Stato globale utente**: Gestione login/logout con persistenza
- **Bootstrap sessione**: Verifica sessione esistente al caricamento
- **Routing con protezione**: Implementa guardie per route protette
- **Loading state**: Mostra spinner durante inizializzazione
- **Provider pattern**: Fornisce stato e funzioni a tutti i componenti child

### `HomePage` — Dashboard Principale
**Responsabilità:** Hub centrale navigazione e stato utente
- **Interfaccia adattiva**: UI diversa per auth/guest/logout
- **Gestione logout**: Invalidazione sessione con chiamata API
- **Controllo monete**: Verifica saldo e suggerimenti modalità
- **Navigazione intelligente**: Routing basato su stato utente

### `LoginPage` — Form Autenticazione
**Responsabilità:** Processo login con validazione
- **Form controllato**: Gestione input con stato React
- **Validazione client**: Controlli format prima invio
- **Gestione errori**: Feedback specifico per problemi auth
- **Loading UX**: Disabilitazione form durante richiesta
- **Auto-redirect**: Navigazione post-login automatica

### `GamePage` — Orchestrator Partita Autenticata
**Responsabilità:** Setup e gestione partita con monete
- **Creazione partita**: API call automatica con gestione errori
- **Verifica prerequisiti**: Controllo monete sufficienti
- **Mounting Game**: Caricamento componente gioco principale
- **Error handling**: Gestione fallimenti creazione partita
- **Navigation flow**: Controllo flusso fine partita

### `GuestGamePage` — Wrapper Partita Guest
**Responsabilità:** Setup partita gratuita semplificata
- **Creazione guest**: API call per partita senza limitazioni
- **Mounting GuestGame**: Caricamento gioco semplificato
- **Navigation control**: Solo ritorno homepage disponibile

---

## Componenti di Gioco (Game Components)

### `Game` — Motore Gioco Autenticato
**Responsabilità:** Logica completa gioco con monete
- **Sistema timer**: Countdown 60s con warning/alert automatici
- **Gestione lettere**: Acquisto con costi variabili e limitazioni vocali
- **Tentativo frase**: Input completo con premio vittoria (+100 monete)
- **Stato sincronizzato**: Comunicazione continua con server API
- **Feedback avanzato**: Messaggi tipizzati per ogni azione utente
- **Animazioni**: Transizioni visuali per migliorare UX

**Hook utilizzati:**
- `useGameLogic`: Logica condivisa e stato centralizzato
- `useGameTimer`: Timer con warning automatici
- `useApiCalls`: Comunicazione server sincronizzata
- `useGameTransitions`: Animazioni e transizioni UI

### `GuestGame` — Gioco Modalità Guest
**Responsabilità:** Versione semplificata senza limitazioni
- **Timer identico**: Stesso countdown e warning del gioco auth
- **Lettere gratuite**: Nessun costo o limitazione vocali
- **Stesso feedback**: UX consistente con modalità autenticata
- **API dedicate**: Endpoint `/api/guest/games` specifici

---

## Componenti Condivisi (Common Components)

### `GameHeader` — Header Informazioni
**Responsabilità:** Intestazione gioco con dati utente
- **Logo e branding**: Identità visiva del gioco
- **Informazioni utente**: Username e monete (se autenticato)
- **Status partita**: Indicatori stato corrente gioco

### `PhraseDisplay` — Griglia Frase
**Responsabilità:** Visualizzazione frase con rivelazioni progressive
- **Rendering caselle**: Layout griglia con spazi fissi
- **Lettere rivelate**: Aggiornamento dinamico posizioni scoperte
- **Separatori spazi**: Gestione corretta spazi tra parole
- **Animazioni reveal**: Effetti visivi per lettere scoperte

### `VirtualKeyboard` — Tastiera Interattiva  
**Responsabilità:** Input lettere con sistema costi
- **Layout A-Z**: Disposizione ottimizzata per touch/click
- **Sistema costi**: Visualizzazione prezzi dinamici per modalità auth
- **Stati pulsanti**: Normale, già tentata, insufficienti monete, disabilitata
- **Separazione vocali**: Evidenziazione differenziata A,E,I,O,U
- **Feedback click**: Conferma visiva selezione lettera

### `GameControls` — Controlli Partita
**Responsabilità:** Input e azioni principali gioco
- **Input lettera singola**: Campo per selezione A-Z con validazione
- **Tentativo frase**: Input completo per indovinare tutto
- **Pulsanti azione**: Abbandona partita, nuova partita
- **Loading states**: Disabilitazione durante API calls
- **Validation UI**: Feedback immediato input non validi

### `FeedbackSystem` — Sistema Messaggi
**Responsabilità:** Comunicazione con utente tramite notifiche
- **Messaggi tipizzati**: Success, error, warning, info con stili diversi
- **Auto-hide**: Sparizione automatica dopo timeout configurabile
- **Timer warnings**: Alert speciali per countdown (10s, 5s)
- **Game end**: Banner risultati finali con statistiche
- **Non-invasive**: Overlay che non blocca interazione

### `GameResultDisplay` — Risultati Finali
**Responsabilità:** Schermata conclusione partita
- **Outcome display**: Vittoria, timeout, abbandono con stili dedicati
- **Statistiche**: Riepilogo performance (lettere tentate, tempo, costi)
- **Frase rivelata**: Visualizzazione completa soluzione
- **Call-to-action**: Pulsanti per nuova partita o homepage

### `LoadingStateManager` — Gestione Caricamenti
**Responsabilità:** Stati loading e spinner centralizzati
- **Loading indicators**: Spinner per diverse durate operazioni
- **Skeleton screens**: Placeholder durante caricamenti
- **Error boundaries**: Gestione graceful errori componenti
- **Retry mechanisms**: Opzioni riprova per operazioni fallite

---

# 🔧 Hook Personalizzati

## `useGameLogic` — Logica Centralizzata
**Responsabilità:** Business logic condivisa tra modalità
- **Stato gioco**: Status, frase, lettere rivelate, feedback
- **Funzioni utilità**: Costi lettere, verifica vocali, formattazione tempo
- **Sistema feedback**: Messaggi tipizzati con auto-hide
- **Animazioni**: Trigger per transizioni UI
- **Compatibilità**: Supporto modalità authenticated/guest

## `useGameTimer` — Timer Avanzato  
**Responsabilità:** Countdown con warning automatici
- **Timer 60s**: Countdown millisecondi con aggiornamento smooth
- **Warning system**: Alert automatici a 10s e 5s rimanenti
- **Auto-stop**: Pausa su fine partita o abbandono
- **Callback**: Notifica timeout per gestione server-side

## `useApiCalls` — Comunicazione Server
**Responsabilità:** HTTP requests con gestione errori
- **Fetch wrapper**: Gestione automatica credentials e headers
- **Error handling**: Retry logic e fallback per network errors
- **Loading states**: Tracking richieste in corso
- **Cache**: Ottimizzazione performance per dati frequenti

## `useGameTransitions` — Animazioni UI
**Responsabilità:** Effetti visuali e transizioni
- **Letter animations**: Effetti per lettere rivelate/miss
- **Game end effects**: Animazioni conclusione partita
- **Smooth transitions**: Cambio stati con easing
- **Performance**: Ottimizzazioni per animazioni fluide

---

# 🎨 Sistema di Styling

## CSS Modulare
- **base.css**: Reset browser, variabili CSS, stili globali
- **game-container.css**: Layout principale e responsive design
- **game-interface.css**: Interfaccia controlli e interazioni
- **phrase-display.css**: Griglia frase e caselle lettere
- **virtual-keyboard.css**: Tastiera con stati e hover effects
- **feedback-system.css**: Messaggi e notifiche
- **game-results.css**: Schermate finali e statistiche

---

# 📡 Comunicazione Client-Server

## Pattern API
```javascript
// Fetch con credentials per autenticazione cookie
const response = await fetch('http://localhost:3001/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Invia cookie sessione
  body: JSON.stringify(data)
});
```

## Gestione Errori
- **Network errors**: Retry automatico con exponential backoff
- **HTTP errors**: Gestione codici specifici (400, 401, 403, 500)
- **Timeout handling**: Fallback per richieste lente
- **User feedback**: Messaggi chiari per ogni tipo errore

---



