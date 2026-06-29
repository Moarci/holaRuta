/*
 * editions/ingles-pro.js – Edition-Build-Anker „HolaRuta · Inglés".
 *
 *   node build.js --edition=ingles-pro   →   HolaRuta-ingles-pro.html
 *
 * Die eigentliche Konfiguration (Marke, Farben, Reiter, vor allem track:"es-en")
 * lebt zentral in editions/registry.js (Quelle der Wahrheit, dort auch per
 * ?edition=ingles-pro zur Laufzeit wählbar). Diese Datei setzt sie für den
 * fest gebauten Edition-Build als aktiv – registry.js wird im Build VOR dieser
 * Datei geladen.
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions["ingles-pro"]) || window.SC.editionConfig;
