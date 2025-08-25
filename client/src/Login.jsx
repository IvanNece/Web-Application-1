import React, { useState } from 'react';

function Login({ setIsLoggedIn, setUser }) {
  // Gestione stato per username e password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Funzione per la gestione del login
  const handleLogin = async (e) => {
    e.preventDefault();
    // Reset errore precedente
    setErrorMessage('');

    try {
      // Chiamata al backend per il login
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Includiamo i cookie di sessione
      });

      const data = await response.json();
      
      if (response.ok) {
        // Successo nel login, aggiorna lo stato dell'app
        console.log('Login successful:', data);
        setUser(data);
        setIsLoggedIn(true);
      } else {
        // Se la risposta non è ok, mostra l'errore
        setErrorMessage(data.error || 'Login failed');
      }
    } catch (error) {
      setErrorMessage('Error during login: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <h2>🔐 Accesso</h2>
      <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem'}}>
        Inserisci le tue credenziali per accedere
      </p>
      
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="👤 Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="🔑 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          ✨ Accedi
        </button>
      </form>
      
      {errorMessage && (
        <div className="error">
          ⚠️ {errorMessage}
        </div>
      )}
      
      <div style={{
        marginTop: '2rem', 
        padding: '1rem', 
        background: 'rgba(168, 85, 247, 0.05)',
        border: '1px solid rgba(168, 85, 247, 0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: 'var(--text-muted)'
      }}>
        <p><strong>💡 Account di prova:</strong></p>
        <p>• <code>novice</code> / <code>password</code> (100 monete)</p>
        <p>• <code>player</code> / <code>password</code> (con partite già giocate)</p>
      </div>
    </div>
  );
}

export default Login;
