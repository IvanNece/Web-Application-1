import { useCallback } from 'react';

/**
 * HOOK PERSONALIZZATO: useApiCalls
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * CENTRALIZZAZIONE CHIAMATE API PER GIOCO "INDOVINA LA FRASE"
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Centralizza tutte le chiamate API condivise tra modalità aut  /**
   * API Call: Abbandona partita corrente
   * 
   * FUNZIONALITÀ:
   * 1. Valida ID partita e imposta loading abbandono
   * 2. Esegue POST request a endpoint abbandono
   * 3. Aggiorna stato gioco a 'abandoned'
   * 4. Rivela frase finale dal server response
   * 5. Attiva animazione sconfitta ('lost')
   * 
   * COMPORTAMENTO UNIFIED:
   * - Stesso endpoint pattern per entrambe modalità
   * - Feedback gestito da loadGameState nei componenti
   * - Stesso stato finale 'abandoned't,
 * eliminando duplicazione di codice e garantendo comportamenti consistenti
 * per operazioni di indovinamento lettere, frasi e abbandono partite.
 * 
 * FUNZIONALITÀ CORE:
 * - guessLetter: API call per indovinare singole lettere con aggiornamento stato
 * - guessPhrase: API call per indovinare frase completa con gestione vittoria/errore
 * - abandonGame: API call per abbandonare partita con recupero frase finale
 * - Gestione endpoint dinamici per modalità authenticated/guest
 * - Gestione response unificata con parsing errori e successi
 * - Aggiornamento stato gioco e utente con sincronizzazione lato client
 * 
 * PARAMETRI CONFIGURAZIONE:
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - gameId: Identificativo partita (per auth da prop, per guest da gameState)
 * - gameState: Stato corrente gioco (necessario per modalità guest)
 * - setGameState: Funzione aggiornamento stato principale gioco
 * - setUser: Setter dati utente (solo modalità authenticated)
 * - user: Oggetto utente corrente (solo modalità authenticated)
 * - showFeedback: Funzione visualizzazione messaggi feedback utente
 * - triggerGameEndAnimation: Funzione attivazione animazioni fine partita
 * - setMessage: Setter messaggi di stato per UI
 * - setTriedLetters: Setter lettere già tentate dall'utente
 * - setUserInputs: Setter input utente e loading (solo modalità authenticated)
 * - setLoading: Setter stato caricamento (solo modalità guest)
 * 
 * VANTAGGI ARCHITETTURALI:
 * DRY Principle: Elimina 120+ righe di API calls duplicate
 * Consistenza: Stesso comportamento fetch/response/error handling
 * Testabilità: API calls isolate e facilmente mockabili
 * Manutenibilità: Endpoint centralizzati per facili modifiche
 * Scalabilità: Aggiunta nuove API senza duplicazione logica
 * 
 * DIFFERENZE MODALITÀ:
 * 
 * AUTHENTICATED:
 * - Gestione monete e costi lettere
 * - Feedback dettagliato con username
 * - Loading state via setUserInputs
 * - Endpoint /api/games/{id}
 * 
 * GUEST:
 * - Nessun costo lettere (gratuito)
 * - Feedback semplificato senza personalizzazione
 * - Loading state via setLoading dedicato
 * - Endpoint /api/guest/games/{id}
 */
const useApiCalls = ({
  mode = 'authenticated',   // Modalità operativa (default authenticated)
  gameId,                   // ID partita principale
  gameState = null,         // Stato gioco (necessario per guest)
  setGameState,             // Setter stato gioco
  setUser = null,           // Setter utente (solo auth)
  user = null,              // Oggetto utente (solo auth)
  showFeedback,             // Funzione feedback messaggi
  triggerGameEndAnimation,  // Funzione animazioni fine
  setMessage,               // Setter messaggi stato
  setTriedLetters,          // Setter lettere tentate
  setUserInputs = null,     // Setter input (solo auth)
  setLoading = null,        // Setter loading (solo guest)
  setPhraseGuess = null     // Setter input frase guest (solo guest)
}) => {

  // SEZIONE: FUNZIONI HELPER
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Helper per costruzione endpoint base
   * 
   * Determina l'URL base corretto in base alla modalità:
   * - Authenticated: /api/games/{id} (con gestione monete)
   * - Guest: /api/guest/games/{id} (senza gestione monete)
   * 
   * @param {string} currentGameId - ID partita corrente (fallback su gameId prop)
   * @returns {string} URL base per API calls
   */
  const getBaseEndpoint = useCallback((currentGameId) => {
    const id = currentGameId || gameId;
    return mode === 'authenticated' 
      ? `http://localhost:3001/api/games/${id}`
      : `http://localhost:3001/api/guest/games/${id}`;
  }, [mode, gameId]);

  /**
   * Helper per gestione stati loading per modalità
   * 
   * Aggiorna loading state appropriato in base alla modalità:
   * - Authenticated: setUserInputs per loading specifico (isSubmittingLetter, etc.)
   * - Guest: setLoading generale per tutta l'interfaccia
   * 
   * @param {string} key - Chiave loading (es: 'isSubmittingLetter')
   * @param {boolean} value - Stato loading (true/false)
   */
  const setLoadingState = useCallback((key, value) => {
    if (mode === 'authenticated' && setUserInputs) {
      // Modalità authenticated: loading granulare per tipo operazione
      setUserInputs(prev => ({ ...prev, [key]: value }));
    } else if (mode === 'guest' && setLoading) {
      // Modalità guest: loading generale per interfaccia
      setLoading(value);
    }
  }, [mode, setUserInputs, setLoading]);

  // � SEZIONE: API CALLS PRINCIPALI
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * �📨 API Call: Indovina lettera singola
   * 
   * FUNZIONALITÀ:
   * 1. Valida parametri e imposta loading state
   * 2. Esegue POST request a endpoint specifico modalità
   * 3. Gestisce response con aggiornamento stato gioco
   * 4. Aggiorna monete utente (solo authenticated)
   * 5. Fornisce feedback visivo con risultato tentativo
   * 6. Gestisce errori con fallback appropriati
   * 
   * LOGICA AUTHENTICATED:
   * - Aggiorna gameState con revealed/revealedLetters/hasUsedVowel/timeLeft
   * - Aggiorna monete utente dal server response
   * - Messaggi dettagliati con costi applicati
   * 
   * LOGICA GUEST:
   * - Aggiorna manualmente revealed/revealedLetters
   * - Controlla vittoria automaticamente
   * - Messaggi semplificati senza costi
   * 
   * @param {string} letter - Lettera da indovinare (maiuscola/minuscola)
   * @param {string} currentGameId - ID partita opzionale (fallback su gameId)
   */
  const apiGuessLetter = useCallback(async (letter, currentGameId = null) => {
    const targetGameId = currentGameId || gameId;
    
    // Guard: verifica presenza ID partita
    if (!targetGameId) return;
    
    // Attiva loading state per modalità
    setLoadingState('isSubmittingLetter', true);
    
    try {
      // Costruisce endpoint per tentativo lettera
      const endpoint = `${getBaseEndpoint(targetGameId)}/guess-letter`;
      
      // Esegue POST request con lettera
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                           // Include session cookies
        body: JSON.stringify({ letter })                  // Payload lettera
      });
      
      // Verifica successo response
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel tentativo lettera');
      }
      
      // Parse dati response dal server
      const data = await response.json();
      
      if (mode === 'authenticated') {
        // LOGICA MODALITÀ AUTHENTICATED
        
        // Nota: Le lettere tentate vengono aggiornate nel componente prima
        // della chiamata API per feedback immediato all'utente
        
        // Aggiorna stato gioco con dati server (sincronizzazione completa)
        setGameState(prev => ({
          ...prev,
          revealed: data.revealed || prev.revealed,           // Posizioni rivelate
          revealedLetters: data.revealedLetters || prev.revealedLetters, // Mappa lettere
          hasUsedVowel: data.hasUsedVowel,                   // Flag uso vocali
          timeLeft: data.timeLeft                            // Tempo rimanente aggiornato
        }));
        
        // Aggiorna monete utente con valore dal server
        if (setUser && data.coins !== undefined) {
          setUser(prev => ({ ...prev, coins: data.coins }));
        }
        
        // Compone messaggio feedback in base al risultato
        if (data.costApplied === 0) {
          // Lettera già tentata: nessun costo applicato
          setMessage(`Lettera "${letter}" già provata. Nessun costo aggiuntivo.`);
        } else if (data.revealedIndexes && data.revealedIndexes.length > 0) {
          // Lettera presente: messaggio successo con costo
          setMessage(`✅ Bene! La lettera "${letter}" è presente (${data.revealedIndexes.length} ${data.revealedIndexes.length === 1 ? 'volta' : 'volte'}). Costo: ${data.costApplied} monete`);
        } else {
          // Lettera assente: messaggio errore con costo
          setMessage(`❌ La lettera "${letter}" non è presente. Costo: ${data.costApplied} monete`);
        }
        
      } else {
        // LOGICA MODALITÀ GUEST
        
        // Nota: Lettere tentate aggiornate nel componente guest prima dell'API
        
        if (data.revealedIndexes && data.revealedIndexes.length > 0) {
          // Lettera presente: messaggio successo gratuito
          setMessage(`✅ Bene! La lettera "${letter.toUpperCase()}" è presente (${data.revealedIndexes.length} ${data.revealedIndexes.length === 1 ? 'volta' : 'volte'}). Costo: 0 monete`);
          
          // Aggiorna stato manualmente (guest non riceve stato completo dal server)
          setGameState(prev => {
            let newRevealed = [...(prev.revealed || [])];
            let newRevealedLetters = {...(prev.revealedLetters || {})};
            
            // Processa ogni posizione rivelata dalla response
            data.revealedIndexes.forEach(index => {
              if (!newRevealed.includes(index)) {
                newRevealed.push(index);
                newRevealedLetters[index] = letter.toUpperCase();
              }
            });
            
            return {
              ...prev,
              revealed: newRevealed,                        // Array posizioni
              revealedLetters: newRevealedLetters          // Mappa posizione->lettera
            };
          });
        } else {
          // Lettera assente: messaggio errore gratuito
          setMessage(`❌ La lettera "${letter.toUpperCase()}" non è presente. Costo: 0 monete`);
        }
        
        // Controllo vittoria: verifica se tutte le lettere sono rivelate
        setGameState(prev => {
          const totalLetters = (prev.phraseLength || 0) - (prev.spaces || []).length;
          
          // Se tutte le lettere sono state rivelate: vittoria automatica
          if ((prev.revealed || []).length >= totalLetters && totalLetters > 0) {
            showFeedback('success', '🎉 Complimenti!', 'Hai indovinato tutte le lettere!', false, false, 'won');
            return {...prev, status: 'won'};
          }
          
          return prev; // Mantieni stato corrente se non vittoria
        });
      }
      
    } catch (error) {
      console.error('Errore API guessLetter:', error);
      // Messaggio errore generico per entrambe le modalità
      setMessage(`Errore: ${error.message}`);
      
    } finally {
      // Disattiva loading state
      setLoadingState('isSubmittingLetter', false);
      
      // Nota: Input cleanup gestito direttamente nei componenti
      // per maggiore controllo del timing di pulizia
    }
  }, [mode, gameId, getBaseEndpoint, setGameState, setUser, setMessage, setTriedLetters, setLoadingState, setUserInputs, showFeedback]);

  /**
   * API Call: Indovina frase completa
   * 
   * FUNZIONALITÀ:
   * 1. Valida tentativo frase e imposta loading state
   * 2. Esegue POST request con tentativo frase
   * 3. Gestisce tre scenari: vittoria, timeout, errore frase
   * 4. Aggiorna stato gioco appropriato per scenario
   * 5. Fornisce feedback specifico e animazioni
   * 6. Reset input frase dopo tentativo
   * 
   * SCENARI GESTITI:
   * 
   * VITTORIA (result: 'win' | status: 'won'):
   * - Authenticated: bonus +100 monete, feedback personalizzato
   * - Guest: feedback generico senza bonus
   * - Entrambi: animazione vittoria, stato 'won'
   * 
   * TIMEOUT (result: 'timeout' | status: 'timeout'):
   * - Revela frase finale dal server
   * - Stato 'timeout' con animazione appropriata
   * - Feedback con frase completa per entrambe modalità
   * 
   * ERRORE FRASE (frase sbagliata):
   * - Authenticated: penalità tempo, aggiornamento monete
   * - Guest: messaggio semplice con tempo rimanente
   * - Mantiene gioco attivo per altri tentativi
   * 
   * @param {string} attempt - Tentativo frase dell'utente
   * @param {string} currentGameId - ID partita opzionale
   */
  const apiGuessPhrase = useCallback(async (attempt, currentGameId = null) => {
    const targetGameId = currentGameId || gameId;
    
    // Guard: verifica ID partita e tentativo non vuoto
    if (!targetGameId || !attempt.trim()) return;
    
    // Attiva loading state per invio frase
    setLoadingState('isSubmittingPhrase', true);
    
    try {
      // Costruisce endpoint per tentativo frase
      const endpoint = `${getBaseEndpoint(targetGameId)}/guess-phrase`;
      
      // Esegue POST request con tentativo frase
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                           // Include session cookies
        body: JSON.stringify({ attempt })                 // Payload tentativo frase
      });
      
      // Verifica successo response
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel tentativo frase');
      }
      
      // Parse dati response dal server
      const data = await response.json();
      
      // SCENARIO: VITTORIA (frase indovinata correttamente)
      if (data.result === 'win' || data.status === 'won') {
        // Aggiorna stato gioco a vittoria con frase completa
        setGameState(prev => ({
          ...prev,
          status: 'won',                              // Stato vittoria
          phrase: data.phrase,                        // Frase completa rivelata
          timeLeft: 0                                 // Timer fermato
        }));
        
        if (mode === 'authenticated') {
          // Modalità authenticated: bonus monete e messaggio personalizzato
          showFeedback('success', '🎉 VITTORIA!', 
            `Hai indovinato la frase: "${data.phrase}". Bonus: +100 monete!`, false, false, 'won');
          triggerGameEndAnimation('won');
          
          // Applica bonus monete con delay per animazione
          setTimeout(() => {
            if (setUser) setUser(prev => ({ ...prev, coins: prev.coins + 100 }));
          }, 100);
          
        } else {
          // Modalità guest: messaggio generico senza bonus
          showFeedback('success', '🎉 Perfetto!', `Hai indovinato la frase: "${data.phrase}"`, false, false, 'won');
        }
        
      } else if (data.result === 'timeout' || data.status === 'timeout') {
        // SCENARIO: TIMEOUT (tempo scaduto durante tentativo)
        setGameState(prev => ({
          ...prev,
          status: 'timeout',                          // Stato timeout
          phrase: data.phrase                         // Frase rivelata dal server
        }));
        
        // Feedback timeout con frase per entrambe modalità
        showFeedback('error', '⏰ Tempo scaduto!', `La frase era: "${data.phrase}"`, false, false, 'timeout');
        
      } else {
        // SCENARIO: FRASE SBAGLIATA (tentativo errato)
        if (mode === 'authenticated') {
          // Modalità authenticated: penalità tempo e monete
          showFeedback('error', 'Frase sbagliata', 
            `"${attempt}" non è la frase corretta. Riprova o continua con le lettere!`, true, true);
          
          // Aggiorna tempo rimanente con penalità
          setGameState(prev => ({
            ...prev,
            timeLeft: data.timeLeft                   // Tempo penalizzato dal server
          }));
          
          // Aggiorna monete se fornite dal server
          if (data.coins !== undefined && setUser) {
            setUser(prev => ({ ...prev, coins: data.coins }));
          }
          
        } else {
          // Modalità guest: messaggio semplice con stile notification (in alto a destra)
          showFeedback('error', 'Frase sbagliata', 
            `"${attempt}" non è corretta. Tempo: ${Math.floor((data.timeLeft || 0) / 1000)}s`, true, true);
        }
      }
      
      // Reset input frase dopo tentativo (pulisce campo per nuovo input)
      if (mode === 'authenticated' && setUserInputs) {
        setUserInputs(prev => ({ ...prev, phraseInput: '' }));
      } else if (mode === 'guest' && setPhraseGuess) {
        // Modalità guest: pulizia campo frase dopo tentativo
        setPhraseGuess('');
      }
      
    } catch (error) {
      console.error('Errore API guessPhrase:', error);
      
      // Feedback errore appropriato per modalità
      if (mode === 'authenticated') {
        showFeedback('error', 'Errore di connessione', 
          `Impossibile inviare la frase: ${error.message}`);
      } else {
        setMessage('Errore di connessione: ' + error.message);
      }
      
    } finally {
      // Disattiva loading state per invio frase
      setLoadingState('isSubmittingPhrase', false);
    }
  }, [mode, gameId, getBaseEndpoint, setGameState, setUser, showFeedback, triggerGameEndAnimation, setMessage, setUserInputs, setLoadingState]);

  /**
   * API Call: Abbandona partita corrente
   * 
   * FUNZIONALITÀ:
   * 1. Valida ID partita e imposta loading abbandono
   * 2. Esegue POST request a endpoint abbandono
   * 3. Aggiorna stato gioco a 'abandoned'
   * 4. Rivela frase finale dal server response
   * 5. Fornisce feedback con frase per entrambe modalità
   * 6. Attiva animazione sconfitta ('lost')
   * 
   * COMPORTAMENTO UNIFIED:
   * - Stesso endpoint pattern per entrambe modalità
   * - Stesso feedback con frase rivelata
   * - Stessa animazione di fine gioco
   * - Stesso stato finale 'abandoned'
   * 
   * DIFFERENZE MODALITÀ:
   * - Authenticated: gestione monete se presente in response
   * - Guest: nessuna gestione monete aggiuntiva
   * 
   * @param {string} currentGameId - ID partita opzionale (fallback su gameId)
   */
  const apiAbandonGame = useCallback(async (currentGameId = null) => {
    const targetGameId = currentGameId || gameId;
    
    // Guard: verifica presenza ID partita
    if (!targetGameId) return;
    
    // Attiva loading state per abbandono
    setLoadingState('abandoning', true);
    
    try {
      // Costruisce endpoint per abbandono partita
      const endpoint = `${getBaseEndpoint(targetGameId)}/abandon`;
      
      // Esegue POST request per abbandono
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'                        // Include session cookies
      });
      
      // Verifica successo response
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'abbandono');
      }
      
      // Parse dati response con frase finale
      const data = await response.json();
      
      // Aggiorna stato gioco a partita abbandonata
      setGameState(prev => ({
        ...prev,
        status: 'abandoned',                          // Stato abbandono
        phrase: data.phrase,                          // Frase rivelata dal server
        timeLeft: 0                                   // Timer fermato
      }));
      
      // Mostra messaggio abbandono per entrambe le modalità
      if (mode === 'authenticated') {
        // Piccolo ritardo per evitare sovrascritture da altri feedback
        setTimeout(() => {
          showFeedback('warning', 'Partita abbandonata!', `La frase era: "${data.phrase}"`, false, false, 'abandoned');
        }, 100);
      } else {
        // Per guest mode: uso showFeedback invece di setMessage per coerenza
        showFeedback('warning', 'Partita abbandonata', `La frase era: "${data.phrase}"`, false, false, 'abandoned');
      }
      
      // Attiva animazione sconfitta
      triggerGameEndAnimation('lost');
      
    } catch (error) {
      console.error('Errore API abandonGame:', error);
      
      // Feedback errore appropriato per modalità
      if (mode === 'authenticated') {
        showFeedback('error', 'Errore nell\'abbandono', error.message, false);
      } else {
        setMessage('Errore nell\'abbandono: ' + error.message);
      }
      
    } finally {
      // Disattiva loading state abbandono
      setLoadingState('abandoning', false);
    }
  }, [mode, gameId, getBaseEndpoint, setGameState, showFeedback, triggerGameEndAnimation, setMessage, setLoadingState]);

  // SEZIONE: EXPORT HOOK
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Return object: Esportazione funzioni API
   * 
   * FUNZIONI ESPORTATE:
   * - apiGuessLetter: Indovinamento lettere singole con feedback immediato
   * - apiGuessPhrase: Indovinamento frase completa con gestione scenari multipli
   * - apiAbandonGame: Abbandono partita con rivelazione frase finale
   * 
   * UTILIZZO NEI COMPONENTI:
   * - Game.jsx: modalità authenticated con gestione monete
   * - GuestGame.jsx: modalità guest con logica semplificata
   * 
   * VANTAGGI CENTRALIZZAZIONE:
   * Eliminazione duplicazione codice (120+ righe risparmiate)
   * Gestione errori unificata e consistente
   * Endpoint configuration centralizzata
   * Testing isolato delle API calls
   * Manutenzione semplificata per modifiche future
   */
  return {
    apiGuessLetter,        // Funzione indovinamento lettera
    apiGuessPhrase,        // Funzione indovinamento frase
    apiAbandonGame         // Funzione abbandono partita
  };
};

export default useApiCalls;
