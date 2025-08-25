import { useState, useEffect } from 'react';
import Login from './Login';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
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
        <h1>Welcome to the Game, {user.username}!</h1>
        <button onClick={handleLogout}>Logout</button>
        {/* Logica per il gioco */}
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <div className="card">
          <button>
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  // Se l'utente non è loggato, mostra il form di login
  return (
    <div className="App">
      <h1>Login to Play</h1>
      <Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
    </div>
  );
}

export default App;
