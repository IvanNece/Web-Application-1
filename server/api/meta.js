import { Router } from 'express';
import { costForLetter, isVowel } from '../lib/costs.js';

// ═══════════════════════════════════════════════════════════════════════════════════
// API METADATI E INFORMAZIONI DI SISTEMA
// Endpoint per recuperare configurazioni e dati di supporto
// ═══════════════════════════════════════════════════════════════════════════════════

const router = Router();

// GET /letter-costs - Restituisce costi di tutte le lettere dell'alfabeto
router.get('/letter-costs', (req, res) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const payload = letters.map(L => ({
    letter: L,
    type: isVowel(L) ? 'vowel' : 'consonant',
    baseCost: costForLetter(L)
  }));
  res.json({ letters: payload });
});

export default router;
