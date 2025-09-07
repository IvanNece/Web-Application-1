/**
 * GAMERESULTDISPLAY.JSX - COMPONENTE RISULTATI FINALI
 * 
 * SCOPO:
 * Display finale partita che mostra risultati, frase completa
 * e azioni disponibili post-gioco. Adatta contenuto in base
 * a modalità autenticata/ospite e tipo conclusione partita.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Display risultato finale (vittoria, timeout, abbandono)
 * - Rivelazione frase completa
 * - Azioni post-partita (nuova partita, menu)
 * - Messaggi status contestuali
 * - Gestione visibilità condizionale
 * - Layout responsivo per entrambe modalità
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Display con opzioni persistenza
 * - 'guest': Display semplificato per sessioni temporanee
 * 
 * PROPS RICEVUTE:
 * - gameState: Stato finale gioco con frase e risultato
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - isVisible: Flag visibilità componente
 * - onPlayAgain: Callback avvio nuova partita
 * - onBackToHome: Callback ritorno homepage
 * 
 * STATI RISULTATO:
 * - 'won': Partita vinta con successo
 * - 'timeout': Tempo scaduto senza vittoria
 * - 'abandoned': Partita abbandonata dall'utente
 * 
 * LOGICA RENDERING:
 * - getStatusText(): Testi status con icone
 * - Rendering condizionale per frase e azioni
 * 
 * STILI CSS:
 * Utilizza game-results.css per modal e layout finali.
 */

import { memo } from 'react';

const GameResultDisplay = ({ 
  gameState,
  mode = 'authenticated', // 'authenticated' | 'guest'
  isVisible = false,
  onPlayAgain,
  onBackToHome
}) => {
  // Controllo visibilità e validità stato gioco
  if (!isVisible || !gameState?.phrase) return null;

  const isGuest = mode === 'guest';

  // Mapping testi status con icone ed emoji contestuali
  const getStatusText = (status) => {
    switch (status) {
      case 'won': return '🎉 Vittoria!';
      case 'timeout': return '⏰ Tempo scaduto';
      case 'abandoned': return isGuest ? '🏳️ Abbandonato' : '🏃‍♂️ Abbandonato';
      default: return 'Gioco terminato';
    }
  };

  return (
    <div className="game-result">
      <h3>Gioco terminato!</h3>
      
      {/* Rivelazione frase completa per risultato finale */}
      {gameState.phrase && (
        <div className="final-phrase">
          <strong>La frase era:</strong> "{gameState.phrase}"
        </div>
      )}
      
      {/* Status finale partita con icone contestuali */}
      <div className="result-status">
        Stato: {getStatusText(gameState.status)}
      </div>
      
      {/* Azioni disponibili post-partita */}
      <div className="end-game-actions">
        {/* Pulsante nuova partita - testo adattato per modalità */}
        <button 
          onClick={onPlayAgain}
          className="play-again-btn"
        >
          🔄 {isGuest ? 'Gioca Ancora' : 'Nuova Partita'}
        </button>
        {/* Pulsante ritorno menu principale */}
        <button 
          onClick={onBackToHome}
          className="back-btn"
        >
          🏠 Menu Principale
        </button>
      </div>
    </div>
  );
};

export default memo(GameResultDisplay);
