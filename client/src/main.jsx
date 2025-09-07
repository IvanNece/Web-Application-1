/**
 * ENTRY POINT APPLICAZIONE: main.jsx
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * PUNTO DI INGRESSO PRINCIPALE PER APPLICAZIONE REACT "INDOVINA LA FRASE"
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * File di bootstrap che inizializza l'applicazione React collegando il DOM
 * virtuale al DOM reale del browser, configurando il rendering root e
 * abilitando le funzionalità di sviluppo per debugging e performance.
 * 
 * FUNZIONALITÀ CORE:
 * - Inizializzazione React 19 Root API per rendering efficiente
 * - Collegamento applicazione React a elemento DOM #root
 * - Abilitazione React Strict Mode per debugging sviluppo
 * - Import CSS globali per styling base applicazione
 * - Bootstrap componente App principale con routing e stati
 * 
 * ARCHITETTURA RENDERING:
 * 
 * REACT 19 ROOT API:
 * - createRoot() sostituisce ReactDOM.render() (legacy)
 * - Abilita Concurrent Features (Suspense, Transitions)
 * - Migliori performance con rendering asincrono
 * - Gestione automatica batching degli aggiornamenti
 * 
 * STRICT MODE BENEFITS:
 * - Double rendering in sviluppo per identificare side effects
 * - Deprecation warnings per API React obsolete
 * - Controlli aggiuntivi su lifecycle methods unsafe
 * - Aiuta identificare problemi di performance e memory leaks
 * 
 * DOM INTEGRATION:
 * - Target elemento #root dal file index.html
 * - Rendering sincrono primo paint, asincrono aggiornamenti
 * - Gestione automatica event listeners e cleanup
 * 
 * CSS LOADING ORDER:
 * 1. index.css - Reset CSS e variabili globali base
 * 2. App.jsx - Componente principale con CSS modulari
 * 3. Altri CSS importati nei rispettivi componenti
 * 
 * DIPENDENZE CRITICHE:
 * - React/ReactDOM 19.x per API moderne
 * - Element DOM #root in index.html
 * - CSS globale index.css per reset e variabili
 * - Component App come root dell'albero componenti
 * 
 * CONFIGURAZIONE PRODUZIONE:
 * - Strict Mode automaticamente disabilitato in build produzione
 * - Ottimizzazioni automatiche Vite per bundling
 * - Tree shaking per eliminazione codice non utilizzato
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// INIZIALIZZAZIONE APPLICAZIONE
//═══════════════════════════════════════════════════════════════════════════════

/**
 * Bootstrap applicazione React con Root API moderna
 * 
 * PROCESSO:
 * 1. createRoot() crea root rendering moderno su elemento #root
 * 2. StrictMode abilita controlli sviluppo e debugging
 * 3. App component viene renderizzato come radice albero componenti
 * 
 * STRICT MODE EFFECTS:
 * - Componenti renderizzati doppio per identificare side effects
 * - Console warnings per pattern anti-patterns
 * - Simulazione mount/unmount per test robustezza
 * 
 * PERFORMANCE:
 * - Concurrent rendering per UI responsiva
 * - Automatic batching per aggiornamenti efficienti
 * - Time slicing per operazioni non bloccanti
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
