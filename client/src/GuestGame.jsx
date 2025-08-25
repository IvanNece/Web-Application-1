import { useState, useEffect, useCallback } from 'react';
import './Game.css';

function GuestGame({ onBackToHome }) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [phraseGuess, setPhraseGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Funzione per creare un nuovo gioco guest
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
        setError(errorData.error || 'Failed to create guest game');
      }
    } catch (err) {
      setError('Error creating guest game: ' + err.message);
    }
    setLoading(false);
  }, []);

  // Funzione per ottenere lo stato del gioco guest
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch guest game state');
      }
    } catch (err) {
      setError('Error fetching guest game: ' + err.message);
    }
  }, []);

  // Funzione per indovinare una lettera (guest)
  const guessLetter = async (letter) => {
    if (!gameState || gameState.status !== 'running') return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameState.gameId}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Aggiorna lo stato del gioco
        setGameState(prev => ({
          ...prev,
          revealed: data.revealedIndexes || prev.revealed,
        }));
        setTimeLeft(data.timeLeft || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to guess letter');
      }
    } catch (err) {
      setError('Error guessing letter: ' + err.message);
    }
    setLoading(false);
  };

  // Funzione per indovinare la frase (guest)
  const guessPhrase = async () => {
    if (!gameState || gameState.status !== 'running' || !phraseGuess.trim()) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/guest/games/${gameState.gameId}/guess-phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt: phraseGuess.trim() }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result === 'win') {
          setGameState(prev => ({
            ...prev,
            status: 'won',
            phrase: data.phrase,
          }));
        } else {
          setTimeLeft(data.timeLeft || 0);
        }
        setPhraseGuess('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to guess phrase');
      }
    } catch (err) {
      setError('Error guessing phrase: ' + err.message);
    }
    setLoading(false);
  };

  // Funzione per abbandonare il gioco guest
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
      }
    } catch (err) {
      setError('Error abandoning guest game: ' + err.message);
    }
    setLoading(false);
  };

  // Timer effect
  useEffect(() => {
    if (gameState?.status === 'running' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Tempo scaduto, aggiorna lo stato del gioco
            fetchGuestGameState(gameState.gameId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState, fetchGuestGameState]);

  // Funzione per renderizzare la frase con lettere rivelate
  const renderPhrase = () => {
    if (!gameState) return '';

    if (gameState.status !== 'running') {
      // Gioco finito, mostra la frase completa
      return gameState.phrase || '';
    }

    // Gioco in corso, mostra solo le lettere rivelate
    const phraseArray = Array(gameState.phraseLength).fill('_');
    
    // Mostra gli spazi
    gameState.spaces?.forEach(index => {
      phraseArray[index] = ' ';
    });

    // Mostra le lettere rivelate
    gameState.revealed?.forEach(index => {
      phraseArray[index] = '●'; // Placeholder per lettere rivelate
    });

    return phraseArray.join('');
  };

  // Formatta il tempo rimanente
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Se non c'è un gioco attivo, mostra il pulsante per crearne uno
  if (!gameState) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h2>Indovina la Frase - Modalità Ospite</h2>
          <div className="user-info">
            <span>Modalità: Ospite (Gratuita)</span>
          </div>
        </div>

        <div className="game-content">
          <div className="start-game">
            <p>Benvenuto al gioco "Indovina la Frase" in modalità ospite!</p>
            <p>Hai 60 secondi per indovinare una frase segreta.</p>
            <p>In modalità ospite puoi giocare gratuitamente, senza limiti sulle vocali!</p>
            <button 
              onClick={createGuestGame} 
              disabled={loading}
              className="start-button"
            >
              {loading ? 'Creando...' : 'Inizia Gioco Ospite'}
            </button>
          </div>
        </div>

        <button onClick={onBackToHome} className="back-button">
          Torna al Menu
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  const isGameFinished = gameState.status !== 'running';

  return (
    <div className="game-container">
      <div className="game-header">
        <h2>Indovina la Frase - Modalità Ospite</h2>
        <div className="user-info">
          <span>Modalità: Ospite (Gratuita)</span>
        </div>
      </div>

      <div className="game-status">
        <div className="timer">
          <span className={timeLeft <= 10 ? 'timer-warning' : ''}>
            Tempo: {formatTime(timeLeft)}
          </span>
        </div>
        <div className="game-info">
          <span>Stato: {gameState.status}</span>
          <span>Modalità: Ospite</span>
        </div>
      </div>

      <div className="phrase-container">
        <div className="phrase-display">
          {renderPhrase()}
        </div>
        {isGameFinished && gameState.phrase && (
          <div className="final-phrase">
            <strong>Frase completa: {gameState.phrase}</strong>
          </div>
        )}
      </div>

      {gameState.status === 'running' && (
        <>
          <div className="letter-selection">
            <h3>Scegli una lettera:</h3>
            <div className="alphabet-grid">
              {ALPHABET.map(letter => (
                <button
                  key={letter}
                  onClick={() => guessLetter(letter)}
                  disabled={loading}
                  className="letter-button consonant"
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="phrase-guess">
            <h3>Oppure indovina tutta la frase:</h3>
            <div className="phrase-input-container">
              <input
                type="text"
                value={phraseGuess}
                onChange={(e) => setPhraseGuess(e.target.value)}
                placeholder="Scrivi qui la tua ipotesi..."
                className="phrase-input"
                disabled={loading}
              />
              <button 
                onClick={guessPhrase}
                disabled={loading || !phraseGuess.trim()}
                className="guess-button"
              >
                Indovina Frase
              </button>
            </div>
          </div>

          <div className="game-actions">
            <button 
              onClick={abandonGuestGame}
              disabled={loading}
              className="abandon-button"
            >
              Abbandona Partita
            </button>
          </div>
        </>
      )}

      {isGameFinished && (
        <div className="game-finished">
          <div className={`result ${gameState.status}`}>
            {gameState.status === 'won' && '🎉 Hai vinto! 🎉'}
            {gameState.status === 'timeout' && '⏰ Tempo scaduto!'}
            {gameState.status === 'abandoned' && '👋 Partita abbandonata'}
          </div>
          <button onClick={() => setGameState(null)} className="new-game-button">
            Nuova Partita
          </button>
          <button onClick={onBackToHome} className="back-button">
            Torna al Menu
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default GuestGame;
