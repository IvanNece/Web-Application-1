import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gameIcon from '../assets/game-icon.svg';
import gameIconRight from '../assets/game-icon-right.svg';

/**
 * PAGINA AUTENTICAZIONE: LoginPage
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * PAGINA LOGIN CON FORM AUTENTICAZIONE E ACCOUNT DEMO
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Gestisce l'autenticazione degli utenti per l'accesso alla modalità di gioco
 * a pagamento con monete, fornendo interfaccia sicura per login e account
 * demo preconfigurati per testing e valutazione.
 * 
 * FUNZIONALITÀ CORE:
 * - Form login con validazione client-side e server-side
 * - Gestione autenticazione tramite API sessions con cookies
 * - Loading state durante processo autenticazione
 * - Error handling con messaggi utente specifici
 * - Account demo preconfigurati per test immediato
 * - Navigazione di ritorno alla homepage
 * - Attributi accessibilità per screen readers
 * 
 * WORKFLOW AUTENTICAZIONE:
 * 1. Input username e password con validazione required
 * 2. Submit form con POST a /api/sessions endpoint
 * 3. Gestione response con aggiornamento stato utente
 * 4. Navigazione automatica alla homepage se successo
 * 5. Display errori se credenziali invalide o errore server
 * 
 * STATI INTERFACCIA:
 * 
 * FORM NORMALE:
 * - Input attivi per username e password
 * - Pulsante submit abilitato
 * - Nessun messaggio errore visibile
 * 
 * LOADING STATE:
 * - Input disabilitati durante richiesta
 * - Pulsante con testo "Accesso..." e disabled
 * - Prevenzione double-submit
 * 
 * ERROR STATE:
 * - Form riattivato dopo errore
 * - Messaggio errore specifico visibile
 * - Input pronti per nuovo tentativo
 * 
 * PROPS:
 * - setUser: Funzione per aggiornamento stato utente globale
 * 
 * DIPENDENZE:
 * - React Router per navigazione post-login
 * - Fetch API per chiamate autenticazione
 * - CSS globale per styling form e layout
 */
function LoginPage({ setUser }) {
  const navigate = useNavigate();

  // SEZIONE: STATI LOCALI
  //═══════════════════════════════════════════════════════════════════════════════

  const [username, setUsername] = useState('');      // Input username
  const [password, setPassword] = useState('');      // Input password
  const [error, setError] = useState('');            // Messaggio errore
  const [isLoading, setIsLoading] = useState(false); // Stato caricamento

  // SEZIONE: GESTIONE LOGIN
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Gestisce processo di login con autenticazione server
   * 
   * WORKFLOW DETTAGLIATO:
   * 1. Previene submit default form e reset errori precedenti
   * 2. Attiva loading state (disabilita form)
   * 3. Esegue POST request a endpoint sessions con credenziali
   * 4. Parse response e gestione successo/errore
   * 5. Aggiorna stato utente globale e naviga alla home se OK
   * 6. Mostra errore specifico se autenticazione fallisce
   * 7. Reset loading state indipendentemente dal risultato
   * 
   * SICUREZZA:
   * - Credentials include per gestione cookies sessione
   * - Clear errori precedenti prima nuovo tentativo
   * - Gestione separata errori network vs credenziali invalide
   * 
   * @param {Event} e - Event del form submit
   */
  const handleLogin = async (e) => {
    e.preventDefault();          // Previene reload pagina
    setError('');               // Reset messaggi errore precedenti
    setIsLoading(true);         // Attiva loading state

    try {
      // Chiamata API autenticazione con credenziali
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'   // Include cookies per sessione
      });

      // Parse dati response dal server
      const data = await response.json();
      
      if (response.ok) {
        // SUCCESSO: aggiorna stato utente e naviga alla home
        setUser(data);           // Imposta dati utente globali
        navigate('/');           // Redirect homepage post-login
      } else {
        // ERRORE: mostra messaggio specifico dal server
        setError(data.error || 'Credenziali non valide');
      }
    } catch (error) {
      // ERRORE NETWORK: messaggio fallback per problemi connessione
      setError('Errore di connessione al server');
    } finally {
      // CLEANUP: reset loading state indipendentemente dal risultato
      setIsLoading(false);
    }
  };

  // SEZIONE: RENDER INTERFACCIA
  //═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="login-page">
      {/* Header con titolo e icone decorative */}
      <div className="title-with-icons">
        <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
        <h1>Indovina la Frase</h1>
        <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
      </div>

      <div className="login-container">
        <h2>🔐 Accesso</h2>
        
        {/* Form login con gestione submit e validazione */}
        <form onSubmit={handleLogin}>
          {/* Input username con placeholder e autocompletamento */}
          <input
            type="text"
            placeholder="👤 Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required                    // Validazione HTML5
            disabled={isLoading}        // Disabilita durante loading
            autoComplete="username"     // Assistenza password manager
          />
          
          {/* Input password con sicurezza e autocompletamento */}
          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required                    // Validazione HTML5
            disabled={isLoading}        // Disabilita durante loading
            autoComplete="current-password" // Assistenza password manager
          />
          
          {/* Pulsante submit con stato loading dinamico */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Accesso...' : '✨ Accedi'}
          </button>
        </form>
        
        {/* Messaggio errore condizionale */}
        {error && <div className="error">⚠️ {error}</div>}
        
        {/* Pulsante navigazione ritorno homepage */}
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="back-btn"
            style={{ 
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              padding: '0.75rem'
            }}
          >
            ← Torna alla Home
          </button>
        </div>

        {/* Sezione account demo per testing e valutazione */}
        <div className="test-accounts" style={{ marginTop: '2rem' }}>
          <p><strong>Account di prova:</strong></p>
          {/* Lista account demo con diverse configurazioni monete */}
          <p>• novice / NoviceUser123! (100 monete)</p>
          <p>• empty / EmptyCoins456@ (0 monete)</p>
          <p>• player / PlayerGame789# (180 monete)</p>
          
          {/* Nota dinamicità saldi per testing */}
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)', 
            marginTop: '0.75rem',
            fontStyle: 'italic' 
          }}>
            💡 Saldi iniziali database - le monete cambiano giocando
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;