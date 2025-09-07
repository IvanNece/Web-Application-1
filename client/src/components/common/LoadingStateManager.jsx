/**
 * LOADINGSTATEMANAGER.JSX - COMPONENTE GESTIONE STATI CARICAMENTO
 * 
 * SCOPO:
 * Componente per gestione stati di caricamento con spinner
 * animato e messaggi personalizzabili. Fornisce feedback visivo
 * durante operazioni asincrone API e transizioni stato gioco.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Spinner animato per feedback visivo
 * - Messaggi caricamento personalizzabili
 * - Sottomessaggi informativi opzionali
 * - Stili adattati per modalità auth/guest
 * - Overlay semi-trasparente
 * - Controllo visibilità condizionale
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Loading con stili completi
 * - 'guest': Loading semplificato per sessioni temporanee
 * 
 * PROPS RICEVUTE:
 * - isLoading: Flag attivazione stato caricamento
 * - message: Messaggio principale caricamento
 * - submessage: Messaggio secondario opzionale
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * 
 * STATI UTILIZZO:
 * - Caricamento iniziale gioco
 * - Invio lettere/frasi API
 * - Transizioni tra stati gioco
 * - Operazioni database
 * 
 * DESIGN PATTERN:
 * - Rendering condizionale con early return
 * - Stili dinamici basati su modalità
 * - Messaggio primario/secondario gerarchico
 * 
 * STILI CSS:
 * Utilizza base.css per spinner e overlay caricamento.
 */

import { memo } from 'react';

const LoadingStateManager = ({ 
  isLoading = false,
  message = 'Caricamento...',
  submessage = '',
  mode = 'authenticated' // 'authenticated' | 'guest'
}) => {
  // Controllo visibilità - ritorna null se non in caricamento
  if (!isLoading) return null;

  const isGuest = mode === 'guest';

  return (
    <div className={`game-container ${isGuest ? '' : 'loading'}`}>
      <div className={isGuest ? 'loading-state' : ''}>
        {/* Spinner animato per feedback visivo caricamento */}
        <div className="loading-spinner"></div>
        {/* Messaggio principale stato caricamento */}
        <h3>{message}</h3>
        {/* Sottomessaggio informativo opzionale */}
        {submessage && <p>{submessage}</p>}
      </div>
    </div>
  );
};

export default memo(LoadingStateManager);
