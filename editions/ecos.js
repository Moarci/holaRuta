/*
 * editions/ecos.js – Edition-Build-Anker „HolaRuta · ECOS" (Cartagena).
 *
 *   node build.js --edition=ecos   →   HolaRuta-ecos.html
 *
 * Die eigentliche Konfiguration (Logo, Farben, Name, Reiter, Sync) lebt zentral in
 * editions/registry.js (Quelle der Wahrheit, dort auch per ?edition=ecos zur Laufzeit
 * wählbar). Diese Datei setzt sie für den fest gebauten Edition-Build als aktiv –
 * registry.js wird im Build VOR dieser Datei geladen.
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions.ecos) || window.SC.editionConfig;
