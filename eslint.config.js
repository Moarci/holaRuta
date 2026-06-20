/*
 * eslint.config.js – BEWUSST schlanke Flat-Config (ESLint v9/v10).
 *
 * Ziel: echte Bugs fangen (undefined-Variablen, offensichtlich toter/falscher
 * Code) OHNE Stil-Bürokratie. HolaRuta ist Vanilla-JS ohne Build/Bundler; jedes
 * Modul ist eine Browser-IIFE, die sich über das globale window.SC verdrahtet.
 * Darum hier großzügige Globals und no-unused-vars nur als Warnung.
 *
 * Lauf:  npx eslint .
 *   (ESLint ist KEINE Repo-Dependency – das Projekt bleibt laufzeit-dependency-
 *    frei; CI installiert es flüchtig, siehe .github/workflows/pages.yml.)
 */
"use strict";

const browserGlobals = {
  // DOM / Browser
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  location: "readonly",
  history: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  fetch: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
  FormData: "readonly",
  Blob: "readonly",
  File: "readonly",
  FileReader: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  btoa: "readonly",
  atob: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  alert: "readonly",
  confirm: "readonly",
  prompt: "readonly",
  matchMedia: "readonly",
  getComputedStyle: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  Image: "readonly",
  Audio: "readonly",
  AudioContext: "readonly",
  webkitAudioContext: "readonly",
  SpeechSynthesisUtterance: "readonly",
  speechSynthesis: "readonly",
  Notification: "readonly",
  IntersectionObserver: "readonly",
  MutationObserver: "readonly",
  ResizeObserver: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly",
  crypto: "readonly",
  performance: "readonly",
  caches: "readonly",
  // Projekt-Namespace (wird über window.SC = ... selbst angelegt)
  SC: "writable",
  // i18n.js setzt window.t = t; das genutzte globale t() in den View-Modulen.
  t: "readonly",
  globalThis: "readonly",
  // Einige Module sind dual-mode (Browser + CommonJS-Export, z. B. qr.js):
  // `typeof module !== "undefined"`-Guard. module/exports als bekannt markieren.
  module: "writable",
  exports: "writable",
};

const nodeGlobals = {
  require: "readonly",
  module: "writable",
  exports: "writable",
  process: "readonly",
  Buffer: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  globalThis: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly",
};

const serviceWorkerGlobals = {
  self: "readonly",
  caches: "readonly",
  clients: "readonly",
  skipWaiting: "readonly",
  fetch: "readonly",
  Response: "readonly",
  Request: "readonly",
  URL: "readonly",
};

const commonRules = {
  "no-undef": "error",
  "no-unused-vars": "warn",
  // KEINE Stilregeln (Einrückung, Anführungszeichen, Semikolons, …) – bewusst.
};

module.exports = [
  // Was ESLint gar nicht erst anfassen soll.
  {
    ignores: [
      "node_modules/**",
      "HolaRuta.html", // generiertes Single-File-Bundle (build.js)
      "scripts/.e2e-out/**",
      "scripts/mutation/.bak/**", // transiente Mutanten-Backups
      "**/*.min.js",
    ],
  },

  // Browser-Module (die eigentliche App): klassische Skripte/IIFEs, kein Modulsystem.
  // swversion.js ist trotz „.js" ein reines Node-Build-Werkzeug (siehe unten).
  {
    files: ["*.js"],
    ignores: ["build.js", "eslint.config.js", "service-worker.js", "swversion.js", "tools/**", "scripts/**", "test/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: browserGlobals,
    },
    rules: commonRules,
  },

  // Service Worker: eigener globaler Scope (self/caches/clients).
  {
    files: ["service-worker.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: Object.assign({}, browserGlobals, serviceWorkerGlobals),
    },
    rules: commonRules,
  },

  // Node-Werkzeuge & Build (CommonJS). swversion.js gehört hierher (require/module/__dirname).
  {
    files: ["build.js", "eslint.config.js", "swversion.js", "tools/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
    rules: commonRules,
  },

  // Tests (CommonJS): bauen sich window/localStorage als Shim selbst — darum
  // Node- UND Browser-Globals erlauben (sonst false „window not defined").
  {
    files: ["test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: Object.assign({}, nodeGlobals, browserGlobals),
    },
    rules: commonRules,
  },

  // E2E-/Verify-Skripte: ES-Module (.mjs), Node-Globals.
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: Object.assign({}, nodeGlobals, browserGlobals),
    },
    rules: commonRules,
  },
];
