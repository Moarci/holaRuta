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

  // Stadtflagge Medellíns (offizielles ziviles Hoheitszeichen, Decreto 151/2002):
  // zwei gleich große Querstreifen – WEISS oben, GRÜN unten – mit dem Wappen in der
  // Mitte (torreón de oro auf blauem Feld). Dies ist eine bewusst VEREINFACHTE,
  // eigene Nachzeichnung (keine kopierte Originalgrafik), inline als data:-URI, damit
  // sie offline im PWA-Cache liegt und die CSP nicht bricht. Anders als die Partner-
  // Demo-Wortmarken oben ist eine Stadtflagge gemeinfrei – daher hier fest gesetzt.
  var MEDELLIN_FLAG = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 64' role='img' aria-label='Bandera de Medellín'>" +
      "<clipPath id='mdeR'><rect x='1' y='1' width='94' height='62' rx='7'/></clipPath>" +
      "<g clip-path='url(#mdeR)'>" +
        "<rect x='0' y='0' width='96' height='32' fill='#ffffff'/>" +      // franja blanca (arriba)
        "<rect x='0' y='32' width='96' height='32' fill='#2f8e5b'/>" +     // franja verde (abajo)
      "</g>" +
      "<rect x='1' y='1' width='94' height='62' rx='7' fill='none' stroke='#1f6b44' stroke-width='2'/>" +
      "<path d='M36 17 H60 V33 Q60 44 48 50 Q36 44 36 33 Z' fill='#123f73' stroke='#0d2c52' stroke-width='1.5'/>" + // escudo (campo azul)
      "<g fill='#e6b422'>" +                                              // torreón de oro
        "<rect x='40' y='31' width='16' height='11'/>" +                  // muralla
        "<rect x='42' y='25' width='4' height='7'/>" +                    // torreón izq.
        "<rect x='50' y='25' width='4' height='7'/>" +                    // torreón der.
        "<rect x='45' y='21' width='6' height='11'/>" +                   // torre central
      "</g>" +
      "<rect x='46' y='36' width='4' height='6' fill='#0d2c52'/>" +       // puerta
      "<circle cx='48' cy='17' r='2.4' fill='#e6b422'/>" +               // alusión a la Virgen de la Candelaria
    "</svg>"
  );

  var EDITIONS = {
    // Produktions-Edition für den Vercel-Launch. Schaltet die opt-in-Cloud (Sync,
    // Social, Telemetrie) scharf – die konkreten apiBase/endpoint werden vom Anker
    // editions/launch.js dynamisch auf die SAME-ORIGIN gesetzt (location.origin),
    // damit Preview- UND Prod-Domain ohne Hardcoding funktionieren und die strenge
    // CSP `connect-src 'self'` erfüllt bleibt. Registry-Eintrag = Quelle der Wahrheit.
    launch: {
      edition: "launch",
      brandName: "HolaRuta",
      appUrl: null, // Anker setzt location.origin
    },
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
      appUrl: "https://holaruta.com/",
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
      appUrl: "https://holaruta.com/",
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
      appUrl: "https://holaruta.com/",
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
      appUrl: "https://holaruta.com/",
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
      appUrl: "https://holaruta.com/",
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
      partner: { name: "Medellín", url: "https://www.medellin.gov.co/" }, // Backlink zur offiziellen Stadtseite (Bezug/Credit)
      logo: MEDELLIN_FLAG, // Stadtflagge (weiß/grün + Wappen) – siehe MEDELLIN_FLAG oben
      defaultDestination: null,
      appUrl: "https://holaruta.com/",
      track: "es-en",      // Paisas lernen Englisch (Frage = Spanisch, Antwort = Englisch)
      taskTab: false,
      teacherTab: false,
    },
    // HelloAbroad: eigenständiger DE-EN-Reiseenglisch-Ableger für 50-60+
    // (siehe docs/superpowers/specs/2026-07-18-helloabroad-design.md). Bewusst
    // KEIN "HolaRuta"-Bezug im brandName. categoryAllowlist beschränkt das
    // Lernen-Tab auf die 10 MVP-Reisebereiche (siehe Task 3 für "flughafen").
    "hello-abroad": {
      edition: "hello-abroad",
      brandName: "HelloAbroad",
      accent: { brand: "#2F6B70", brandInk: "#1F4A4E" },
      partner: null,
      logo: null,
      defaultDestination: null,
      // Zeigt auf die APP (wie bei jeder anderen Edition), nicht auf die
      // Marketing-Landingpage (hello-abroad/index.html): die Landingpage hat
      // keinen Deep-Link-Router und kennt ?m=<modul> nicht – ein „Modul teilen“-
      // Link würde sonst dort ohne Modul-Öffnung stranden (siehe share.js:
      // shareText() hängt ?m=<slug> an appUrl an, share.js: linkBaseUrl() hängt
      // zusätzlich ?edition=hello-abroad an, damit die App im HelloAbroad-
      // Branding statt im HolaRuta-Standard startet).
      appUrl: "https://holaruta.com/",
      track: "de-en",
      taskTab: false,
      teacherTab: false,
      sync: null,
      categoryAllowlist: [
        "basics", "talk", "flughafen", "grenze", "hotel", "hostel",
        "essen", "trinken", "compras", "dinero", "banco",
        "verkehr", "rumbo", "auto", "farmacia", "notfall",
      ],
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
