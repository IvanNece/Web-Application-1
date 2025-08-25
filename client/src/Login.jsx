import React, { useState } from 'react';

function Login() {
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
        // Successo nel login, redirigi o mostra il game UI
        console.log('Login successful:', data);
        // Qui puoi usare React Router per spostarti alla pagina di gioco
        window.location.href = '/game';  // o usa react-router per la navigazione
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
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
}

export default Login;
