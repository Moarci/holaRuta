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
  // Demo-Logo: NACHGEBAUTE Wortmarke (eingebettetes SVG, kein Original-Asset, keine
  // Original-Schrift). Nur für die unveröffentlichte Vorschau. Vor Veröffentlichung
  // durch das echte, freigegebene Logo ersetzen ODER entfernen (logo:null).
  logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzIgNzIiIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iRUNPUyBFc2N1ZWxhIGRlIEVzcGFub2wiPjx0ZXh0IHg9IjAiIHk9IjQ0IiBmb250LWZhbWlseT0iR2VvcmdpYSxUaW1lcyxzZXJpZiIgZm9udC1zaXplPSI0NiIgZm9udC13ZWlnaHQ9IjcwMCIgbGV0dGVyLXNwYWNpbmc9IjYiIGZpbGw9IiMxRjdBOEMiPkVDT1M8L3RleHQ+PHRleHQgeD0iMyIgeT0iNjQiIGZvbnQtZmFtaWx5PSJWZXJkYW5hLEdlbmV2YSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEzIiBmb250LXdlaWdodD0iNjAwIiBsZXR0ZXItc3BhY2luZz0iMiIgZmlsbD0iIzE1NUM2OSI+RXNjdWVsYSBkZSBFc3BhJiMyNDE7b2w8L3RleHQ+PC9zdmc+",
  defaultDestination: "Cartagena",        // surft die Pre-Arrival-Kachel an
  // Beispiel-Vorverdrahtung der optionalen Cloud-Sync (Stufe 3, BACKEND.md).
  // enabled: false, bis ECOS einen echten Endpunkt bereitstellt; für die lokale
  // Demo `node tools/mock-sync-server.js` starten und enabled:true + apiBase
  // auf http://localhost:8788 setzen.
  sync: { enabled: false, apiBase: "https://sync.example-ecos.org", orgLabel: "ECOS Cartagena" },
  // Aufgaben-Codes (Tarea) & Klassenübersicht sind im Schulkontext der Hauptweg →
  // eigene Reiter unten (verschwinden dadurch aus „Entdecken“).
  taskTab: true,
  teacherTab: true,
};
