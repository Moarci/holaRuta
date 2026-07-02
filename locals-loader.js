/*
 * HolaRuta – locals-loader.js
 *
 * Lädt die drei großen Locals-Korpus-Dateien (~1,76 MB unminifiziert) NUR im
 * Locals-Track (es-en). Im Standard-Reise-Track (de-es) griffen deren
 * Einhäng-Guards ohnehin nie – Transfer + Parse waren reine Verschwendung
 * bei jedem Kaltstart.
 *
 * Funktionsweise: Dieses Skript läuft parser-blockend (bewusst OHNE defer)
 * NACH editions/registry.js und config.js (beide ebenfalls ohne defer),
 * damit SC.track hier bereits feststeht. document.write erzeugt ECHTE
 * parser-inserted <script defer>-Tags an genau dieser Stream-Position –
 * die defer-Queue-Reihenfolge ist damit identisch zur früheren statischen
 * Verdrahtung (nach i18n.strings.js/data.js, vor context.js). Dynamische
 * Injection (wie loadModule) ginge NICHT: solche Skripte laufen erst nach
 * der defer-Queue, also nach context.js/app.js – zu spät für attach() und
 * die Parse-Zeit-Konsumenten in app.js. document.write ist same-origin
 * unkritisch (Browser drosseln nur cross-origin-Writes); die Lighthouse-
 * Warnung ist hier bewusst in Kauf genommen.
 *
 * Single-File-Build: build.js ersetzt diesen Loader komplett durch die
 * eingebetteten Module (gleiche Position, Guards greifen wie bisher).
 * Service Worker: alle drei Dateien bleiben im Precache, damit ein
 * Laufzeit-Wechsel per ?edition=ingles-pro/venue-en offline funktioniert.
 */
(function () {
  "use strict";
  var track = window.SC && window.SC.track && window.SC.track.id && window.SC.track.id();
  if (track !== "es-en") return;
  document.write('<script defer src="i18n.strings.es.js"><\/script>');
  document.write('<script defer src="data.locals.js"><\/script>');
  document.write('<script defer src="contextdata.locals.js"><\/script>');
})();
