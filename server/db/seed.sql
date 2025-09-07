/*
 * ========================================
 * DATI DI SEED - INDOVINA LA FRASE
 * ========================================
 * 
 * Popola il database con frasi predefinite per il gioco
 * Include frasi per modalità autenticata e guest
 */

-- ==========================================
-- PULIZIA DATI ESISTENTI
-- ==========================================
-- Rimuove tutte le frasi esistenti per ricaricare i dati puliti
DELETE FROM phrases;

-- ==========================================
-- FRASI PER MODALITÀ AUTENTICATA
-- ==========================================
-- Frasi motivazionali per utenti registrati (30 frasi disponibili)
-- Lunghezza: 30-50 caratteri, solo lettere e spazi
INSERT INTO phrases(text, mode) VALUES
('be kind to yourself every single day', 'auth'),
('small steps lead to big changes ahead', 'auth'),
('today is a good day to start fresh', 'auth'),
('believe in yourself more than others do', 'auth'),
('hard work always pays off in the end', 'auth'),
('every mistake is a chance to learn more', 'auth'),
('stay positive when life gets really tough', 'auth'),
('good things come to those who wait long', 'auth'),
('practice makes you better every single time', 'auth'),
('dream big and work hard every single day', 'auth'),
('you are stronger than you think you are', 'auth'),
('progress is better than being perfect', 'auth'),
('never give up on your biggest dreams ever', 'auth'),
('be patient with yourself while you grow', 'auth'),
('learn something new every single day friend', 'auth'),
('help others and you help yourself too', 'auth'),
('take one step forward every single day', 'auth'),
('stay curious about the world around you', 'auth'),
('be brave enough to try new things often', 'auth'),
('listen more than you speak to others', 'auth'),
('work hard and let your results speak loud', 'auth'),
('happiness matters more than being right', 'auth'),
('trust the process even when it is slow', 'auth'),
('be grateful for what you have right now', 'auth'),
('change starts with you not other people', 'auth'),
('stay humble even when you win big time', 'auth'),
('read books to grow your mind every day', 'auth'),
('ask questions when you do not understand', 'auth'),
('love yourself before you love other people', 'auth'),
('keep going when others choose to stop', 'auth');

-- ==========================================
-- FRASI PER MODALITÀ GUEST
-- ==========================================
-- Frasi semplificate per utenti non registrati (3 frasi dedicate)
-- Pensate per essere accessibili e motivanti per i visitatori
INSERT INTO phrases(text, mode) VALUES
('every day is a new chance to grow', 'guest'),
('be happy with who you are becoming', 'guest'),
('be happy about the person you are today', 'guest');
