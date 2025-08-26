import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gameIcon from '../assets/game-icon.svg';
import gameIconRight from '../assets/game-icon-right.svg';

function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        navigate('/'); // Torna alla home dopo il login
      } else {
        setError(data.error || 'Credenziali non valide');
      }
    } catch (error) {
      setError('Errore di connessione al server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="title-with-icons">
        <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
        <h1>🎮 Indovina la Frase</h1>
        <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
      </div>

      <div className="login-container">
        <h2>🔐 Accesso</h2>
        
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="👤 Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Accesso...' : '✨ Accedi'}
          </button>
        </form>
        
        {error && <div className="error">⚠️ {error}</div>}
        
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="back-btn"
            style={{ 
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              padding: '0.75rem'
            }}
          >
            ← Torna alla Home
          </button>
        </div>

        <div className="test-accounts" style={{ marginTop: '2rem' }}>
          <p><strong>Account di prova:</strong></p>
          <p>• novice / password (100 monete)</p>
          <p>• player / password (180 monete)</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;