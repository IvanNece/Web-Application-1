import { useState, useEffect, useCallback } from 'react';
import './Game.css';

const Game = ({ gameId, onGameEnd, user, setUser }) => {
  // Stati principali del gioco
  const [gameState, setGameState] = useState({
    status: 'loading',
    phraseLength: 0,
    spaces: [],
    revealed: [],
    hasUsedVowel: false,
    timeLeft: 0,
    phrase: null // solo quando il gioco è finito
  });
  
  const [userInputs, setUserInputs] = useState({
    letterInput: '',
    phraseInput: '',
    isSubmittingLetter: false,
    isSubmittingPhrase: false
  });
  
  const [message, setMessage] = useState('');
  const [triedLetters, setTriedLetters] = useState(new Set());

  // Costi delle lettere basati sulla frequenza (come nel backend)
  const getLetterCost = useCallback((letter) => {
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
  }, []);

  const isVowel = useCallback((letter) => {
    return ['A', 'E', 'I', 'O', 'U'].includes(letter.toUpperCase());
  }, []);

  // Carica stato iniziale del gioco
  const loadGameState = useCallback(async () => {
    try {
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
        hasUsedVowel: data.hasUsedVowel || false,
        timeLeft: data.timeLeft || 0,
        phrase: data.phrase || null
      });
      
      // Aggiorna le monete dell'utente
      if (data.coins !== undefined) {
        setUser(prev => ({ ...prev, coins: data.coins }));
      }
      
      // Per ora non abbiamo un endpoint specifico per le lettere tentate,
      // quindi manteniamo lo stato locale. In una implementazione completa
      // dovremmo avere un endpoint che restituisce anche le lettere già tentate.
      
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setMessage(`Errore: ${error.message}`);
    }
  }, [gameId, setUser]);

  // Timer countdown
  useEffect(() => {
    if (gameState.status !== 'running' || gameState.timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = Math.max(0, prev.timeLeft - 1000);
        if (newTimeLeft === 0) {
          // Il timer è scaduto, ricarichiamo lo stato (il backend gestirà il timeout)
          setTimeout(loadGameState, 100);
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeLeft, loadGameState]);

  // Caricamento iniziale
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Funzione per tentare una lettera
  const guessLetter = async () => {
    const letter = userInputs.letterInput.trim().toUpperCase();
    
    if (!letter || !/^[A-Z]$/.test(letter)) {
      setMessage('Inserisci una lettera valida (A-Z)');
      return;
    }
    
    if (triedLetters.has(letter)) {
      setMessage('Lettera già tentata!');
      return;
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
      setGameState(prev => ({
        ...prev,
        revealed: [...prev.revealed, ...data.revealedIndexes],
        hasUsedVowel: data.hasUsedVowel,
        timeLeft: data.timeLeft
      }));
      
      // Aggiorna monete utente
      setUser(prev => ({ ...prev, coins: data.coins }));
      
      // Messaggio di feedback
      if (data.revealedIndexes.length > 0) {
        setMessage(`Bene! La lettera "${letter}" è presente (${data.revealedIndexes.length} volte). Costo: ${data.costApplied} monete`);
      } else {
        setMessage(`La lettera "${letter}" non è presente. Costo: ${data.costApplied} monete`);
      }
      
      setUserInputs(prev => ({ ...prev, letterInput: '' }));
      
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
      setMessage('Inserisci la frase completa');
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
        setMessage('🎉 Complimenti! Hai vinto! +100 monete!');
        setTimeout(() => onGameEnd('won'), 2000);
      } else if (data.result === 'wrong') {
        setMessage('Frase sbagliata, riprova!');
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
      setMessage(`Errore: ${error.message}`);
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
      
      setMessage('Partita abbandonata');
      setTimeout(() => onGameEnd('abandoned'), 1500);
      
    } catch (error) {
      console.error('Errore nell\'abbandono:', error);
      setMessage(`Errore: ${error.message}`);
    }
  };

  // Gestione fine gioco per timeout o altri stati
  useEffect(() => {
    if (gameState.status === 'timeout') {
      setMessage('⏰ Tempo scaduto! -20 monete di penalità');
      setTimeout(() => onGameEnd('timeout'), 2000);
    } else if (gameState.status === 'won') {
      setMessage('🎉 Hai vinto! +100 monete!');
      setTimeout(() => onGameEnd('won'), 2000);
    }
  }, [gameState.status, onGameEnd]);

  // Renderizza griglia lettere
  const renderPhraseGrid = () => {
    if (gameState.status === 'loading') {
      return <div className="phrase-grid loading">Caricamento...</div>;
    }
    
    const cells = [];
    for (let i = 0; i < gameState.phraseLength; i++) {
      const isSpace = gameState.spaces.includes(i);
      const isRevealed = gameState.revealed.includes(i);
      
      cells.push(
        <div 
          key={i}
          className={`phrase-cell ${isSpace ? 'space' : ''} ${isRevealed ? 'revealed' : ''}`}
        >
          {isSpace ? '' : (isRevealed ? '•' : '')}
        </div>
      );
    }
    
    return <div className="phrase-grid">{cells}</div>;
  };

  // Formato tempo
  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (gameState.status === 'loading') {
    return <div className="game-container loading">Caricamento gioco...</div>;
  }

  const isGameRunning = gameState.status === 'running';
  const isGameEnded = ['won', 'timeout', 'abandoned'].includes(gameState.status);

  return (
    <div className="game-container">
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
        <h3>Indovina la frase:</h3>
        {renderPhraseGrid()}
      </div>

      {/* Messaggio feedback */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* Controlli gioco */}
      {isGameRunning && (
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
    </div>
  );
};

export default Game;