/*
 * ========================================
 * TEST: RESPONSIVE DESIGN AUTOMATICO
 * ========================================
 * 
 * Analizza automaticamente i file CSS per verificare responsive design
 * Controlla media queries, breakpoint e classi responsive
 * Genera report su compatibilità desktop e mobile
 */

import fs from 'fs';
import path from 'path';

console.log('TEST RESPONSIVE DESKTOP AUTOMATICO\n');

// ==========================================
// CONFIGURAZIONE PERCORSI
// ==========================================
const clientPath = path.join(process.cwd(), '..', 'client', 'src');
const cssFiles = ['Game.css', 'App.css', 'index.css'];

// ==========================================
// ANALISI MEDIA QUERIES
// ==========================================
console.log('ANALISI MEDIA QUERIES:');
let totalMediaQueries = 0;
let desktopQueries = 0;
let mobileQueries = 0;

for (const file of cssFiles) {
  const filePath = path.join(clientPath, file);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const mediaQueries = content.match(/@media[^{]+{/g) || [];
    
    console.log(`\n📄 ${file}:`);
    console.log(`  Media queries trovate: ${mediaQueries.length}`);
    
    mediaQueries.forEach(query => {
      const cleanQuery = query.replace('@media', '').replace('{', '').trim();
      console.log(`    └─ ${cleanQuery}`);
      
      totalMediaQueries++;
      if (query.includes('max-width')) mobileQueries++;
      if (query.includes('min-width') && (query.includes('1200px') || query.includes('1440px') || query.includes('1920px'))) desktopQueries++;
    });
  } else {
    console.log(`⚠️  ${file} non trovato`);
  }
}

console.log('\n📊 SOMMARIO RESPONSIVE:');
console.log(`  Total media queries: ${totalMediaQueries}`);
console.log(`  Mobile queries (max-width): ${mobileQueries}`);
console.log(`  Desktop queries (min-width >=1024px): ${desktopQueries}`);

// Controlla problemi comuni
console.log('\n🔍 CONTROLLO PROBLEMI COMUNI:');

// 1. Container con max-width
const gameCSS = fs.readFileSync(path.join(clientPath, 'Game.css'), 'utf8');
if (gameCSS.includes('max-width: 900px')) {
  console.log('✅ Container con max-width trovato (900px)');
} else {
  console.log('⚠️  Nessun max-width container trovato');
}

// 2. Layout flessibile
if (gameCSS.includes('flex') || gameCSS.includes('grid')) {
  console.log('✅ Layout flessibile (flex/grid) utilizzato');
} else {
  console.log('❌ Layout flessibile mancante');
}

// 3. Unità responsive
const responsiveUnits = ['rem', 'em', 'vh', 'vw', '%'];
let foundResponsiveUnits = 0;
responsiveUnits.forEach(unit => {
  if (gameCSS.includes(unit)) {
    foundResponsiveUnits++;
  }
});

console.log(`✅ Unità responsive utilizzate: ${foundResponsiveUnits}/${responsiveUnits.length}`);

// 4. Font scaling
if (gameCSS.includes('font-size') && (gameCSS.includes('rem') || gameCSS.includes('em'))) {
  console.log('✅ Font size scalabile utilizzato');
} else {
  console.log('⚠️  Font size fisso potrebbe causare problemi');
}

console.log('\n🎯 RACCOMANDAZIONI DESKTOP:');
if (desktopQueries === 0) {
  console.log('❌ MANCANO media queries per desktop grandi (>1200px)');
  console.log('   Suggerisci: @media (min-width: 1200px) per layout large');
}

if (totalMediaQueries < 3) {
  console.log('⚠️  Poche media queries, considera breakpoint aggiuntivi');
}

// Test layout key components
console.log('\n🧪 TEST COMPONENTI CHIAVE:');

const components = [
  'game-container',
  'header-info', 
  'phrase-grid',
  'virtual-keyboard',
  'feedback-banner'
];

components.forEach(comp => {
  if (gameCSS.includes(comp) || gameCSS.includes(comp.replace('-', '_'))) {
    console.log(`✅ ${comp}: Stili trovati`);
  } else {
    console.log(`⚠️  ${comp}: Stili non trovati o naming diverso`);
  }
});

console.log('\n✅ Test responsive automatico completato!');
console.log('\n📋 PROSSIMO STEP: Testa manualmente su browser con DevTools');
