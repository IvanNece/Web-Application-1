/**
 * GAME.JSX - COMPONENTE PRINCIPALE GIOCO AUTENTICATO
 * 
 * SCOPO:
 * Componente React principale che gestisce l'intero flusso di gioco
 * per utenti autenticati con sistema di monete, timer e persistenza.
 * Coordina tutti i sotto-componenti e la logica di business del gioco.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Gestione completa stato gioco autenticato con monete
 * - Integrazione API server per persistenza dati
 * - Sistema timer con warning automatici
 * - Gestione lettere, vocali e tentativi frase
 * - Feedback avanzato e animazioni visuali
 * - Sincronizzazione server-client in tempo reale
 * 
 * HOOK UTILIZZATI:
 * - useGameLogic: Logica di gioco centralizzata e stato
 * - useGameTimer: Gestione timer e warning temporali
 * - useApiCalls: Comunicazione API e sincronizzazione
 * 
 * COMPONENTI CHILD:
 * - GameHeader: Header con logo e informazioni giocatore
 * - GameControls: Controlli input lettera e frase
 * - PhraseDisplay: Griglia visualizzazione frase
 * - VirtualKeyboard: Tastiera virtuale con costi
 * - FeedbackSystem: Sistema messaggi e notifiche
 * - LoadingStateManager: Gestione stati di caricamento
 * 
 * PROPS RICEVUTE:
 * - gameId: ID univoco della partita attiva
 * - onGameEnd: Callback fine gioco per parent
 * - user: Oggetto utente autenticato corrente
 * - setUser: Funzione aggiornamento stato utente
 * 
 * SICUREZZA:
 * - Strict Mode Protection per prevenire double loading
 * - Validazione input lato client
 * - Gestione errori di rete e timeout
 * - Sincronizzazione stato server obbligatoria
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
import LoadingStateManager from './common/LoadingStateManager';
import useGameLogic from '../hooks/useGameLogic';
import useGameTimer from '../hooks/useGameTimer';
import useApiCalls from '../hooks/useApiCalls';

const Game = ({ gameId, onGameEnd, user, setUser }) => {
  
  // ===============================
  // RIFERIMENTI E PROTEZIONI STRICT MODE
  // ===============================
  
  // STRICT MODE PROTECTION: Previene double loading in React StrictMode
  const initialLoadRef = useRef(false);
  
  // ===============================
  // HOOK PERSONALIZZATI PRINCIPALI
  // ===============================
  
  // HOOK LOGICA GIOCO: Gestisce stato completo gioco autenticato
  const {
    gameState,
    setGameState,
    feedbackState,
    setFeedbackState,
    animationState,
    setAnimationState,
    letterCosts,
    setLetterCosts,
    costsLoaded,
    setCostsLoaded,
    isVowel,
    getLetterCost,
    formatTime,
    showFeedback,
    triggerLetterAnimation,
    triggerGameEndAnimation,
    resetGameState
  } = useGameLogic('authenticated');
  
  // ===============================
  // STATO LOCALE COMPONENTE
  // ===============================
  
  // STATO LETTERE RIVELATE: Traccia lettere già scoperte nella frase
  const [revealedLetters, setRevealedLetters] = useState(new Set());
  
  // STATO INPUT UTENTE: Gestisce input correnti e stati di invio
  const [userInputs, setUserInputs] = useState({
    letterInput: '',      // Input lettera singola corrente
    phraseInput: '',      // Input frase completa corrente
    isSubmittingLetter: false,  // Flag invio lettera in corso
    isSubmittingPhrase: false   // Flag invio frase in corso
  });
  
  // STATO MESSAGGI E TRACKING: Messaggi display e lettere tentate
  const [message, setMessage] = useState('');
  const [triedLetters, setTriedLetters] = useState(new Set());
  
  // ===============================
  // STATO LOADING E SINCRONIZZAZIONE
  // ===============================
  
  // STATI CARICAMENTO: Traccia operazioni asincrone in corso
  const [loadingStates, setLoadingStates] = useState({
    loadingGame: true,        // Caricamento iniziale gioco
    submittingLetter: false,  // Invio lettera API
    submittingPhrase: false,  // Invio frase API
    syncingWithServer: false  // Sincronizzazione generale server
  });

  // HELPER LOADING: Funzione per aggiornare stati di caricamento atomicamente
  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // ===============================
  // FUNZIONI API E SINCRONIZZAZIONE
  // ===============================

  // CARICAMENTO COSTI LETTERE: Recupera configurazione costi dal server
  const loadLetterCosts = useCallback(async () => {
    try {
      setLoading('syncingWithServer', true);
      const response = await fetch('http://localhost:3001/api/meta/letter-costs', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const costsMap = {};
        // Mapping costi lettere in struttura accessibile
        // Mapping costi lettere in struttura accessibile
        data.letters.forEach(letterInfo => {
          costsMap[letterInfo.letter] = {
            cost: letterInfo.baseCost,    // Costo base lettera
            type: letterInfo.type         // Tipo lettera (vocal/consonant)
          };
        });
        setLetterCosts(costsMap);
        setCostsLoaded(true);
        // RIMOSSO: Banner "Costi lettere caricati" che causava problemi UX
        // showFeedback('success', 'Costi lettere caricati', 'Sistema di costi sincronizzato con il server');
      } else {
        throw new Error('Errore nel caricamento costi');
      }
    } catch (error) {
      console.error('Errore nel caricamento costi lettere:', error);
      // Non mostra feedback di fallback se gioco è già concluso
      if (gameState.status === 'running') {
        showFeedback('warning', 'Costi di fallback attivati', 'Utilizzando costi predefiniti per problemi di connessione');
      }
      // Fallback ai costi locali se l'API fallisce
      setCostsLoaded(true);
    } finally {
      setLoading('syncingWithServer', false);
    }
  }, [showFeedback, setLoading]);

  // ===============================
  // CARICAMENTO STATO GIOCO
  // ===============================

  // CARICAMENTO GIOCO: Recupera stato attuale della partita dal server
  const loadGameState = useCallback(async () => {
    try {
      setLoading('loadingGame', true);
      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel caricamento del gioco');
      }
      
      const data = await response.json();
      
      // AGGIORNAMENTO STATO: Sincronizza stato locale con server
      setGameState({
        status: data.status,                    // Stato partita (running/won/timeout/abandoned)
        phraseLength: data.phraseLength,        // Lunghezza totale frase
        spaces: data.spaces || [],              // Posizioni spazi nella frase
        revealed: data.revealed || [],          // Posizioni lettere rivelate
        revealedLetters: data.revealedLetters || {}, // Mapping posizione->lettera
        hasUsedVowel: data.hasUsedVowel || false,    // Flag utilizzo vocale
        timeLeft: data.timeLeft || 0,           // Tempo rimanente secondi
        phrase: data.phrase || null        // Frase completa (solo se gioco terminato)
      });
      
      // LOGGING DEBUG: Info utili per sviluppo (commentati per produzione)
      if (data.status === 'running') {
        // console.log(`[Game ${gameId}] Partita IN CORSO - Lunghezza: ${data.phraseLength} caratteri, Spazi: ${data.spaces.length}, Lettere rivelate: ${data.revealed.length}`);
        if (data.revealed.length > 0) {
          const revealedLetters = Object.entries(data.revealedLetters).map(([pos, letter]) => `${letter}(${pos})`);
          // console.log(`Lettere già rivelate: ${revealedLetters.join(', ')}`);
        }
      } else if (data.phrase) {
        // console.log(`[Game ${gameId}] Partita TERMINATA - Frase era: "${data.phrase}"`);
      }
      
      // AGGIORNAMENTO MONETE: Sincronizza saldo utente con server
      if (data.coins !== undefined) {
        setUser(prev => ({ ...prev, coins: data.coins }));
      }
      
      // TODO: Caricamento lettere tentate dal server
      // In una implementazione completa, il server dovrebbe fornire anche questo dato
      
      // FEEDBACK STATO: Messaggi appropriati per stato gioco caricato
      if (data.status === 'running') {
        // RIMOSSO: Banner "Gioco caricato" che causava problemi UX
        // showFeedback('info', 'Gioco caricato', `Tempo rimanente: ${Math.ceil(data.timeLeft / 1000)}s`, true, true);
      } else if (data.status === 'won') {
        showFeedback('success', 'Partita completata!', 'Hai indovinato la frase', false, false, 'won');
        triggerGameEndAnimation('won');
      } else if (data.status === 'timeout') {
        const timeoutMessage = user ? 
          `${user.username} hai perso 20 monete per il timeout` : 
          `La frase era: "${data.phrase}"`;
        showFeedback('error', 'Tempo scaduto!', timeoutMessage, false, false, 'timeout');
        triggerGameEndAnimation('timeout');
      } else if (data.status === 'abandoned') {
        // NOTA: Non mostra feedback per abbandono per evitare duplicati
        // Il feedback è già gestito da apiAbandonGame() in useApiCalls
        triggerGameEndAnimation('lost');
      }
      
    } catch (error) {
      console.error('Errore nel caricamento del gioco:', error);
      // Non mostra errore di caricamento se gioco è già concluso
      if (gameState.status === 'running') {
        showFeedback('error', 'Errore di caricamento', error.message, false);
      }
    } finally {
      setLoading('loadingGame', false);
    }
  }, [gameId, showFeedback, setLoading, triggerGameEndAnimation]);

  // ===============================
  // HOOK API E SINCRONIZZAZIONE
  // ===============================
  
  // HOOK TIMER AUTENTICATO: Gestione countdown per modalità autenticata
  useGameTimer(
    gameState,                    // Stato gioco corrente
    setGameState,                 // Setter stato gioco
    showFeedback,                 // Funzione feedback
    triggerGameEndAnimation,      // Trigger animazioni fine gioco
    setUser,                      // Setter dati utente (per modalità autenticata)
    user,                         // Oggetto utente corrente
    gameId,                       // ID partita autenticata
    'authenticated'               // Modalità autenticata
  );
  
  // HOOK API CALLS: Gestione chiamate server per azioni gioco
  const { apiGuessLetter, apiGuessPhrase, apiAbandonGame } = useApiCalls({
    mode: 'authenticated',     // Modalità autenticata con persistenza
    gameId,                   // ID partita corrente
    setGameState,             // Setter stato gioco
    setUser,                  // Setter dati utente
    user,                     // Oggetto utente corrente
    showFeedback,             // Funzione display feedback
    triggerGameEndAnimation,  // Trigger animazioni fine gioco
    setMessage,               // Setter messaggi display
    setTriedLetters,          // Setter lettere tentate
    setUserInputs             // Setter input utente
  });

  // ===============================
  // SINCRONIZZAZIONE PERIODICA SERVER
  // ===============================
  
  // SYNC AUTOMATICO: Sincronizzazione periodica stato con server (ogni 30 secondi)
  useEffect(() => {
    if (gameState.status !== 'running') return;
    
    const syncInterval = setInterval(async () => {
      try {
        setLoading('syncingWithServer', true);
        const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // CONTROLLO CAMBIAMENTI: Verifica se stato cambiato lato server
          if (data.status !== gameState.status) {
            // Evita reload per abandoned - già gestito da apiAbandonGame
            if (data.status === 'abandoned') {
              // Solo aggiorna stato senza feedback duplicato
              setGameState(prev => ({ ...prev, status: 'abandoned', phrase: data.phrase }));
            } else {
              showFeedback('info', 'Stato sincronizzato', 
                'Il gioco è stato aggiornato dal server');
              await loadGameState();
            }
          } else {
            // AGGIORNAMENTI INCREMENTALI: Solo tempo e monete se necessario
            if (Math.abs(data.timeLeft - gameState.timeLeft) > 2000) {
              setGameState(prev => ({ ...prev, timeLeft: data.timeLeft }));
            }
            
            if (data.coins !== user.coins) {
              setUser(prev => ({ ...prev, coins: data.coins }));
            }
          }
        }
      } catch (error) {
        console.warn('Errore di sincronizzazione:', error);
      } finally {
        setLoading('syncingWithServer', false);
      }
    }, 30000); // Intervallo sincronizzazione: 30 secondi
    
    return () => clearInterval(syncInterval);
  }, [gameId, gameState.status, gameState.timeLeft, user.coins, loadGameState, showFeedback, setLoading]);

  // ===============================
  // INIZIALIZZAZIONE COMPONENTE
  // ===============================
  
  // CARICAMENTO INIZIALE: Setup iniziale gioco e costi con protezione StrictMode
  useEffect(() => {
    // Protezione contro double rendering di React StrictMode
    if (initialLoadRef.current) {
      // console.log('🛡️ Game initial load double call prevented by StrictMode protection');
      return;
    }
    
    initialLoadRef.current = true;
    loadGameState();    // Carica stato partita dal server
    loadLetterCosts();  // Carica configurazione costi lettere
  }, [loadGameState, loadLetterCosts]);

  // ===============================
  // GESTORI EVENTI UTENTE
  // ===============================
  
  // TENTATIVO LETTERA: Gestione completa tentativo lettera con validazioni
  const guessLetter = async () => {
    const letter = userInputs.letterInput.trim().toUpperCase();
    
    // RESET INPUT: Svuota input sempre come prima operazione
    setUserInputs(prev => ({ ...prev, letterInput: '' }));
    
    // VALIDAZIONE BASE: Controllo presenza lettera valida
    if (!letter) {
      setMessage('📝 Inserisci una lettera valida');
      return;
    }
    
    // CONTROLLO PRIORITA 1: Verifica disponibilità monete (sempre primo!)
    const cost = getLetterCost(letter);
    if (user.coins < cost) {
      setMessage(`💰 Non hai abbastanza monete! 🎯`);
      return;
    }
    
    // CONTROLLO PRIORITA 2: Verifica se lettera già tentata
    if (triedLetters.has(letter.toLowerCase())) {
      setMessage('📝 Lettera già tentata');
      return;
    }
    
    // CONTROLLO PRIORITA 3: Limitazioni vocali modalità autenticata
    if (isVowel(letter) && gameState.hasUsedVowel) {
      setMessage('🔤 Puoi usare solo una vocale per partita! 🅰️');
      return;
    }
    
    // Aggiorna triedLetters immediatamente per coerenza
    setTriedLetters(prev => new Set([...prev, letter.toLowerCase()]));
    
    await apiGuessLetter(letter);
  };

  // Funzione per gestire il click su una lettera dalla tastiera virtuale - ora usa l'hook
  const handleLetterClick = async (letter) => {
    if (!letter) {
      return;
    }
    
    // PRIORITÀ 1: Controllo monete (sempre primo!)
    const cost = getLetterCost(letter);
    if (user.coins < cost) {
      setMessage(`� Non hai abbastanza monete! Non ti rimane altro che provare a indovinare la frase o abbandonare la partita 🎯`);
      return;
    }
    
    // PRIORITÀ 2: Controllo se la lettera è già stata tentata
    if (triedLetters.has(letter.toLowerCase())) {
      return; // Lettera già tentata - non mostrare messaggio se già disabilitata
    }
    
    // PRIORITÀ 3: Controllo vocali
    if (isVowel(letter) && gameState.hasUsedVowel) {
      setMessage('� Puoi usare solo una vocale per partita! �!');
      return;
    }
    
    // Aggiorna triedLetters immediatamente per disabilitare il pulsante
    setTriedLetters(prev => new Set([...prev, letter.toLowerCase()]));
    
    // Usa l'hook per l'API call
    await apiGuessLetter(letter);
  };

  // TENTATIVO FRASE: Gestione invio frase completa per vittoria immediata
  const guessPhrase = async () => {
    const attempt = userInputs.phraseInput.trim();
    await apiGuessPhrase(attempt);
  };

  // ABBANDONO PARTITA: Gestione abbandono sicuro senza penalità
  const abandonGame = async () => {
    await apiAbandonGame();
  };

  // ===============================
  // FUNZIONI RENDERING AUSILIARIE
  // ===============================

  // RENDERING GRIGLIA FRASE: Visualizzazione avanzata frase con stati
  const renderPhraseGrid = () => {
    // Stato caricamento
    if (gameState.status === 'loading') {
      return <div className="phrase-grid loading">Caricamento...</div>;
    }
    
    // Gioco terminato - mostra frase completa
    if (gameState.phrase && ['won', 'timeout', 'abandoned'].includes(gameState.status)) {
      return (
        <div className="phrase-grid final">
          {gameState.phrase.split('').map((char, i) => (
            <div 
              key={i}
              className={`phrase-cell ${char === ' ' ? 'space' : 'final-revealed'}`}
            >
              {char === ' ' ? '' : char.toUpperCase()}
            </div>
          ))}
        </div>
      );
    }
    
    // Durante gioco - modalità sicura anti-cheat con lettere selettive
    const cells = [];
    
    // Iterazione su ogni posizione della frase
    for (let i = 0; i < gameState.phraseLength; i++) {
      const isSpace = gameState.spaces.includes(i);
      const isRevealed = gameState.revealed.includes(i);
      
      let cellContent = '';
      let cellClass = `phrase-cell ${isSpace ? 'space' : ''}`;
      
      if (isSpace) {
        cellContent = '';
        cellClass = 'phrase-cell space';
      } else if (isRevealed) {
        const revealedLetter = getRevealedLetterAtPosition(i);
        if (revealedLetter) {
          cellContent = revealedLetter;
          cellClass = 'phrase-cell revealed';
        } else {
          cellContent = '●';  // Fallback per lettera rivelata senza contenuto
          cellClass = 'phrase-cell revealed';
        }
      } else {
        cellContent = '';     // Lettera nascosta
        cellClass = 'phrase-cell';
      }
      
      // Aggiunta cella alla griglia
      cells.push(
        <div key={i} className={cellClass}>
          {cellContent}
        </div>
      );
    }
    
    return <div className="phrase-grid">{cells}</div>;
  };

  // HELPER LETTERA POSIZIONE: Recupera lettera rivelata in posizione specifica
  const getRevealedLetterAtPosition = (position) => {
    return gameState.revealedLetters[position] || null;
  };

  // ===============================
  // RENDERING PRINCIPALE
  // ===============================

  // LOADING PRINCIPALE: Schermata caricamento iniziale gioco
  if (loadingStates.loadingGame) {
    return (
      <LoadingStateManager 
        isLoading={true}
        message="Caricamento gioco..."
        submessage="Sincronizzazione con il server"
        mode="authenticated"
      />
    );
  }

  // STATI GIOCO: Determinazione stato corrente per rendering condizionale
  const isGameRunning = gameState.status === 'running';
  const isGameEnded = ['won', 'timeout', 'abandoned'].includes(gameState.status);

  return (
    <>
      <div className="game-container">
        {/* Indicatore sincronizzazione server */}
        {loadingStates.syncingWithServer && (
          <div className="sync-overlay">
            <div className="sync-spinner"></div>
            <span>Sincronizzazione...</span>
          </div>
        )}
        
        {/* HEADER GIOCO: Componente header con timer e controlli */}
        <GameHeader 
          mode="authenticated"
          user={user}
          timeLeft={gameState.timeLeft}
          hasUsedVowel={gameState.hasUsedVowel}
          onAbandon={abandonGame}
          gameIcon={gameIcon}
          gameIconRight={gameIconRight}
          formatTime={formatTime}
          isGameRunning={isGameRunning}
        />
        
        {/* SISTEMA FEEDBACK: Banner messaggi e notifiche avanzate */}
        <FeedbackSystem 
          feedbackState={feedbackState}
          mode="authenticated"
          onClose={() => setFeedbackState(prev => ({ ...prev, isVisible: false }))}
          onGameEnd={onGameEnd}
          onBackToHome={() => onGameEnd(gameState.status)}
        />
        
        {/* ANIMAZIONE LETTERA: Feedback visivo risultato tentativo */}
        {animationState.showLetterAnimation && (
          <div className={`letter-animation ${animationState.letterResult}`}>
            <div className="letter-animation-content">
              <div className="big-letter">{animationState.lastGuessedLetter}</div>
              <div className="animation-text">
                {animationState.letterResult === 'hit' ? '✨ TROVATA!' : '💥 NON C\'È'}
              </div>
            </div>
          </div>
        )}

        {/* GRIGLIA FRASE: Visualizzazione frase con lettere rivelate */}
        <PhraseDisplay 
          gameState={gameState}
          revealed={gameState.revealed}
          getRevealedLetterAtPosition={getRevealedLetterAtPosition}
          mode="authenticated"
        />

      {/* MESSAGGIO FEEDBACK: Display messaggio temporaneo */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* SEZIONE CONTROLLI: Input e tastiera sempre visibili */}
      <div className="game-section">
        {/* CONTROLLI INPUT: Sezione unificata lettera + frase */}
        <GameControls 
          mode="authenticated"
          letterInput={userInputs.letterInput}
          phraseInput={userInputs.phraseInput}
          onLetterChange={(value) => setUserInputs(prev => ({ ...prev, letterInput: value }))}
          onPhraseChange={(value) => setUserInputs(prev => ({ ...prev, phraseInput: value }))}
          onLetterSubmit={guessLetter}
          onPhraseSubmit={guessPhrase}
          isSubmittingLetter={userInputs.isSubmittingLetter}
          isSubmittingPhrase={userInputs.isSubmittingPhrase}
          getLetterCost={getLetterCost}
          isVowel={isVowel}
          hasUsedVowel={gameState.hasUsedVowel}
        />

        {/* TASTIERA VIRTUALE: Keyboard on-screen con costi e stati */}
        <VirtualKeyboard 
          mode="authenticated"
          onLetterClick={handleLetterClick}
          triedLetters={triedLetters}
          userCoins={user.coins}
          hasUsedVowel={gameState.hasUsedVowel}
          getLetterCost={getLetterCost}
          isVowel={isVowel}
          isSubmitting={userInputs.isSubmittingLetter}
        />
      </div>

    </div>
    </>
  );
};

export default Game;