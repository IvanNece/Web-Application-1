/*
 * ========================================
 * SISTEMA DI COSTI LETTERE - INDOVINA LA FRASE
 * ========================================
 * 
 * Gestisce il calcolo dei costi BASE per le lettere nel gioco.
 * Implementa un sistema basato sulla frequenza delle lettere in inglese
 * per bilanciare il gameplay e la gestione delle monete.
 * 
 * LOGICA COMPLETA DEI COSTI:
 * 1. Questo file calcola il COSTO BASE per ogni lettera
 * 2. In games.js viene applicata la logica finale:
 *    - Lettera PRESENTE nella frase: costo base
 *    - Lettera ASSENTE (miss): costo base * 2 (PENALITÀ RADDOPPIO)
 * 
 * STRATEGIA DI GIOCO:
 * - Vocali: alto rischio/alto reward (10 base, 20 se sbagli)
 * - Consonanti frequenti: rischio medio (es. T = 5 base, 10 se sbagli)  
 * - Consonanti rare: basso rischio (es. Z = 1 base, 2 se sbagli)
 */

// ==========================================
// CONFIGURAZIONE VOCALI
// ==========================================
// Vocali hanno costo fisso di 10 monete (una sola vocale per partita)
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// ==========================================
// FASCE DI COSTO CONSONANTI
// ==========================================
// Costi basati sulle frequenze delle lettere in inglese (fonte: STTMedia)
// Logica: lettere più frequenti = costo maggiore per bilanciare il gioco
// Ordine frequenza (alta -> bassa): T N H S | R L D C | M W Y F | G P B V | K J X Q Z
const GROUPS = {
  5: ['T', 'N', 'H', 'S'],    // Lettere più frequenti (costo alto)
  4: ['R', 'L', 'D', 'C'],    // Frequenza alta
  3: ['M', 'W', 'Y', 'F'],    // Frequenza media
  2: ['G', 'P', 'B', 'V'],    // Frequenza bassa
  1: ['K', 'J', 'X', 'Q', 'Z'] // Lettere rare (costo basso)
};

// ==========================================
// MAPPA DEI COSTI
// ==========================================
// Costruisce una mappa per lookup rapido del costo di ogni lettera
const COSTS = new Map();
for (const [cost, letters] of Object.entries(GROUPS)) {
  for (const ch of letters) COSTS.set(ch, Number(cost));
}

// ==========================================
// FUNZIONI ESPORTATE
// ==========================================

/**
 * Verifica se una lettera è una vocale
 * @param {string} ch - Lettera da verificare
 * @returns {boolean} True se è una vocale
 */
export function isVowel(ch) {
  return VOWELS.has(String(ch).toUpperCase());
}

/**
 * Calcola il costo BASE per tentare una specifica lettera
 * 
 * IMPORTANTE: Questo è solo il costo base! Il costo finale viene calcolato in games.js:
 * - Se la lettera è PRESENTE nella frase: costo base (questo valore)
 * - Se la lettera è ASSENTE (miss): costo base * 2 (raddoppiato come penalità)
 * 
 * 
 * @param {string} ch - Lettera da valutare
 * @returns {number} Costo BASE in monete (10 per vocali, 1-5 per consonanti)
 */
export function costForLetter(ch) {
  const up = String(ch).toUpperCase();
  if (isVowel(up)) return 10;      // Vocali: costo base fisso alto
  return COSTS.get(up) ?? 5;       // Consonanti: costo base variabile (default prudente)
}
