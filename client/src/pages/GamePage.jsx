import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Game from '../components/Game';

/**
 * PAGINA GIOCO AUTENTICATO: GamePage
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * WRAPPER E GESTORE MODALITÀ GIOCO AUTENTICATA CON MONETE
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Gestisce il ciclo di vita completo delle partite autenticate, dalla creazione
 * alla gestione degli stati intermedi (loading, errore, gioco attivo) fino alla
 * conclusione con possibilità di nuove partite o ritorno homepage.
 * 
 * FUNZIONALITÀ CORE:
 * - Creazione automatica nuova partita all'avvio pagina
 * - Gestione stati interfaccia (loading, errore, gioco attivo)
 * - Protezione React Strict Mode per prevenire double calls
 * - Error handling con retry e navigazione fallback
 * - Gestione fine partita (nuova partita o ritorno home)
 * - Aggiornamento monete utente post-creazione partita
 * - Integrazione con componente Game per logica principale
 * 
 * STATI INTERFACCIA:
 * 
 * CREAZIONE PARTITA (isCreatingGame: true):
 * - Loader con messaggio preparazione frase
 * - API call POST /games per nuova partita
 * - Aggiornamento monete utente se presente in response
 * 
 * ERRORE CREAZIONE (error: string):
 * - Messaggio errore specifico
 * - Pulsante retry per nuovo tentativo
 * - Pulsante home per navigazione fallback
 * 
 * GIOCO ATTIVO (currentGameId: string):
 * - Render componente Game con props complete
 * - Gestione eventi fine partita
 * - Header nascosto (integrato in Game component)
 * 
 * WORKFLOW CREAZIONE PARTITA:
 * 1. Mount componente attiva useEffect
 * 2. Protezione Strict Mode previene double calls
 * 3. POST request a /api/games per nuova partita
 * 4. Aggiornamento gameId e monete utente da response
 * 5. Render componente Game con dati partita
 * 
 * PROPS:
 * - user: Oggetto utente corrente (username, monete)
 * - setUser: Funzione aggiornamento stato utente globale
 * 
 * DIPENDENZE:
 * - Component Game per logica gioco principale
 * - React Router per navigazione post-gioco
 * - useRef per protezione Strict Mode
 */
function GamePage({ user, setUser }) {
  const navigate = useNavigate();

  // SEZIONE: STATI LOCALI
  //═══════════════════════════════════════════════════════════════════════════════

  const [currentGameId, setCurrentGameId] = useState(null);   // ID partita corrente
  const [isCreatingGame, setIsCreatingGame] = useState(false); // Loading creazione
  const [error, setError] = useState('');                     // Messaggi errore
  
  // Protezione React Strict Mode per prevenire double calls API
  const gameCreatedRef = useRef(false);

  // SEZIONE: CREAZIONE AUTOMATICA PARTITA
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Effect per creazione automatica partita al mount componente
   * 
   * STRICT MODE PROTECTION:
   * - useRef previene double calls durante sviluppo
   * - Flag gameCreatedRef blocca chiamate duplicate
   * - Console log commentato per produzione
   * 
   * WORKFLOW:
   * 1. Verifica flag protezione Strict Mode
   * 2. Imposta flag per prevenire chiamate successive
   * 3. Avvia processo createNewGame
   */
  useEffect(() => {
    // Protezione contro double rendering di StrictMode
    if (gameCreatedRef.current) {
      // console.log('Strict Mode double call prevented');
      return;
    }
    
    gameCreatedRef.current = true;
    createNewGame();
  }, []);

  // SEZIONE: GESTIONE CREAZIONE PARTITA
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Crea nuova partita autenticata con API call
   * 
   * WORKFLOW DETTAGLIATO:
   * 1. Attiva loading state e reset errori precedenti
   * 2. POST request a /api/games endpoint per nuova partita
   * 3. Gestione response con verifica status e parsing dati
   * 4. Aggiornamento gameId per attivazione componente Game
   * 5. Aggiornamento monete utente se fornite in response
   * 6. Error handling con messaggio specifico per l'utente
   * 7. Cleanup loading state indipendentemente dal risultato
   * 
   * ERROR HANDLING:
   * - Distinzione errori server vs network
   * - Messaggi specifici dal server o fallback generici
   * - Console log per debugging mantenendo UX pulita
   */
  const createNewGame = async () => {
    setIsCreatingGame(true);    // Attiva loading interface
    setError('');               // Reset messaggi errore precedenti

    try {
      // API call per creazione nuova partita autenticata
      const response = await fetch('http://localhost:3001/api/games', {
        method: 'POST',
        credentials: 'include',   // Include cookies sessione
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Verifica successo response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione del gioco');
      }

      // Parse dati partita dal server
      const gameData = await response.json();
      setCurrentGameId(gameData.gameId);  // Attiva componente Game

      // Aggiorna monete utente se fornite nella response server
      if (gameData.coins !== undefined) {
        setUser(prev => ({ ...prev, coins: gameData.coins }));
      }

    } catch (error) {
      console.error('Errore creazione gioco:', error);
      setError(`Errore nella creazione del gioco: ${error.message}`);
    } finally {
      // Cleanup: disattiva loading state
      setIsCreatingGame(false);
    }
  };

  // SEZIONE: GESTIONE EVENTI FINE PARTITA
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Gestisce azioni post fine partita
   * 
   * AZIONI SUPPORTATE:
   * 
   * NUOVA PARTITA (result: 'new-game'):
   * 1. Reset gameId corrente
   * 2. Clear errori precedenti
   * 3. Avvia nuova creazione partita
   * 4. Mantiene utente sulla pagina gioco
   * 
   * RITORNO HOME (qualsiasi altro result):
   * 1. Navigazione diretta alla homepage
   * 2. Cleanup automatico componente
   * 
   * @param {string} result - Tipo azione richiesta da Game component
   */
  const handleGameEnd = (result) => {
    if (result === 'new-game') {
      // Richiesta nuova partita: ricrea il gioco
      setCurrentGameId(null);   // Reset ID per trigger ricreazione
      setError('');             // Clear errori precedenti
      createNewGame();          // Avvia nuova partita
      return;
    }
    
    // Qualsiasi altro result: ritorna alla home
    navigate('/');
  };

  /**
   * Navigazione diretta alla homepage
   * 
   * Utilizzato per pulsanti "Torna alla Home" negli stati di errore
   * o come fallback generale per uscita dalla pagina gioco.
   */
  const handleBackToHome = () => {
    navigate('/');
  };

  // SEZIONE: RENDER STATI INTERFACCIA
  //═══════════════════════════════════════════════════════════════════════════════

  // STATO: Loading creazione partita
  if (isCreatingGame) {
    return (
      <div className="game-page">
        <div className="game-creation-loader">
          <h2>Creazione partita in corso...</h2>
          <p>Stiamo preparando una nuova frase per te!</p>
        </div>
      </div>
    );
  }

  // STATO: Errore nella creazione del gioco
  if (error) {
    return (
      <div className="game-page">
        <div className="game-error">
          <h2>Errore</h2>
          <p>{error}</p>
          <div className="error-actions">
            {/* Pulsante retry per nuovo tentativo creazione */}
            <button onClick={createNewGame} className="retry-btn">
              Riprova
            </button>
            {/* Pulsante navigazione fallback */}
            <button onClick={handleBackToHome} className="back-btn">
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATO: Gioco attivo con partita creata
  if (currentGameId) {
    return (
      <div className="game-page">
        {/* Header precedentemente presente ora integrato in Game component
        <div className="game-page-header">
          <button onClick={handleBackToHome} className="back-to-home-btn">
            ← Torna alla Home
          </button>
          <h1>Partita in Corso</h1>
          <div className="user-info">
            <span>Giocatore: <strong>{user.username}</strong></span>
          </div>
        </div>
        */}
        
        {/* Componente Game principale con props complete */}
        <Game 
          gameId={currentGameId}      // ID partita per API calls
          onGameEnd={handleGameEnd}   // Callback gestione fine partita
          user={user}                 // Dati utente corrente
          setUser={setUser}           // Setter per aggiornamenti utente
        />
      </div>
    );
  }

  // STATO: Fallback per casi imprevisti (non dovrebbe mai renderizzare)
  return (
    <div className="game-page">
      <div className="game-error">
        <h2>Errore</h2>
        <p>Impossibile inizializzare il gioco</p>
        <button onClick={handleBackToHome} className="back-btn">
          Torna alla Home
        </button>
      </div>
    </div>
  );
}

export default GamePage;