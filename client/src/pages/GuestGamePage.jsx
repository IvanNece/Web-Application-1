import { useNavigate } from 'react-router-dom';
import GuestGame from '../GuestGame';

function GuestGamePage() {
  const navigate = useNavigate();

  return (
    <GuestGame onBackToHome={() => navigate('/')} />
  );
}

export default GuestGamePage;