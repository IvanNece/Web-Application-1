/**
 * VIRTUALKEYBOARD.JSX - COMPONENTE TASTIERA VIRTUALE
 * 
 * SCOPO:
 * Tastiera on-screen per selezione lettere con sistema costi,
 * separazione vocali/consonanti e feedback visivo stati lettere.
 * Ottimizzata per modalità autenticata con limitazioni e guest illimitata.
 * 
 * FUNZIONALITA PRINCIPALI:
 * - Tastiera virtuale divisa vocali/consonanti
 * - Sistema costi differenziato per tipo lettera
 * - Tracking lettere già tentate
 * - Limitazione vocali modalità autenticata
 * - Feedback visivo stato lettere
 * - Disabilitazione automatica lettere inappropriate
 * 
 * MODALITA SUPPORTATE:
 * - 'authenticated': Tastiera con costi e limitazioni vocali
 * - 'guest': Tastiera gratuita senza limitazioni
 * 
 * PROPS RICEVUTE:
 * - mode: Modalità operativa ('authenticated' | 'guest')
 * - onLetterClick: Callback click lettera
 * - triedLetters: Array lettere già tentate
 * - userCoins: Monete utente per verifica affordability
 * - hasUsedVowel: Flag utilizzo vocale (modalità auth)
 * - getLetterCost: Funzione calcolo costo lettera
 * - isVowel: Funzione verifica vocale
 * - isSubmitting: Flag stato invio in corso
 * 
 * LOGICA LETTERE:
 * - Vocali: A, E, I, O, U (10 monete, max 1 per partita auth)
 * - Consonanti: Resto alfabeto (5 monete)
 * - Stati: normale, già tentata, insufficienti monete, disabilitata
 * 
 * GESTIONE EVENTI:
 * - handleLetterClick(): Click lettera con validazione costi
 * 
 * STILI CSS:
 * Utilizza virtual-keyboard.css per layout e stati pulsanti.
 */

import { memo } from 'react';

const VirtualKeyboard = ({ 
  mode = 'authenticated', // 'authenticated' | 'guest'
  onLetterClick, 
  triedLetters, 
  userCoins = 0, 
  hasUsedVowel = false,
  getLetterCost,
  isVowel,
  isSubmitting = false 
}) => {
  const isGuest = mode === 'guest';

  // Gestione click lettera con invio al componente padre
  const handleLetterClick = (letter) => {
    if (onLetterClick) {
      onLetterClick(letter);
    }
  };

  return (
    <div className="virtual-keyboard">
      <h4>Clicca su una lettera per tentarla:</h4>
      
      {/* Sezione vocali con informazioni costi e limitazioni */}
      <div className="keyboard-section vowels">
        <h5>
          {isGuest 
            ? 'Vocali (GRATUITE - illimitate per ospiti)' 
            : `Vocali (10 monete ${hasUsedVowel ? '- già usata' : '- solo 1 per partita'})`
          }
        </h5>
        <div className="keyboard-row">
          {['A', 'E', 'I', 'O', 'U'].map(letter => {
            const cost = isGuest ? 0 : (getLetterCost ? getLetterCost(letter) : 10);
            const tried = triedLetters.has(letter.toLowerCase());
            const disabled = tried || 
              (!isGuest && isVowel && isVowel(letter) && hasUsedVowel) || 
              (!isGuest && userCoins < cost);
            const cannotAfford = !isGuest && userCoins < cost;
            
            return (
              <button
                key={letter}
                className={`keyboard-key vowel ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''} ${cannotAfford ? 'no-coins' : ''}`}
                onClick={() => handleLetterClick(letter)}
                disabled={disabled || isSubmitting}
                title={`${letter} - ${isGuest ? 'GRATIS' : `${cost} monete`}${tried ? ' (già tentata)' : disabled ? ' (disabilitata)' : ''}`}
              >
                <span className="letter">{letter}</span>
                {!isGuest && <span className="cost">{cost}</span>}
              </button>
            );
          })}
        </div>
        {!isGuest && hasUsedVowel && (
          <div className="vowel-used-notice">✓ Vocale già utilizzata in questa partita</div>
        )}
      </div>
      
      {/* Consonanti per costo */}
      {[
        { cost: 5, letters: ['T', 'N', 'H', 'S'], label: isGuest ? 'Consonanti frequenti (GRATUITE)' : 'Consonanti frequenti (5 monete)' },
        { cost: 4, letters: ['R', 'L', 'D', 'C'], label: isGuest ? 'Consonanti comuni (GRATUITE)' : 'Consonanti comuni (4 monete)' },
        { cost: 3, letters: ['M', 'W', 'Y', 'F'], label: isGuest ? 'Consonanti medie (GRATUITE)' : 'Consonanti medie (3 monete)' },
        { cost: 2, letters: ['G', 'P', 'B', 'V'], label: isGuest ? 'Consonanti meno frequenti (GRATUITE)' : 'Consonanti meno frequenti (2 monete)' },
        { cost: 1, letters: ['K', 'J', 'X', 'Q', 'Z'], label: isGuest ? 'Consonanti rare (GRATUITE)' : 'Consonanti rare (1 moneta)' }
      ].map((group, index) => (
        <div key={index} className="keyboard-section consonants">
          <h5>{group.label}</h5>
          <div className="keyboard-row">
            {group.letters.map(letter => {
              const cost = isGuest ? 0 : (getLetterCost ? getLetterCost(letter) : group.cost);
              const tried = triedLetters.has(letter.toLowerCase());
              const disabled = tried || (!isGuest && userCoins < cost);
              const cannotAfford = !isGuest && userCoins < cost;
              
              return (
                <button
                  key={letter}
                  className={`keyboard-key consonant cost-${group.cost} ${tried ? 'tried' : ''} ${disabled ? 'disabled' : ''} ${cannotAfford ? 'no-coins' : ''}`}
                  onClick={() => handleLetterClick(letter)}
                  disabled={disabled || isSubmitting}
                  title={`${letter} - ${isGuest ? 'GRATIS' : `${cost} monete`}${tried ? ' (già tentata)' : cannotAfford ? ' (monete insufficienti)' : ''}`}
                >
                  <span className="letter">{letter}</span>
                  {!isGuest && <span className="cost">{cost}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="keyboard-info">
        <div className="cost-warning">
          {isGuest 
            ? '✨ Modalità Ospite: Tutte le lettere sono gratuite!'
            : '⚠️ Ricorda: Se la lettera non è presente nella frase, il costo viene raddoppiato!'
          }
        </div>
        <div className="coins-available">
          {isGuest 
            ? '🎮 Nessun costo - Gioco completamente gratuito'
            : `💰 Monete disponibili: ${userCoins}`
          }
        </div>
      </div>
    </div>
  );
};

export default memo(VirtualKeyboard);
