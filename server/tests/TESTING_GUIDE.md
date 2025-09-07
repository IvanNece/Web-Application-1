# 🧪 Guida Completa al Testing - Indovina la Frase

## 📋 Panoramica del Sistema di Testing

Il progetto implementa una strategia di testing completa e multidimensionale che garantisce robustezza, affidabilità e sicurezza a tutti i livelli del sistema. La suite di test copre database, API, logica business, gestione errori e integrazione.

## 🏗️ Architettura Stratificata dei Test

### **Livello 1: Integrità Database**
**Obiettivo**: Garantire che i vincoli del database prevengano automaticamente la corruzione dei dati

**Test File**: `test_database_constraints.mjs`
- Vincoli UNIQUE (username duplicati)
- Vincoli CHECK (monete negative, status invalidi)  
- Foreign Key constraints (integrità referenziale)
- Validazione lunghezza frasi e formato lettere

```bash
# Esecuzione (no server richiesto)
cd server
node tests/test_database_constraints.mjs
```

### **Livello 2: Validazione API HTTP**
**Obiettivo**: Verificare che tutte le API restituiscano codici di stato e messaggi appropriati

**Test File**: `test_http_api_errors.mjs`
- **401 Unauthorized**: Accesso senza autenticazione
- **403 Forbidden**: Limitazioni business (monete, segregazione)
- **404 Not Found**: Risorse inesistenti
- **400 Bad Request**: Input malformati
- **409 Conflict**: Operazioni non permesse
- **500 Internal Server Error**: Errori sistema

```bash
# Esecuzione (server attivo richiesto)
# Terminal 1: Avvia server
npm run dev

# Terminal 2: Esegui test
node tests/test_http_api_errors.mjs
```

### **Livello 3: Concorrenza e Isolamento**
**Test File**: `test_concurrent_games.mjs`
- Isolamento sessioni utente
- Timer indipendenti per partita
- Segregazione accesso ai dati
- Frasi casuali indipendenti

### **Livello 4: Integrità Dati Seed**
**Test File**: `test_seed_users.mjs`
- Verifica 3 utenti di test (novice, empty, player)
- Bilanci monete corretti
- Frasi auth/guest in quantità appropriate
- Coerenza configurazioni iniziali

## 🔍 Catalogo Completo Codici di Errore

### **🔒 Errori di Autenticazione**

#### **401 - Unauthorized**
- **Causa**: Tentativo accesso endpoint protetti senza sessione
- **Messaggio**: `Not authenticated`
- **Soluzione**: Eseguire login tramite `/api/sessions`
- **Test**: Navigare a `http://localhost:3001/api/games/123` senza login

#### **403 - Forbidden**
**Limitazioni Monete:**
- `Not enough coins to start a game`
- `No coins left for letters`
- `Not enough coins`

**Segregazione Modalità:**
- `Forbidden (not a guest game)`
- `logged in users cannot access guest games`

**Test**: Login come utente "empty" (0 monete) e tentare di creare partita

### **📝 Errori di Validazione**

#### **400 - Bad Request**
- `Invalid game id` - ID partita malformato
- `Invalid input` - Lettera/frase non valida
- `Only one vowel per game` - Tentativo seconda vocale

**Test**: Inviare lettera con caratteri speciali o ID non numerico

### **🔍 Errori Risorse**

#### **404 - Not Found**
- `Game not found` - Partita inesistente o inaccessibile
- `Not found` - Risorsa generica non trovata

**Test**: Accedere a partita inesistente `/games/99999`

### **⚔️ Conflitti Business Logic**

#### **409 - Conflict**
- `Game already ended (won/lost/timeout)` - Partita già conclusa
- `Game already ended (timeout)` - Specifica per timeout

**Test**: Completare una partita e tentare di continuare

### **🔥 Errori Server**

#### **500 - Internal Server Error**
- `No phrase available` - Nessuna frase modalità auth
- `No guest phrase available` - Nessuna frase modalità guest

## 🛠️ Suite di Test Specializzati

### **🔧 Test di Diagnostica**

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

### **🎯 Test di Qualità**

#### `test_console_warnings.mjs`
- Checklist warning React comuni
- Validazione build Vite clean
- Controllo ESLint issues
- Raccomandazioni performance

#### `test_responsive_auto.mjs`
- Verifica layout responsive
- Test breakpoint CSS
- Controllo usabilità mobile

### **🛡️ Test di Sicurezza**

#### `test_security.mjs`
- Validazione autenticazione robusta
- Test bypass tentativi
- Controllo isolamento utenti

#### `test_user_segregation.mjs`
- Verifica separazione dati utente
- Test accesso cross-utente
- Validazione privacy partite

### **🔗 Test di Integrazione**

#### `test_session_behavior.mjs`
- Comportamento sessioni completo
- Test login/logout flows
- Gestione timeout sessioni

#### `test_transaction.mjs`
- Atomicità operazioni database
- Test rollback su errori
- Consistenza transazioni

## 📊 Sistema di Logging e Architettura

### **Logging Colorato**
Il server implementa logging avanzato con messaggi colorati in rosso per facilitare il debugging:

```
GET /api/games/abc 400 5.123 ms - 35
[ERROR 400] Bad Request - Input non valido: "Invalid game id"
```

### **Architettura Server-First**
- **Tutte le validazioni gestite dal server**
- Frontend delega validazione al backend
- Consistenza garantita per API e UI
- Sicurezza: nessun bypass possibile
- Debug centralizzato con logging completo

### **Localizzazione Codici nel Codebase**
- `server/api/games.js` - Errori giochi autenticati
- `server/api/guest.js` - Errori giochi ospite  
- `server/api/sessions.js` - Errori login/logout
- `server/auth/passport.js` - Errori autenticazione

## 🚀 Metodologie di Testing

### **Test Automatizzato Completo**
```bash
# Test completo suite
cd server/tests
node test_database_constraints.mjs
node test_http_api_errors.mjs
node test_concurrent_games.mjs
node final_report.mjs
```

### **Test Manuali Browser**
1. **Autenticazione**: Login/logout con credenziali varie
2. **Gameplay**: Scenari completi con monete insufficienti
3. **Concorrenza**: Due utenti simultanei in tab separate
4. **Errori**: URL manipolati e input malformati

### **Test Collection HTTP**
**File**: `auth.http`, `game.http`
- Utilizzabili con REST Client (VS Code)
- Variabili dinamiche per workflow automatizzato
- Test completi API endpoint

### **Strategia Multi-Livello**

```
┌─────────────────┬──────────────────────┬────────────────────────┐
│ ASPETTO         │ Database Tests       │ HTTP API Tests         │
├─────────────────┼──────────────────────┼────────────────────────┤
│ Livello         │ Database (SQL)       │ API (HTTP)             │
│ Accesso         │ Diretto DB           │ Richieste web          │
│ Errori testati  │ SQL violations       │ HTTP status codes      │
│ User facing     │ ❌ No               │ ✅ Si                  │
│ Data integrity  │ ✅ Si               │ ❌ No                  │
│ Authentication  │ ❌ No               │ ✅ Si                  │
│ Business logic  │ ❌ Limitata         │ ✅ Completa            │
└─────────────────┴──────────────────────┴────────────────────────┘
```

**Sicurezza Multi-Livello:**
1. **Database** → Ultima linea di difesa contro dati corrotti
2. **API** → Prima linea di difesa con messaggi user-friendly

## 📈 Report e Monitoraggio

### **`final_report.mjs`**
Genera report completo con:
- Statistiche database (utenti, partite, frasi)
- Analisi economia gioco (monete spese/guadagnate)
- Distribuzione esiti partite
- Validazione requisiti completata

### **Metriche Chiave**
- **Integrità Dati**: Vincoli database attivi
- **Gestione Errori**: Copertura completa codici HTTP
- **Concorrenza**: Isolamento utenti garantito
- **Performance**: Logging e profiling implementato
- **Sicurezza**: Validazione server-side robusta

## 💡 Raccomandazioni

### **Durante Sviluppo**
1. **Prima** → Esegui test database (veloce, no server)
2. **Poi** → Esegui test API (completo, con server)
3. Monitorare console browser per warning
4. Utilizzare React Developer Tools per profiling
5. Testare scenari edge case regolarmente

### **Pre-Produzione**
- Eseguire suite test completa
- Validare performance sotto carico
- Controllo memory leak potenziali
- Test security penetration

### **Manutenzione**
- Aggiornare test per nuove feature
- Monitorare metriche performance
- Analizzare log errori periodicamente
- Validare integrità dati regolarmente

## ✅ Conclusioni

La strategia di testing implementata garantisce:

- **Robustezza**: Sistema resiliente a input invalidi
- **Sicurezza**: Isolamento utenti e validazione server-side  
- **Performance**: Monitoraggio e ottimizzazione continua
- **Manutenibilità**: Test automatizzati per regressioni
- **Qualità**: Copertura completa casi d'uso e edge case

**Due approcci, un solo obiettivo**: Sistema robusto e user-friendly
- Database Tests → **"I dati sono sicuri?"**
- API Tests → **"Gli utenti capiscono gli errori?"**

Il sistema è pronto per produzione con confidence elevata nella stabilità e affidabilità. 🎮✨
