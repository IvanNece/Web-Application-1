# GUIDA COMPLETA AL TESTING - INDOVINA LA FRASE

## Panoramica del Sistema di Testing

Il progetto "Indovina la Frase" implementa una strategia di testing completa e multidimensionale che garantisce robustezza, affidabilità e sicurezza a tutti i livelli del sistema. La suite di test copre database, API, logica business, gestione errori e integrazione.

## Architettura Stratificata dei Test

### Livello 1: Integrità Database
**Obiettivo**: Garantire che i vincoli del database prevengano automaticamente la corruzione dei dati

**File**: `test_database_constraints.mjs`
- Vincoli UNIQUE (username duplicati)
- Vincoli CHECK (monete negative, status invalidi)  
- Foreign Key constraints (integrità referenziale)
- Validazione lunghezza frasi e format lettere

### Livello 2: Validazione API HTTP
**Obiettivo**: Verificare che tutte le API restituiscano codici di stato e messaggi appropriati

**File**: `test_http_api_errors.mjs`
- **401 Unauthorized**: Accesso senza autenticazione
- **403 Forbidden**: Limitazioni business (monete, segregazione)
- **404 Not Found**: Risorse inesistenti
- **400 Bad Request**: Input malformati
- **409 Conflict**: Operazioni non permesse

### Livello 3: Concorrenza e Isolamento
**Obiettivo**: Assicurare che più utenti possano giocare simultaneamente senza interferenze

**File**: `test_concurrent_games.mjs`
- Isolamento sessioni utente
- Timer indipendenti per partita
- Segregazione accesso ai dati
- Frasi casuali indipendenti

### Livello 4: Integrità Dati Seed
**Obiettivo**: Validare la corretta inizializzazione del sistema

**File**: `test_seed_users.mjs`
- Verifica 3 utenti di test (novice, empty, player)
- Bilanci monete corretti
- Frasi auth/guest in quantità appropriate
- Coerenza configurazioni iniziali

## Catalogo Completo Codici di Errore

### Errori di Autenticazione (401-403)

#### 401 - Unauthorized
- **Causa**: Tentativo accesso endpoint protetti senza sessione
- **Messaggio**: `Not authenticated`
- **Soluzione**: Eseguire login tramite `/api/sessions`

#### 403 - Forbidden
**Limitazioni Monete:**
- `Not enough coins to start a game`
- `No coins left for letters`
- `Not enough coins`

**Segregazione Modalità:**
- `Forbidden (not a guest game)`
- `logged in users cannot access guest games`

### Errori di Validazione (400)

#### 400 - Bad Request
- `Invalid game id` - ID partita malformato
- `Invalid input` - Lettera/frase non valida
- `Only one vowel per game` - Tentativo seconda vocale

### Errori Risorse (404)

#### 404 - Not Found
- `Game not found` - Partita inesistente o inaccessibile
- `Not found` - Risorsa generica non trovata

### Conflitti Business Logic (409)

#### 409 - Conflict
- `Game already ended (won/lost/timeout)` - Partita già conclusa
- `Game already ended (timeout)` - Specifica per timeout

### Errori Server (500)

#### 500 - Internal Server Error
- `No phrase available` - Nessuna frase modalità auth
- `No guest phrase available` - Nessuna frase modalità guest

## Sistema di Logging Avanzato

### Logging Colorato
```
GET /api/games/abc 400 5.123 ms - 35
[ERROR 400] Bad Request - Input non valido: "Invalid game id"
```

### Architettura Server-First
- **Tutte le validazioni gestite dal server**
- Frontend delega validazione al backend
- Consistenza garantita per API e UI
- Sicurezza: nessun bypass possibile
- Debug centralizzato con logging completo

## Suite di Test Specializzati

### Test di Diagnostica

#### `debug_coins.mjs`
- Analizza bilanci utenti correnti
- Mostra transazioni monete recenti
- Debugging sistema economico del gioco

#### `check_fk.mjs`
- Verifica attivazione foreign key constraints
- Controllo PRAGMA nel database
- Validazione integrità referenziale

#### `test_sqlite_sequence.mjs`
- Analisi tabella sqlite_sequence
- Stato sequenze AUTOINCREMENT
- Debugging problemi ID duplicati

### Test di Qualità

#### `test_console_warnings.mjs`
- Checklist warning React comuni
- Validazione build Vite clean
- Controllo ESLint issues
- Raccomandazioni performance

#### `test_responsive_auto.mjs`
- Verifica layout responsive
- Test breakpoint CSS
- Controllo usabilità mobile

### Test di Sicurezza

#### `test_security.mjs`
- Validazione autenticazione robusta
- Test bypass tentativi
- Controllo isolamento utenti

#### `test_user_segregation.mjs`
- Verifica separazione dati utente
- Test accesso cross-utente
- Validazione privacy partite

### Test di Integrazione

#### `test_session_behavior.mjs`
- Comportamento sessioni completo
- Test login/logout flows
- Gestione timeout sessioni

#### `test_transaction.mjs`
- Atomicità operazioni database
- Test rollback su errori
- Consistenza transazioni

## Metodologie di Testing

### Test Automatizzato
```bash
# Test completo suite
cd server/tests
node test_database_constraints.mjs
node test_http_api_errors.mjs
node test_concurrent_games.mjs
node final_report.mjs
```

### Test Manuali Browser
1. **Autenticazione**: Login/logout con credenziali varie
2. **Gameplay**: Scenari completi con monete insufficienti
3. **Concorrenza**: Due utenti simultanei in tab separate
4. **Errori**: URL manipolati e input malformati

### Test Collection HTTP
**File**: `auth.http`, `game.http`
- Utilizzabili con REST Client (VS Code)
- Variabili dinamiche per workflow automatizzato
- Test completi API endpoint

## Report e Monitoraggio

### `final_report.mjs`
Genera report completo con:
- Statistiche database (utenti, partite, frasi)
- Analisi economia gioco (monete spese/guadagnate)
- Distribuzione esiti partite
- Validazione requisiti completata

### Metriche Chiave
- **Integrità Dati**: Vincoli database attivi
- **Gestione Errori**: Copertura completa codici HTTP
- **Concorrenza**: Isolamento utenti garantito
- **Performance**: Logging e profiling implementato
- **Sicurezza**: Validazione server-side robusta

## Raccomandazioni Sviluppo

### Durante Sviluppo
- Monitorare console browser per warning
- Utilizzare React Developer Tools per profiling
- Testare scenari edge case regolarmente
- Verificare log server per errori

### Pre-Produzione
- Eseguire suite test completa
- Validare performance sotto carico
- Controllo memory leak potenziali
- Test security penetration

### Manutenzione
- Aggiornare test per nuove feature
- Monitorare metriche performance
- Analizzare log errori periodicamente
- Validare integrità dati regolarmente

## Conclusioni

La strategia di testing implementata garantisce:
- **Robustezza**: Sistema resiliente a input invalidi
- **Sicurezza**: Isolamento utenti e validazione server-side
- **Performance**: Monitoraggio e ottimizzazione continua
- **Manutenibilità**: Test automatizzati per regressioni
- **Qualità**: Copertura completa casi d'uso e edge case

Il sistema è pronto per produzione con confidence elevata nella stabilità e affidabilità.
