/*
 * config.js  (SC.config) – Marken-/Edition-Konfiguration.
 *
 * Standard = HolaRuta pur. Eine Co-Branding-Edition setzt VOR diesem Modul
 * window.SC.editionConfig (siehe editions/*.js); der Edition-Build
 * (`node build.js --edition=<id>`) schiebt diese Datei automatisch davor.
 * Ohne Edition bleibt alles exakt wie heute (graceful).
 *
 * REINE DATEN/MERGE – kein DOM-Zugriff. Angewandt wird die Config einmalig
 * beim Start (app.js → applyEdition: Akzentfarbe, Titel, theme-color, Credit).
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  var DEFAULT = {
    edition: null,            // null = keine Edition (Standard HolaRuta)
    brandName: "HolaRuta",    // Tab-Titel & installierter App-Name
    accent: null,             // null = Standard-Terrakotta; sonst { brand, brandInk }
    partner: null,            // { name, url? } für einen dezenten Credit im Profil
    logo: null,               // Partner-Logo (data:- oder https:-URL) – NUR mit schriftlicher
                              //   Freigabe setzen; null = kein Logo (rechtlich sichere Vorgabe)
    defaultDestination: null, // z.B. "Cartagena" → blendet die Pre-Arrival-Kachel ein
    // Optionale Cloud-Sync (Stufe 3, BACKEND.md). null = aus (Standard, kein
    // Netzwerk). Eine Schul-/Partner-Edition kann sie vorkonfigurieren:
    //   sync: { enabled: true, apiBase: "https://…", orgLabel: "ECOS" }
    sync: null,
  };

  SC.config = Object.assign({}, DEFAULT, SC.editionConfig || {});
})();
