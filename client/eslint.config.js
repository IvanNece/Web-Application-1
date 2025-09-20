// Import delle configurazioni e plugin ESLint
import js from '@eslint/js'                          // Regole JavaScript base raccomandate
import globals from 'globals'                        // Variabili globali browser (window, document, etc.)
import reactHooks from 'eslint-plugin-react-hooks'   // Plugin per validare React Hooks
import reactRefresh from 'eslint-plugin-react-refresh' // Plugin per compatibilità hot reload

export default [
  // Ignora cartelle di build/output
  { ignores: ['dist'] },
  
  {
    // Applica regole a tutti i file JavaScript e JSX
    files: ['**/*.{js,jsx}'],
    
    // Configurazione linguaggio e parser
    languageOptions: {
      ecmaVersion: 2020,                    // Supporta JavaScript ES2020
      globals: globals.browser,             // Conosce variabili browser globali
      parserOptions: {
        ecmaVersion: 'latest',              // Usa sintassi JavaScript più recente
        ecmaFeatures: { jsx: true },        // Abilita parsing JSX per React
        sourceType: 'module',               // Supporta import/export ES6
      },
    },
    
    // Plugin attivati per controlli specifici
    plugins: {
      'react-hooks': reactHooks,            // Valida Rules of Hooks di React
      'react-refresh': reactRefresh,        // Controlla compatibilità hot reload
    },
    
    // Regole di linting attive
    rules: {
      ...js.configs.recommended.rules,                    // Regole JavaScript raccomandate (~50)
      ...reactHooks.configs.recommended.rules,            // Regole React Hooks raccomandate (~5)
      
      // Personalizzazioni regole specifiche
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], // Ignora variabili MAIUSCOLE e _underscore
      'react-refresh/only-export-components': [           // Avvisa per export non-component (HMR)
        'warn',
        { allowConstantExport: true },                    // Permetti export di costanti
      ],
    },
  },
]
