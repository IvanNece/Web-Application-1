/**
 * GAMECONTROLS.JSX - COMPONENTE CONTROLLI GIOCO
 * 
 * SCOPO:
 * Componente per input utente che gestisce i controlli principali
 * del gioco: inserimento lettere singole e tentativo frase completa.
 * Supporta modalità autenticata con sistema costi e modalità ospite.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Input lettera singola con validazione
 * - Input frase completa con validazione
 * - Sistema costi lettere (solo modalità auth)
 * - Gestione vocali con limitazioni (modalità auth)
 * - Feedback visivo stato caricamento
 * - Pulsanti submit con stati disabilitazione
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Controlli con sistema costi e limitazioni
 * - 'guest': Controlli semplificati senza costi
 * 
 * PROPS RICEVUTE:
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - letterInput: Valore input lettera corrente
 * - phraseInput: Valore input frase corrente
 * - onLetterChange: Callback modifica input lettera
 * - onPhraseChange: Callback modifica input frase
 * - onLetterSubmit: Callback submit lettera
 * - onPhraseSubmit: Callback submit frase
 * - isSubmittingLetter: Flag stato invio lettera
 * - isSubmittingPhrase: Flag stato invio frase
 * - getLetterCost: Funzione calcolo costo lettera
 * - isVowel: Funzione verifica se lettera è vocale
 * - hasUsedVowel: Flag utilizzo vocale (modalità auth)
 * - loading: Flag stati di caricamento
 * 
 * GESTIONE EVENTI:
 * - handleLetterKeyPress(): Enter per submit lettera
 * - handlePhraseKeyPress(): Enter per submit frase
 * 
 * STILI CSS:
 * Utilizza game-interface.css per styling controlli e input.
 */

import { memo } from 'react';

const GameControls = ({ 
  mode = 'authenticated', // 'authenticated' | 'guest'
  letterInput,
  phraseInput,
  onLetterChange,
  onPhraseChange,
  onLetterSubmit,
  onPhraseSubmit,
  isSubmittingLetter = false,
  isSubmittingPhrase = false,
  getLetterCost,
  isVowel,
  hasUsedVowel = false,
  loading = false
}) => {
  const isGuest = mode === 'guest';

  // Gestione evento Enter su input lettera per submit automatico
  const handleLetterKeyPress = (e) => {
    if (e.key === 'Enter' && onLetterSubmit) {
      onLetterSubmit();
    }
  };

  // Gestione evento Enter su input frase per submit automatico
  const handlePhraseKeyPress = (e) => {
    if (e.key === 'Enter' && onPhraseSubmit) {
      onPhraseSubmit();
    }
  };

  return (
    <div className="unified-input-section">
      {/* Sezione sinistra - Input lettera singola con costi e validazione */}
      <div className="letter-input-section">
        <h4>Indovina una lettera</h4>
        <div className="input-group">
          {/* Input lettera con conversione automatica maiuscole */}
          <input
            type="text"
            value={letterInput}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().slice(-1); // Forza maiuscole, max 1 carattere
              if (onLetterChange) onLetterChange(value);
            }}
            maxLength={1}
            className="letter-input"
            disabled={isSubmittingLetter || loading}
            onKeyPress={handleLetterKeyPress}
          />
          {/* Pulsante submit lettera con validazione stato */}
          <button 
            onClick={onLetterSubmit}
            disabled={isSubmittingLetter || loading || !letterInput.trim()}
            className="guess-letter-btn"
            title="Prova lettera"
          >
            →
          </button>
        </div>
        
        {/* Anteprima costo lettera con avvisi speciali vocali - sempre presente per evitare spostamenti */}
        <div className="cost-preview">
          {letterInput ? (
            isGuest ? (
              'Costo: GRATIS'
            ) : (
              <>
                {(() => {
                  const cost = getLetterCost ? getLetterCost(letterInput) : 0;
                  const costText = `Costo: ${cost} ${cost === 1 ? 'moneta' : 'monete'}`;
                  const hasVowelWarning = isVowel && isVowel(letterInput) && !hasUsedVowel;
                  
                  if (hasVowelWarning) {
                    return (
                      <>
                        {costText}{'\u00A0'}
                        <span className="vowel-warning">(Unica vocale!)</span>
                      </>
                    );
                  }
                  
                  return costText;
                })()}
              </>
            )
          ) : (
            // Spazio riservato quando non c'è input per evitare spostamenti
            '\u00A0' // Non-breaking space
          )}
        </div>
      </div>

      {/* Sezione destra - Input frase completa per tentativo finale */}
      <div className="phrase-input-section">
        <h4>Indovina la frase</h4>
        <div className="input-group">
          {/* Input frase completa senza restrizioni caratteri */}
          <input
            type="text"
            value={phraseInput}
            onChange={(e) => {
              if (onPhraseChange) onPhraseChange(e.target.value);
            }}
            className="phrase-input"
            disabled={isSubmittingPhrase || loading}
            onKeyPress={handlePhraseKeyPress}
          />
          {/* Pulsante submit frase con reward info nel tooltip */}
          <button 
            onClick={onPhraseSubmit}
            disabled={isSubmittingPhrase || loading || !phraseInput.trim()}
            className="guess-phrase-btn"
            title={isGuest ? "Prova frase completa" : "Prova frase (+100 monete)"}
          >
            ✓
          </button>
        </div>
        
        {/* Spazio riservato per allineamento visivo con sezione sinistra */}
        <div className="cost-preview" style={{visibility: 'hidden', minHeight: '20px'}}>
          {isGuest ? 'Gratis' : 'Placeholder'}
        </div>
      </div>
    </div>
  );
};

export default memo(GameControls);
