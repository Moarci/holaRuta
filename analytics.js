/*
 * analytics.js  (SC.analytics) – OPTIONALE, abschaltbare, ANONYME Nutzungs-Telemetrie.
 *
 * Zweck: dem Betreiber eine grobe Antwort auf „wie viele nutzen die App und was
 * machen sie?" geben – OHNE die Datensparsamkeit der App aufzugeben. Wie sync.js
 * und social.js ist dieses Modul so geschnitten, dass nur noch der Server fehlt:
 * der reine, testbare Kern (Snapshot aus den BEREITS vorhandenen gamestats bauen
 * und grob bucketen) ist hier fertig, der dünne fetch-Adapter spricht den in
 * BACKEND.md §17 spezifizierten Endpunkt.
 *
 * Prinzipien (identisch zu social.js / BACKEND.md §1):
 *  - Doppeltes Gate: gesendet wird NUR, wenn (1) eine Edition einen Endpunkt
 *    konfiguriert hat (SC.config.analytics.enabled + endpoint) UND (2) der Aufrufer
 *    meta.consent === true übergibt. Sonst exakt 0 Netzwerk-Calls – wie die App ohne
 *    dieses Modul. Dieses Modul kennt KEINEN Default: WER zustimmt bzw. was ohne
 *    getroffene Wahl gilt, entscheidet allein der Controller (app.js). Seit dem
 *    Wechsel auf OPT-OUT ist dort `settings.analyticsConsent !== false` an, d.h. nur
 *    ein ausdrückliches „Aus" im Profil schaltet ab.
 *  - Datenminimierung: der Snapshot trägt NUR grobe, gebucketete Aggregate –
 *    KEINE PII, KEINE stabile Nutzer-ID. Im Event-Strom sind seit der Rahmen-
 *    Entscheidung 2026-07-23 zwei eng umrissene Ausnahmen erlaubt: Katalog-
 *    Karten-IDs (Inhalts-Slugs, keine Personendaten; eigene Nutzerkarten nur
 *    als "custom") und der PII-bereinigte Suchbegriff NUR bei 0 Treffern
 *    (siehe EVENTS-Allowlist). Alles Weitere (Namen/E-Mails/Kartentexte)
 *    bleibt verboten. Der Snapshot selbst wird komplett aus dem schon
 *    vorhandenen gamestats abgeleitet; nichts Neues wird erfasst.
 *    Buckets sind bewusst grob (k-anonymity-freundlich): viele Nutzer teilen sich
 *    denselben Bereich, ein einzelner ist nicht herausrechenbar.
 *  - Reiner Kern: buildUsageSnapshot/bucket/featuresUsed sind seiteneffektfrei
 *    (wie srs/matcher) und in test/analytics.test.js geprüft – ganz ohne Server.
 *  - Geteilte Netz-/Auth-Schicht: der fetch-Wrapper liegt in SC.net (mit sync/social
 *    geteilt). Für die anonyme Telemetrie reist KEIN Login/Token mit.
 *
 * REIN-DATEN + ein dünner fetch-Adapter. Kein DOM. Kein Framework.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // „Zuletzt gesendet"-Tag (YYYY-MM-DD): bewusst NICHT in store.KNOWN_KEYS -> reist
  // nicht im Backup mit und ist kein Lerninhalt (analog net.js TOKEN_KEY).
  var SENT_KEY = "spanischcard.analyticssent.v1";

  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }
  function str(v) { return typeof v === "string" ? v : ""; }

  // Lokaler Tagesschlüssel „YYYY-MM-DD" – IDENTISCH zu app.dayKey/social.dayKey,
  // damit „ein Snapshot pro Tag" denselben Tag meint wie der lokale Tageszähler
  // (gamestats.dailyCounts).
  function dayKey(ms) {
    var d = new Date(typeof ms === "number" ? ms : Date.now());
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // ---------- reiner Kern (testbar, ohne Server) ----------

  // Ordnet eine Zahl einem GROBEN Bereich zu (Datensparsamkeit: nie der exakte
  // Wert, der einen Nutzer fingerprinten könnte). edges = aufsteigende Obergrenzen;
  // Rückgabe ist ein kurzer, server-stabiler String wie "0","1-10","11-30","61+".
  function bucket(n, edges) {
    var v = num(n);
    var e = Array.isArray(edges) ? edges : [];
    if (v <= 0) return "0";
    var lo = 1;
    for (var i = 0; i < e.length; i++) {
      if (v <= e[i]) return lo + "-" + e[i];
      lo = e[i] + 1;
    }
    return lo + "+";
  }

  // Welche Lern-Modi hat der Nutzer JE mindestens einmal benutzt? Rein boolesch aus
  // den vorhandenen gamestats-Zählern – KEINE Häufigkeiten, keine Reihenfolge, keine
  // IDs. Bewusst grob, damit daraus kein Nutzer fingerprintbar wird.
  function featuresUsed(g) {
    var s = isObj(g) ? g : {};
    function any(v) { return isObj(v) ? Object.keys(v).length > 0 : num(v) > 0; }
    return {
      study: num(s.reviews) > 0,
      listen: num(s.listenReviews) > 0,
      precios: num(s.preciosPlayed) > 0,
      dialogos: num(s.dialogosPlayed) > 0,
      definiciones: num(s.quizzesPlayed) > 0,
      yesto: num(s.yestoPlayed) > 0,
      frases: num(s.frasesPlayed) > 0,
      conjug: num(s.conjugPlayed) > 0,
      battles: num(s.battlesPlayed) > 0,
      roleplay: any(s.roleplaysSeen),
      challenges: any(s.challengesDone),
      ruta: any(s.rutaDays),
      pretrip: any(s.pretripDays),
    };
  }

  // Bucket-Grenzen bewusst grob halten (k-anonymity): Karten heute, aktuelle
  // Tagesserie, Bewertungen über die Lebenszeit.
  var CARD_EDGES = [10, 30, 60];
  var STREAK_EDGES = [1, 3, 7, 30];
  var REVIEW_EDGES = [10, 50, 200, 1000];

  var MASTERED_EDGES = [10, 25, 50, 75, 90]; // % gemeisterte Karten (Lernfortschritt)
  var TRIPDAILY_EDGES = [5, 10, 20, 40];     // Tagesziel (Karten/Tag) des Reiseziels

  // Baut den ANONYMEN Tages-Snapshot, den der Client (mit Zustimmung) sendet.
  // meta = { day?, now?, appVersion?, locale?, track?, masteredPct?, hasTripGoal?,
  //          tripPerDay?, edition?, platform? } – nur grobe Metadaten.
  // KEINE Identität, keine PII, keine Karten-IDs: der Server zählt nur Aggregate.
  function buildUsageSnapshot(gamestats, meta) {
    var g = isObj(gamestats) ? gamestats : {};
    var m = isObj(meta) ? meta : {};
    var day = str(m.day) || dayKey(m.now);
    var counts = isObj(g.dailyCounts) ? g.dailyCounts : {};
    return {
      app: "holaruta",
      schema: 1,
      day: day,
      appVersion: str(m.appVersion).slice(0, 20), // grob (z.B. "1.120.0"), kein Build-Fingerprint
      locale: str(m.locale).slice(0, 8),          // UI-Sprache (de/en/es)
      track: str(m.track).slice(0, 12),           // Lern-Track (de-es/es-en)
      edition: str(m.edition).slice(0, 16) || "none",   // Co-Branding-Edition (B2B) | "none"
      platform: str(m.platform).slice(0, 12) || "other", // grobe Plattform-Klasse
      cardsToday: bucket(counts[day], CARD_EDGES), // Aktivität heute (Bucket)
      streak: bucket(g.dailyStreak, STREAK_EDGES), // Bindung (Bucket)
      reviews: bucket(g.reviews, REVIEW_EDGES),    // Gesamt-Nutzung (Bucket)
      mastered: bucket(m.masteredPct, MASTERED_EDGES), // Lernfortschritt (% gemeistert, Bucket)
      tripGoal: m.hasTripGoal === true,            // hat ein Reiseziel gesetzt?
      tripDaily: bucket(m.tripPerDay, TRIPDAILY_EDGES), // Tagesziel (Bucket)
      features: featuresUsed(g),                   // welche Modi je benutzt (boolesch)
    };
  }

  // ---------- dünner Client-Adapter (opt-in, fetch-basiert) ----------

  function cfg() { return (SC.config && SC.config.analytics) || null; }
  function apiBase() {
    var base = (cfg() && cfg().endpoint) || "";
    return base.replace(/\/+$/, "");
  }
  // „available" = eine Edition hat einen Endpunkt konfiguriert (unabhängig von der
  // Nutzer-Zustimmung). Nur dann zeigt die UI überhaupt den Consent-Schalter.
  function available() { return !!(cfg() && cfg().enabled && apiBase() && typeof fetch === "function"); }

  // ---------- Sampling (SC.config.analytics.sampleRate, BACKEND.md §17.7) ----------
  // Anteil der GERÄTE, die überhaupt senden – Datenminimierung bei Reichweite.
  // Deterministisch über die pseudonyme clientId gehasht (FNV-1a): ein Gerät ist
  // stabil „drin" oder „draußen". Ein Zufall PRO EVENT würde dagegen Funnels und
  // Sessions zerreißen (halbe Journeys). Fehlend/ungültig = 1 (alle senden).
  function samplePct(id) {
    var s = str(id);
    var h = 0x811c9dc5; // FNV-1a 32 bit
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return (h % 10000) / 100; // 0 … 99.99
  }
  function sampleRate() {
    var r = cfg() && cfg().sampleRate;
    return (typeof r === "number" && isFinite(r) && r >= 0 && r <= 1) ? r : 1;
  }
  function sampled() {
    var r = sampleRate();
    if (r >= 1) return true;
    if (r <= 0) return false;
    return samplePct(clientId()) < r * 100;
  }

  function lastSent() { try { return localStorage.getItem(SENT_KEY) || ""; } catch (e) { return ""; } }
  function markSent(day) { try { localStorage.setItem(SENT_KEY, day); } catch (e) { /* egal */ } }

  // Sendet HÖCHSTENS einmal pro Tag und NUR mit beidem: konfiguriertem Endpunkt
  // UND ausdrücklicher Zustimmung (meta.consent === true). Fehler werden geschluckt
  // (fire-and-forget) – Telemetrie darf die App nie blockieren. Erfolgreich
  // bestätigt der Server -> Tag merken (kein zweiter Send), sonst nächster Start
  // erneut. Gibt ein Promise { sent } zurück (auch für die Tests).
  function maybeSend(gamestats, meta) {
    var m = isObj(meta) ? meta : {};
    if (!available() || m.consent !== true || !sampled()) return Promise.resolve({ sent: false });
    var snap = buildUsageSnapshot(gamestats, m);
    if (lastSent() === snap.day) return Promise.resolve({ sent: false });
    return SC.net.request(apiBase(), "POST", "/v1/usage", snap, { timeout: 8000 })
      .then(function (r) {
        var ok = !!(r && r.ok);
        if (ok) markSent(snap.day);
        return { sent: ok, day: snap.day };
      }, function () { return { sent: false }; });
  }

  // =========================================================================
  // EVENT-PIPELINE (Interaktions-Tracking, BACKEND.md §17.6)
  // Detaillierter Event-Strom NEBEN dem Tages-Snapshot – für Weiterentwicklung
  // (Funnels/Retention/Drop-off) und Monitoring (Fehler/Performance). Gleiches
  // Gate; ohne Endpunkt UND ctx.consent wird NICHTS gepuffert/gesendet.
  // =========================================================================

  var EVENTS_PATH = "/v1/events";
  var QUEUE_KEY = "spanischcard.analyticsqueue.v1"; // gepufferte Events (Ring)
  var CLIENT_KEY = "spanischcard.analyticscid.v1";  // pseudonyme, resetbare clientId
  var FIRST_KEY = "spanischcard.analyticsfirst.v1"; // Tag des ersten (zugestimmten) Events – Time-to-Value
  // Alle vier bewusst NICHT in store.KNOWN_KEYS -> reisen nicht im Backup mit.
  var QUEUE_CAP = 200;                 // höchstens so viele Events puffern (Ring)
  var BATCH_MAX = 50;                  // pro POST höchstens so viele
  var SESSION_GAP_MS = 30 * 60 * 1000; // >30 min Inaktivität -> neue Session
  var ERROR_CAP = 10;                  // höchstens so viele error-Events je Session

  // Pseudonyme Id (kein Klarname, keine Krypto-Anforderung – nur Wiedererkennung).
  function randomId() {
    try {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        var a = new Uint8Array(9); crypto.getRandomValues(a);
        return Array.prototype.map.call(a, function (b) { return (b & 0xff).toString(16).padStart(2, "0"); }).join("");
      }
    } catch (e) { /* Fallback unten */ }
    return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // Geräte-pseudonym: persistent, aber jederzeit resetbar (resetClientId / Consent-aus).
  function clientId() {
    var id = null;
    try { id = localStorage.getItem(CLIENT_KEY); } catch (e) { id = null; }
    if (!id) { id = randomId(); try { localStorage.setItem(CLIENT_KEY, id); } catch (e2) { /* egal */ } }
    return id;
  }

  // Time-to-Value: der TAG des allerersten getrackten Events wird lokal gestempelt
  // (nur mit aktivem Gate, also nie ohne Zustimmung). daysSinceFirstUse() liefert
  // daraus die Ganzzahl „Tage seit Erstnutzung" für activation.day_n – es reist
  // NIE das Datum selbst, nur die Differenz, gedeckelt gegen Ausreißer/Fingerprints.
  function stampFirstUse(now) {
    try { if (!localStorage.getItem(FIRST_KEY)) localStorage.setItem(FIRST_KEY, dayKey(now)); } catch (e) { /* egal */ }
  }
  function daysSinceFirstUse(now) {
    var first = "";
    try { first = localStorage.getItem(FIRST_KEY) || ""; } catch (e) { return undefined; }
    var f = first.split("-"), c = dayKey(typeof now === "number" ? now : Date.now()).split("-");
    if (f.length !== 3) return undefined;
    var d = Math.round((Date.UTC(+c[0], +c[1] - 1, +c[2]) - Date.UTC(+f[0], +f[1] - 1, +f[2])) / 86400000);
    if (!isFinite(d) || d < 0) return undefined;
    return Math.min(d, 365);
  }

  // Sitzungs-pseudonym: pro App-Start neu, rotiert nach Inaktivität. Nur im Speicher.
  var sess = null; // { id, last }
  function sessionId(now) {
    var t = typeof now === "number" ? now : Date.now();
    if (!sess || (t - sess.last) > SESSION_GAP_MS) sess = { id: randomId(), last: t };
    else sess.last = t;
    return sess.id;
  }

  // ---------- reiner Kern: Taxonomie + Allowlist-Sanitizer (testbar) ----------

  // Erlaubtes „Slug"-Format für Enum-/Kategorie-Werte: KEINE Leerzeichen, kurz.
  // Freitext (Suchbegriffe, Kartentexte, Namen) hat Leerzeichen/Satzzeichen und
  // fällt damit STRUKTURELL durch -> kann nicht versehentlich gesendet werden.
  var SLUG = /^[a-z0-9_.:+-]{1,32}$/i;

  // Wenige „text"-Felder (nur Fehler-Diagnose) gehen NICHT als Slug durch, sondern
  // werden PII-bereinigt und hart gekappt.
  function cleanText(v) {
    var s = str(v);
    if (!s) return undefined;
    s = s.replace(/[\w.+-]+@[\w.-]+/g, "@"); // E-Mail-Adressen entfernen
    s = s.replace(/\d{4,}/g, "#");           // lange Ziffernfolgen (IDs/Tel/Karten) entfernen
    s = s.replace(/\s+/g, " ").trim();
    return s ? s.slice(0, 80) : undefined;
  }

  function san(mode, val) {
    switch (mode) {
      case "bool": return typeof val === "boolean" ? val : !!val;
      case "int": { var n = num(val); return n < 0 ? 0 : Math.round(n); }
      case "slug":
      case "bucket": return (typeof val === "string" && SLUG.test(val)) ? val : undefined;
      case "text": return cleanText(val);
      default: return undefined;
    }
  }

  // Taxonomie: pro Event eine feste Prop-Allowlist (key -> Sanitizer-Modus). Alles
  // NICHT Gelistete wird verworfen (Default deny). „bucket"-Felder erwartet der Kern
  // bereits als Bucket-STRING (Aufrufer nutzt SC.analytics.bucket).
  var EVENTS = {
    // standalone = läuft die App als installierte PWA (Gegenstück zum Install-
    // Funnel: nicht nur „installiert", sondern „wird installiert BENUTZT").
    app_open:         { returning: "bool", load_ms: "bucket", src: "slug", standalone: "bool" },
    screen_view:      { screen: "slug", tab: "slug" },
    action:           { action: "slug", mode: "slug", dir: "slug", level: "slug", tab: "slug", scope: "slug" },
    session_start:    { scope: "slug", origin: "slug", mode: "slug", cards: "bucket" },
    // Runden-Kennzahlen: die groben Buckets (answered/accuracy/xp/again) bleiben für
    // Abwärtskompatibilität; die *_n/secs-Ints geben Investor-Analytics die EXAKTE
    // Interaktions-Tiefe PRO SITZUNG (opt-in, pseudonym – weiterhin KEIN Freitext,
    // KEINE Karten-IDs/-Inhalte). „secs" = Dauer DIESER Lernrunde (nicht die 30-min-
    // sessionId-Spanne) und wird aufrufer-seitig gegen Fingerprinting gedeckelt.
    // mode = Lernmodus der Runde (flip/type/listen). speak_n/context_n sind
    // RUNDEN-SUMMEN (wie oft TTS bzw. Kontext-Panel auf Karten DIESER Runde):
    // bewusst KEIN Hochfrequenz-Event-Spam – die Aktionen speak/flip/rate/skip sind
    // in app.js als NOISY_ACTIONS vom generischen action-Event ausgenommen und
    // reisen stattdessen als Summen hier.
    session_complete: { answered: "bucket", accuracy: "bucket", xp: "bucket", again: "bucket", mastered: "int",
                        answered_n: "int", correct_n: "int", xp_n: "int", secs: "int",
                        mode: "slug", speak_n: "int", context_n: "int" },
    // card = Katalog-Karten-ID (kurzer Inhalts-Slug wie "b02" – Referenz auf
    // App-Inhalte, keine Personendaten; bewusste Rahmen-Entscheidung 2026-07-23).
    // EIGENE Nutzerkarten (custom: true) reisen NIE mit ihrer Id/ihrem Inhalt,
    // sondern nur als Platzhalter "custom". spoke/ctx = wurde auf DIESER Karte
    // vor der Bewertung TTS bzw. das Kontext-Panel benutzt (karten-genaue
    // Werkzeug-Nutzung, ohne zusätzliche Einzel-Events).
    card_rated:       { rating: "slug", mode: "slug", level: "slug", cat: "slug",
                        card: "slug", spoke: "bool", ctx: "bool" },
    // Start↔Abschluss je Lernspiel: feature_start am Rundenstart, feature_complete am
    // Rundenende – zusammen ergeben sie die Abschlussquote (Funnel je Spiel).
    feature_start:    { feature: "slug", mode: "slug" },
    feature_complete: { feature: "slug", perfect: "bool" },
    // q = der Suchbegriff, NUR bei Suchen mit 0 Treffern gesetzt (Content-
    // Lücken-Analyse: „was fehlt im Katalog?" – Rahmen-Entscheidung 2026-07-23).
    // Der "text"-Sanitizer (cleanText) entfernt E-Mails/lange Ziffernfolgen und
    // kappt hart auf 80 Zeichen. Bei Treffern reist weiterhin NIE der Suchtext,
    // nur die groben qlen/results-Buckets.
    search:           { qlen: "bucket", results: "bucket", q: "text" },
    // Virality-Funnel: content = WAS geteilt wird (stats/card/tips/module …),
    // NIE der Empfänger/Inhalt. (channel kann später ergänzt werden, wenn der
    // Client den Wel-Weg kennt – bewusst NICHT gelistet, solange nicht gesendet.)
    share:            { content: "slug" },
    // Aktivierungs-/Habit-Meilensteine: first_session (allererste Runde) sowie
    // streak_3/streak_7/streak_30 (Serientage erreicht – Gewohnheitsbildung).
    // day_n = Tage zwischen erster (zugestimmter) Nutzung und dem Meilenstein
    // (Time-to-Value bzw. Zeit-bis-Gewohnheit, ≤365).
    activation:       { milestone: "slug", day_n: "int" },
    // Einstufungstest abgeschlossen: NUR das grobe Niveau (A1/A2/B1 …), nie
    // Antworten/Punkte. Start/Abschluss reisen als feature_start/-complete.
    placement_result: { level: "slug" },
    onboarding_step:  { step: "slug", n: "int" },
    onboarding_complete: {},
    error:            { type: "slug", msg: "text", src: "text", line: "int", screen: "slug" },
    consent_change:   { on: "bool" },
    // Install-Funnel: pwa_prompt = Ausgang des NATIVEN Install-Dialogs
    // (accepted/dismissed), pwa_installed = tatsächlich installiert (alle Wege).
    pwa_prompt:       { outcome: "slug" },
    pwa_installed:    {},
  };
  // Erweiterbar: weitere Event-Namen lassen sich hier ergänzen + an der passenden
  // Stelle via SC.analytics.track() senden; der Server akzeptiert sie über dasselbe
  // Allowlist-Muster. Bewusst NUR Events gelistet, die der Client heute tatsächlich
  // sendet (Spec == Implementierung).

  // Hält NUR die für dieses Event erlaubten, sanitisierten Props (Default deny).
  function sanitizeProps(name, props) {
    var spec = EVENTS[str(name)];
    if (!spec) return {};
    var p = isObj(props) ? props : {};
    var out = {};
    Object.keys(spec).forEach(function (k) {
      if (p[k] === undefined || p[k] === null) return;
      var v = san(spec[k], p[k]);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }

  // Baut den vollständigen Event-Envelope (rein, deterministisch über ctx).
  function buildEvent(name, props, ctx) {
    var c = isObj(ctx) ? ctx : {};
    var now = typeof c.now === "number" ? c.now : Date.now();
    return {
      v: 1,
      ts: now,
      day: dayKey(now),
      clientId: str(c.clientId),
      sessionId: str(c.sessionId),
      seq: num(c.seq),
      appVersion: str(c.appVersion).slice(0, 20),
      locale: str(c.locale).slice(0, 8),
      track: str(c.track).slice(0, 12),
      edition: str(c.edition).slice(0, 16),   // Co-Branding-Edition (B2B) | ""
      platform: str(c.platform).slice(0, 12), // grobe Plattform-Klasse | ""
      event: str(name).slice(0, 40),
      props: sanitizeProps(name, props),
    };
  }

  // ---------- Adapter: Kontext, Queue, track/flush ----------

  // Vom Controller einmalig (und bei Consent-/Sprachwechsel) gesetzt: Meta + ob der
  // Nutzer zugestimmt hat. OHNE consent wird NICHTS gepuffert (keine stille Sammlung).
  var ctx = { appVersion: "", locale: "", track: "", edition: "", platform: "", consent: false };
  function configure(next) { if (isObj(next)) ctx = Object.assign({}, ctx, next); }

  function loadQueue() {
    try { var a = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  var queue = loadQueue();
  function saveQueue() { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (e) { /* Quota/aus -> egal */ } }

  var seqCounter = 0;

  // Erfasst ein Event: bauen + sanitisieren + in die Ring-Queue. Tut NICHTS ohne
  // Endpunkt UND Zustimmung und NUR für bekannte Event-Namen. Wirft nie.
  function track(name, props, opts) {
    if (!available() || ctx.consent !== true || !sampled()) return;
    if (!EVENTS[str(name)]) return;
    var o = isObj(opts) ? opts : {};
    var now = typeof o.now === "number" ? o.now : Date.now();
    // Fehler-Schleifen (z.B. ein Error pro Render-Frame) würden die Ring-Queue
    // fluten und die WERTVOLLEN Events (Sessions, Funnels) verdrängen: error-Events
    // pro Session hart deckeln. Der Zähler lebt auf der Session und rotiert mit ihr.
    if (str(name) === "error") {
      sessionId(now); // sess sicherstellen (rotiert ggf. nach Inaktivität)
      sess.errs = (sess.errs || 0) + 1;
      if (sess.errs > ERROR_CAP) return;
    }
    stampFirstUse(now); // Time-to-Value-Anker: Tag des ersten (zugestimmten) Events
    var ev = buildEvent(name, props, {
      now: now,
      clientId: clientId(),
      sessionId: sessionId(now),
      seq: seqCounter++,
      appVersion: ctx.appVersion,
      locale: ctx.locale,
      track: ctx.track,
      edition: ctx.edition,
      platform: ctx.platform,
    });
    queue.push(ev);
    if (queue.length > QUEUE_CAP) queue = queue.slice(queue.length - QUEUE_CAP); // Ring: Älteste verwerfen
    saveQueue();
  }

  // Entfernt GENAU die gesendeten Events (per seq) aus der Queue. Nebenläufigkeits-
  // sicher: nimmt ein zweiter (z.B. Beacon-)Flush dieselbe Slice, löscht er nicht aus
  // Versehen die NÄCHSTE Slice (das wäre Datenverlust) – schlimmstenfalls ein
  // Duplikat-Send. Idempotent (bereits entfernte seqs sind ein No-op).
  function removeSent(batch) {
    var ids = Object.create(null);
    batch.forEach(function (e) { if (e) ids[e.seq] = 1; });
    queue = queue.filter(function (e) { return !ids[e.seq]; });
    saveQueue();
  }

  var flushing = false; // verhindert parallele Netz-Flushes (Doppel-Sends)

  // Sendet einen Batch gepufferter Events. opts.beacon nutzt navigator.sendBeacon
  // (zuverlässig beim Verstecken/Schließen). Erfolg -> gesendete Events entfernen.
  // Wirft nie.
  function flush(opts) {
    var o = isObj(opts) ? opts : {};
    if (!available() || ctx.consent !== true || !queue.length) return Promise.resolve({ sent: 0 });
    var batch = queue.slice(0, BATCH_MAX);
    // Beim Verstecken/Schließen: zuverlässig via sendBeacon (synchron, übersteht das
    // Entladen). Best-effort, auch wenn gerade ein regulärer Flush läuft. Es wird die
    // GANZE Queue in ≤50er-Batches gesendet (max. QUEUE_CAP/BATCH_MAX = 4 POSTs) –
    // vorher ging beim harten Schließen alles jenseits des ersten Batches verloren.
    // Lehnt der Browser einen Beacon ab (Budget voll), bleibt der Rest gepuffert.
    if (o.beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      var beaconSent = 0;
      while (queue.length) {
        var b = queue.slice(0, BATCH_MAX);
        var ok = false;
        try {
          var blob = new Blob([JSON.stringify({ events: b })], { type: "application/json" });
          ok = navigator.sendBeacon(apiBase() + EVENTS_PATH, blob);
        } catch (e) { ok = false; }
        if (!ok) break;
        removeSent(b);
        beaconSent += b.length;
      }
      if (beaconSent) return Promise.resolve({ sent: beaconSent, beacon: true });
      // Beacon abgelehnt -> regulärer Pfad unten
    }
    // Regulärer Pfad: nur EIN gleichzeitiger Netz-Flush.
    if (flushing) return Promise.resolve({ sent: 0, busy: true });
    flushing = true;
    return SC.net.request(apiBase(), "POST", EVENTS_PATH, { events: batch }, { timeout: 8000 })
      .then(function (r) {
        flushing = false;
        if (r && r.ok) { removeSent(batch); return { sent: batch.length }; }
        return { sent: 0 };
      }, function () { flushing = false; return { sent: 0 }; });
  }

  // Pseudonyme clientId + Erstnutzungs-Tag verwerfen und Puffer leeren
  // (Reset / Consent-aus): danach ist NICHTS Wiedererkennbares mehr gespeichert.
  function resetClientId() {
    try { localStorage.removeItem(CLIENT_KEY); } catch (e) { /* egal */ }
    try { localStorage.removeItem(FIRST_KEY); } catch (e) { /* egal */ }
    queue = []; saveQueue(); sess = null;
  }

  SC.analytics = {
    // Adapter (Snapshot)
    available: available,
    maybeSend: maybeSend,
    SENT_KEY: SENT_KEY,
    // Adapter (Events)
    configure: configure,
    track: track,
    flush: flush,
    resetClientId: resetClientId,
    daysSinceFirstUse: daysSinceFirstUse,
    QUEUE_KEY: QUEUE_KEY,
    CLIENT_KEY: CLIENT_KEY,
    FIRST_KEY: FIRST_KEY,
    // Reiner Kern (für Tests + serverseitige Wiederverwendung)
    dayKey: dayKey,
    bucket: bucket,
    samplePct: samplePct,
    featuresUsed: featuresUsed,
    buildUsageSnapshot: buildUsageSnapshot,
    buildEvent: buildEvent,
    sanitizeProps: sanitizeProps,
    EVENTS: EVENTS,
  };
})();
