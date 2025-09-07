# GUIDA COMPLETA ALLA SUITE DI TEST

## Panoramica del Sistema di Testing

Il progetto "Indovina la Frase" implementa una suite di test completa e stratificata per garantire robustezza, affidabilità e correttezza del sistema a tutti i livelli. La strategia di testing adotta un approccio multidimensionale che copre database, API, logica business e integrazione.

## Architettura dei Test

### Livello 1: Test Vincoli Database (`test_database_constraints.mjs`)

#### Obiettivo Strategico
Verifica che il database SQLite respinga automaticamente dati non validi attraverso vincoli e constraint nativi, garantendo integrità dei dati anche in caso di malfunzionamenti applicativi.

#### Copertura Funzionale
- **Vincoli UNIQUE**: Prevenzione username duplicati
- **Vincoli CHECK**: Validazione monete non negative e status validi
- **Foreign Keys**: Integrità referenziale tra utenti, partite e frasi
- **Constraint personalizzati**: Lunghezza frasi e format lettere

#### Implementazione Tecnica
```javascript
// Accesso diretto al layer database
import { get, all, run } from '../lib/db.js';

// Test inserimento dati invalidi
await run('INSERT INTO users(username, password_hash, coins) VALUES (?, ?, ?)', 
          ['player', 'test', 100]); // Deve fallire: username duplicato
```

#### Benefici Architetturali
- Garantisce integrità dati indipendentemente dall'applicazione
- Previene corruzione database anche con bug nell'API
- Testa vincoli SQL nativi per performance ottimali

### Livello 2: Test API HTTP (`test_http_api_errors.mjs`)

#### Obiettivo Strategico
Verifica che le API HTTP restituiscano codici di stato HTTP appropriati e messaggi di errore informativi per tutti i casi limite e scenari di errore.

#### Copertura degli Status Code
- **401 Unauthorized**: Accesso a endpoint protetti senza autenticazione
- **403 Forbidden**: Limitazioni business (monete, segregazione modalità)
- **404 Not Found**: Risorse inesistenti (partite, endpoint)
- **400 Bad Request**: Validazione input malformati
- **409 Conflict**: Operazioni non permesse per stato attuale

#### Metodologia di Test
```javascript
// Richieste HTTP reali al server
const response = await fetch('http://localhost:3001/api/games/123');
// ✅ Verifica: response.status === 401 && data.error === "Not authenticated"
```

### **✅ VANTAGGI:**
- Garantisce **user experience** corretta
- Testa **autenticazione/autorizzazione**
- Verifica **messaggi di errore** comprensibili
- Simula **comportamento utente reale**

---

## 🔄 **PERCHÉ TENERLI ENTRAMBI?**

### **📊 COMPLEMENTARITÀ:**
```
┌─────────────────┬──────────────────────┬────────────────────────┐
│ ASPETTO         │ test_database_       │ test_http_api_         │
│                 │ constraints.mjs      │ errors.mjs             │
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

### **🛡️ SICUREZZA MULTI-LIVELLO:**
1. **Database** → Ultima linea di difesa contro dati corrotti
2. **API** → Prima linea di difesa con messaggi user-friendly

### **🎯 SCENARI COPERTI:**
- **Sviluppatore bug** → Database constraint ferma il danno
- **Attacco diretto** → API authentication respinge richiesta
- **Input malformato** → API validation + DB constraint (doppia protezione)
- **Race condition** → DB constraint mantiene consistency

---

## 🚀 **COME ESEGUIRE:**

### **Test Database:**
```bash
cd server
node tests/test_database_constraints.mjs
```

### **Test API (richiede server attivo):**
```bash
# Terminal 1: Avvia server
npm run dev

# Terminal 2: Esegui test
node tests/test_http_api_errors.mjs
```

---

## 📈 **STRATEGIA DI TESTING:**

### **🔄 Durante sviluppo:**
1. **Prima** → Esegui `test_database_constraints.mjs` (veloce, no server)
2. **Poi** → Esegui `test_http_api_errors.mjs` (completo, con server)

### **🎯 Prima del deploy:**
- Entrambi i test devono **passare al 100%**
- Database constraints = **Dati sicuri**  
- API errors = **Utenti felici**

---

## ✅ **CONCLUSIONE:**

**Due test, un solo obiettivo**: **Sistema robusto e user-friendly**

- `test_database_constraints.mjs` → **"I dati sono sicuri?"**
- `test_http_api_errors.mjs` → **"Gli utenti capiscono gli errori?"**

Insieme formano una **test suite completa** che garantisce qualità a tutti i livelli! 🎮✨
