/*
 * editions/registry.js – Verzeichnis aller Co-Branding-Editionen (QUELLE DER WAHRHEIT)
 * + Laufzeit-Auswahl per Link.
 *
 * Zweck: Eine Schule/Partnerfirma kann EINEN Link verschicken, der die App in ihrem
 * Branding (Logo, Farben, Name) öffnet – ohne eine eigene Datei zu verteilen:
 *     https://…/holaRuta/?edition=ecos
 * und optional direkt ins Onboarding (siehe app.js, Parameter `start=onboarding`):
 *     https://…/holaRuta/?edition=ecos&start=onboarding
 *
 * Lädt VOR config.js. Ist bereits eine Edition fest eingebaut (Edition-Build via
 * `node build.js --edition=ecos`), bleibt diese gesetzt – der URL-Parameter kann eine
 * fest gebaute Edition NICHT überschreiben.
 *
 * Hinweis: Demo-Logos sind nachgebaute Wortmarken (kein Original-Asset). Vor einer
 * Veröffentlichung durch das echte, freigegebene Logo ersetzen ODER logo:null setzen.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  var EDITIONS = {
    ecos: {
      edition: "ecos",
      brandName: "HolaRuta · ECOS",
      // Karibik-Teal als thematischer Akzent (Cartagena). NÄHERUNG – bei Freigabe ersetzen.
      accent: { brand: "#1F7A8C", brandInk: "#155C69" },
      partner: { name: "ECOS · Cartagena" }, // url erst mit Partner-Freigabe
      logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzIgNzIiIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iRUNPUyBFc2N1ZWxhIGRlIEVzcGFub2wiPjx0ZXh0IHg9IjAiIHk9IjQ0IiBmb250LWZhbWlseT0iR2VvcmdpYSxUaW1lcyxzZXJpZiIgZm9udC1zaXplPSI0NiIgZm9udC13ZWlnaHQ9IjcwMCIgbGV0dGVyLXNwYWNpbmc9IjYiIGZpbGw9IiMxRjdBOEMiPkVDT1M8L3RleHQ+PHRleHQgeD0iMyIgeT0iNjQiIGZvbnQtZmFtaWx5PSJWZXJkYW5hLEdlbmV2YSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEzIiBmb250LXdlaWdodD0iNjAwIiBsZXR0ZXItc3BhY2luZz0iMiIgZmlsbD0iIzE1NUM2OSI+RXNjdWVsYSBkZSBFc3BhJiMyNDE7b2w8L3RleHQ+PC9zdmc+",
      defaultDestination: "Cartagena",
      sync: { enabled: false, apiBase: "https://sync.example-ecos.org", orgLabel: "ECOS Cartagena" },
      taskTab: true,
      teacherTab: true,
    },
    weroad: {
      edition: "weroad",
      brandName: "HolaRuta · WeRoad Colombia",
      // Lebhaftes Koralle nahe WeRoads Markenauftritt. NÄHERUNG – bei Freigabe ersetzen.
      accent: { brand: "#FB5A47", brandInk: "#D33A2C" },
      partner: { name: "WeRoad Colombia" }, // url erst mit Partner-Freigabe
      logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzIgNDgiIHJvbGU9ImltZyIgYXJpYS1sYWJlbD0iV2VSb2FkIj48dGV4dCB4PSIwIiB5PSIzNyIgZm9udC1mYW1pbHk9IlZlcmRhbmEsR2VuZXZhLFRhaG9tYSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iNzAwIiBsZXR0ZXItc3BhY2luZz0iLTEuNSIgZmlsbD0iI0ZCNUE0NyI+V2VSb2FkPC90ZXh0Pjwvc3ZnPg==",
      defaultDestination: "Colombia",
      sync: { enabled: false, apiBase: "https://sync.example-weroad.com", orgLabel: "WeRoad Colombia" },
      taskTab: true,
      teacherTab: true,
    },
  };

  SC.editions = EDITIONS;

  // Laufzeit-Auswahl per ?edition=… (oder #edition=…) – nur wenn nicht fest gebaut.
  if (!SC.editionConfig) {
    try {
      var search = (location.search && location.search.length > 1) ? location.search : "";
      if (!search && location.hash && location.hash.indexOf("=") >= 0) search = location.hash.replace(/^#/, "?");
      var id = (new URLSearchParams(search).get("edition") || "").toLowerCase();
      if (id && EDITIONS[id]) SC.editionConfig = EDITIONS[id];
    } catch (e) { /* URL/URLSearchParams fehlt – ohne Edition starten */ }
  }
})();
