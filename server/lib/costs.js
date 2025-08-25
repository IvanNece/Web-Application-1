// server/lib/costs.js

// Vocali fisse a 10 (una sola per partita)
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Fasce di costo per consonanti (fondate sulle frequenze STTMedia):
// Ordine frequenza (alto -> basso): T N H S | R L D C | M W Y F | G P B V | K J X Q Z
const GROUPS = {
  5: ['T', 'N', 'H', 'S'],
  4: ['R', 'L', 'D', 'C'],
  3: ['M', 'W', 'Y', 'F'],
  2: ['G', 'P', 'B', 'V'],
  1: ['K', 'J', 'X', 'Q', 'Z'],
};

const COSTS = new Map();
for (const [cost, letters] of Object.entries(GROUPS)) {
  for (const ch of letters) COSTS.set(ch, Number(cost));
}

export function isVowel(ch) {
  return VOWELS.has(String(ch).toUpperCase());
}

export function costForLetter(ch) {
  const up = String(ch).toUpperCase();
  if (isVowel(up)) return 10;      // vocali
  return COSTS.get(up) ?? 5;       // default prudente
}
