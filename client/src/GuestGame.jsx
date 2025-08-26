import { useState, useEffect, useCallback } from 'react';
import './Game.css';

function GuestGame({ onBackToHome }) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Messaggio come nel Game normale
  const [phraseGuess, setPhraseGuess] = useState('');
  const [letterInput, setLetterInput] = useState(''); // Input separato per lettere
  const [timeLeft, setTimeLeft] = useState(0);
  const [triedLetters, setTriedLetters] = useState(new Set());

  // Stato per feedback identico a Game.jsx
  const [feedbackState, setFeedbackState] = useState({
    type: '',
    message: '',
    details: '',
    isVisible: false,
    autoHide: true
  });

  // Stato per animazioni identico a Game.jsx
  const [animationState, setAnimationState] = useState({
    showGameEndAnimation: false,
    gameEndAnimation: '', // 'won', 'lost', 'timeout', ''
    letterResult: ''
  });

  // Gestione feedback messaggi identico a Game.jsx
  const showFeedback = useCallback((type, message, details = '', autoHide = true) => {
    setFeedbackState({
      type,
      message,
      details,
      isVisible: true,
      autoHide
    });
    
    if (autoHide) {
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, isVisible: false }));
      }, 4000);
    }
  }, []);

  // Gestione animazioni fine gioco identico a Game.jsx
  const triggerGameEndAnimation = useCallback((endType) => {
    setAnimationState(prev => ({
      ...prev,
      gameEndAnimation: endType,
      showGameEndAnimation: true
    }));
  }, []);

  // Funzione per creare un nuovo gioco guest - avvio automatico
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
        setGameState(data);
        setTimeLeft(data.timeLeft || 60);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nella creazione del gioco');
      }
    } catch (err) {
      setError('Errore di connessione: ' + err.message);
    }
    setLoading(false);
  }, []);

  // Avvia automaticamente il gioco al caricamento
  useEffect(() => {
    createGuestGame();
  }, [createGuestGame]);

  // Funzione per ottenere lo stato del gioco guest - con feedback identici a Game.jsx
  const fetchGuestGameState = useCallback(async (gameId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
        setTimeLeft(data.timeLeft || 0);
        
        // Feedback di stato identico a Game.jsx
        if (data.status === 'running') {
          showFeedback('info', 'Gioco caricato', `Tempo rimanente: ${Math.ceil(data.timeLeft / 1000)}s`);
        } else if (data.status === 'won') {
          showFeedback('success', 'Partita completata!', 'Hai indovinato la frase', false);
          triggerGameEndAnimation('won');
        } else if (data.status === 'timeout') {
          showFeedback('error', 'Tempo scaduto!', `La frase era: "${data.phrase}"`, false);
          triggerGameEndAnimation('timeout');
        } else if (data.status === 'abandoned') {
          showFeedback('warning', 'Partita abbandonata', `La frase era: "${data.phrase}"`, false);
          triggerGameEndAnimation('lost');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nel recupero dello stato');
      }
    } catch (err) {
      setError('Errore di connessione: ' + err.message);
    }
  }, [showFeedback, triggerGameEndAnimation]);

  // Funzione per indovinare una lettera - GUEST MODE (corretta per API guest)
  const guessLetter = async (letter) => {
    if (!gameState || gameState.status !== 'running') return;
    if (triedLetters.has(letter.toLowerCase())) {
      setMessage(`Hai già provato la lettera "${letter.toUpperCase()}"`);
      return;
    }

    setLoading(true);
    setTriedLetters(prev => new Set(prev).add(letter.toLowerCase()));
    setLetterInput(''); // Pulisci input dopo il tentativo
    
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameState.gameId}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // L'API guest restituisce revealedIndexes, non revealed/revealedLetters
        let newRevealed = [...(gameState.revealed || [])];
        let newRevealedLetters = {...(gameState.revealedLetters || {})};
        
        if (data.revealedIndexes && data.revealedIndexes.length > 0) {
          // Aggiungi nuovi indici rivelati
          data.revealedIndexes.forEach(index => {
            if (!newRevealed.includes(index)) {
              newRevealed.push(index);
              newRevealedLetters[index] = letter.toUpperCase();
            }
          });
          
          setMessage(`✅ Bene! La lettera "${letter.toUpperCase()}" è presente (${data.revealedIndexes.length} volte). Costo: 0 monete`);
        } else {
          setMessage(`❌ La lettera "${letter.toUpperCase()}" non è presente. Costo: 0 monete`);
        }
        
        // Aggiorna lo stato con i nuovi dati
        setGameState(prev => ({
          ...prev,
          revealed: newRevealed,
          revealedLetters: newRevealedLetters
        }));
        
        setTimeLeft(data.timeLeft || timeLeft);
        
        // Check vittoria: se tutte le lettere non-spazio sono rivelate
        const totalLetters = (gameState.phraseLength || 0) - (gameState.spaces || []).length;
        if (newRevealed.length >= totalLetters && totalLetters > 0) {
          setGameState(prev => ({...prev, status: 'won'}));
          showFeedback('success', '🎉 Complimenti!', 'Hai indovinato tutte le lettere!', false);
        }
        
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Errore nel tentativo lettera');
      }
    } catch (err) {
      setMessage('Errore di connessione: ' + err.message);
    }
    setLoading(false);
  };

  // Funzione per indovinare la frase completa - corretta per API guest
  const guessPhrase = async () => {
    if (!gameState || gameState.status !== 'running' || !phraseGuess.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameState.gameId}/guess-phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ attempt: phraseGuess })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.result === 'win' || data.status === 'won') {
          // Vittoria!
          setGameState(prev => ({
            ...prev,
            status: 'won',
            phrase: data.phrase
          }));
          showFeedback('success', '🎉 Perfetto!', 'Hai indovinato la frase completa!', false);
        } else if (data.result === 'timeout' || data.status === 'timeout') {
          // Timeout
          setGameState(prev => ({
            ...prev,
            status: 'timeout',
            phrase: data.phrase
          }));
          showFeedback('error', '⏰ Tempo scaduto!', `La frase era: "${data.phrase}"`, false);
        } else {
          // Frase sbagliata, continua a giocare
          setTimeLeft(data.timeLeft || timeLeft);
          setMessage(`❌ Frase errata. Riprova! Tempo rimanente: ${Math.floor((data.timeLeft || timeLeft) / 1000)}s`);
        }
        setPhraseGuess('');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Errore nel tentativo frase');
      }
    } catch (err) {
      setMessage('Errore di connessione: ' + err.message);
    }
    setLoading(false);
  };

  // Funzione per abbandonare il gioco - corretta per API guest
  const abandonGuestGame = async () => {
    if (!gameState) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameState.gameId}/abandon`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(prev => ({
          ...prev,
          status: 'abandoned',
          phrase: data.phrase,
        }));
        showFeedback('warning', 'Partita abbandonata', `La frase era: "${data.phrase}"`, false);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Errore nell\'abbandono');
      }
    } catch (err) {
      setMessage('Errore nell\'abbandono: ' + err.message);
    }
    setLoading(false);
  };

  // Timer effect - identico a Game.jsx con feedback professionali
  useEffect(() => {
    if (gameState?.status !== 'running' || timeLeft <= 0) return;
    
    const gameId = gameState.gameId; // Cattura gameId per evitare dipendenze circolari
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTimeLeft = Math.max(0, prev - 1000);
        
        // Avviso quando il tempo sta per scadere (identico a Game.jsx)
        if (newTimeLeft <= 10000 && newTimeLeft > 5000 && prev > 10000) {
          showFeedback('warning', '⏰ Tempo in esaurimento!', 
            'Meno di 10 secondi rimasti. Affretta la decisione!');
        }
        
        if (newTimeLeft <= 5000 && newTimeLeft > 0 && prev > 5000) {
          showFeedback('error', '🚨 ULTIMI 5 SECONDI!', 
            'Il tempo sta per scadere!');
        }
        
        if (newTimeLeft === 0) {
          // Il timer è scaduto, ricarichiamo lo stato (il backend gestirà il timeout)
          showFeedback('error', 'Tempo scaduto!', 'La partita è terminata', false);
          triggerGameEndAnimation('timeout');
          setTimeout(() => {
            // Ricarica stato senza dipendenza da fetchGuestGameState
            fetch(`http://localhost:3001/api/guest/games/${gameId}`, {
              method: 'GET',
              credentials: 'include',
            })
            .then(res => res.json())
            .then(data => setGameState(data))
            .catch(err => console.error('Errore ricarica timeout:', err));
          }, 100);
        }
        
        return newTimeLeft;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState?.status, gameState?.gameId, timeLeft, showFeedback, triggerGameEndAnimation]);

  // Funzioni di utilità corrette per guest API
  const isGameRunning = gameState?.status === 'running';
  const formatTime = (milliseconds) => {
    const seconds = Math.floor((milliseconds || 0) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderizza griglia identica a Game.jsx
  const renderPhraseGrid = () => {
    if (!gameState || gameState.status === 'loading') {
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
    
    // Durante il gioco, come in Game.jsx
    const cells = [];
    for (let i = 0; i < (gameState.phraseLength || 0); i++) {
      const isSpace = (gameState.spaces || []).includes(i);
      const isRevealed = (gameState.revealed || []).includes(i);
      
      let cellContent = '';
      let cellClass = `phrase-cell ${isSpace ? 'space' : ''}`;
      
      if (isSpace) {
        cellContent = '';
        cellClass = 'phrase-cell space';
      } else if (isRevealed) {
        const revealedLetter = (gameState.revealedLetters || {})[i];
        if (revealedLetter) {
          cellContent = revealedLetter;
          cellClass = 'phrase-cell revealed';
        } else {
          cellContent = '';
          cellClass = 'phrase-cell empty';
        }
      } else {
        cellContent = '';
        cellClass = 'phrase-cell empty';
      }
      
      cells.push(
        <div key={i} className={cellClass}>
          {cellContent}
        </div>
      );
    }
    
    return (
      <div className="phrase-grid">
        {cells}
      </div>
    );
  };

  // Se non c'è un gioco attivo o è in caricamento, mostra il loader
  if (!gameState || gameState.status === 'loading') {
    return (
      <div className="game-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Caricamento gioco ospite...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Sistema di feedback identico a Game.jsx */}
      {feedbackState.isVisible && (
        <div className={`feedback-banner ${feedbackState.type} ${!feedbackState.autoHide ? 'game-end-modal' : ''}`}>
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
            
            {/* Pulsanti per i banner di fine gioco */}
            {!feedbackState.autoHide && (
              <div className="game-end-actions" style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                <button 
                  style={{
                    padding: '0.8rem 1.5rem',
                    backgroundColor: 'transparent',
                    border: '2px solid currentColor',
                    borderRadius: '8px',
                    color: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={onBackToHome}
                >
                  🏠 Menu Principale
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header gioco identico a Game.jsx */}
      <div className="game-header">
        <h2>🎮 MODALITÀ OSPITE - Indovina la Frase</h2>
        <div className="game-info">
          <div className="timer">
            ⏱️ {formatTime(timeLeft)}
          </div>
          <div className="coins">
            🆓 Gioco gratuito
          </div>
          <div className="vowel-status">
            🔤 Vocali illimitate
          </div>
        </div>
      </div>

      {/* Griglia frase identica a Game.jsx */}
      <div className="phrase-section">
        <h3>
          {isGameRunning ? 'Indovina la frase:' : 'Risultato Finale:'}
          <span className="phrase-progress">
            {isGameRunning && 
              ` (${(gameState.revealed || []).length}/${(gameState.phraseLength || 1) - (gameState.spaces || []).length} lettere rivelate)`
            }
          </span>
        </h3>
        
        {/* Barra progresso identica a Game.jsx */}
        {isGameRunning && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${((gameState.revealed || []).length / Math.max(1, (gameState.phraseLength || 1) - (gameState.spaces || []).length)) * 100}%`
              }}
            ></div>
          </div>
        )}
        
        {renderPhraseGrid()}
      </div>

      {/* Messaggio feedback identico a Game.jsx */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}
      
      {/* Messaggio errore se presente */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Controlli gioco identici a Game.jsx */}
      {isGameRunning && (
        <div className="game-section">
          {/* Tastiera virtuale identica ma con costi 0 */}
          <div className="virtual-keyboard">
            <h4>Clicca su una lettera per tentarla:</h4>
            
            {/* Vocali - identiche a Game.jsx ma gratuite */}
            <div className="keyboard-section vowels">
              <h5>Vocali (GRATUITE - illimitate per ospiti)</h5>
              <div className="keyboard-row">
                {['A', 'E', 'I', 'O', 'U'].map(letter => {
                  const tried = triedLetters.has(letter.toLowerCase());
                  const disabled = tried;
                  
                  return (
                    <button
                      key={letter}
                      className={`keyboard-key vowel ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => guessLetter(letter)}
                      disabled={disabled || loading}
                      title={`${letter} - GRATIS${tried ? ' (già tentata)' : ''}`}
                    >
                      <span className="letter">{letter}</span>
                      <span className="cost">🆓</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Consonanti identiche a Game.jsx ma gratuite */}
            {[
              { cost: 'GRATIS', letters: ['T', 'N', 'H', 'S'], label: 'Consonanti frequenti (GRATUITE)' },
              { cost: 'GRATIS', letters: ['R', 'L', 'D', 'C'], label: 'Consonanti comuni (GRATUITE)' },
              { cost: 'GRATIS', letters: ['M', 'W', 'Y', 'F'], label: 'Consonanti medie (GRATUITE)' },
              { cost: 'GRATIS', letters: ['G', 'P', 'B', 'V'], label: 'Consonanti meno frequenti (GRATUITE)' },
              { cost: 'GRATIS', letters: ['K', 'J', 'X', 'Q', 'Z'], label: 'Consonanti rare (GRATUITE)' }
            ].map((group, index) => (
              <div key={index} className="keyboard-section consonants">
                <h5>{group.label}</h5>
                <div className="keyboard-row">
                  {group.letters.map(letter => {
                    const tried = triedLetters.has(letter.toLowerCase());
                    const disabled = tried;
                    
                    return (
                      <button
                        key={letter}
                        className={`keyboard-key consonant ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => guessLetter(letter)}
                        disabled={disabled || loading}
                        title={`${letter} - GRATIS${tried ? ' (già tentata)' : ''}`}
                      >
                        <span className="letter">{letter}</span>
                        <span className="cost">🆓</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="keyboard-info">
              <div className="cost-warning">
                ✨ <strong>Modalità Ospite:</strong> Tutte le lettere sono gratuite!
              </div>
              <div className="coins-available">
                🎮 <strong>Nessun costo - Gioco completamente gratuito</strong>
              </div>
            </div>
          </div>
        
          {/* Controlli identici a Game.jsx */}
          <div className="game-controls">
            {/* Input lettera identico */}
            <div className="letter-input-section">
              <h4>Indovina una lettera:</h4>
              <div className="input-group">
                <input
                  type="text"
                  value={letterInput}
                  onChange={(e) => setLetterInput(e.target.value.toUpperCase().slice(-1))}
                  placeholder="Lettera (A-Z)"
                  maxLength={1}
                  className="letter-input"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && letterInput && guessLetter(letterInput)}
                />
                <button 
                  onClick={() => letterInput && guessLetter(letterInput)}
                  disabled={loading || !letterInput.trim()}
                  className="guess-letter-btn"
                >
                  {loading ? 'Tentativo...' : 'Prova Lettera'}
                </button>
              </div>
            </div>
            
            {/* Input frase identico */}
            <div className="phrase-input-section">
              <h4>Oppure indovina tutta la frase:</h4>
              <div className="input-group">
                <input
                  type="text"
                  value={phraseGuess}
                  onChange={(e) => setPhraseGuess(e.target.value)}
                  placeholder="Scrivi qui la tua soluzione completa..."
                  className="phrase-input"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && phraseGuess.trim().length > 1 && guessPhrase()}
                />
                <button 
                  onClick={guessPhrase}
                  disabled={loading || !phraseGuess.trim() || phraseGuess.trim().length <= 1}
                  className="guess-phrase-btn"
                >
                  {loading ? 'Tentativo...' : 'Indovina Frase'}
                </button>
              </div>
            </div>
            
            {/* Azioni identiche */}
            <div className="game-actions">
              <button 
                onClick={abandonGuestGame}
                disabled={loading}
                className="abandon-btn"
              >
                🏳️ Abbandona Partita
              </button>
              <button 
                onClick={onBackToHome}
                className="back-btn"
              >
                🏠 Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schermata fine gioco identica */}
      {!isGameRunning && gameState.phrase && (
        <div className="game-finished">
          <div className={`result-banner ${gameState.status}`}>
            <div className="result-content">
              {gameState.status === 'won' && (
                <>
                  <div className="result-icon">🎉</div>
                  <h3>COMPLIMENTI!</h3>
                  <p>Hai indovinato la frase!</p>
                </>
              )}
              {gameState.status === 'timeout' && (
                <>
                  <div className="result-icon">⏰</div>
                  <h3>TEMPO SCADUTO!</h3>
                  <p>Peccato, il tempo è finito!</p>
                </>
              )}
              {gameState.status === 'abandoned' && (
                <>
                  <div className="result-icon">🏳️</div>
                  <h3>PARTITA ABBANDONATA</h3>
                  <p>Hai deciso di arrenderti</p>
                </>
              )}
              
              <div className="final-phrase-reveal">
                <strong>La frase era: "{gameState.phrase}"</strong>
              </div>
              
              <div className="game-stats-final">
                <div className="stat">
                  <span className="stat-label">Lettere tentate:</span>
                  <span className="stat-value">{triedLetters.size}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Tempo trascorso:</span>
                  <span className="stat-value">{formatTime(60 - timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="end-game-actions">
            <button 
              onClick={() => window.location.reload()}
              className="play-again-btn"
            >
              🔄 Gioca Ancora
            </button>
            <button 
              onClick={onBackToHome}
              className="back-btn"
            >
              🏠 Menu Principale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestGame;
