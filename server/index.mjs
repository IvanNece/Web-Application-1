/*
 * =======================================
 * SERVER PRINCIPALE - INDOVINA LA FR// Configurazione CORS per architettura "due// Gestore globale degli errori non catturati
// Previene il leak di informazioni sensibili nascondendo stack trace in produzione
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Handler per endpoint non esistenti
// Restituisce sempre JSON consistente invece di HTML di default di Express
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Avvio del server HTTP sulla porta configurata
// Ascolta su tutte le interfacce di rete disponibili
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server AW1 attivo su http://localhost:${PORT}`);
});rmette al client React (porta 5173) di comunicare con questo server (porta 3001)
// credentials: true è essenziale per l'invio automatico dei cookie di sessione
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // consente invio/lettura cookie dal client
})); * ========================================
 * 
 * Entry point dell'applicazione Express per il gioco "Indovina la Frase"
 * Configura middleware, routing, autenticazione e sessioni
 * Gestisce CORS per comunicazione con client React
 */

// Framework web principale per creare server HTTP e gestire routing
import express from 'express';
// Middleware per gestire Cross-Origin Resource Sharing tra client e server
import cors from 'cors';
// Logger HTTP per monitorare richieste in entrata durante sviluppo
import morgan from 'morgan';
// Gestore sessioni utente basate su cookie per mantenere stato autenticazione
import session from 'express-session';
// Framework di autenticazione modulare e flessibile
import passport from 'passport';
// Configurazione strategia di autenticazione locale (username/password)
import './auth/passport.js';          
// Router per gestione sessioni: login, logout, verifica stato
import sessionsRouter from './api/sessions.js';
// Router per partite utenti autenticati con sistema monete
import gamesRouter from './api/games.js';
// Router per partite modalità ospite (senza autenticazione)
import guestRouter from './api/guest.js';
// Router per metadati di sistema come costi lettere
import metaRouter from './api/meta.js';

// ==========================================
// INIZIALIZZAZIONE EXPRESS APP
// ==========================================
// Crea istanza principale dell'applicazione Express
// Questa sarà la base per tutti i middleware e routing
const app = express();

// ==========================================
// MIDDLEWARE DI LOGGING
// ==========================================
// Morgan in modalità 'dev' stampa richieste HTTP con colori per debugging
// Formato: METHOD url STATUS response-time - content-length
app.use(morgan('dev'));

// Middleware personalizzato per intercettare e loggare errori HTTP con colori
// Override del metodo res.json per catturare errori e stamparli in rosso
app.use((req, res, next) => {
  // Salva riferimenti ai metodi originali prima di sovrascriverli
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Dizionario che mappa codici di stato HTTP a descrizioni comprensibili
  // Utilizzato per migliorare il debugging durante sviluppo
  const statusDescriptions = {
    400: 'Bad Request - Input non valido',
    401: 'Unauthorized - Autenticazione richiesta', 
    403: 'Forbidden - Accesso negato',
    404: 'Not Found - Risorsa non trovata',
    409: 'Conflict - Operazione non permessa',
    500: 'Internal Server Error - Errore interno'
  };
  
  // Override del metodo json per intercettare e loggare errori
  res.json = function(data) {
    const status = res.statusCode;
    
    // Logga errori con colore rosso per visibilità durante sviluppo
    if (status >= 400 && data && data.error) {
      const description = statusDescriptions[status] || 'Errore sconosciuto';
      console.log(`\x1b[31m[ERROR ${status}] ${description}: "${data.error}"\x1b[0m`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});

// ==========================================
// MIDDLEWARE DI PARSING
// ==========================================
// Abilita il parsing automatico di richieste con Content-Type: application/json
// Rende disponibile req.body come oggetto JavaScript nelle route
app.use(express.json());

// 3) CORS per pattern “due server” (client Vite su 5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // consente invio/lettura cookie dal client
}));

// Configurazione sessioni basate su cookie per mantenere stato autenticazione
// Essenziale per il funzionamento di Passport.js
app.use(session({
  name: 'aw1.sid',   // nome del cookie personalizzato
  secret: 'aw1-dev-secret-change-me', // chiave per firmare i cookie (cambiare in produzione)
  resave: false, // non salvare sessioni non modificate
  saveUninitialized: false, // non salvare sessioni vuote
  cookie: {
    sameSite: 'lax', // protezione CSRF
    secure: false, // false per HTTP in sviluppo, true per HTTPS in produzione
    httpOnly: true // previene accesso JavaScript client-side per sicurezza
  }
}));

// Inizializzazione del sistema di autenticazione Passport.js
// initialize() configura Passport per lavorare con Express
app.use(passport.initialize());
// session() integra Passport con le sessioni Express per persistenza autenticazione
app.use(passport.session());

// Endpoint di healthcheck per verificare che il server sia operativo
// Utilizzato per monitoring e test di connettività
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// Registrazione dei router per le diverse funzionalità dell'API
// Ogni router gestisce un aspetto specifico dell'applicazione
app.use('/api/sessions', sessionsRouter); // Login, logout, stato autenticazione
app.use('/api/games', gamesRouter); // Partite per utenti autenticati
app.use('/api/guest', guestRouter); // Partite per visitatori non registrati
app.use('/api/meta', metaRouter); // Metadati come costi lettere

// aiuta a non far trapelare stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});


// 8) 404 “pulito” in JSON per tutte le API non trovate
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 9) Avvio
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server AW1 attivo su http://localhost:${PORT}`);
});
