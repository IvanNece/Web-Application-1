-- Frasi (autenticato)
DELETE FROM phrases;

INSERT INTO phrases(text, mode) VALUES
('knowledge is power but wisdom is peace', 'auth'),
('curiosity lights the path through darkness', 'auth'),
('practice does not make perfect only better', 'auth'),
('failure is data success is interpretation', 'auth'),
('we are all stories in the end my friend', 'auth'),
('the map is not the territory remember this', 'auth'),
('complex systems emerge from simple rules', 'auth'),
('discipline is a bridge between goals reality', 'auth'),
('talent is common effort is uncommon treasure', 'auth'),
('small steps compound into giant leaps ahead', 'auth'),
('make it work then make it right make fast', 'auth'),
('constraints are gifts for creative minds now', 'auth'),
('luck favors the prepared and the persistent', 'auth'),
('quality is not an act it is a habit daily', 'auth'),
('simplicity is the soul of efficiency truly', 'auth'),
('measure twice cut once iterate many times', 'auth'),
('clarity is kind confusion is cruel indeed', 'auth'),
('learn unlearn relearn repeat until mastery', 'auth'),
('the best code is the code you do not write', 'auth'),
('be brave enough to be bad at something new', 'auth'),
('test behavior not implementation details', 'auth');

-- Frasi guest (3 dedicate)
INSERT INTO phrases(text, mode) VALUES
('never stop exploring the unknown within', 'guest'),
('time flies when curiosity guides you', 'guest'),
('read more learn more question more', 'guest');
