/**
 * USEGAMETRANSITIONS.JS - HOOK TRANSIZIONI GIOCO
 * 
 * SCOPO:
 * Hook personalizzato per gestire transizioni fluide tra stati del gioco,
 * eliminando cambi bruschi e creando animazioni coordinate per UX migliore.
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * - Transizioni fluide fine gioco (vittoria/timeout/abbandono)
 * - Animazioni coordinate banner + griglia
 * - Reveal progressivo lettere finali (stagger effect)
 * - Gestione stati intermedi per transizioni smooth
 * - Pattern fade-in/fade-out per elementi UI
 * 
 * STATI TRANSIZIONE:
 * - 'running': Gioco in corso normale
 * - 'transitioning': Stato intermedio durante cambio
 * - 'revealing': Animazione reveal lettere finali
 * - 'completed': Transizione completata
 * 
 * PATTERN UTILIZZATI:
 * - State Machine semplificato per transizioni
 * - Delayed state updates per animazioni coordinate
 * - Cleanup automatico timeout per memory leaks
 * 
 * @param {Object} gameState - Stato corrente del gioco
 * @returns {Object} Stati transizione e controlli animazione
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useGameTransitions = (gameState) => {
  // STATI TRANSIZIONE
  const [transitionState, setTransitionState] = useState('running');
  const [isRevealing, setIsRevealing] = useState(false);
  const [showFinalPhrase, setShowFinalPhrase] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  
  // REFS per cleanup timeout
  const timeoutsRef = useRef([]);
  
  // CLEANUP: Cancella tutti i timeout attivi
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);
  
  // HELPER: Aggiunge timeout con auto-cleanup
  const addTimeout = useCallback((callback, delay) => {
    const timeout = setTimeout(() => {
      callback();
      // Rimuovi timeout dalla lista
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== timeout);
    }, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);
  
  // TRIGGER: Avvia sequenza transizione fine gioco
  const triggerGameEndTransition = useCallback((endType) => {
    if (transitionState !== 'running') return; // Evita transizioni multiple
    
    console.log('🎬 Inizio transizione fine gioco:', endType);
    
    // FASE 1: Stato transitioning (fade out elementi correnti)
    setTransitionState('transitioning');
    
    // FASE 2: Inizio reveal dopo breve pausa (300ms)
    addTimeout(() => {
      setIsRevealing(true);
      setTransitionState('revealing');
      console.log('✨ Inizio reveal progressivo lettere');
      
      // FASE 3: Animazione progressiva reveal (1000ms con stagger)
      const totalDuration = 1000;
      const steps = 20; // 20 step per animazione fluida
      const stepDuration = totalDuration / steps;
      
      for (let i = 0; i <= steps; i++) {
        addTimeout(() => {
          const progress = (i / steps) * 100;
          setRevealProgress(progress);
          
          // Ultimo step: mostra frase completa
          if (i === steps) {
            setShowFinalPhrase(true);
            console.log('🎉 Frase finale rivelata');
          }
        }, i * stepDuration);
      }
      
      // FASE 4: Transizione completata (dopo reveal + 200ms pausa)
      addTimeout(() => {
        setTransitionState('completed');
        console.log('✅ Transizione completata');
      }, totalDuration + 200);
      
    }, 300);
    
  }, [transitionState, addTimeout]);
  
  // RESET: Reset stati per nuova partita
  const resetTransition = useCallback(() => {
    clearAllTimeouts();
    setTransitionState('running');
    setIsRevealing(false);
    setShowFinalPhrase(false);
    setRevealProgress(0);
    console.log('🔄 Reset transizioni per nuova partita');
  }, [clearAllTimeouts]);
  
  // EFFECT: Monitor cambi stato gioco per trigger automatico
  useEffect(() => {
    const endStates = ['won', 'timeout', 'abandoned'];
    
    if (endStates.includes(gameState?.status) && transitionState === 'running') {
      triggerGameEndTransition(gameState.status);
    }
  }, [gameState?.status, transitionState, triggerGameEndTransition]);
  
  // EFFECT: Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
  
  // EFFECT: Reset automatico su cambio gameId (nuova partita)
  useEffect(() => {
    if (gameState?.status === 'running' && transitionState !== 'running') {
      resetTransition();
    }
  }, [gameState?.gameId, gameState?.status, transitionState, resetTransition]);
  
  return {
    // STATI TRANSIZIONE
    transitionState,      // 'running' | 'transitioning' | 'revealing' | 'completed'
    isRevealing,         // Boolean: animazione reveal in corso
    showFinalPhrase,     // Boolean: mostra frase completa
    revealProgress,      // Number: progresso reveal 0-100
    
    // CONTROLLI MANUALI
    triggerGameEndTransition,  // Trigger manuale transizione
    resetTransition,           // Reset manuale per nuova partita
    
    // HELPER STATI CSS
    isTransitioning: transitionState === 'transitioning',
    isCompleted: transitionState === 'completed',
    shouldShowGame: transitionState === 'running' || transitionState === 'transitioning',
    shouldShowFinal: transitionState === 'revealing' || transitionState === 'completed'
  };
};

export default useGameTransitions;
