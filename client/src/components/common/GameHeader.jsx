/**
 * GAMEHEADER.JSX - COMPONENTE HEADER GIOCO
 * 
 * SCOPO:
 * Componente header universale che visualizza informazioni di gioco,
 * logo, timer e controlli di abbandono. Adattabile per modalità
 * autenticata e ospite con interfacce differenziate.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Logo animato e status partita
 * - Timer countdown con formattazione
 * - Informazioni giocatore (solo modalità auth)
 * - Pulsante abbandono partita
 * - Indicatore stato vocali (modalità auth)
 * - Responsive design per entrambe le modalità
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Header completo con timer, monete, vocali
 * - 'guest': Header semplificato senza persistenza
 * 
 * PROPS RICEVUTE:
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - user: Oggetto utente per modalità autenticata
 * - timeLeft: Tempo rimanente in secondi
 * - hasUsedVowel: Flag uso vocale per modalità auth
 * - onAbandon: Callback abbandono partita
 * - gameIcon: Icona sinistra del gioco
 * - gameIconRight: Icona destra del gioco
 * - formatTime: Funzione formattazione tempo
 * - isGameRunning: Flag stato partita attiva
 * - loading: Flag stati di caricamento
 * 
 * STRUTTURA RENDERING:
 * - renderMainHeader(): Logo e status partita
 * - renderSecondaryInfo(): Timer, info utente, controlli
 * - Responsive layout con flex per ottimizzazione spazio
 * 
 * STILI CSS:
 * Utilizza game-container.css per styling header e layout.
 */

import { memo } from 'react';

const GameHeader = ({ 
  mode = 'authenticated', // 'authenticated' | 'guest'
  user,
  timeLeft,
  hasUsedVowel = false,
  onAbandon,
  gameIcon,
  gameIconRight,
  formatTime,
  isGameRunning = true,
  loading = false
}) => {
  const isGuest = mode === 'guest';

  // Header principale con logo (solo per gioco in corso)
  const renderMainHeader = () => {
    if (!isGameRunning) return null;
    
    return (
      <div className="game-header">
        <div className="game-info">
          <div className="game-logo-section">
            <img 
              src={gameIcon} 
              alt="Game Icon Left" 
              className="game-logo left"
            />
            <span className="game-status">Partita in Corso</span>
            <img 
              src={gameIconRight} 
              alt="Game Icon Right" 
              className="game-logo right"
            />
          </div>
        </div>
      </div>
    );
  };

  // Informazioni secondarie del gioco con controlli e dettagli
  const renderSecondaryInfo = () => {
    return (
      <div className="game-secondary-info">
        {/* Pulsante abbandono partita - senza penalità per utenti autenticati */}
        <button 
          className="abandon-btn-header"
          onClick={onAbandon}
          disabled={loading}
        >
          <span className="abandon-line-1">Abbandona partita</span>
          {!isGuest && <span className="abandon-line-2">senza penalità</span>}
        </button>
        
        {/* Timer countdown con formattazione temporale */}
        <div className="timer">
          ⏱️ {formatTime ? formatTime(timeLeft) : timeLeft}
        </div>
        
        {/* Status utilizzo vocali - diverso per modalità auth/guest */}
        <div className="vowel-status">
          {isGuest 
            ? '🔤 Vocali illimitate' 
            : (hasUsedVowel ? '✅ Vocale usata' : '🔤 Vocale disponibile')
          }
        </div>
        
        {/* Informazioni giocatore con avatar e dettagli */}
        <div className="player-info">
          <div className="player-avatar">
            {isGuest ? '🎮' : '👤'}
          </div>
          <div className="player-details">
            <div className="player-name">
              {isGuest ? 'Ospite' : user?.username}
            </div>
            <div className="player-coins">
              {isGuest ? '🆓 Gratis' : `💰 ${user?.coins}`}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render finale: header principale + informazioni secondarie
  return (
    <>
      {renderMainHeader()}
      {renderSecondaryInfo()}
    </>
  );
};

export default memo(GameHeader);
