import { Router } from 'express';
import { costForLetter, isVowel } from '../lib/costs.js';



const router = Router();

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
