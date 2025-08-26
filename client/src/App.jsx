import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import GuestGamePage from './pages/GuestGamePage';
import './App.css';

function App() {
  // Stato globale dell'utente - lo manteniamo qui perché è condiviso tra più pagine
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se l'utente è già autenticato quando l'app si carica
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        credentials: 'include' // Importante: invia il cookie di sessione
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Errore verifica autenticazione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <h2>Caricamento...</h2>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Route principale - mostra la home */}
          <Route 
            path="/" 
            element={<HomePage user={user} />} 
          />
          
          {/* Route login - reindirizza alla home se già autenticato */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : 
              <LoginPage setUser={setUser} />
            } 
          />
          
          {/* Route gioco autenticato - richiede login */}
          <Route 
            path="/game" 
            element={
              user ? <GamePage user={user} setUser={setUser} /> : 
              <Navigate to="/login" replace />
            } 
          />
          
          {/* Route gioco guest - accessibile a tutti */}
          <Route 
            path="/guest" 
            element={<GuestGamePage />} 
          />
          
          {/* Qualsiasi altra route reindirizza alla home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;