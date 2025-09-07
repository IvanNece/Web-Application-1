import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import GuestGamePage from './pages/GuestGamePage';
import './App.css';

/**
 * COMPONENTE PRINCIPALE: App
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * ROOT COMPONENT CON ROUTING E GESTIONE STATO GLOBALE AUTENTICAZIONE
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Componente radice dell'applicazione che gestisce il routing tra le pagine,
 * mantiene lo stato globale dell'autenticazione utente e implementa la logica
 * di protezione delle route in base allo stato di login dell'utente.
 * 
 * FUNZIONALITÀ CORE:
 * - Routing SPA con React Router 7.x per navigazione seamless
 * - Stato globale utente condiviso tra tutti i componenti
 * - Verifica automatica sessione esistente al caricamento app
 * - Protezione route con redirect automatici
 * - Loading state durante inizializzazione per UX fluida
 * - Gestione errori network con fallback graceful
 * 
 * ARCHITETTURA ROUTING:
 * 
 * ROUTE PUBBLICHE (accessibili senza autenticazione):
 * - "/" (HomePage): Dashboard principale, accesso modalità guest/login
 * - "/login" (LoginPage): Form autenticazione con redirect se già loggato
 * - "/guest" (GuestGamePage): Gioco gratuito, redirect se autenticato
 * 
 * ROUTE PROTETTE (richiedono autenticazione):
 * - "/game" (GamePage): Gioco con monete, redirect a login se non autenticato
 * 
 * ROUTE FALLBACK:
 * - "*" (Wildcard): Redirect automatico homepage per URL invalidi
 * 
 * LOGICA PROTEZIONE ROUTE:
 * - Utente autenticato su /login → Redirect home (già loggato)
 * - Utente non autenticato su /game → Redirect login (richiede auth)
 * - Utente autenticato su /guest → Redirect home (modalità incompatibili)
 * - URL non esistenti → Redirect home (404 handling)
 * 
 * STATO GLOBALE GESTITO:
 * - user: Oggetto utente (username, coins) o null se non autenticato
 * - setUser: Funzione per aggiornamento stato (login/logout/monete)
 * - isLoading: Flag inizializzazione app per UX loading
 * 
 * WORKFLOW INIZIALIZZAZIONE:
 * 1. Mount App component
 * 2. useEffect verifica sessione esistente via API
 * 3. Loading state mostrato durante verifica
 * 4. Aggiornamento stato utente se sessione valida
 * 5. Render routing con protezioni appropriate
 * 
 * DIPENDENZE CRITICHE:
 * - React Router per SPA navigation
 * - CSS App.css per styling globale applicazione
 * - API sessions per verifica autenticazione persistente
 * - Componenti page per rendering route specifiche
 */
function App() {
  // SEZIONE: STATI GLOBALI
  //═══════════════════════════════════════════════════════════════════════════════

  // Stato globale utente condiviso tra tutte le pagine
  const [user, setUser] = useState(null);           // Dati utente (null = non autenticato)
  const [isLoading, setIsLoading] = useState(true); // Loading inizializzazione app

  // SEZIONE: VERIFICA SESSIONE ESISTENTE
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Effect per verifica automatica sessione esistente
   * 
   * Eseguito al mount dell'App per controllare se l'utente ha già
   * una sessione attiva, evitando di richiedere nuovo login se
   * il browser mantiene cookies validi.
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Verifica stato autenticazione corrente tramite API
   * 
   * WORKFLOW:
   * 1. GET request a /api/sessions/current con cookies inclusi
   * 2. Parse response per verifica sessione valida
   * 3. Aggiornamento stato utente se autenticato
   * 4. Gestione errori network senza impatto UX
   * 5. Disattivazione loading per abilitare rendering route
   * 
   * CASI GESTITI:
   * - Sessione valida: aggiorna stato utente con dati server
   * - Sessione invalida/assente: mantiene user=null (normale)
   * - Errore network: log errore ma continua (fallback graceful)
   * 
   * SICUREZZA:
   * - Credentials include per invio cookies sessione
   * - Nessun storage locale credenziali (session-based)
   * - Verifica lato server per validazione sessione
   */
  const checkAuthStatus = async () => {
    try {
      // Verifica sessione corrente con cookies inclusi
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        credentials: 'include' // Critico: invia cookie di sessione
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Aggiorna stato solo se autenticazione confermata
        if (data.authenticated && data.user) {
          setUser(data.user);     // Imposta dati utente da server
        }
        // Se data.authenticated è false, l'utente non è loggato (comportamento normale)
      }
    } catch (error) {
      // Solo errori di rete/server reali vengono loggati
      // Non errori di autenticazione (che sono comportamento normale)
      console.error('Errore verifica autenticazione:', error);
    } finally {
      // Disattiva loading indipendentemente dal risultato
      setIsLoading(false);
    }
  };

  // SEZIONE: RENDER LOADING STATE
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Interfaccia loading durante inizializzazione
   * 
   * Mostrata mentre si verifica la sessione esistente per evitare
   * flash di contenuto non autenticato prima del check completo.
   * Migliora UX prevenendo layout shift e stati inconsistenti.
   */
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <h2>Caricamento...</h2>
        </div>
      </div>
    );
  }

  // SEZIONE: ROUTING PRINCIPALE
  //═══════════════════════════════════════════════════════════════════════════════

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* ROUTE: Homepage principale (sempre accessibile) */}
          <Route 
            path="/" 
            element={<HomePage user={user} setUser={setUser} />} 
          />
          
          {/* ROUTE: Login con protezione doppio accesso */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : 
              <LoginPage setUser={setUser} />
            } 
          />
          
          {/* ROUTE: Gioco autenticato con protezione accesso */}
          <Route 
            path="/game" 
            element={
              user ? <GamePage user={user} setUser={setUser} /> : 
              <Navigate to="/login" replace />
            } 
          />
          
          {/* ROUTE: Gioco guest con esclusione utenti autenticati */}
          <Route 
            path="/guest" 
            element={
              user ? <Navigate to="/" replace /> : 
              <GuestGamePage />
            } 
          />
          
          {/* ROUTE: Fallback per URL non esistenti */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;