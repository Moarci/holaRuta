/*
 * editions/medellin.js – Edition-Build-Anker „HolaRuta · Medellín".
 *
 *   node build.js --edition=medellin   →   HolaRuta-medellin.html
 *
 * Die eigentliche Konfiguration lebt zentral in editions/registry.js (Quelle der
 * Wahrheit, dort auch per ?edition=medellin zur Laufzeit wählbar). Diese Datei setzt sie
 * für den fest gebauten Edition-Build als aktiv – registry.js wird im Build VOR dieser
 * Datei geladen. track:"es-en" (Locals): Paisas lernen Englisch, mit den Medellín-Modulen
 * (Gruppe „loc-med" in data.locals.js).
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions.medellin) || window.SC.editionConfig;
