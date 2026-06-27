/*
 * editions/cartagena-locals.js – Edition-Build-Anker „LocalRuta · Inglés".
 *
 *   node build.js --edition=cartagena-locals   →   HolaRuta-cartagena-locals.html
 *
 * Die eigentliche Konfiguration (Marke, Farben, Reiter, vor allem track:"es-en")
 * lebt zentral in editions/registry.js (Quelle der Wahrheit, dort auch per
 * ?edition=cartagena-locals zur Laufzeit wählbar). Diese Datei setzt sie für den
 * fest gebauten Edition-Build als aktiv – registry.js wird im Build VOR dieser
 * Datei geladen.
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions["cartagena-locals"]) || window.SC.editionConfig;
