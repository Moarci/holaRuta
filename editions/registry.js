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
      partner: { name: "ECOS · Cartagena", url: "https://www.ecosescuela.com/" }, // Backlink zur Partner-Homepage (Profil-Credit)
      // logo: null -> sauberer Text-Credit (Markenfarbe). Echtes, freigegebenes
      // Asset hier als https:- oder data:image-URL setzen, dann erscheint es als Bild.
      logo: null,
      defaultDestination: "Cartagena",
      appUrl: "https://moarci.github.io/holaRuta/",
      sync: { enabled: false, apiBase: "https://sync.example-ecos.org", orgLabel: "ECOS Cartagena" },
      taskTab: true,
      teacherTab: true,
    },
    weroad: {
      edition: "weroad",
      brandName: "HolaRuta · WeRoad Colombia",
      // Lebhaftes Koralle nahe WeRoads Markenauftritt. NÄHERUNG – bei Freigabe ersetzen.
      accent: { brand: "#FB5A47", brandInk: "#D33A2C" },
      partner: { name: "WeRoad Colombia", url: "https://www.weroad.com/" }, // Backlink zur Partner-Homepage (Profil-Credit)
      // logo: null -> sauberer Text-Credit (Markenfarbe). Echtes, freigegebenes
      // Asset hier als https:- oder data:image-URL setzen, dann erscheint es als Bild.
      logo: null,
      defaultDestination: "Colombia",
      appUrl: "https://moarci.github.io/holaRuta/",
      sync: { enabled: false, apiBase: "https://sync.example-weroad.com", orgLabel: "WeRoad Colombia" },
      taskTab: true,
      teacherTab: true,
    },
    // Generische White-Label-Vorlage für Hostels. Pro Hostel kopieren und brandName,
    // accent, partner, defaultDestination und (mit schriftlicher Freigabe) logo anpassen.
    // Der `hostel`-Block holt die hostel-typischen Inhalte (Modo hostal, Games, Flirten,
    // Knigge, Diálogos, Bailar) prominent nach vorne: eigener Abschnitt oben unter
    // „Entdecken" plus Quick-Start-Banner auf der Startseite. Inhalte bleiben zusätzlich
    // an ihrer angestammten Stelle. Hostel-Orange ist eine NÄHERUNG – bei Bedarf ersetzen.
    hostel: {
      edition: "hostel",
      brandName: "HolaRuta · Hostel",
      accent: { brand: "#E08A2C", brandInk: "#B5681C" },
      partner: { name: "Dein Hostel", url: null }, // pro Hostel: Name + Backlink zur Homepage
      logo: null,
      defaultDestination: null, // pro Hostel z.B. "Cartagena" → blendet die Pre-Arrival-Kachel ein
      appUrl: "https://moarci.github.io/holaRuta/",
      taskTab: false,
      teacherTab: false,
      hostel: {
        banner: true,
        featured: ["open-hostel", "open-juegos", "open-banderas", "open-flirt", "open-knigge", "open-dialogos", "open-bailar"],
      },
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
