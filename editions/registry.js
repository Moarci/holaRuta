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
    // Inglés-Edition: Spanisch-Sprecher:innen lernen ENGLISCH fürs Berufsleben
    // (umgekehrter Track, nicht orts- oder zielgruppengebunden). track:"es-en" dreht
    // Lernrichtung, Stimme (TTS) und UI-Sprachen um: Frage = Spanisch (card.es),
    // Antwort = Englisch (card.en), Oberfläche ES/EN. Funktioniert schon mit dem
    // Bestandskorpus (jede Karte trägt es+en); data.locals.js ergänzt arbeitsweltnahe
    // Kategorien (Hospitality, Alltag, Beruf usw.).
    "ingles-pro": {
      edition: "ingles-pro",
      brandName: "HolaRuta · Inglés",
      // Karibik-Teal wie ECOS Cartagena. NÄHERUNG – bei Freigabe ersetzen.
      accent: { brand: "#1F7A8C", brandInk: "#155C69" },
      partner: { name: "ECOS · Cartagena", url: "https://www.ecosescuela.com/" },
      logo: null,
      defaultDestination: null,
      appUrl: "https://moarci.github.io/holaRuta/",
      track: "es-en",      // <- kehrt die Lernrichtung um (Spanisch lernt Englisch)
      taskTab: true,       // Tarea (Aufgaben) zentral für Schulen
      teacherTab: true,    // Modo profe (Klassenübersicht) zentral für Schulen
    },
    // Generische Venue-Vorlage für den Locals-Track (employer-pays): ein Hostel/Hotel
    // hängt EINEN QR auf, das Personal lernt Englisch (track:"es-en"), ohne Konto,
    // offline. Wie der `hostel`-Block, nur in der Lernrichtung umgekehrt und ohne
    // ECOS-Bezug – pro Venue brandName/accent/partner anpassen (Freigabe für logo
    // nötig). Kein Schul-Backoffice: taskTab/teacherTab aus (reines Selbstlernen am
    // Arbeitsplatz). Poster: docs/anleitungen/venue-en.html.
    "venue-en": {
      edition: "venue-en",
      brandName: "HolaRuta · English at Work",
      // Neutrales Petrol – markenfrei. NÄHERUNG, pro Venue ersetzbar.
      accent: { brand: "#2F6B70", brandInk: "#1F4A4E" },
      partner: { name: "Your Venue", url: null }, // pro Venue: Name + Backlink
      logo: null,
      defaultDestination: null,
      appUrl: "https://moarci.github.io/holaRuta/",
      track: "es-en",      // Personal lernt Englisch (Frage = Spanisch, Antwort = Englisch)
      taskTab: false,      // kein Schul-Aufgaben-Workflow – Selbstlernen am Arbeitsplatz
      teacherTab: false,
    },
    // Medellín-Locals-Variante: Paisas lernen Englisch für den Umgang mit
    // englischsprachigen Tourist:innen – mit stadtspezifischen Modulen (Comuna 13,
    // Metro/Metrocable, medio ambiente, cultura paisa, Guatapé, nómadas digitales,
    // Feria de las Flores). track:"es-en" wie venue-en; zusätzlich blendet der
    // Locals-Track die neue Kategorie-Gruppe „loc-med" (data.locals.js) oben ein.
    // Paisa-Grün als Akzent (Ciudad de la Eterna Primavera / Corredores Verdes) –
    // NÄHERUNG, bei Freigabe ersetzen. Selbstlernen: kein Schul-Backoffice.
    medellin: {
      edition: "medellin",
      brandName: "HolaRuta · Medellín",
      accent: { brand: "#2F8E5B", brandInk: "#1F6B44" },
      partner: { name: "Medellín", url: null },
      logo: null,
      defaultDestination: null,
      appUrl: "https://moarci.github.io/holaRuta/",
      track: "es-en",      // Paisas lernen Englisch (Frage = Spanisch, Antwort = Englisch)
      taskTab: false,
      teacherTab: false,
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
