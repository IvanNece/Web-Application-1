import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import './auth/passport.js';          
import sessionsRouter from './api/sessions.js';

const app = express();

// 1) Logging
app.use(morgan('dev'));

// 2) Body parser JSON
app.use(express.json());

// 3) CORS per pattern “due server” (client Vite su 5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // consente invio/lettura cookie dal client
}));

// 4) Sessione con cookie (requisito: Passport + cookie di sessione)
app.use(session({
  secret: 'aw1-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: false // metti true solo se usi HTTPS
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

// 8) 404 “pulito” in JSON per tutte le API non trovate
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 9) Avvio
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server AW1 attivo su http://localhost:${PORT}`);
});
