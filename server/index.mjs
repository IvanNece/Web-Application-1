/*
 * ========================================
 * SERVER PRINCIPALE - INDOVINA LA FRASE
 * ======// Router per modalità guest (partite senza autenticazione)
app.use('/api/guest', guestRouter);
// Metadati di sistema (costi lettere, configurazioni)
app.use('/api/meta', metaRouter);

// ==========================================
// MIDDLEWARE DI GESTIONE ERRORI
// ==========================================
// Gestione centralizzata degli errori per prevenire leak di stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Handler per endpoint non trovati - restituisce JSON consistente
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ==========================================
// AVVIO SERVER
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server AW1 attivo su http://localhost:${PORT}`);
});================
 * 
 * Entry point dell'applicazione Express per il gioco "Indovina la Frase"
 * Configura middleware, routing, autenticazione e sessioni
 * Gestisce CORS per comunicazione con client React
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import './auth/passport.js';          
import sessionsRouter from './api/sessions.js';
import gamesRouter from './api/games.js';
import guestRouter from './api/guest.js';
import metaRouter from './api/meta.js';

// ==========================================
// INIZIALIZZAZIONE EXPRESS APP
// ==========================================
const app = express();

// ==========================================
// MIDDLEWARE DI LOGGING
// ==========================================
// Morgan per logging HTTP request standard
app.use(morgan('dev'));

// Middleware personalizzato per logging errori con descrizioni colorate
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Mappa codici di stato HTTP a descrizioni user-friendly
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
// Parser per JSON body nelle richieste POST/PUT
app.use(express.json());

// 3) CORS per pattern “due server” (client Vite su 5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // consente invio/lettura cookie dal client
}));

// 4) Sessione con cookie (requisito: Passport + cookie di sessione)
app.use(session({
  name: 'aw1.sid',   // nome del cookie personalizzato
  secret: 'aw1-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: false, 
    httpOnly: true
  }
}));

// 5) Passport (autenticazione)
app.use(passport.initialize());
app.use(passport.session());

// 6) Healthcheck (utile per testare che il server risponde)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// 7) Router sessioni (per ora vuoto: lo riempiremo nello step Auth)
app.use('/api/sessions', sessionsRouter);
app.use('/api/games', gamesRouter);
app.use('/api/guest', guestRouter);
app.use('/api/meta', metaRouter);

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
