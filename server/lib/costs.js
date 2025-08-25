const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

const GROUPS = {
  5: ['T', 'N', 'S', 'H'],
  4: ['R', 'D', 'L', 'C'],
  3: ['M', 'W', 'F', 'G'],
  2: ['Y', 'P', 'B', 'V'],
  1: ['K', 'J', 'X', 'Q', 'Z'],
};

const COSTS = new Map();
for (const [cost, letters] of Object.entries(GROUPS)) {
  for (const ch of letters) COSTS.set(ch, Number(cost));
}

export function isVowel(ch) {
  return VOWELS.has(ch.toUpperCase());
}

export function costForLetter(ch) {
  const up = ch.toUpperCase();
  if (isVowel(up)) return 10;
  return COSTS.get(up) ?? 5; // default prudente
}
