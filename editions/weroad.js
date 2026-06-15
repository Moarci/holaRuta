/*
 * editions/weroad.js – Beispiel-Edition „HolaRuta · WeRoad Colombia".
 *
 * REINE DATEN. Edition-Build:
 *   node build.js --edition=weroad   →   HolaRuta-weroad.html
 *
 * Hinweis: Logo/Name/URL eines Partners nur mit dessen Freigabe verwenden.
 */
window.SC = window.SC || {};
window.SC.editionConfig = {
  edition: "weroad",
  brandName: "HolaRuta · WeRoad Colombia",
  // Lebhaftes Koralle nahe WeRoads Markenauftritt. NÄHERUNG – exakte Brand-Hex
  // konnten online nicht verifiziert werden; bei Freigabe gegen Brand-Guide ersetzen.
  accent: { brand: "#FB5A47", brandInk: "#D33A2C" },
  partner: { name: "WeRoad Colombia" }, // url erst mit Partner-Freigabe
  // logo: "https://…/weroad.svg",       // NUR mit schriftlicher Freigabe setzen (data: oder https:)
  defaultDestination: "Colombia",         // surft die Pre-Arrival-Kachel an
  // Beispiel-Vorverdrahtung der optionalen Cloud-Sync (Stufe 3, BACKEND.md).
  // enabled: false, bis WeRoad einen echten Endpunkt bereitstellt; für die lokale
  // Demo `node tools/mock-sync-server.js` starten und enabled:true + apiBase
  // auf http://localhost:8788 setzen.
  sync: { enabled: false, apiBase: "https://sync.example-weroad.com", orgLabel: "WeRoad Colombia" },
};
