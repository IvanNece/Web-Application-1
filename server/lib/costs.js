/*
 * ========================================
 * SISTEMA DI COSTI LETTERE - INDOVINA LA FRASE
 * ========================================
 * 
 * Gestisce il calcolo dei costi per le lettere nel gioco
 * Implementa un sistema basato sulla frequenza delle lettere in inglese
 * per bilanciare il gameplay e la gestione delle monete
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
 * Calcola il costo per tentare una specifica lettera
 * @param {string} ch - Lettera da valutare
 * @returns {number} Costo in monete (10 per vocali, 1-5 per consonanti)
 */
export function costForLetter(ch) {
  const up = String(ch).toUpperCase();
  if (isVowel(up)) return 10;      // Vocali: costo fisso alto
  return COSTS.get(up) ?? 5;       // Consonanti: costo variabile (default prudente)
}
