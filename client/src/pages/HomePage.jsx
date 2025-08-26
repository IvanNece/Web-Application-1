import { useNavigate } from 'react-router-dom';
import gameIcon from '../assets/game-icon.svg';
import gameIconRight from '../assets/game-icon-right.svg';

function HomePage({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Forza il reload completo per pulire tutto lo stato
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Errore durante logout:', error);
    }
  };

  return (
    <div className="home-page">
      <div className="welcome-message">
        <div className="title-with-icons">
          <img src={gameIcon} className="logo game-icon side-left" alt="Puzzle icon" />
          <h1>🎮 Indovina la Frase</h1>
          <img src={gameIconRight} className="logo game-icon side-right" alt="Puzzle icon" />
        </div>
      </div>

      <div className="card">
        {user ? (
          // Sezione per utenti autenticati
          <>
            <h2>Benvenuto, {user.username}!</h2>
            <p className="user-info">
              💰 Monete disponibili: <strong>{user.coins}</strong>
            </p>
            
            {user.coins > 0 ? (
              <button 
                className="start-game-btn"
                onClick={() => navigate('/game')}
              >
                🎯 Inizia Partita (costa monete)
              </button>
            ) : (
              <div className="no-coins-warning">
                <p>Non hai abbastanza monete per giocare!</p>
                <p>Prova la modalità ospite gratuita:</p>
                {/* Solo se non ha monete, mostra modalità guest */}
                <button 
                  className="guest-btn"
                  onClick={() => navigate('/guest')}
                  style={{ 
                    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-green) 100%)',
                    marginTop: '1rem'
                  }}
                >
                  🎮 Gioca come Ospite (Gratis)
                </button>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className="logout-btn"
            >
              🚪 Logout
            </button>
          </>
        ) : (
          // Sezione per utenti non autenticati
          <>
            <h2>Scegli come giocare</h2>
            
            <button 
              className="start-game-btn"
              onClick={() => navigate('/login')}
            >
              🔐 Accedi per giocare con le monete
            </button>
            
            <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
              oppure
            </p>
            
            {/* Per utenti non autenticati, mostra sempre modalità guest */}
            <button 
              className="guest-btn"
              onClick={() => navigate('/guest')}
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-green) 100%)'
              }}
            >
              🎮 Gioca come Ospite (Gratis)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;