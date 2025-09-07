/**
 * GUESTGAME.JSX - COMPONENTE GIOCO MODALITA OSPITE
 * 
 * SCOPO:
 * Componente React per gestione completa del gioco in modalità ospite
 * senza autenticazione. Offre esperienza di gioco semplificata senza
 * persistenza, timer o sistema di monete. Ideale per demo rapide.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Gioco completo senza registrazione richiesta
 * - Tentativi illimitati per lettere e frasi
 * - Interfaccia semplificata senza timer o monete
 * - Frasi generate casualmente dal server
 * - Reset e nuova partita immediati
 * 
 * DIFFERENZE DA MODALITA AUTENTICATA:
 * - Nessun sistema di monete o costi
 * - Nessun timer o time pressure
 * - Nessuna persistenza stato tra sessioni
 * - Tentativi di lettere e frasi gratuiti
 * - Interfaccia più diretta e accessibile
 * 
 * HOOK UTILIZZATI:
 * - useGameLogic: Logica di gioco in modalità 'guest'
 * - useGameTimer: Timer semplificato per statistiche
 * - useApiCalls: API calls per frasi guest
 * 
 * COMPONENTI CHILD:
 * - GameHeader: Header semplificato senza info utente
 * - GameControls: Controlli senza costi o limitazioni
 * - PhraseDisplay: Griglia frase identica a modalità auth
 * - VirtualKeyboard: Tastiera senza prezzi o restrizioni
 * - FeedbackSystem: Feedback semplificato
 * - LoadingStateManager: Loading states per UX fluida
 * 
 * PROPS RICEVUTE:
 * - onBackToHome: Callback per tornare alla home page
 * 
 * SICUREZZA:
 * - Strict Mode Protection per prevenire doppia creazione
 * - Validazione input locale
 * - Gestione errori di rete graceful
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/base.css';
import '../styles/game-container.css';
import '../styles/game-interface.css';
import '../styles/phrase-display.css';
import '../styles/virtual-keyboard.css';
import '../styles/feedback-system.css';
import '../styles/game-results.css';
import gameIcon from '../assets/game-icon.svg';
import gameIconRight from '../assets/game-icon-right.svg';
import VirtualKeyboard from './common/VirtualKeyboard';
import GameHeader from './common/GameHeader';
import PhraseDisplay from './common/PhraseDisplay';
import GameControls from './common/GameControls';
import FeedbackSystem from './common/FeedbackSystem';
import useGameLogic from '../hooks/useGameLogic';
import useGameTimer from '../hooks/useGameTimer';
import useApiCalls from '../hooks/useApiCalls';
import LoadingStateManager from './common/LoadingStateManager';

function GuestGame({ onBackToHome }) {
  
  // ===============================
  // HOOK PERSONALIZZATI MODALITA GUEST
  // ===============================
  
  // HOOK LOGICA GIOCO: Gestisce stato gioco semplificato per ospiti
  const {
    gameState: hookGameState,       // Stato gioco da hook condiviso
    setGameState: setHookGameState, // Setter stato gioco hook
    feedbackState,                  // Stato feedback messaggi
    setFeedbackState,              // Setter feedback
    animationState,                // Stato animazioni
    setAnimationState,             // Setter animazioni
    showFeedback,                  // Funzione display feedback
    triggerGameEndAnimation,       // Trigger animazioni fine gioco
    formatTime: hookFormatTime,    // Formattatore tempo da hook
    resetGameState                 // Reset stato per nuova partita
  } = useGameLogic('guest');

  // ===============================
  // STATO LOCALE GUEST
  // ===============================
  
  // STATO GIOCO GUEST: Stato specifico modalità ospite semplificata
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);      // Caricamento operazioni
  const [error, setError] = useState('');             // Messaggi errore
  const [message, setMessage] = useState('');         // Messaggi temporanei
  const [phraseGuess, setPhraseGuess] = useState(''); // Input frase tentativo
  const [letterInput, setLetterInput] = useState(''); // Input lettera corrente
  const [timeLeft, setTimeLeft] = useState(0);        // Timer countdown
  const [triedLetters, setTriedLetters] = useState(new Set()); // Lettere tentate

  // PROTEZIONE STRICT MODE: Previene doppia creazione partita
  const gameCreatedRef = useRef(false);

  // STATI COMPATIBILITA: Stato per compatibilità con useApiCalls hook
  const [isSubmittingPhrase, setIsSubmittingPhrase] = useState(false);
  
  // OGGETTO USERINPUTS: Compatibilità per hook condiviso useApiCalls
  const userInputs = {
    phraseInput: phraseGuess,                    // Input frase corrente
    isSubmittingPhrase: isSubmittingPhrase      // Flag invio frase
  };
  
  // SETTER USERINPUTS: Wrapper per aggiornamento stato compatibile
  const setUserInputs = (updater) => {
    if (typeof updater === 'function') {
      const newState = updater(userInputs);
      if (newState.phraseInput !== undefined) setPhraseGuess(newState.phraseInput);
      if (newState.isSubmittingPhrase !== undefined) setIsSubmittingPhrase(newState.isSubmittingPhrase);
    } else {
      if (updater.phraseInput !== undefined) setPhraseGuess(updater.phraseInput);
      if (updater.isSubmittingPhrase !== undefined) setIsSubmittingPhrase(updater.isSubmittingPhrase);
    }
  };

  // ===============================
  // FUNZIONI API GUEST
  // ===============================

  // CREAZIONE GIOCO GUEST: Avvia nuova partita ospite senza autenticazione
  const createGuestGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/guest/games', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);                    // Imposta stato partita
        setTimeLeft(data.timeLeft || 60);      // Imposta timer iniziale
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nella creazione del gioco');
      }
    } catch (err) {
      setError('Errore di connessione: ' + err.message);
    }
    setLoading(false);
  }, []);

  // ===============================
  // INIZIALIZZAZIONE AUTOMATICA
  // ===============================

  // AVVIO AUTOMATICO: Crea gioco guest al mounting componente
  useEffect(() => {
    // Protezione contro double rendering di React StrictMode
    if (gameCreatedRef.current) {
      // console.log('🛡️ Guest game double call prevented by StrictMode protection');
      return;
    }
    
    gameCreatedRef.current = true;
    createGuestGame();  // Avvia creazione partita guest
  }, [createGuestGame]);

  // ===============================
  // FUNZIONI API GUEST
  // ===============================

  // RECUPERO STATO GIOCO: Sincronizzazione stato partita guest con feedback
  const fetchGuestGameState = useCallback(async (gameId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);                    // Aggiorna stato gioco
        setTimeLeft(data.timeLeft || 0);       // Aggiorna timer
        
        // FEEDBACK STATI FINALI: Solo per stati conclusivi (non 'running')
        if (data.status === 'won') {
          showFeedback('success', 'Partita completata!', 'Hai indovinato la frase', false, false, 'won');
          triggerGameEndAnimation('won');
        } else if (data.status === 'timeout') {
          showFeedback('error', 'Tempo scaduto!', `La frase era: "${data.phrase}"`, false, false, 'timeout');
          triggerGameEndAnimation('timeout');
        } else if (data.status === 'abandoned') {
          showFeedback('warning', 'Partita abbandonata', `La frase era: "${data.phrase}"`, false, false, 'abandoned');
          triggerGameEndAnimation('lost');
        }
        // NOTA: Rimosso feedback per 'running' che causava banner indesiderato
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nel recupero dello stato');
      }
    } catch (err) {
      setError('Errore di connessione: ' + err.message);
    }
  }, [showFeedback, triggerGameEndAnimation]);

  // ===============================
  // HOOK TIMER E API GUEST
  // ===============================

  // TIMER GUEST: Hook countdown specifico per modalità ospite
  useGameTimer(
    gameState,                    // Stato gioco corrente
    setGameState,                 // Setter stato gioco
    showFeedback,                 // Funzione feedback
    triggerGameEndAnimation,      // Trigger animazioni
    null,                        // setUser non necessario per guest
    null,                        // user non necessario per guest
    gameState?.gameId,           // ID partita guest
    'guest',                     // Modalità guest
    setTimeLeft                  // Setter timer specifico guest
  );

  // HOOK API CALLS: Centralizzazione chiamate API guest
  const { apiGuessLetter, apiGuessPhrase, apiAbandonGame } = useApiCalls({
    mode: 'guest',                      // Modalità guest semplificata
    gameId: gameState?.gameId,          // ID partita guest
    gameState: gameState,               // Stato gioco corrente
    setGameState: setGameState,         // Setter stato gioco
    showFeedback: showFeedback,         // Funzione feedback
    triggerGameEndAnimation: triggerGameEndAnimation, // Animazioni
    setMessage: setMessage,             // Setter messaggi
    setTriedLetters: setTriedLetters,   // Setter lettere tentate
    setLoading: setLoading,             // Setter caricamento
    setPhraseGuess: setPhraseGuess      // Setter input frase guest
  });

  // ===============================
  // GESTORI EVENTI GUEST
  // ===============================

  // TENTATIVO LETTERA GUEST: Gestione lettera senza costi né limitazioni
  const guessLetter = async (letter) => {
    if (!gameState || gameState.status !== 'running') return;
    
    // CONTROLLO LETTERA GIA TENTATA: Verifica duplicati
    if (triedLetters.has(letter.toLowerCase())) {
      setMessage(`Hai già provato la lettera "${letter.toUpperCase()}"`);
      setLetterInput(''); // Svuota input anche per lettere duplicate
      return;
    }

    // AGGIORNAMENTO IMMEDIATO: Traccia lettera e reset input
    setTriedLetters(prev => new Set(prev).add(letter.toLowerCase()));
    setLetterInput('');

    // INVIO API: Utilizza hook per chiamata server guest
    await apiGuessLetter(letter);
  };

  // TENTATIVO FRASE GUEST: Gestione frase completa modalità ospite
  const guessPhrase = async () => {
    const attempt = phraseGuess.trim();
    await apiGuessPhrase(attempt);
  };

  // ABBANDONO GIOCO GUEST: Gestione abbandono partita ospite
  const abandonGuestGame = async () => {
    await apiAbandonGame();
  };

  // ===============================
  // FUNZIONI HELPER E UTILITA
  // ===============================

  // STATO GIOCO: Verifica se partita in corso
  const isGameRunning = gameState?.status === 'running';

  // HELPER LETTERA POSIZIONE: Recupera lettera rivelata posizione specifica
  const getRevealedLetterAtPosition = (position) => {
    return gameState.revealedLetters?.[position] || null;
  };

  // NUOVA PARTITA GUEST: Reset completo stato e avvio nuovo gioco
  const startNewGuestGame = () => {
    // RESET HOOK: Reset stati del hook condiviso
    resetGameState();
    
    // RESET LOCALE: Reset stati specifici guest
    setGameState(null);
    setLoading(false);
    setError('');
    setMessage('');
    setPhraseGuess('');
    setLetterInput('');
    setTimeLeft(0);
    setTriedLetters(new Set());
    
    // NUOVO GIOCO: Avvia creazione nuova partita
    createGuestGame();
  };

  // ===============================
  // RENDERING PRINCIPALE
  // ===============================

  // LOADING INIZIALE: Schermata caricamento per stato indefinito o loading
  if (!gameState || gameState.status === 'loading') {
    return (
      <LoadingStateManager 
        isLoading={true}
        message="Caricamento gioco ospite..."
        mode="guest"
      />
    );
  }

  return (
    <>
      <div className="game-container">
        {/* SISTEMA FEEDBACK: Banner messaggi specifico per guest */}
        <FeedbackSystem 
          feedbackState={feedbackState}
          mode="guest"
          onClose={() => setFeedbackState(prev => ({ ...prev, isVisible: false }))}
          onGameEnd={startNewGuestGame}
          onBackToHome={onBackToHome}
        />

      {/* HEADER GIOCO: Info gioco e controlli per modalità guest */}
      <GameHeader 
        mode="guest"
        timeLeft={timeLeft}
        onAbandon={abandonGuestGame}
        gameIcon={gameIcon}
        gameIconRight={gameIconRight}
        formatTime={hookFormatTime}
        isGameRunning={isGameRunning}
        loading={loading}
      />

      {/* GRIGLIA FRASE: Display frase per modalità guest */}
      <PhraseDisplay 
        gameState={gameState}
        revealed={gameState.revealed}
        getRevealedLetterAtPosition={getRevealedLetterAtPosition}
        mode="guest"
      />

      {/* MESSAGGIO FEEDBACK: Display messaggi temporanei */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}
      
      {/* MESSAGGIO ERRORE: Display errori connessione/API */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* SEZIONE CONTROLLI: Input e tastiera sempre visibili */}
      <div className="game-section">
        {/* CONTROLLI INPUT: Componente unificato lettera + frase */}
        <GameControls
          letterInput={letterInput}
          phraseInput={phraseGuess}
          isInputEnabled={!loading}
          mode="guest"
          onLetterChange={setLetterInput}
          onPhraseChange={setPhraseGuess}
          onLetterSubmit={() => letterInput && guessLetter(letterInput)}
          onPhraseSubmit={guessPhrase}
        />

        {/* TASTIERA VIRTUALE: Keyboard gratuita per modalità guest */}
        <VirtualKeyboard 
          mode="guest"
          onLetterClick={guessLetter}
          triedLetters={triedLetters}
          isSubmitting={loading}
        />
      </div>
      </div>
    </>
  );
}

// EXPORT: Componente gioco modalità ospite semplificata
export default GuestGame;
