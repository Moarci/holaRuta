/*
 * editions/weroad.js – Edition-Build-Anker „HolaRuta · WeRoad Colombia".
 *
 *   node build.js --edition=weroad   →   HolaRuta-weroad.html
 *
 * Die eigentliche Konfiguration lebt zentral in editions/registry.js (Quelle der
 * Wahrheit, dort auch per ?edition=weroad zur Laufzeit wählbar). Diese Datei setzt sie
 * für den fest gebauten Edition-Build als aktiv – registry.js wird im Build VOR dieser
 * Datei geladen.
 */
window.SC = window.SC || {};
window.SC.editionConfig = (window.SC.editions && window.SC.editions.weroad) || window.SC.editionConfig;
