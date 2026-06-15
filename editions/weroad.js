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
  // Demo-Logo: NACHGEBAUTE Wortmarke (eingebettetes SVG, kein Original-Asset, keine
  // Original-Schrift). Nur für die unveröffentlichte Vorschau. Vor Veröffentlichung
  // durch das echte, freigegebene Logo ersetzen ODER entfernen (logo:null).
  logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzIgNDgiIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iV2VSb2FkIj48dGV4dCB4PSIwIiB5PSIzNyIgZm9udC1mYW1pbHk9IlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iNzAwIiBsZXR0ZXItc3BhY2luZz0iLTEuNSIgZmlsbD0iI0ZCNUE0NyI+V2VSb2FkPC90ZXh0Pjwvc3ZnPg==",
  defaultDestination: "Colombia",         // surft die Pre-Arrival-Kachel an
  // Beispiel-Vorverdrahtung der optionalen Cloud-Sync (Stufe 3, BACKEND.md).
  // enabled: false, bis WeRoad einen echten Endpunkt bereitstellt; für die lokale
  // Demo `node tools/mock-sync-server.js` starten und enabled:true + apiBase
  // auf http://localhost:8788 setzen.
  sync: { enabled: false, apiBase: "https://sync.example-weroad.com", orgLabel: "WeRoad Colombia" },
};
