import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Game from '../Game';

function GamePage({ user, setUser }) {
  const navigate = useNavigate();
  const [currentGameId, setCurrentGameId] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [error, setError] = useState('');

  // Crea una nuova partita quando il componente si monta
  useEffect(() => {
    createNewGame();
  }, []);

  const createNewGame = async () => {
    if (user.coins <= 0) {
      setError('Non hai abbastanza monete per iniziare una partita!');
      return;
    }

    setIsCreatingGame(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/games', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione del gioco');
      }

      const gameData = await response.json();
      setCurrentGameId(gameData.gameId);

      // Aggiorna le monete dell'utente se fornite nella risposta
      if (gameData.coins !== undefined) {
        setUser(prev => ({ ...prev, coins: gameData.coins }));
      }

    } catch (error) {
      console.error('Errore creazione gioco:', error);
      setError(`Errore nella creazione del gioco: ${error.message}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleGameEnd = (result) => {
    console.log('Gioco terminato con risultato:', result);
    // Torna alla home dopo che il gioco è terminato
    setTimeout(() => navigate('/'), 1000);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Loading state durante la creazione del gioco
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

  // Errore nella creazione del gioco
  if (error) {
    return (
      <div className="game-page">
        <div className="game-error">
          <h2>Errore</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={createNewGame} className="retry-btn">
              Riprova
            </button>
            <button onClick={handleBackToHome} className="back-btn">
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gioco attivo
  if (currentGameId) {
    return (
      <div className="game-page">
        <div className="game-page-header">
          <button onClick={handleBackToHome} className="back-to-home-btn">
            ← Torna alla Home
          </button>
          <h1>🎮 Partita in Corso</h1>
          <div className="user-info">
            <span>Giocatore: <strong>{user.username}</strong></span>
          </div>
        </div>
        
        <Game 
          gameId={currentGameId}
          onGameEnd={handleGameEnd}
          user={user}
          setUser={setUser}
        />
      </div>
    );
  }

  // Fallback (non dovrebbe mai accadere)
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