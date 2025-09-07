import { useEffect, useCallback } from 'react';

/**
 * ⏰ HOOK PERSONALIZZATO: useGameTimer
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * GESTIONE CENTRALIZZATA DEL TIMER DI GIOCO
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Centralizza la logica del timer condivisa tra modalità autenticata e guest,
 * fornendo countdown automatico, warning temporali e gestione timeout con
 * comportamenti specifici per ciascuna modalità di gioco.
 * 
 * 🔧 FUNZIONALITÀ PRINCIPALI:
 * - Timer countdown automatico ogni secondo (1000ms intervalli)
 * - Sistema warning progressivo (10s e 5s rimanenti)
 * - Gestione timeout con API call automatica per recupero stato finale
 * - Cleanup automatico degli intervalli per prevenire memory leak
 * - Supporto doppia modalità con logiche specifiche
 * 
 * PARAMETRI DI INGRESSO:
 * - gameState: Stato gioco corrente (con timeLeft per auth, gestito separatamente per guest)
 * - setGameState: Funzione aggiornamento stato principale del gioco
 * - showFeedback: Funzione per visualizzare messaggi feedback all'utente
 * - triggerGameEndAnimation: Funzione per attivare animazioni di fine partita
 * - setUser: Setter aggiornamento dati utente (solo modalità authenticated)
 * - user: Oggetto utente corrente per personalizzazione messaggi (solo authenticated)
 * - gameId: Identificativo unico partita per API calls
 * - mode: Modalità gioco ('authenticated' | 'guest')
 * - setTimeLeft: Setter tempo rimanente (solo modalità guest con stato separato)
 * 
 * DIFFERENZE TRA MODALITÀ:
 * 
 * MODALITÀ AUTHENTICATED:
 * - Tempo gestito in gameState.timeLeft (stato centralizzato)
 * - Aggiornamento monete utente automatico su timeout
 * - Messaggi personalizzati con username
 * - API endpoint: /api/games/{gameId}
 * 
 * MODALITÀ GUEST:
 * - Tempo gestito in stato separato via setTimeLeft
 * - Nessun aggiornamento monete (non applicabile)
 * - Messaggi generici senza personalizzazione
 * - API endpoint: /api/guest/games/{gameId}
 * 
 * WORKFLOW OPERATIVO:
 * 1. Attivazione timer solo durante fase 'running'
 * 2. Decremento automatico ogni secondo
 * 3. Warning automatici a soglie predefinite (10s, 5s)
 * 4. Gestione timeout con API call e aggiornamento stato
 * 5. Cleanup intervallo su component unmount
 */
const useGameTimer = (
  gameState,                // Stato principale gioco
  setGameState,             // Setter stato gioco
  showFeedback,             // Funzione feedback messaggi
  triggerGameEndAnimation,  // Funzione animazioni fine
  setUser,                  // Setter utente (solo auth)
  user,                     // Oggetto utente (solo auth)
  gameId,                   // ID partita per API
  mode,                     // Modalità: 'authenticated'/'guest'
  setTimeLeft = null        // Setter tempo (solo guest)
) => {

  // SEZIONE: GESTIONE TIMEOUT
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Gestione timeout - API call per recuperare stato finale
   * 
   * Quando il timer raggiunge zero, esegue:
   * 1. Attiva animazione di fine gioco (tipo 'timeout')
   * 2. Chiama endpoint API specifico per modalità
   * 3. Aggiorna stato gioco con dati finali dal server
   * 4. Aggiorna monete utente (solo modalità authenticated)
   * 5. Mostra messaggio feedback personalizzato per modalità
   * 
   * ENDPOINT API:
   * - Authenticated: /api/games/{gameId} (include aggiornamento monete)
   * - Guest: /api/guest/games/{gameId} (solo dati gioco)
   * 
   * MESSAGGI TIMEOUT:
   * - Authenticated: Include username e penalità monete (-20)
   * - Guest: Messaggio generico con frase rivelata
   */
  const handleTimeout = useCallback(async () => {
    // Guard: verifica presenza ID partita
    if (!gameId) return;
    
    try {
      // Attiva animazione finale di tipo timeout
      triggerGameEndAnimation('timeout');
      
      // Determina endpoint API in base alla modalità
      const endpoint = mode === 'authenticated' 
        ? `http://localhost:3001/api/games/${gameId}`
        : `http://localhost:3001/api/guest/games/${gameId}`;
      
      // Esegue chiamata API per recupero stato finale
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',  // Include cookies sessione
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Aggiorna stato gioco con dati finali dal server
        setGameState(data);
        
        // Aggiorna monete utente solo in modalità autenticata
        if (mode === 'authenticated' && setUser && data.coins !== undefined) {
          setUser(prev => ({ ...prev, coins: data.coins }));
        }
        
        // Compone messaggio timeout personalizzato per modalità
        let timeoutMessage;
        if (mode === 'authenticated' && user) {
          // Modalità authenticated: include username e penalità monete
          timeoutMessage = data.phrase 
            ? `La frase era: "${data.phrase}" - ${user.username} hai perso 20 monete per il timeout`
            : `${user.username} hai perso 20 monete per il timeout`;
        } else {
          // Modalità guest: messaggio generico con frase
          timeoutMessage = data.phrase 
            ? `La frase era: "${data.phrase}"`
            : 'La partita è terminata';
        }
        
        // Mostra feedback finale con tipo timeout
        showFeedback('error', 'Tempo scaduto!', timeoutMessage, false, false, 'timeout');
        
      } else {
        throw new Error('Errore nel recupero dati timeout');
      }
      
    } catch (error) {
      console.error('Errore gestione timeout:', error);
      
      // Fallback: messaggio di errore in caso di API failure
      const fallbackMessage = mode === 'authenticated' && user
        ? `${user.username} hai perso 20 monete per il timeout`
        : 'La partita è terminata';
      
      showFeedback('error', 'Tempo scaduto!', fallbackMessage, false, false, 'timeout');
    }
  }, [gameId, mode, setGameState, setUser, user, showFeedback, triggerGameEndAnimation]);

  // SEZIONE: TIMER COUNTDOWN PRINCIPALE
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Effect principale per gestione countdown timer
   * 
   * LOGICA OPERATIVA:
   * 1. Attivazione solo durante fase 'running'
   * 2. Verifica tempo rimanente in base alla modalità
   * 3. Decremento automatico ogni secondo (1000ms)
   * 4. Warning automatici a soglie predefinite (10s, 5s)
   * 5. Gestione timeout quando tempo raggiunge zero
   * 6. Cleanup intervallo su cambio stato o unmount
   * 
   * MODALITÀ AUTHENTICATED:
   * - Tempo letto da gameState.timeLeft
   * - Aggiornamento via setGameState
   * 
   * MODALITÀ GUEST:
   * - Tempo gestito separatamente via setTimeLeft
   * - Lettura da state esterno passato al hook
   * 
   * WARNING SYSTEM:
   * - 10 secondi: warning giallo con messaggio moderato
   * - 5 secondi: alert rosso con messaggio urgente
   * - Entrambi con auto-hide per non disturbare il gioco
   */
  useEffect(() => {
    // Guard: attivazione solo durante gioco in corso
    if (gameState?.status !== 'running') {
      return;
    }
    
    // Determina il tempo rimanente dalla modalità appropriata
    const currentTimeLeft = mode === 'authenticated' ? gameState?.timeLeft : null;
    
    // Guard modalità authenticated: verifica presenza timeLeft valido
    if (mode === 'authenticated' && (!currentTimeLeft || currentTimeLeft <= 0)) {
      return;
    }
    
    // Crea intervallo countdown con logica specifica per modalità
    const interval = setInterval(() => {
      if (mode === 'authenticated') {
        // MODALITÀ AUTHENTICATED: gestione via gameState.timeLeft
        setGameState(prev => {
          // Guard: mantieni stato se non in running
          if (!prev || prev.status !== 'running') return prev;
          
          // Calcola nuovo tempo con limite minimo zero
          const newTimeLeft = Math.max(0, prev.timeLeft - 1000);
          
          // WARNING 10 SECONDI: avviso moderato
          if (newTimeLeft <= 10000 && newTimeLeft > 5000 && prev.timeLeft > 10000) {
            showFeedback('warning', '⏰ Tempo in esaurimento!', 
              'Meno di 10 secondi rimasti. Affretta la decisione!', true, true);
          }
          
          // WARNING 5 SECONDI: alert critico
          if (newTimeLeft <= 5000 && newTimeLeft > 0 && prev.timeLeft > 5000) {
            showFeedback('error', '🚨 ULTIMI 5 SECONDI!', 
              'Il tempo sta per scadere!', true, true);
          }
          
          // TIMEOUT: gestione fine tempo solo se gioco ancora running
          if (newTimeLeft === 0 && prev.status === 'running') {
            handleTimeout();
          }
          
          // Ritorna stato aggiornato con nuovo timeLeft
          return { ...prev, timeLeft: newTimeLeft };
        });
        
      } else {
        // 👤 MODALITÀ GUEST: gestione via stato separato
        if (setTimeLeft) {
          setTimeLeft(prev => {
            // Calcola nuovo tempo con limite minimo zero
            const newTimeLeft = Math.max(0, prev - 1000);
            
            // WARNING 10 SECONDI: avviso moderato guest
            if (newTimeLeft <= 10000 && newTimeLeft > 5000 && prev > 10000) {
              showFeedback('warning', '⏰ Tempo in esaurimento!', 
                'Meno di 10 secondi rimasti. Affretta la decisione!', true, true);
            }
            
            // WARNING 5 SECONDI: alert critico guest
            if (newTimeLeft <= 5000 && newTimeLeft > 0 && prev > 5000) {
              showFeedback('error', '🚨 ULTIMI 5 SECONDI!', 
                'Il tempo sta per scadere!', true, true);
            }
            
            // TIMEOUT: gestione fine tempo guest solo se gioco ancora running
            if (newTimeLeft === 0 && (!gameState || gameState.status === 'running')) {
              handleTimeout();
            }
            
            // Ritorna nuovo valore tempo
            return newTimeLeft;
          });
        }
      }
    }, 1000); // Intervallo fisso 1 secondo
    
    // Cleanup: rimuove intervallo per prevenire memory leak
    return () => clearInterval(interval);
    
  }, [gameState?.status, gameState?.timeLeft, mode, setGameState, setTimeLeft, showFeedback, handleTimeout]);

  // SEZIONE: EXPORT HOOK
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Hook di solo side-effect (nessun return di dati)
   * 
   * Questo hook è progettato per gestire solo effetti collaterali:
   * - Non ritorna stati o funzioni
   * - Gestisce autonomamente timer e warning
   * - Utilizzato per comportamenti automatici in background
   * 
   * Integrazione nei componenti:
   * - Game.jsx: modalità authenticated con gameState.timeLeft
   * - GuestGame.jsx: modalità guest con timeLeft separato
   */
  return null; // Hook di solo side-effect
};

export default useGameTimer;
