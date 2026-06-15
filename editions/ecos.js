/*
 * editions/ecos.js – Beispiel-Edition „HolaRuta · ECOS" (Cartagena).
 *
 * REINE DATEN. Wird vom Edition-Build vor config.js eingebunden:
 *   node build.js --edition=ecos   →   HolaRuta-ecos.html
 *
 * Hinweis: Logo/Name/URL eines Partners nur mit dessen Freigabe verwenden.
 * Bis dahin neutral co-branded (Akzentfarbe + „· ECOS"-Textzusatz, ohne Logo).
 */
window.SC = window.SC || {};
window.SC.editionConfig = {
  edition: "ecos",
  brandName: "HolaRuta · ECOS",
  // Karibik-Teal als thematischer Akzent (Cartagena). NÄHERUNG – ECOS' exakte
  // Brand-Hex konnten online nicht verifiziert werden; bei Freigabe ersetzen.
  accent: { brand: "#1F7A8C", brandInk: "#155C69" },
  partner: { name: "ECOS · Cartagena" }, // url erst mit Partner-Freigabe
  // logo: "https://…/ecos.svg",          // NUR mit schriftlicher Freigabe setzen (data: oder https:)
  defaultDestination: "Cartagena",        // surft die Pre-Arrival-Kachel an
  // Beispiel-Vorverdrahtung der optionalen Cloud-Sync (Stufe 3, BACKEND.md).
  // enabled: false, bis ECOS einen echten Endpunkt bereitstellt; für die lokale
  // Demo `node tools/mock-sync-server.js` starten und enabled:true + apiBase
  // auf http://localhost:8788 setzen.
  sync: { enabled: false, apiBase: "https://sync.example-ecos.org", orgLabel: "ECOS Cartagena" },
};
