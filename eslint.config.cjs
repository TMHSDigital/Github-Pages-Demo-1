'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['_site/', 'node_modules/', 'test-results/'] },
  js.configs.recommended,
  {
    // Site scripts: classic browser scripts loaded with defer, sharing window.TMHSCalc / TMHSTools
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser } },
  },
  {
    // Build, link-check and test scripts run in Node
    files: ['**/*.cjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    // Test callbacks passed to page.evaluate run in the browser
    files: ['tests/**/*.cjs', 'scripts/screenshots.cjs'],
    languageOptions: { globals: { ...globals.browser, TMHSCalc: 'readonly', axe: 'readonly' } },
  },
];
