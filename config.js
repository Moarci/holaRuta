/*
 * config.js  (SC.config + SC.track) – Marken-/Edition-Konfiguration & Lern-Track.
 *
 * Standard = HolaRuta pur. Eine Co-Branding-Edition setzt VOR diesem Modul
 * window.SC.editionConfig (siehe editions/*.js); der Edition-Build
 * (`node build.js --edition=<id>`) schiebt diese Datei automatisch davor.
 * Ohne Edition bleibt alles exakt wie heute (graceful).
 *
 * REINE DATEN/MERGE – kein DOM-Zugriff. Angewandt wird die Config einmalig
 * beim Start (app.js → applyEdition: Akzentfarbe, Titel, theme-color, Credit).
 *
 * LERN-TRACK (SC.track): Welche Sprache wird gelernt, welche ist Muttersprache?
 * Der Standard-Track "de-es" (Reise: Deutsch/Englisch lernt Spanisch) bildet das
 * bisherige, fest verdrahtete Verhalten ab – ohne Edition ändert sich nichts. Eine
 * Edition kann per `track: "es-en"` die Richtung umkehren (Locals: Spanisch lernt
 * Englisch). SC.track kapselt die zuvor überall als `card.es`/Spanisch hartkodierten
 * Annahmen: learnLang (Antwortfeld der Karte), nativeLangs (wählbare UI-Sprachen),
 * ttsLocale (Stimme der Lernsprache). learnText(card) ist das Pendant zu
 * i18n.nativeText(card) für die GELERNTE Seite.
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
    // Optionale Sozial-/Wettbewerbs-Schicht (Freunde + Tages-Rangliste, BACKEND.md
    // §16). null = aus (Standard, kein Netzwerk). Nutzt denselben passwortlosen
    // Login wie sync; apiBase fällt auf sync.apiBase zurück, wenn nicht gesetzt:
    //   social: { enabled: true, apiBase: "https://…" }
    social: null,
    // Optionale ANONYME Nutzungs-Telemetrie (BACKEND.md §17). null = aus (Standard,
    // kein Netzwerk). Sendet NUR mit Endpunkt UND ausdrücklicher Nutzer-Zustimmung
    // im Profil einen anonymen, gebucketeten Tages-Snapshot (keine PII, keine
    // Karten-IDs, keine stabile ID). Eine Edition kann sie vorkonfigurieren:
    //   analytics: { enabled: true, endpoint: "https://…" }
    analytics: null,
    // Account-First (Login-Gate am Start). null = aus (Standard: offline/anonym wie
    // bisher – keine Account-Pflicht). Eine vernetzte Edition (launch) schaltet es
    // scharf: { required:true, google:true }. `required` greift NUR, wenn zugleich
    // Cloud-Sync aktiv ist (truthy apiBase) – eine per file:// geöffnete Offline-
    // Variante zeigt also KEIN Gate (graceful). `google` blendet den Google-Button
    // ein; ohne ihn bleibt der passwortlose E-Mail-Code der einzige Weg.
    account: null,
    // Kanonische Web-Adresse der App (für teilbare Aufgaben-/Onboarding-Links).
    // null = aktuelle Adresse (location) verwenden. Editionen setzen ihre Pages-URL,
    // damit ein Link auch dann stimmt, wenn die Lehrkraft die App als Datei öffnet.
    appUrl: null,
    // Eigene Reiter „Tarea“ / „Modo profe“ in der unteren Navigation (statt nur als
    // Kachel unter Entdecken). Für Schul-/Reise-Editionen, wo Aufgaben-Codes bzw.
    // die Klassenübersicht der Hauptweg sind. Aktiv -> Kachel verschwindet aus Entdecken.
    taskTab: false,
    teacherTab: false,
    // Hostel-Modus: holt die hostel-typischen Inhalte (Modo hostal, Games, Flirten,
    // Knigge …) prominent nach vorne – ein eigener Abschnitt oben unter „Entdecken"
    // plus ein Quick-Start-Banner auf der Startseite. null = aus (Standard).
    //   hostel: { banner: true, featured: ["open-hostel","open-juegos", …] }
    // featured = Liste von FEATURES-Aktionen in Wunschreihenfolge (siehe ui.js).
    hostel: null,
    // Lern-Track: "de-es" (Standard, Reise) | "es-en" (Locals, Englisch lernen) |
    // "de-en" (HelloAbroad, Reiseenglisch). null = Standard "de-es".
    track: null,
    // Kategorie-Filter fürs Lernen-Tab/Suche/Editor/Stats: null = alle Kategorien
    // sichtbar (Standard, unverändert für bestehende Editionen). Eine Edition mit
    // schmalerem Themenumfang (z.B. HelloAbroad) setzt eine explizite Liste
    // erlaubter Kategorie-IDs.
    categoryAllowlist: null,
  };

  SC.config = Object.assign({}, DEFAULT, SC.editionConfig || {});

  // ---- Lern-Tracks (SC.track) ----------------------------------------------
  // Bekannte Tracks. learnLang = Karten-Feld der GELERNTEN Antwort. nativeLangs =
  // erlaubte UI-/Frage-Sprachen (erste = Vorgabe). ttsLocale = Stimme der Lernsprache.
  // cardNativeLang: fixe Muttersprache (L1) der KARTEN-FRAGE. null = folgt der
  // UI-Sprache (Reise: de/en-Tourist:innen lesen die Frage in ihrer Sprache).
  // "es" = immer Spanisch (Locals lernen Englisch AUS dem Spanischen – die Frage
  // bleibt Spanisch, auch wenn die Oberfläche auf Englisch gestellt wird).
  var TRACKS = {
    "de-es": { id: "de-es", learnLang: "es", nativeLangs: ["de", "en"], cardNativeLang: null, ttsLocale: "es-419" },
    "es-en": { id: "es-en", learnLang: "en", nativeLangs: ["es", "en"], cardNativeLang: "es", ttsLocale: "en-US" },
    // HelloAbroad: DE-Muttersprachler lernt Reiseenglisch. cardNativeLang: null
    // (wie de-es) -> Frage folgt der UI-Sprache (Deutsch); learnLang "en" -> die
    // gelernte Antwort ist card.en (in data.js bereits zu 100% befüllt).
    "de-en": { id: "de-en", learnLang: "en", nativeLangs: ["de"], cardNativeLang: null, ttsLocale: "en-US" },
  };
  var DEFAULT_TRACK = "de-es";

  function currentTrack() {
    var id = SC.config && SC.config.track;
    return (id && TRACKS[id]) || TRACKS[DEFAULT_TRACK];
  }

  // SC.track – kleine, DOM-freie Helfer rund um den aktiven Track. Alle lesen die
  // einmalig gemergte SC.config; graceful, falls eine unbekannte track-id gesetzt ist.
  SC.track = {
    TRACKS: TRACKS,
    current: currentTrack,
    id: function () { return currentTrack().id; },
    // Karten-Feld bzw. -Text der GELERNTEN Antwort (Reise: "es", Locals: "en").
    learnLang: function () { return currentTrack().learnLang; },
    learnText: function (card) { return card ? String(card[currentTrack().learnLang] || "") : ""; },
    // Erlaubte UI-/Muttersprachen für diesen Track (erste = Vorgabe).
    nativeLangs: function () { return currentTrack().nativeLangs; },
    // Fixe L1 der Karten-Frage (null = folgt der UI-Sprache). Siehe TRACKS-Kommentar.
    cardNativeLang: function () { return currentTrack().cardNativeLang; },
    // Stimme der Lernsprache (für speech.js).
    ttsLocale: function () { return currentTrack().ttsLocale; },
  };

  // SC.account – DOM-freie Helfer rund um Account-First. Lesen die gemergte
  // SC.config.account. `required()` prüft NUR die Config-Absicht; ob das Gate real
  // greift (zusätzlich: Cloud-Sync aktiv + nicht eingeloggt), entscheidet der
  // Controller (app.js accountGateActive), da das SC.sync/SC.net voraussetzt.
  var acc = function () { return (SC.config && SC.config.account) || null; };
  SC.account = {
    cfg: acc,
    required: function () { var a = acc(); return !!(a && a.required); },
    google: function () { var a = acc(); return !!(a && a.google); },
  };
})();
