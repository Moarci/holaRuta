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
  accent: { brand: "#E0533A", brandInk: "#B53C28" }, // kräftiges Coral
  partner: { name: "WeRoad Colombia" }, // url erst mit Partner-Freigabe
  defaultDestination: "Colombia",         // surft die Pre-Arrival-Kachel an
  // Beispiel-Vorverdrahtung der optionalen Cloud-Sync (Stufe 3, BACKEND.md).
  // enabled: false, bis WeRoad einen echten Endpunkt bereitstellt; für die lokale
  // Demo `node tools/mock-sync-server.js` starten und enabled:true + apiBase
  // auf http://localhost:8788 setzen.
  sync: { enabled: false, apiBase: "https://sync.example-weroad.com", orgLabel: "WeRoad Colombia" },
};
