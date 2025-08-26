import { useState, useEffect, useCallback } from 'react';
import './Game.css';

const Game = ({ gameId, onGameEnd, user, setUser }) => {
  // Stati principali del gioco
  const [gameState, setGameState] = useState({
    status: 'loading',
    phraseLength: 0,
    spaces: [],
    revealed: [], // Indici delle posizioni rivelate
    revealedLetters: {}, // Mappa posizione -> lettera (dal backend)
    hasUsedVowel: false,
    timeLeft: 0,
    phrase: null // solo quando il gioco è finito
  });
  
  // Nuovo stato per tenere traccia delle lettere rivelate
  const [revealedLetters, setRevealedLetters] = useState(new Set());
  
  // Stato per i costi delle lettere dall'API
  const [letterCosts, setLetterCosts] = useState({});
  const [costsLoaded, setCostsLoaded] = useState(false);
  
  const [userInputs, setUserInputs] = useState({
    letterInput: '',
    phraseInput: '',
    isSubmittingLetter: false,
    isSubmittingPhrase: false
  });
  
  const [message, setMessage] = useState('');
  const [triedLetters, setTriedLetters] = useState(new Set());
  
  // Stati per feedback e animazioni
  const [loadingStates, setLoadingStates] = useState({
    loadingGame: true,
    submittingLetter: false,
    submittingPhrase: false,
    syncingWithServer: false
  });
  
  const [feedbackState, setFeedbackState] = useState({
    type: '', // 'success', 'error', 'info', 'warning'
    message: '',
    details: '',
    isVisible: false,
    autoHide: true,
    isGameEnd: false,
    isTimeWarning: false
  });
  
  const [animationState, setAnimationState] = useState({
    lastGuessedLetter: '',
    letterResult: '', // 'hit', 'miss', ''
    showLetterAnimation: false,
    gameEndAnimation: '', // 'won', 'lost', 'timeout', ''
    showGameEndAnimation: false
  });

  // Costi delle lettere basati sulla frequenza (come nel backend)
  const getLetterCost = useCallback((letter) => {
    if (costsLoaded && letterCosts[letter.toUpperCase()]) {
      return letterCosts[letter.toUpperCase()].cost;
    }
    
    // Fallback ai costi locali
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const costs = {
      5: ['T', 'N', 'H', 'S'],
      4: ['R', 'L', 'D', 'C'],
      3: ['M', 'W', 'Y', 'F'],
      2: ['G', 'P', 'B', 'V'],
      1: ['K', 'J', 'X', 'Q', 'Z']
    };
    
    const upper = letter.toUpperCase();
    if (vowels.has(upper)) return 10;
    
    for (const [cost, letters] of Object.entries(costs)) {
      if (letters.includes(upper)) return Number(cost);
    }
    return 5; // default
  }, [costsLoaded, letterCosts]);

  const isVowel = useCallback((letter) => {
    return ['A', 'E', 'I', 'O', 'U'].includes(letter.toUpperCase());
  }, []);

  // Gestione feedback messaggi
  const showFeedback = useCallback((type, message, details = '', autoHide = true, isGameEnd = false, isTimeWarning = false) => {
    setFeedbackState({
      type,
      message,
      details,
      isVisible: true,
      autoHide,
      isGameEnd,
      isTimeWarning
    });
    
    // Auto-hide dopo 4 secondi se richiesto (non per i banner di fine partita)
    if (autoHide && !isGameEnd) {
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, isVisible: false }));
      }, 4000);
    }
  }, []);

  // Gestione animazioni lettere
  const triggerLetterAnimation = useCallback((letter, isHit) => {
    setAnimationState(prev => ({
      ...prev,
      lastGuessedLetter: letter,
      letterResult: isHit ? 'hit' : 'miss',
      showLetterAnimation: true
    }));
    
    // Reset animazione dopo 2 secondi
    setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        showLetterAnimation: false,
        lastGuessedLetter: '',
        letterResult: ''
      }));
    }, 2000);
  }, []);

  // Gestione animazioni fine gioco
  const triggerGameEndAnimation = useCallback((endType) => {
    setAnimationState(prev => ({
      ...prev,
      gameEndAnimation: endType,
      showGameEndAnimation: true
    }));
  }, []);

  // Loading states helpers
  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Carica costi lettere dall'API
  const loadLetterCosts = useCallback(async () => {
    try {
      setLoading('syncingWithServer', true);
      const response = await fetch('http://localhost:3001/api/meta/letter-costs', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const costsMap = {};
        data.letters.forEach(letterInfo => {
          costsMap[letterInfo.letter] = {
            cost: letterInfo.baseCost,
            type: letterInfo.type
          };
        });
        setLetterCosts(costsMap);
        setCostsLoaded(true);
        showFeedback('success', 'Costi lettere caricati', 'Sistema di costi sincronizzato con il server');
      } else {
        throw new Error('Errore nel caricamento costi');
      }
    } catch (error) {
      console.error('Errore nel caricamento costi lettere:', error);
      showFeedback('warning', 'Costi di fallback attivati', 'Utilizzando costi predefiniti per problemi di connessione');
      // Fallback ai costi locali se l'API fallisce
      setCostsLoaded(true);
    } finally {
      setLoading('syncingWithServer', false);
    }
  }, [showFeedback, setLoading]);

  // Carica stato iniziale del gioco
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
      
      setGameState({
        status: data.status,
        phraseLength: data.phraseLength,
        spaces: data.spaces || [],
        revealed: data.revealed || [],
        revealedLetters: data.revealedLetters || {},
        hasUsedVowel: data.hasUsedVowel || false,
        timeLeft: data.timeLeft || 0,
        phrase: data.phrase || null
      });
      
      // Aggiorna le monete dell'utente
      if (data.coins !== undefined) {
        setUser(prev => ({ ...prev, coins: data.coins }));
      }
      
      // Carica lettere già tentate dal server (simulato per ora)
      // In una implementazione completa, il server dovrebbe fornire anche questo dato
      
      // Feedback di successo
      if (data.status === 'running') {
        showFeedback('info', 'Gioco caricato', `Tempo rimanente: ${Math.ceil(data.timeLeft / 1000)}s`);
      } else if (data.status === 'won') {
        showFeedback('success', 'Partita completata!', 'Hai indovinato la frase', false, true);
        triggerGameEndAnimation('won');
      } else if (data.status === 'timeout') {
        showFeedback('error', 'Tempo scaduto!', `La frase era: "${data.phrase}"`, false, true);
        triggerGameEndAnimation('timeout');
      } else if (data.status === 'abandoned') {
        showFeedback('warning', 'Partita abbandonata', `La frase era: "${data.phrase}"`, false, true);
        triggerGameEndAnimation('lost');
      }
      
    } catch (error) {
      console.error('Errore nel caricamento del gioco:', error);
      showFeedback('error', 'Errore di caricamento', error.message, false);
    } finally {
      setLoading('loadingGame', false);
    }
  }, [gameId, showFeedback, setLoading, triggerGameEndAnimation]);

  // Timer countdown con controllo di sincronizzazione
  useEffect(() => {
    if (gameState.status !== 'running' || gameState.timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = Math.max(0, prev.timeLeft - 1000);
        
        // Avviso quando il tempo sta per scadere
        if (newTimeLeft <= 10000 && newTimeLeft > 5000 && prev.timeLeft > 10000) {
          showFeedback('warning', '⏰ Tempo in esaurimento!', 
            'Meno di 10 secondi rimasti. Affretta la decisione!', true, false, true);
        }
        
        if (newTimeLeft <= 5000 && newTimeLeft > 0 && prev.timeLeft > 5000) {
          showFeedback('error', '🚨 ULTIMI 5 SECONDI!', 
            'Il tempo sta per scadere!', true, false, true);
        }
        
        if (newTimeLeft === 0) {
          // Il timer è scaduto, ricarichiamo lo stato (il backend gestirà il timeout)
          showFeedback('error', 'Tempo scaduto!', 'La partita è terminata', false, true);
          triggerGameEndAnimation('timeout');
          setTimeout(loadGameState, 100);
        }
        
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeLeft, loadGameState, showFeedback, triggerGameEndAnimation]);

  // Sincronizzazione periodica con il server (ogni 30 secondi)
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
          
          // Controlla se lo stato è cambiato lato server
          if (data.status !== gameState.status) {
            showFeedback('info', 'Stato sincronizzato', 
              'Il gioco è stato aggiornato dal server');
            await loadGameState();
          } else {
            // Aggiorna solo il tempo e le monete se diversi
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
    }, 30000); // Ogni 30 secondi
    
    return () => clearInterval(syncInterval);
  }, [gameId, gameState.status, gameState.timeLeft, user.coins, loadGameState, showFeedback, setLoading]);

  // Caricamento iniziale
  useEffect(() => {
    loadGameState();
    loadLetterCosts();
  }, [loadGameState, loadLetterCosts]);

  // Funzione per tentare una lettera (da input di testo)
  const guessLetter = async () => {
    const letter = userInputs.letterInput.trim().toUpperCase();
    
    if (!letter || !/^[A-Z]$/.test(letter)) {
      showFeedback('warning', 'Lettera non valida', 'Inserisci una singola lettera (A-Z)');
      return;
    }
    
    if (triedLetters.has(letter)) {
      showFeedback('warning', 'Lettera già tentata', `La lettera "${letter}" è già stata provata`);
      return;
    }
    
    if (isVowel(letter) && gameState.hasUsedVowel) {
      showFeedback('error', 'Limite vocali raggiunto', 'Puoi usare solo una vocale per partita!');
      return;
    }
    
    const cost = getLetterCost(letter);
    if (user.coins < cost) {
      showFeedback('error', 'Monete insufficienti', `Serve ${cost} monete, ma ne hai solo ${user.coins}`);
      return;
    }
    
    setUserInputs(prev => ({ ...prev, isSubmittingLetter: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ letter })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel tentativo');
      }
      
      const data = await response.json();
      
      // Aggiorna lo stato locale
      setTriedLetters(prev => new Set([...prev, letter]));
      
      // Aggiorna le lettere rivelate nella griglia usando i dati dal backend
      setGameState(prev => ({
        ...prev,
        revealed: data.revealed || prev.revealed,
        revealedLetters: data.revealedLetters || prev.revealedLetters,
        hasUsedVowel: data.hasUsedVowel,
        timeLeft: data.timeLeft
      }));
      
      // Aggiorna monete utente
      setUser(prev => ({ ...prev, coins: data.coins }));
      
      // Feedback e animazioni
      const isHit = data.revealedIndexes && data.revealedIndexes.length > 0;
      
      if (isHit) {
        showFeedback('success', `Bene! Lettera trovata`, 
          `"${letter}" è presente ${data.revealedIndexes.length} volta/e. Costo: ${data.costApplied} monete`);
        triggerLetterAnimation(letter, true);
      } else {
        showFeedback('error', `Lettera non presente`, 
          `"${letter}" non c'è nella frase. Costo raddoppiato: ${data.costApplied} monete`);
        triggerLetterAnimation(letter, false);
      }
      
      setUserInputs(prev => ({ ...prev, letterInput: '' }));
      
    } catch (error) {
      console.error('Errore nel tentativo lettera:', error);
      showFeedback('error', 'Errore di connessione', 
        `Impossibile inviare la lettera: ${error.message}`);
    } finally {
      setUserInputs(prev => ({ ...prev, isSubmittingLetter: false }));
    }
  };

  // Funzione per gestire il click su una lettera dalla tastiera virtuale
  const handleLetterClick = async (letter) => {
    if (!letter || triedLetters.has(letter)) {
      return; // Lettera già tentata
    }
    
    if (isVowel(letter) && gameState.hasUsedVowel) {
      setMessage('Puoi usare solo una vocale per partita!');
      return;
    }
    
    const cost = getLetterCost(letter);
    if (user.coins < cost) {
      setMessage(`Non hai abbastanza monete! Costo: ${cost}`);
      return;
    }
    
    // Usa la stessa logica di guessLetter ma con la lettera passata
    setUserInputs(prev => ({ ...prev, isSubmittingLetter: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ letter })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel tentativo');
      }
      
      const data = await response.json();
      
      // Aggiorna lo stato locale
      setTriedLetters(prev => new Set([...prev, letter]));
      
      // Aggiorna le lettere rivelate nella griglia usando i dati dal backend
      setGameState(prev => ({
        ...prev,
        revealed: data.revealed || prev.revealed, // Usa l'array completo dal backend
        revealedLetters: data.revealedLetters || prev.revealedLetters, // Usa l'oggetto completo dal backend
        hasUsedVowel: data.hasUsedVowel,
        timeLeft: data.timeLeft
      }));
      
      // Aggiorna monete utente
      setUser(prev => ({ ...prev, coins: data.coins }));
      
      // Messaggio di feedback
      if (data.revealedIndexes && data.revealedIndexes.length > 0) {
        setMessage(`Bene! La lettera "${letter}" è presente (${data.revealedIndexes.length} volte). Costo: ${data.costApplied} monete`);
      } else {
        setMessage(`La lettera "${letter}" non è presente. Costo: ${data.costApplied} monete`);
      }
      
    } catch (error) {
      console.error('Errore nel tentativo lettera:', error);
      setMessage(`Errore: ${error.message}`);
    } finally {
      setUserInputs(prev => ({ ...prev, isSubmittingLetter: false }));
    }
  };

  // Funzione per tentare la frase completa
  const guessPhrase = async () => {
    const attempt = userInputs.phraseInput.trim();
    
    if (!attempt) {
      showFeedback('warning', 'Frase mancante', 'Inserisci la frase completa prima di tentarla');
      return;
    }
    
    if (attempt.length < 3) {
      showFeedback('warning', 'Frase troppo corta', 'La frase deve essere di almeno 3 caratteri');
      return;
    }
    
    setUserInputs(prev => ({ ...prev, isSubmittingPhrase: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}/guess-phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ attempt })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel tentativo');
      }
      
      const data = await response.json();
      
      if (data.result === 'win') {
        setGameState(prev => ({
          ...prev,
          status: 'won',
          phrase: data.phrase,
          timeLeft: 0
        }));
        setUser(prev => ({ ...prev, coins: prev.coins + 100 }));
        
        showFeedback('success', '🎉 VITTORIA! 🎉', 
          `Hai indovinato la frase: "${data.phrase}". Bonus: +100 monete!`, false);
        triggerGameEndAnimation('won');
        
        // NON facciamo più il redirect automatico
        // setTimeout(() => onGameEnd('won'), 3000);
      } else if (data.result === 'wrong') {
        showFeedback('error', 'Frase sbagliata', 
          `"${attempt}" non è la frase corretta. Riprova o continua con le lettere!`);
        
        setGameState(prev => ({
          ...prev,
          timeLeft: data.timeLeft
        }));
        
        if (data.coins !== undefined) {
          setUser(prev => ({ ...prev, coins: data.coins }));
        }
      }
      
      setUserInputs(prev => ({ ...prev, phraseInput: '' }));
      
    } catch (error) {
      console.error('Errore nel tentativo frase:', error);
      showFeedback('error', 'Errore di connessione', 
        `Impossibile inviare la frase: ${error.message}`);
    } finally {
      setUserInputs(prev => ({ ...prev, isSubmittingPhrase: false }));
    }
  };

  // Funzione per abbandonare
  const abandonGame = async () => {
    if (!window.confirm('Sei sicuro di voler abbandonare? Non ci saranno penalità.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}/abandon`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'abbandono');
      }
      
      const data = await response.json();
      setGameState(prev => ({
        ...prev,
        status: 'abandoned',
        phrase: data.phrase,
        timeLeft: 0
      }));
      
      showFeedback('warning', 'Partita abbandonata', 'Hai deciso di abbandonare la partita', false, true);
      triggerGameEndAnimation('lost');
      // Rimuoviamo il timeout automatico - ora l'utente controlla
      
    } catch (error) {
      console.error('Errore nell\'abbandono:', error);
      showFeedback('error', 'Errore nell\'abbandono', error.message);
    }
  };

  // Renderizza griglia lettere avanzata
  const renderPhraseGrid = () => {
    if (gameState.status === 'loading') {
      return <div className="phrase-grid loading">Caricamento...</div>;
    }
    
    // Se il gioco è finito, mostra la frase completa
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
    
    // Durante il gioco, mostra solo lettere rivelate e spazi (anti-cheat)
    const cells = [];
    for (let i = 0; i < gameState.phraseLength; i++) {
      const isSpace = gameState.spaces.includes(i);
      const isRevealed = gameState.revealed.includes(i);
      
      let cellContent = '';
      let cellClass = `phrase-cell ${isSpace ? 'space' : ''}`;
      
      if (isSpace) {
        // Gli spazi sono sempre visibili
        cellContent = '';
        cellClass = 'phrase-cell space';
      } else if (isRevealed) {
        // Per le lettere rivelate, utilizziamo i dati sicuri dal backend
        const revealedLetter = getRevealedLetterAtPosition(i);
        if (revealedLetter) {
          cellContent = revealedLetter;
          cellClass = 'phrase-cell revealed';
        } else {
          // Non dovrebbe succedere se il backend è consistente
          cellContent = '●';
          cellClass = 'phrase-cell revealed';
        }
      } else {
        // Lettera non ancora rivelata
        cellContent = '';
        cellClass = 'phrase-cell';
      }
      
      cells.push(
        <div key={i} className={cellClass}>
          {cellContent}
        </div>
      );
    }
    
    return <div className="phrase-grid">{cells}</div>;
  };

  // Funzione helper per ottenere la lettera rivelata in una specifica posizione
  const getRevealedLetterAtPosition = (position) => {
    // Ora utilizziamo i dati sicuri dal backend
    return gameState.revealedLetters[position] || null;
  };

  // Formato tempo
  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Loading principale
  if (loadingStates.loadingGame) {
    return (
      <div className="game-container loading">
        <div className="loading-spinner"></div>
        <h3>Caricamento gioco...</h3>
        <p>Sincronizzazione con il server</p>
      </div>
    );
  }

  const isGameRunning = gameState.status === 'running';
  const isGameEnded = ['won', 'timeout', 'abandoned'].includes(gameState.status);

  return (
    <div className={`game-container ${animationState.showGameEndAnimation ? `game-end-${animationState.gameEndAnimation}` : ''}`}>
      {/* Overlay di sincronizzazione */}
      {loadingStates.syncingWithServer && (
        <div className="sync-overlay">
          <div className="sync-spinner"></div>
          <span>Sincronizzazione...</span>
        </div>
      )}
      
      {/* Sistema di feedback avanzato */}
      {feedbackState.isVisible && !feedbackState.isGameEnd && (
        <div className={`feedback-banner ${feedbackState.type} ${feedbackState.isTimeWarning ? 'time-warning' : ''}`}>
          <div className="feedback-content">
            <div className="feedback-header">
              <span className="feedback-icon">
                {feedbackState.type === 'success' && '✅'}
                {feedbackState.type === 'error' && '❌'}
                {feedbackState.type === 'warning' && '⚠️'}
                {feedbackState.type === 'info' && 'ℹ️'}
              </span>
              <strong>{feedbackState.message}</strong>
              {feedbackState.autoHide && (
                <button 
                  className="feedback-close"
                  onClick={() => setFeedbackState(prev => ({ ...prev, isVisible: false }))}
                >
                  ×
                </button>
              )}
            </div>
            {feedbackState.details && (
              <div className="feedback-details">{feedbackState.details}</div>
            )}
          </div>
        </div>
      )}

      {/* Banner di fine gioco separato - VERSION SEMPLIFICATA PER DEBUG */}
      {feedbackState.isVisible && feedbackState.isGameEnd && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '2px solid #ff6b6b',
          textAlign: 'center',
          zIndex: 9999,
          maxWidth: '400px',
          width: '90vw',
          maxHeight: '300px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
            {feedbackState.type === 'success' && '🎉'}
            {feedbackState.type === 'error' && '⏰'}
            {feedbackState.type === 'warning' && '⚠️'}
            {feedbackState.type === 'info' && 'ℹ️'}
          </div>
          <h2 style={{fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold'}}>
            {feedbackState.message}
          </h2>
          {feedbackState.details && (
            <p style={{fontSize: '1.1rem', lineHeight: '1.4', marginBottom: '2rem'}}>
              {feedbackState.details}
      {/* Banner di fine gioco separato - VERSION SEMPLIFICATA PER DEBUG */}
      {feedbackState.isVisible && feedbackState.isGameEnd && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '2px solid #ff6b6b',
          textAlign: 'center',
          zIndex: 9999,
          maxWidth: '400px',
          width: '90vw',
          maxHeight: '300px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
            {feedbackState.type === 'success' && '🎉'}
            {feedbackState.type === 'error' && '⏰'}
            {feedbackState.type === 'warning' && '⚠️'}
            {feedbackState.type === 'info' && 'ℹ️'}
          </div>
          <h2 style={{fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold'}}>
            {feedbackState.message}
          </h2>
          {feedbackState.details && (
            <p style={{fontSize: '1.1rem', lineHeight: '1.4', marginBottom: '2rem'}}>
              {feedbackState.details}
            </p>
          )}
          {!feedbackState.autoHide && (
            <button 
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: 'transparent',
                border: '2px solid white',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setFeedbackState(prev => ({ ...prev, isVisible: false }))}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Chiudi
            </button>
          )}
        </div>
      )}
      
      {/* Animazione lettera tentata */}
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

      {/* Header con info gioco */}
      <div className="game-header">
        <div className="game-info">
          <div className="timer">
            ⏱️ {formatTime(gameState.timeLeft)}
          </div>
          <div className="coins">
            💰 {user.coins} monete
          </div>
          <div className="vowel-status">
            {gameState.hasUsedVowel ? '✅ Vocale usata' : '🔤 Vocale disponibile'}
          </div>
        </div>
      </div>

      {/* Griglia frase */}
      <div className="phrase-section">
        <h3>
          {gameState.status === 'running' ? 'Indovina la frase:' : 'Risultato Finale:'}
          <span className="phrase-progress">
            {gameState.status === 'running' && 
              ` (${gameState.revealed.length}/${gameState.phraseLength - gameState.spaces.length} lettere rivelate)`
            }
          </span>
        </h3>
        
        {/* Barra progresso */}
        {gameState.status === 'running' && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(gameState.revealed.length / Math.max(1, gameState.phraseLength - gameState.spaces.length)) * 100}%`
              }}
            ></div>
          </div>
        )}
        
        {renderPhraseGrid()}
        
        {/* Legend */}
        {gameState.status === 'running' && (
          <div className="grid-legend">
            <div className="legend-item">
              <div className="legend-cell empty"></div>
              <span>Lettera nascosta</span>
            </div>
            <div className="legend-item">
              <div className="legend-cell revealed">A</div>
              <span>Lettera rivelata</span>
            </div>
            <div className="legend-item">
              <div className="legend-cell space"></div>
              <span>Spazio</span>
            </div>
          </div>
        )}
      </div>

      {/* Messaggio feedback */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* Controlli gioco */}
      {isGameRunning && (
        <div className="game-section">
          {/* Tastiera virtuale interattiva */}
          <div className="virtual-keyboard">
            <h4>Clicca su una lettera per tentarla:</h4>
            
            {/* Vocali */}
            <div className="keyboard-section vowels">
              <h5>Vocali (10 monete {gameState.hasUsedVowel ? '- già usata' : '- solo 1 per partita'})</h5>
              <div className="keyboard-row">
                {['A', 'E', 'I', 'O', 'U'].map(letter => {
                  const cost = getLetterCost(letter);
                  const tried = triedLetters.has(letter);
                  const disabled = tried || (isVowel(letter) && gameState.hasUsedVowel) || (user.coins < cost);
                  const cannotAfford = user.coins < cost;
                  
                  return (
                    <button
                      key={letter}
                      className={`keyboard-key vowel ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''} ${cannotAfford ? 'no-coins' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                      disabled={disabled || userInputs.isSubmittingLetter}
                      title={`${letter} - ${cost} monete${tried ? ' (già tentata)' : disabled ? ' (disabilitata)' : ''}`}
                    >
                      <span className="letter">{letter}</span>
                      <span className="cost">{cost}</span>
                    </button>
                  );
                })}
              </div>
              {gameState.hasUsedVowel && (
                <div className="vowel-used-notice">✓ Vocale già utilizzata in questa partita</div>
              )}
            </div>
            
            {/* Consonanti per costo */}
            {[
              { cost: 5, letters: ['T', 'N', 'H', 'S'], label: 'Consonanti frequenti (5 monete)' },
              { cost: 4, letters: ['R', 'L', 'D', 'C'], label: 'Consonanti comuni (4 monete)' },
              { cost: 3, letters: ['M', 'W', 'Y', 'F'], label: 'Consonanti medie (3 monete)' },
              { cost: 2, letters: ['G', 'P', 'B', 'V'], label: 'Consonanti meno frequenti (2 monete)' },
              { cost: 1, letters: ['K', 'J', 'X', 'Q', 'Z'], label: 'Consonanti rare (1 moneta)' }
            ].map(group => (
              <div key={group.cost} className="keyboard-section consonants">
                <h5>{group.label}</h5>
                <div className="keyboard-row">
                  {group.letters.map(letter => {
                    const cost = getLetterCost(letter);
                    const tried = triedLetters.has(letter);
                    const disabled = tried || (user.coins < cost);
                    const cannotAfford = user.coins < cost;
                    
                    return (
                      <button
                        key={letter}
                        className={`keyboard-key consonant cost-${cost} ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''} ${cannotAfford ? 'no-coins' : ''}`}
                        onClick={() => handleLetterClick(letter)}
                        disabled={disabled || userInputs.isSubmittingLetter}
                        title={`${letter} - ${cost} monete${tried ? ' (già tentata)' : cannotAfford ? ' (monete insufficienti)' : ''}`}
                      >
                        <span className="letter">{letter}</span>
                        <span className="cost">{cost}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="keyboard-info">
              <div className="cost-warning">
                ⚠️ <strong>Ricorda:</strong> Se la lettera non è presente nella frase, il costo viene raddoppiato!
              </div>
              <div className="coins-available">
                💰 Monete disponibili: <strong>{user.coins}</strong>
              </div>
            </div>
          </div>
        
          <div className="game-controls">
          {/* Input lettera */}
          <div className="letter-input-section">
            <h4>Indovina una lettera:</h4>
            <div className="input-group">
              <input
                type="text"
                value={userInputs.letterInput}
                onChange={(e) => setUserInputs(prev => ({ 
                  ...prev, 
                  letterInput: e.target.value.toUpperCase().slice(-1) 
                }))}
                placeholder="Lettera (A-Z)"
                maxLength={1}
                className="letter-input"
                disabled={userInputs.isSubmittingLetter}
                onKeyPress={(e) => e.key === 'Enter' && guessLetter()}
              />
              <button 
                onClick={guessLetter}
                disabled={userInputs.isSubmittingLetter || !userInputs.letterInput.trim()}
                className="guess-letter-btn"
              >
                {userInputs.isSubmittingLetter ? 'Tentativo...' : 'Prova Lettera'}
              </button>
            </div>
            
            {/* Anteprima costo */}
            {userInputs.letterInput && (
              <div className="cost-preview">
                Costo: {getLetterCost(userInputs.letterInput)} monete
                {isVowel(userInputs.letterInput) && !gameState.hasUsedVowel && (
                  <span className="vowel-warning"> (Unica vocale disponibile!)</span>
                )}
              </div>
            )}
          </div>

          {/* Input frase completa */}
          <div className="phrase-input-section">
            <h4>O indovina la frase completa:</h4>
            <div className="input-group">
              <input
                type="text"
                value={userInputs.phraseInput}
                onChange={(e) => setUserInputs(prev => ({ 
                  ...prev, 
                  phraseInput: e.target.value 
                }))}
                placeholder="Scrivi la frase completa..."
                className="phrase-input"
                disabled={userInputs.isSubmittingPhrase}
                onKeyPress={(e) => e.key === 'Enter' && guessPhrase()}
              />
              <button 
                onClick={guessPhrase}
                disabled={userInputs.isSubmittingPhrase || !userInputs.phraseInput.trim()}
                className="guess-phrase-btn"
              >
                {userInputs.isSubmittingPhrase ? 'Tentativo...' : 'Prova Frase (+100 💰)'}
              </button>
            </div>
          </div>

          {/* Bottone abbandono */}
          <div className="abandon-section">
            <button onClick={abandonGame} className="abandon-btn">
              🏃‍♂️ Abbandona (senza penalità)
            </button>
          </div>
          </div> {/* Chiusura game-controls */}
        </div>
      )}

      {/* Risultato finale */}
      {isGameEnded && (
        <div className="game-result">
          <h3>Gioco terminato!</h3>
          {gameState.phrase && (
            <div className="final-phrase">
              <strong>La frase era:</strong> "{gameState.phrase}"
            </div>
          )}
          <div className="result-status">
            Stato: {gameState.status === 'won' ? '🎉 Vittoria!' : 
                   gameState.status === 'timeout' ? '⏰ Tempo scaduto' : 
                   '🏃‍♂️ Abbandonato'}
          </div>
        </div>
      )}

      {/* Lettere tentate */}
      {triedLetters.size > 0 && (
        <div className="tried-letters">
          <h4>Lettere tentate:</h4>
          <div className="letters-list">
            {Array.from(triedLetters).sort().map(letter => (
              <span key={letter} className="tried-letter">{letter}</span>
            ))}
          </div>
        </div>
      )}

      {/* Schermata finale - appare sopra tutto quando il gioco è finito */}
      {isGameEnded && (
        <div className="game-end-overlay">
          <div className="game-end-modal">
            <div className={`game-end-header ${gameState.status}`}>
              {gameState.status === 'won' && (
                <>
                  <div className="end-icon">🏆</div>
                  <h2>VITTORIA!</h2>
                  <div className="end-subtitle">Complimenti, hai indovinato la frase!</div>
                </>
              )}
              {gameState.status === 'timeout' && (
                <>
                  <div className="end-icon">⏰</div>
                  <h2>TEMPO SCADUTO</h2>
                  <div className="end-subtitle">Il tempo è finito prima che riuscissi a indovinare</div>
                </>
              )}
              {gameState.status === 'abandoned' && (
                <>
                  <div className="end-icon">🏳️</div>
                  <h2>GIOCO ABBANDONATO</h2>
                  <div className="end-subtitle">Hai deciso di abbandonare la partita</div>
                </>
              )}
            </div>
            
            <div className="game-end-content">
              <div className="final-phrase">
                <h3>La frase era:</h3>
                <div className="phrase-reveal">"{gameState.phrase}"</div>
              </div>
              
              <div className="game-stats">
                {gameState.status === 'won' && (
                  <div className="stat-item success">
                    <span className="stat-icon">💰</span>
                    <span className="stat-text">+100 monete bonus!</span>
                  </div>
                )}
                
                <div className="stat-item">
                  <span className="stat-icon">🔤</span>
                  <span className="stat-text">Lettere tentate: {triedLetters.size}</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-text">
                    Tempo: {gameState.status === 'won' ? 'Completato in tempo' : 'Scaduto'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="game-end-actions">
              <button 
                className="back-to-home-btn"
                onClick={() => onGameEnd(gameState.status)}
              >
                <span className="btn-icon">🏠</span>
                Torna alla Home
              </button>
              
              <button 
                className="new-game-btn"
                onClick={() => window.location.reload()}
              >
                <span className="btn-icon">🎮</span>
                Nuova Partita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;