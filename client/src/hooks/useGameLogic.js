/**
 * USEGAMELOGIC.JS - HOOK LOGICA GIOCO CENTRALIZZATA
 * 
 * SCOPO:
 * Hook personalizzato che centralizza la logica di gioco condivisa
 * tra mod guest e autenticato
 * // DISPLAY FEEDBACK: Mostra messaggi tipizzati all'utente
  const showFeedback = useCallback((type, message, details = '', autoHide = true, timerWarning = false, gameEndType = null) => {
    setFeedbackState({
      type,                       // Tipo messaggio
      message,                    // Testo principale
      details,                    // Dettagli aggiuntivi
      isVisible: true,            // Abilita visibilità
      autoHide,                   // Auto-nascondimento attivo
      timerWarning,               // Flag avviso timer
      gameEndType                 // Tipo conclusione gioco
    });ticata e guest, gestendo stato gioco, feedback,
 * animazioni e funzioni di utilità. Elimina duplicazione codice.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Gestione stato gioco centralizzato
 * - Sistema feedback messaggi tipizzati
 * - Animazioni lettere e fine partita
 * - Funzioni utilità (costi, vocali, tempo)
 * - Compatibilità modalità auth/guest
 * - Performance ottimizzata con useCallback
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Modalità completa con persistenza e costi
 * - 'guest': Modalità semplificata senza limitazioni
 * 
 * STATO GESTITO:
 * - gameState: Stato principale gioco (status, frase, lettere rivelate)
 * - feedbackState: Sistema messaggi e notifiche utente
 * - animationState: Controllo animazioni UI
 * - letterCosts: Configurazione costi lettere
 * 
 * FUNZIONI ESPOSTE:
 * - showFeedback(): Display messaggi tipizzati
 * - triggerLetterAnimation(): Animazioni risultato lettere
 * - triggerGameEndAnimation(): Animazioni conclusione partita
 * - getLetterCost(): Calcolo costo lettera con fallback
 * - isVowel(): Verifica se lettera è vocale (A,E,I,O,U)
 * - formatTime(): Formattazione tempo mm:ss
 * - resetGameState(): Reset completo per nuova partita
 * 
 * VANTAGGI ARCHITETTURALI:
 * - DRY: Elimina duplicazione tra Game.jsx e GuestGame.jsx
 * - Testabilità: Logica isolata e facilmente testabile
 * - Manutenibilità: Modifiche centralizzate in un solo punto
 * - Performance: useCallback previene re-render inutili
 * - Riusabilità: Hook condivisibile tra componenti
 */

import { useState, useCallback } from 'react';

const useGameLogic = (mode = 'authenticated') => {
  
  // ===============================
  // STATO PRINCIPALE GIOCO
  // ===============================
  
  // STATO GIOCO: Configurazione e stato corrente partita
  const [gameState, setGameState] = useState({
    status: 'loading',          // Stato partita: loading/running/won/timeout/abandoned
    phraseLength: 0,            // Lunghezza totale frase in caratteri
    spaces: [],                 // Array posizioni spazi nella frase
    revealed: [],               // Array indici posizioni lettere rivelate
    revealedLetters: {},        // Mappa posizione -> lettera rivelata
    hasUsedVowel: false,        // Flag utilizzo vocale (modalità auth)
    timeLeft: 60000,            // Tempo rimanente in millisecondi
    phrase: null,               // Frase completa (solo quando gioco terminato)
    gameId: null                // ID univoco partita
  });

  // ===============================
  // STATO FEEDBACK E MESSAGGI
  // ===============================
  
  // FEEDBACK STATE: Sistema messaggi e notifiche utente
  const [feedbackState, setFeedbackState] = useState({
    type: '',                   // Tipo: 'success', 'error', 'info', 'warning'
    message: '',                // Messaggio principale
    details: '',                // Dettagli aggiuntivi
    isVisible: false,           // Flag visibilità banner
    autoHide: true,             // Auto-nascondimento temporizzato
    timerWarning: false,        // Flag avviso timer scadenza
    gameEndType: null           // Tipo fine gioco: 'won', 'timeout', 'abandoned'
  });

  // ===============================
  // STATO ANIMAZIONI
  // ===============================
  
  // ANIMATION STATE: Controllo animazioni UI gioco
  const [animationState, setAnimationState] = useState({
    lastGuessedLetter: '',      // Ultima lettera tentata per animazione
    letterResult: '',           // Risultato tentativo: 'hit', 'miss'
    showLetterAnimation: false, // Flag visibilità animazione lettera
    gameEndAnimation: '',       // Tipo animazione fine: 'won', 'lost', 'timeout'
    showGameEndAnimation: false // Flag visibilità animazione finale
  });

  // ===============================
  // STATO COSTI LETTERE
  // ===============================
  
  // LETTER COSTS: Cache costi lettere con stato caricamento
  const [letterCosts, setLetterCosts] = useState({});
  const [costsLoaded, setCostsLoaded] = useState(false);

  // ===============================
  // FUNZIONI UTILITA LETTERE
  // ===============================

  // VERIFICA VOCALE: Determina se lettera è vocale (A, E, I, O, U)
  const isVowel = useCallback((letter) => {
    return ['A', 'E', 'I', 'O', 'U'].includes(letter.toUpperCase());
  }, []);

  // CALCOLO COSTO LETTERA: Determina costo con fallback locale
  const getLetterCost = useCallback((letter) => {
    // Utilizza costi server se disponibili
    if (costsLoaded && letterCosts[letter.toUpperCase()]) {
      return letterCosts[letter.toUpperCase()].cost;
    }
    
    // FALLBACK COSTI: Costi locali se API non disponibile
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const costs = {
      5: ['T', 'N', 'H', 'S'],      // Consonanti frequenti
      4: ['R', 'L', 'D', 'C'],      // Consonanti comuni
      3: ['M', 'W', 'Y', 'F'],      // Consonanti medie
      2: ['G', 'P', 'B', 'V'],      // Consonanti meno frequenti
      1: ['K', 'J', 'X', 'Q', 'Z']  // Consonanti rare
    };
    
    const upper = letter.toUpperCase();
    if (vowels.has(upper)) return 10;  // Vocali costano 10 monete
    
    // Ricerca costo consonante in tabella
    for (const [cost, letters] of Object.entries(costs)) {
      if (letters.includes(upper)) return Number(cost);
    }
    return 5; // Costo default consonanti non classificate
  }, [costsLoaded, letterCosts]);

  // ===============================
  // FUNZIONI UTILITA TEMPO
  // ===============================

  // FORMATTAZIONE TEMPO: Converte millisecondi in formato mm:ss
  const formatTime = useCallback((ms) => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ===============================
  // FUNZIONI FEEDBACK SISTEMA
  // ===============================

  // DISPLAY FEEDBACK: Mostra messaggi tipizzati all'utente
  const showFeedback = useCallback((type, message, details = '', autoHide = true, timerWarning = false, gameEndType = null) => {
    console.log(`[DEBUG] showFeedback chiamato:`, { type, message, details, autoHide, timerWarning, gameEndType });
    console.trace('[DEBUG] Stack trace showFeedback');
    
    // Protezione: non sovrascrive feedback abandoned già attivo
    setFeedbackState(prev => {
      if (prev.gameEndType === 'abandoned' && prev.isVisible && !prev.autoHide) {
        console.log('🚫 [DEBUG] Prevented overwriting abandoned feedback');
        return prev; // Mantiene il feedback di abbandono esistente
      }
      
      return {
        type,                       // Tipo messaggio
        message,                    // Testo principale
        details,                    // Dettagli aggiuntivi
        isVisible: true,            // Abilita visibilità
        autoHide,                   // Auto-nascondimento attivo
        timerWarning,               // Flag avviso timer
        gameEndType                 // Tipo conclusione gioco
      };
    });
    
    // AUTO-HIDE: Nascondimento automatico dopo 4 secondi solo se richiesto
    if (autoHide) {
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, isVisible: false }));
      }, 4000);
    }
  }, []);

  // ===============================
  // FUNZIONI ANIMAZIONI
  // ===============================

  // ANIMAZIONE LETTERA: Trigger animazione risultato tentativo lettera
  const triggerLetterAnimation = useCallback((letter, isHit) => {
    setAnimationState(prev => ({
      ...prev,
      lastGuessedLetter: letter,            // Lettera da animare
      letterResult: isHit ? 'hit' : 'miss', // Risultato per styling
      showLetterAnimation: true             // Attiva animazione
    }));
    
    // RESET ANIMAZIONE: Cleanup automatico dopo 2 secondi
    setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        showLetterAnimation: false,
        lastGuessedLetter: '',
        letterResult: ''
      }));
    }, 2000);
  }, []);

  // ANIMAZIONE FINE GIOCO: Trigger animazione conclusione partita
  const triggerGameEndAnimation = useCallback((endType) => {
    setAnimationState(prev => ({
      ...prev,
      gameEndAnimation: endType,    // Tipo fine gioco per styling
      showGameEndAnimation: true    // Attiva animazione finale
    }));
  }, []);

  // SEZIONE: FUNZIONI DI RESET
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Reset completo dello stato di gioco
   * 
   * Ripristina tutti gli stati agli valori iniziali per iniziare una nuova partita:
   * - gameState: stato di gioco principale con dati fase reset
   * - feedbackState: messaggi e notifiche cancellati
   * - animationState: animazioni disattivate
   * 
   * Utilizzato quando:
   * - L'utente avvia una nuova partita
   * - Si ritorna alla pagina principale 
   * - Si verifica un errore critico che richiede reset completo
   */
  const resetGameState = useCallback(() => {
    // Reset stato principale del gioco
    setGameState({
      status: 'loading',        // Stato iniziale di caricamento
      phraseLength: 0,          // Lunghezza frase da determinare
      spaces: [],               // Posizioni spazi vuoti
      revealed: [],             // Lettere rivelate per posizione
      revealedLetters: {},      // Mappa lettere scoperte
      hasUsedVowel: false,      // Flag uso vocali reset
      timeLeft: 0,              // Timer ripristinato
      phrase: null,             // Frase cancellata
      gameId: null              // ID partita cancellato
    });
    
    // Reset sistema feedback e notifiche
    setFeedbackState({
      type: '',                 // Tipo messaggio vuoto
      message: '',              // Messaggio principale vuoto
      details: '',              // Dettagli aggiuntivi vuoti
      isVisible: false,         // Nasconde feedback
      autoHide: true,           // Ripristina auto-hide
      timerWarning: false,      // Cancella warning timer
      gameEndType: null         // Reset tipo fine gioco
    });
    
    // Reset sistema animazioni
    setAnimationState({
      lastGuessedLetter: '',    // Ultima lettera cancellata
      letterResult: '',         // Risultato lettera vuoto
      showLetterAnimation: false, // Disattiva animazione lettera
      gameEndAnimation: '',     // Tipo animazione fine vuoto
      showGameEndAnimation: false // Disattiva animazione finale
    });
  }, []);

  // SEZIONE: OGGETTO DI RITORNO
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * RETURN OBJECT: Esportazione di tutti gli stati e funzioni
   * 
   * Questo hook centralizzato fornisce:
   * 
   * STATI PRINCIPALI:
   * - gameState/setGameState: Stato gioco principale (frase, progress, timer)
   * - feedbackState/setFeedbackState: Sistema messaggi e notifiche
   * - animationState/setAnimationState: Controllo animazioni lettere/fine gioco
   * - letterCosts/setLetterCosts: Costi lettere dinamici dal server
   * - costsLoaded/setCostsLoaded: Flag caricamento costi completato
   * 
   * FUNZIONI UTILITY:
   * - isVowel: Controlla se lettera è vocale (a,e,i,o,u)
   * - getLetterCost: Calcola costo lettera con fallback sicuri
   * - formatTime: Formatta tempo rimanente in mm:ss
   * 
   * FUNZIONI CONTROLLO:
   * - showFeedback: Gestisce visualizzazione messaggi con auto-hide
   * - triggerLetterAnimation: Attiva animazione risultato lettera
   * - triggerGameEndAnimation: Attiva animazione fine partita
   * - resetGameState: Reset completo per nuova partita
   * 
   * Utilizzato da Game.jsx e GuestGame.jsx per logica condivisa
   */
  return {
    // STATI PRINCIPALI - Gestione completa del gioco
    gameState,              // Stato principale gioco (letture/scritture)
    setGameState,           // Setter stato gioco (aggiornamenti)
    feedbackState,          // Stato sistema feedback (messaggi)
    setFeedbackState,       // Setter feedback (notifiche)
    animationState,         // Stato animazioni (effetti)
    setAnimationState,      // Setter animazioni (controlli)
    letterCosts,            // Costi lettere dal server (dinamici)
    setLetterCosts,         // Setter costi (aggiornamenti server)
    costsLoaded,            // Flag caricamento costi (boolean)
    setCostsLoaded,         // Setter caricamento (stato pronto)
    
    // FUNZIONI UTILITY - Logica riutilizzabile
    isVowel,               // Controllo vocali (a,e,i,o,u)
    getLetterCost,         // Calcolo costo con fallback
    formatTime,            // Formattazione tempo mm:ss
    
    // FUNZIONI CONTROLLO - Gestione stato e feedback
    showFeedback,          // Mostra messaggi con auto-hide
    triggerLetterAnimation, // Animazione risultato lettera
    triggerGameEndAnimation, // Animazione fine partita
    resetGameState         // Reset completo stati
  };
};

export default useGameLogic;
