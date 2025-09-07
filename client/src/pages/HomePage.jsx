import { useNavigate } from 'react-router-dom';
import gameIcon from '../assets/game-icon.svg';
import gameIconRight from '../assets/game-icon-right.svg';

/**
 * PAGINA PRINCIPALE: HomePage
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * HOMEPAGE E DASHBOARD UTENTE DEL GIOCO "INDOVINA LA FRASE"
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Pagina di benvenuto e punto di partenza per tutte le modalità di gioco,
 * con interfaccia adattiva in base allo stato di autenticazione dell'utente
 * e gestione delle opzioni di gioco disponibili.
 * 
 * FUNZIONALITÀ CORE:
 * - Dashboard utente con visualizzazione monete e username
 * - Controllo accesso modalità autenticata (verifica monete sufficienti)
 * - Accesso diretto modalità ospite per utenti non autenticati
 * - Sistema logout con reset stato utente
 * - Navigazione verso login, gioco autenticato o modalità guest
 * - Messaggi informativi per promozione modalità alternative
 * 
 * STATI INTERFACCIA:
 * 
 * UTENTE AUTENTICATO CON MONETE:
 * - Messaggio benvenuto personalizzato con username
 * - Visualizzazione saldo monete corrente
 * - Pulsante "Inizia Partita" per modalità a pagamento
 * - Pulsante logout per terminare sessione
 * 
 * UTENTE AUTENTICATO SENZA MONETE:
 * - Messaggio benvenuto con alert monete insufficienti
 * - Informazioni modalità ospite (richiede logout)
 * - Pulsante logout per accedere a modalità gratuita
 * - Nessun pulsante gioco (disabilitato)
 * 
 * UTENTE NON AUTENTICATO:
 * - Interfaccia scelta modalità
 * - Pulsante accesso per registrazione/login
 * - Pulsante modalità ospite diretto (gratuito)
 * - Separatore visivo tra opzioni
 * 
 * PROPS:
 * - user: Oggetto utente corrente (null se non autenticato)
 * - setUser: Funzione per aggiornamento stato utente (logout)
 * 
 * DIPENDENZE:
 * - React Router per navigazione tra pagine
 * - Asset SVG per icone decorative del gioco
 * - CSS globale per styling homepage
 */
function HomePage({ user, setUser }) {
  const navigate = useNavigate();

  // SEZIONE: GESTIONE LOGOUT
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Gestisce logout utente con chiamata API e reset stato
   * 
   * WORKFLOW:
   * 1. Esegue DELETE request a /api/sessions/current
   * 2. Reset stato utente locale a null (elimina dati sensibili)
   * 3. Forza navigazione homepage per re-render interfaccia
   * 4. Gestisce errori di connessione con console log
   * 
   * SICUREZZA:
   * - Elimina immediatamente stato utente dal client
   * - Invalida sessione lato server
   * - Impedisce accesso a dati utente dopo logout
   */
  const handleLogout = async () => {
    try {
      // Chiamata API per invalidare sessione server
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'    // Include cookies sessione
      });
      
      if (response.ok) {
        // Reset stato utente senza page reload (SPA behavior)
        setUser(null);
        navigate('/');           // Forza re-render homepage
      }
    } catch (error) {
      console.error('Errore durante logout:', error);
    }
  };

  // SEZIONE: NAVIGAZIONE MODALITÀ GUEST
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Gestisce navigazione alla modalità ospite
   * 
   * Naviga direttamente alla pagina guest senza controlli aggiuntivi.
   * Disponibile per:
   * - Utenti non autenticati (accesso diretto)
   * - Utenti autenticati che hanno fatto logout per giocare gratis
   */
  const handleGuestMode = () => {
    navigate('/guest');
  };

  // SEZIONE: RENDER INTERFACCIA
  //═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="home-page">
      {/* Header con titolo e icone decorative */}
      <div className="welcome-message">
        <div className="title-with-icons">
          <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
          <h1>Indovina la Frase</h1>
          <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
        </div>
      </div>

      <div className="card">
        {user ? (
          // INTERFACCIA: Utente autenticato
          <>
            {/* Messaggio benvenuto personalizzato */}
            <h2>Benvenuto, {user.username}!</h2>
            <p className="user-info">
              💰 Monete disponibili: <strong>{user.coins}</strong>
            </p>
            
            {user.coins > 0 ? (
              // Caso: Monete sufficienti per giocare
              <button 
                className="start-game-btn"
                onClick={() => navigate('/game')}
              >
                🎯 Inizia Partita (costa monete)
              </button>
            ) : (
              // Caso: Monete insufficienti con info modalità guest
              <div className="no-coins-warning">
                <p>Non hai abbastanza monete per giocare!</p>
                
                {/* Info box modalità ospite per utenti senza monete */}
                <div className="guest-info" style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'rgba(0, 255, 255, 0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 255, 255, 0.3)'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-cyan)' }}>
                    💡 <strong>Modalità Ospite disponibile!</strong>
                  </p>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Per giocare gratis con le frasi dedicate agli ospiti, devi prima fare logout.
                  </p>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    🔐 Logout → 🎮 Modalità Ospite (3 frasi gratuite, senza monete)
                  </p>
                </div>
              </div>
            )}
            
            {/* Pulsante logout sempre disponibile per utenti autenticati */}
            <button 
              onClick={handleLogout} 
              className="logout-btn"
            >
              🚪 Logout
            </button>
          </>
        ) : (
          // INTERFACCIA: Utente non autenticato (scelta modalità)
          <>
            <h2>Scegli come giocare</h2>
            
            {/* Pulsante accesso modalità autenticata */}
            <button 
              className="start-game-btn"
              onClick={() => navigate('/login')}
            >
              🔐 Accedi per giocare con le monete
            </button>
            
            {/* Separatore visivo tra opzioni */}
            <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
              oppure
            </p>
            
            {/* Pulsante modalità ospite per utenti non autenticati */}
            <button 
              className="guest-btn"
              onClick={handleGuestMode}
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-green) 100%)'
              }}
            >
              🎮 Gioca come Ospite (Gratis)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;