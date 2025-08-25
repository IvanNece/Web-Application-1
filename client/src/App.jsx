import { useState, useEffect } from 'react';
import Login from './Login';
import gameIcon from './assets/game-icon.svg';
import gameIconRight from './assets/game-icon-right.svg';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Funzione per verificare se l'utente è loggato (può venire dal cookie di sessione)
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sessions/current', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking login:', error);
      }
    };

    checkLogin();
  }, []);

  // Funzione per il logout
  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setIsLoggedIn(false);
        setUser(null);
        window.location.href = '/'; // Reindirizza alla pagina di login
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Se l'utente è loggato, mostra la UI del gioco
  if (isLoggedIn) {
    return (
      <div className="App">
        <div className="welcome-message">
          <div className="title-with-icons">
            <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
            <h1>🎮 Indovina la Frase</h1>
            <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
          </div>
          <p className="user-info">
            🌟 Benvenuto, <strong>{user.username}</strong>! 
            <span style={{marginLeft: '1rem'}}>💰 Monete: <strong>{user.coins}</strong></span>
          </p>
        </div>
        
        <div className="card">
          <h2>🚀 Pronto per la sfida?</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem'}}>
            Indovina la frase segreta prima che scada il tempo!<br/>
            <small>• Consonanti: 1-5 monete • Vocali: 10 monete • Bonus vittoria: +100 monete</small>
          </p>
          
          {user.coins > 0 ? (
            <button className="start-game-btn">
              🎯 Inizia Nuova Partita
            </button>
          ) : (
            <div style={{
              padding: '1.5rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: 'var(--accent-red)',
              marginBottom: '1rem'
            }}>
              <h3>❌ Monete insufficienti!</h3>
              <p>Hai bisogno di almeno 1 moneta per giocare.</p>
            </div>
          )}
          
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    );
  }

  // Se l'utente non è loggato, mostra il form di login
  return (
    <div className="App">
      <div className="welcome-message">
        <div className="title-with-icons">
          <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
          <h1>🎮 Indovina la Frase</h1>
          <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
        </div>
        <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem'}}>
          Accedi per iniziare la tua avventura!
        </p>
      </div>
      
      <Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
    </div>
  );
}

export default App;
