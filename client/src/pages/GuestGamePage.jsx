import { useNavigate } from 'react-router-dom';
import GuestGame from '../components/GuestGame';

/**
 * PAGINA GIOCO OSPITE: GuestGamePage
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * WRAPPER MINIMALE PER MODALITÀ GIOCO OSPITE GRATUITA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * SCOPO PRINCIPALE:
 * Fornisce wrapper di navigazione per il componente GuestGame, mantenendo
 * separazione delle responsabilità tra logica di routing (page) e logica
 * di gioco (component). Design pattern minimale per modalità ospite.
 * 
 * FUNZIONALITÀ CORE:
 * - Wrapper di navigazione per componente GuestGame
 * - Gestione callback ritorno homepage tramite React Router
 * - Architettura minimale senza stati locali (logica in GuestGame)
 * - Separazione responsabilità: page per routing, component per game logic
 * 
 * CARATTERISTICHE MODALITÀ OSPITE:
 * - Nessuna autenticazione richiesta
 * - Nessuna gestione monete o utenti
 * - Nessuna creazione partita (gestita internamente da GuestGame)
 * - Accesso diretto e immediato al gioco
 * - Pool frasi dedicato per ospiti (3 frasi disponibili)
 * 
 * DIFFERENZE DA GamePage:
 * 
 * GamePage (Autenticata):
 * - Stati complessi (creazione partita, loading, errori)
 * - API call per creazione partita
 * - Gestione monete utente
 * - Ciclo vita partita completo
 * 
 * GuestGamePage (Ospite):
 * - Wrapper minimale senza stati
 * - Delegazione completa a GuestGame component
 * - Nessuna API call di setup
 * - Accesso immediato
 * 
 * ARCHITETTURA:
 * - Page: Solo responsabilità routing e navigazione
 * - Component: Tutta la logica gioco e stati interni
 * - Pattern: Thin wrapper con single responsibility
 * 
 * PROPS NECESSARIE:
 * - Nessuna prop richiesta (self-contained)
 * 
 * DIPENDENZE:
 * - Component GuestGame per logica completa gioco ospite
 * - React Router per navigazione homepage
 * - Pattern callback per comunicazione component -> page
 */
function GuestGamePage() {
  const navigate = useNavigate();

  // SEZIONE: RENDER MINIMALE
  //═══════════════════════════════════════════════════════════════════════════════

  /**
   * Render wrapper minimale con delega completa
   * 
   * PATTERN DESIGN:
   * - Page si occupa solo di navigazione
   * - Component gestisce tutta la logica gioco
   * - Callback onBackToHome per comunicazione component -> page
   * - Nessun stato locale necessario
   * 
   * VANTAGGI:
   * - Separazione netta delle responsabilità
   * - Component riutilizzabile indipendentemente
   * - Page testabile indipendentemente
   * - Codice più pulito e manutenibile
   */
  return (
    <GuestGame 
      onBackToHome={() => navigate('/')}  // Callback navigazione homepage
    />
  );
}

export default GuestGamePage;