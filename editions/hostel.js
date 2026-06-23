/*
 * editions/hostel.js – Edition-Build-Anker „HolaRuta · Hostel" (generische Vorlage).
 *
 *   node build.js --edition=hostel   →   HolaRuta-hostel.html
 *
 * Die eigentliche Konfiguration (Farben, Name, Hostel-Block) lebt zentral in
 * editions/registry.js (Quelle der Wahrheit, dort auch per ?edition=hostel zur Laufzeit
 * wählbar). Diese Datei setzt sie für den fest gebauten Edition-Build als aktiv –
 * registry.js wird im Build VOR dieser Datei geladen.
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions.hostel) || window.SC.editionConfig;
