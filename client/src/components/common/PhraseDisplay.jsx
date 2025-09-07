/**
 * PHRASEDISPLAY.JSX - COMPONENTE VISUALIZZAZIONE FRASE
 * 
 * SCOPO:
 * Componente che gestisce la visualizzazione della griglia frase
 * con lettere rivelate/nascoste, spazi e stati del gioco.
 * Adatta il rendering in base allo stato partita corrente.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Griglia dinamica lettere frase
 * - Gestione lettere rivelate/nascoste
 * - Visualizzazione spazi tra parole
 * - Stati gioco (caricamento, in corso, finito)
 * - Rendering finale frase completa
 * - Fallback per modalità autenticata/ospite
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Display con persistenza stato
 * - 'guest': Display semplificato senza persistenza
 * 
 * PROPS RICEVUTE:
 * - gameState: Stato corrente del gioco con frase e status
 * - revealed: Array lettere già rivelate
 * - getRevealedLetterAtPosition: Funzione ottenimento lettera posizione
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * 
 * STATI VISUALIZZAZIONE:
 * - 'loading': Messaggio caricamento
 * - 'running': Griglia con lettere rivelate/nascoste
 * - 'won'/'timeout'/'abandoned': Frase completa rivelata
 * 
 * LOGICA RENDERING:
 * - renderPhraseGrid(): Griglia principale con stati
 * - Gestione caratteri speciali e spazi
 * - Mappatura posizioni con chiavi uniche
 * 
 * STILI CSS:
 * Utilizza phrase-display.css per griglia e stati celle.
 */

import { memo, useMemo } from 'react';
import useGameTransitions from '../../hooks/useGameTransitions';

const PhraseDisplay = ({ 
  gameState,
  revealed = [],
  getRevealedLetterAtPosition,
  mode = 'authenticated' // 'authenticated' | 'guest'
}) => {
  const isGameRunning = gameState?.status === 'running';
  
  // HOOK TRANSIZIONI: Gestione animazioni fluide fine gioco
  const {
    transitionState,
    isRevealing,
    showFinalPhrase,
    revealProgress,
    shouldShowGame,
    shouldShowFinal
  } = useGameTransitions(gameState);

  /**
   * Calcola layout intelligente per griglia su due righe
   * 
   * ALGORITMO LAYOUT PAROLE MIGLIORATO:
   * 1. Identifica parole complete basandosi sui spazi
   * 2. Mantiene sempre l'integrità delle parole (nessuna parola spezzata)
   * 3. Distribuisce parole intere tra righe per bilanciamento visivo
   * 4. Spazi seguono sempre la parola che li precede
   * 
   * REGOLE FERREE:
   * - Nessuna parola mai spezzata tra righe
   * - Ogni parola (con spazi associati) va completamente su una riga
   * - Distribuzione bilanciata ma rispettando l'integrità delle parole
   * - Spazi sempre associati alla parola precedente
   * 
   * @returns {Object} Layout con firstRow e secondRow arrays
   */
  const calculateIntelligentLayout = () => {
    if (!gameState.phraseLength || !gameState.spaces) {
      return { firstRow: [], secondRow: [] };
    }

    // Identifica le parole in base agli spazi
    const words = [];
    let currentWordPositions = [];
    let currentWordStart = 0;

    for (let i = 0; i < gameState.phraseLength; i++) {
      if (gameState.spaces.includes(i)) {
        // Fine parola corrente - aggiungi la parola se non è vuota
        if (currentWordPositions.length > 0) {
          words.push({
            start: currentWordStart,
            positions: [...currentWordPositions],
            length: currentWordPositions.length,
            hasTrailingSpace: true,
            spacePosition: i
          });
          currentWordPositions = [];
        }
        currentWordStart = i + 1;
      } else {
        // Lettera della parola
        currentWordPositions.push(i);
        if (currentWordPositions.length === 1) currentWordStart = i;
      }
    }

    // Aggiungi ultima parola se non termina con spazio
    if (currentWordPositions.length > 0) {
      words.push({
        start: currentWordStart,
        positions: [...currentWordPositions],
        length: currentWordPositions.length,
        hasTrailingSpace: false
      });
    }

    // Distribuzione intelligente parole complete su due righe
    const totalPositions = gameState.phraseLength;
    const targetFirstRowLength = Math.ceil(totalPositions / 2);
    
    let firstRowLength = 0;
    let firstRowWords = [];
    let secondRowWords = [];

    for (const word of words) {
      // Calcola lunghezza totale parola + spazio (se presente)
      const wordFullLength = word.positions.length + (word.hasTrailingSpace ? 1 : 0);
      const lengthIfAdded = firstRowLength + wordFullLength;
      
      // Decisione: prima riga o seconda riga
      // Regola principale: non superare il target + tolleranza
      // Se siamo oltre la metà, va automaticamente sulla seconda riga
      if (lengthIfAdded <= targetFirstRowLength + 2 && firstRowLength < targetFirstRowLength) {
        // Parola va alla prima riga
        firstRowWords.push(word);
        firstRowLength = lengthIfAdded;
      } else {
        // Parola va alla seconda riga
        secondRowWords.push(word);
      }
    }

    // Converte words in arrays di posizioni, includendo spazi
    const firstRow = [];
    const secondRow = [];

    firstRowWords.forEach(word => {
      // Aggiungi posizioni della parola
      firstRow.push(...word.positions);
      // Aggiungi spazio se presente
      if (word.hasTrailingSpace) {
        firstRow.push(word.spacePosition);
      }
    });

    secondRowWords.forEach(word => {
      // Aggiungi posizioni della parola
      secondRow.push(...word.positions);
      // Aggiungi spazio se presente
      if (word.hasTrailingSpace) {
        secondRow.push(word.spacePosition);
      }
    });

    return { firstRow, secondRow };
  };

  // MEMO OPTIMIZATIONS: Memorizzo il calcolo del layout per performance
  const layoutResult = useMemo(() => {
    return calculateIntelligentLayout();
  }, [gameState.phraseLength, gameState.spaces]);

  // Rendering griglia frase principale con gestione stati e transizioni
  const renderPhraseGrid = () => {
    // Stato caricamento - placeholder informativo
    if (gameState.status === 'loading') {
      return <div className="phrase-grid loading">Caricamento...</div>;
    }
    
    // NUOVO: Gestione stati transizione per animazioni fluide
    const isGameEnded = ['won', 'timeout', 'abandoned'].includes(gameState.status);
    
    // Durante transizione: mostra stato intermedio
    if (isGameEnded && transitionState === 'transitioning') {
      return renderGameGrid(true); // Grid normale ma con classe transitioning
    }
    
    // Durante reveal progressivo: animazione staggered
    if (isGameEnded && (transitionState === 'revealing' || transitionState === 'completed')) {
      return renderFinalPhraseWithAnimation();
    }
    
    // Gioco in corso normale - griglia standard
    return renderGameGrid(false);
  };

  // Rendering griglia durante gioco normale
  const renderGameGrid = (isTransitioning = false) => {
    const { firstRow, secondRow } = layoutResult;
    
    // Calcolo classe ridimensionamento dinamico basato su lunghezza frase
    const getGridSizeClass = () => {
      const totalLength = gameState.phraseLength || 0;
      if (totalLength > 70) return 'phrase-extra-long';
      if (totalLength > 60) return 'phrase-very-long';
      if (totalLength > 40) return 'phrase-long';
      return '';
    };
    
    const baseClasses = `phrase-grid intelligent-layout ${getGridSizeClass()}`;
    const transitionClass = isTransitioning ? 'transitioning' : '';
    const gridClass = `${baseClasses} ${transitionClass}`.trim();
    
    const renderRow = (positions, rowClass) => (
      <div className={`phrase-row ${rowClass}`}>
        {positions.map(i => {
          const isSpace = gameState.spaces?.includes(i);
          const isRevealed = gameState.revealed?.includes(i);
          
          let cellContent = '';
          let cellClass = `phrase-cell ${isSpace ? 'space' : ''}`;
          
          // Aggiungi classe transitioning se necessario
          if (isTransitioning && !isSpace) {
            cellClass += ' transitioning';
          }
          
          // Gestione spazi tra parole
          if (isSpace) {
            cellContent = '';
            cellClass = 'phrase-cell space';
          } 
          // Gestione lettere rivelate con contenuto dinamico
          else if (isRevealed) {
            const revealedLetter = getRevealedLetterAtPosition ? getRevealedLetterAtPosition(i) : null;
            if (revealedLetter) {
              cellContent = revealedLetter;
              cellClass = 'phrase-cell revealed';
            } else {
              cellContent = '●';
              cellClass = 'phrase-cell revealed';
            }
          } 
          // Lettere nascoste - celle vuote con placeholder
          else {
            cellContent = '';
            cellClass = 'phrase-cell';
          }
          
          return (
            <div key={i} className={cellClass}>
              {cellContent}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className={gridClass}>
        {firstRow.length > 0 && renderRow(firstRow, 'first-row')}
        {secondRow.length > 0 && renderRow(secondRow, 'second-row')}
      </div>
    );
  };

  // Rendering frase finale con animazione staggered
  const renderFinalPhraseWithAnimation = () => {
    const getGridSizeClass = () => {
      const totalLength = gameState.phraseLength || 0;
      if (totalLength > 70) return 'phrase-extra-long';
      if (totalLength > 60) return 'phrase-very-long';
      if (totalLength > 40) return 'phrase-long';
      return '';
    };
    
    const baseClasses = `phrase-grid intelligent-layout ${getGridSizeClass()}`;
    const stateClass = transitionState === 'completed' ? 'completed' : 'revealing';
    const gridClass = `${baseClasses} ${stateClass}`.trim();
    
    const { firstRow, secondRow } = calculateIntelligentLayout();
    
    const renderAnimatedRow = (positions, rowClass) => (
      <div className={`phrase-row ${rowClass}`}>
        {positions.map((i, index) => {
          const isSpace = gameState.spaces?.includes(i);
          const char = isSpace ? '' : (gameState.phrase?.[i] || '').toUpperCase();
          
          let cellClass = `phrase-cell ${isSpace ? 'space' : 'final-revealed'}`;
          
          // Aggiungi animazione staggered solo alle lettere
          if (!isSpace && isRevealing) {
            cellClass += ' final-revealing';
          }
          
          const style = !isSpace && isRevealing ? {
            '--reveal-delay': `${index * 50}ms` // Stagger di 50ms per lettera
          } : {};
          
          return (
            <div key={i} className={cellClass} style={style}>
              {char}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className={gridClass}>
        {firstRow.length > 0 && renderAnimatedRow(firstRow, 'first-row')}
        {secondRow.length > 0 && renderAnimatedRow(secondRow, 'second-row')}
      </div>
    );
  };

  // Calcolo percentuale progresso lettere rivelate
  const calculateProgress = () => {
    if (!gameState.revealed || !gameState.phraseLength || !gameState.spaces) {
      return 0;
    }
    const totalLetters = gameState.phraseLength - gameState.spaces.length;
    return totalLetters > 0 ? (gameState.revealed.length / totalLetters) * 100 : 0;
  };

  return (
    <div className="phrase-section">
      {/* Header sezione con contatore lettere rivelate */}
      <h3>
        <span className="phrase-progress">
          {isGameRunning ? 
            `(${gameState.revealed?.length || 0}/${(gameState.phraseLength || 0) - (gameState.spaces?.length || 0)} lettere rivelate)` :
            'Risultato Finale:'
          }
        </span>
      </h3>
      
      {/* Barra progresso visiva per gioco in corso */}
      {isGameRunning && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${calculateProgress()}%`
            }}
          ></div>
        </div>
      )}
      
      {/* Griglia frase principale */}
      {renderPhraseGrid()}
    </div>
  );
};

export default memo(PhraseDisplay);
