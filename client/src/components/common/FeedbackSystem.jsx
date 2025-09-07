/**
 * FEEDBACKSYSTEM.JSX - COMPONENTE SISTEMA FEEDBACK
 * 
 * SCOPO:
 * Sistema centralizzato per gestione feedback utente con messaggi,
 * notifiche e azioni fine partita. Supporta diversi tipi di feedback
 * con icone, auto-nascondimento e azioni personalizzate.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Messaggi feedback tipizzati (success, error, warning, info)
 * - Banner notifiche con icone contestuali
 * - Auto-nascondimento temporizzato
 * - Azioni fine partita (nuova partita, home)
 * - Gestione modalità autenticata e ospite
 * - Overlay modale per azioni critiche
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Feedback con persistenza e azioni complete
 * - 'guest': Feedback semplificato per sessioni temporanee
 * 
 * PROPS RICEVUTE:
 * - feedbackState: Oggetto stato feedback con visibilità e contenuto
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - onClose: Callback chiusura feedback
 * - onGameEnd: Callback fine partita con azioni
 * - onBackToHome: Callback ritorno homepage
 * 
 * TIPI FEEDBACK:
 * - 'success': Operazioni riuscite (verde)
 * - 'error': Errori e fallimenti (rosso)
 * - 'warning': Avvisi e attenzioni (giallo)
 * - 'info': Informazioni generali (blu)
 * 
 * LOGICA RENDERING:
 * - getFeedbackIcon(): Icone per tipo feedback
 * - renderGameEndActions(): Azioni fine partita
 * 
 * STILI CSS:
 * Utilizza feedback-system.css per banner e overlay.
 */

import { memo } from 'react';

const FeedbackSystem = ({ 
  feedbackState,
  mode = 'authenticated', // 'authenticated' | 'guest'
  onClose,
  onGameEnd,
  onBackToHome
}) => {
  // Controllo visibilità - ritorna null se nascosto
  if (!feedbackState.isVisible) return null;

  const isGuest = mode === 'guest';

  // Mapping icone per tipo feedback con emoji contestuali
  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  // Rendering azioni fine partita per feedback non auto-nascosti
  const renderGameEndActions = () => {
    if (feedbackState.autoHide) return null;

    return (
      <div className="game-end-actions" style={{
        marginTop: '1.5rem', 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center'
      }}>
        {/* Solo pulsante Menu Principale per tutti i tipi di fine gioco */}
        <button 
          style={{
            padding: '0.8rem 1.5rem',
            backgroundColor: 'transparent',
            border: '2px solid currentColor',
            borderRadius: '8px',
            color: 'inherit',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={isGuest ? onBackToHome : onBackToHome}
        >
          🏠 Menu Principale
        </button>
      </div>
    );
  };

  return (
    <div className={`feedback-banner ${feedbackState.type} ${!feedbackState.autoHide ? `game-end-modal ${feedbackState.gameEndType === 'won' ? 'victory-modal' : feedbackState.gameEndType === 'timeout' ? 'timeout-modal' : ''}` : ''} ${feedbackState.timerWarning ? 'timer-warning-banner' : ''}`}>
      <div className="feedback-content">
        {/* Header feedback con icona, messaggio e chiusura opzionale */}
        <div className="feedback-header">
          <span className="feedback-icon">
            {getFeedbackIcon(feedbackState.type)}
          </span>
          <strong>{feedbackState.message}</strong>
          {/* Pulsante chiusura solo per feedback auto-nascosti */}
          {feedbackState.autoHide && (
            <button 
              className="feedback-close"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        
        {/* Dettagli aggiuntivi feedback se presenti */}
        {feedbackState.details && (
          <div className="feedback-details">{feedbackState.details}</div>
        )}
        
        {/* Azioni fine partita per feedback persistenti */}
        {renderGameEndActions()}
      </div>
    </div>
  );
};

export default memo(FeedbackSystem);
