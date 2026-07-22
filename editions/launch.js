/*
 * editions/launch.js – Anker der Produktions-Edition „launch" (Registry = Quelle
 * der Wahrheit). Schaltet die opt-in-Cloud (Sync, Social, Telemetrie) auf die
 * SAME-ORIGIN-API scharf, OHNE den config.js-Default zu ändern (der bleibt „alles
 * null/offline"). Gebaut/eingebettet via `node build.js --dist --edition=launch`
 * (buildDist hängt dieses Script VOR config.js ein; siehe vercel.json).
 *
 * apiBase = location.origin: absolute, TRUTHY App-Origin (sync.js enabled() verlangt
 * truthy apiBase) und exakt dieselbe Origin wie die Seite -> CSP `connect-src 'self'`
 * bleibt erfüllt, kein CORS. NUR auf http(s) scharf: eine per file:// geöffnete
 * Single-File-Variante bleibt offline (kein truthy apiBase, das ins Leere zeigt).
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});
  var base = (SC.editions && SC.editions.launch) || { edition: "launch", brandName: "HolaRuta" };

  var isWeb = typeof location !== "undefined" && /^https?:$/.test(location.protocol || "");
  var origin = isWeb && location.origin ? location.origin : "";

  var cfg = isWeb
    ? Object.assign({}, base, {
        appUrl: origin,
        sync: { enabled: true, apiBase: origin, orgLabel: "HolaRuta" },
        social: { enabled: true }, // apiBase fällt auf sync.apiBase zurück
        // Account-First: Login-Gate direkt beim ersten Start (Berater-Empfehlung –
        // wer den Account nicht früh anlegt, claimt seine Daten später kaum noch).
        // google:true blendet den Google-Button ein (niedrigste Schwelle); der
        // passwortlose E-Mail-Code bleibt als Rückfall. Greift nur auf http(s)
        // (isWeb) – die file://-Offline-Variante bleibt anonym/gate-frei.
        account: { required: true, google: true },
        // WICHTIG: analytics.endpoint ist die BASIS-Origin; analytics.js hängt selbst
        // /v1/usage bzw. /v1/events an. Also NICHT den Pfad mit reingeben (sonst
        // entstünde …/v1/usage/v1/usage).
        analytics: { enabled: true, endpoint: origin },
      })
    : base;

  SC.editions = SC.editions || {};
  SC.editions.launch = base;
  // Nur setzen, wenn nicht bereits eine Edition per ?edition= / fester Build gewählt ist.
  if (!SC.editionConfig) SC.editionConfig = cfg;
})();
