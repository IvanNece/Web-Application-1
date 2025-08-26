import { useNavigate } from 'react-router-dom';

function GamePage({ user, setUser }) {
  const navigate = useNavigate();

  return (
    <div className="game-page">
      <h1>Gioco Autenticato</h1>
      <p>Benvenuto {user.username}! Hai {user.coins} monete.</p>
      <p>Il gioco verrà implementato nel prossimo step.</p>
      <button onClick={() => navigate('/')}>Torna alla Home</button>
    </div>
  );
}

export default GamePage;