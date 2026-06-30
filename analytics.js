/*
 * analytics.js  (SC.analytics) – OPTIONALE, opt-in, ANONYME Nutzungs-Telemetrie.
 *
 * Zweck: dem Betreiber eine grobe Antwort auf „wie viele nutzen die App und was
 * machen sie?" geben – OHNE die Datensparsamkeit der App aufzugeben. Wie sync.js
 * und social.js ist dieses Modul so geschnitten, dass nur noch der Server fehlt:
 * der reine, testbare Kern (Snapshot aus den BEREITS vorhandenen gamestats bauen
 * und grob bucketen) ist hier fertig, der dünne fetch-Adapter spricht den in
 * BACKEND.md §17 spezifizierten Endpunkt.
 *
 * Prinzipien (identisch zu social.js / BACKEND.md §1):
 *  - Opt-in & DEFAULT AUS: gesendet wird NUR, wenn (1) eine Edition einen Endpunkt
 *    konfiguriert hat (SC.config.analytics.enabled + endpoint) UND (2) der Nutzer
 *    im Profil ausdrücklich zugestimmt hat (meta.consent === true). Sonst exakt
 *    0 Netzwerk-Calls – wie die App ohne dieses Modul.
 *  - Datenminimierung: der Snapshot trägt NUR grobe, gebucketete Aggregate –
 *    KEINE PII, KEINE Karten-IDs, KEIN Suchtext, KEINE stabile Nutzer-ID. Alles
 *    wird aus dem schon vorhandenen gamestats abgeleitet; nichts Neues wird erfasst.
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

  // Baut den ANONYMEN Tages-Snapshot, den der Client (mit Zustimmung) sendet.
  // meta = { day?, now?, appVersion?, locale?, track? } – nur grobe Metadaten.
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
      cardsToday: bucket(counts[day], CARD_EDGES), // Aktivität heute (Bucket)
      streak: bucket(g.dailyStreak, STREAK_EDGES), // Bindung (Bucket)
      reviews: bucket(g.reviews, REVIEW_EDGES),    // Gesamt-Nutzung (Bucket)
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

  function lastSent() { try { return localStorage.getItem(SENT_KEY) || ""; } catch (e) { return ""; } }
  function markSent(day) { try { localStorage.setItem(SENT_KEY, day); } catch (e) { /* egal */ } }

  // Sendet HÖCHSTENS einmal pro Tag und NUR mit beidem: konfiguriertem Endpunkt
  // UND ausdrücklicher Zustimmung (meta.consent === true). Fehler werden geschluckt
  // (fire-and-forget) – Telemetrie darf die App nie blockieren. Erfolgreich
  // bestätigt der Server -> Tag merken (kein zweiter Send), sonst nächster Start
  // erneut. Gibt ein Promise { sent } zurück (auch für die Tests).
  function maybeSend(gamestats, meta) {
    var m = isObj(meta) ? meta : {};
    if (!available() || m.consent !== true) return Promise.resolve({ sent: false });
    var snap = buildUsageSnapshot(gamestats, m);
    if (lastSent() === snap.day) return Promise.resolve({ sent: false });
    return SC.net.request(apiBase(), "POST", "/v1/usage", snap, { timeout: 8000 })
      .then(function (r) {
        var ok = !!(r && r.ok);
        if (ok) markSent(snap.day);
        return { sent: ok, day: snap.day };
      }, function () { return { sent: false }; });
  }

  SC.analytics = {
    // Adapter
    available: available,
    maybeSend: maybeSend,
    SENT_KEY: SENT_KEY,
    // Reiner Kern (für Tests + serverseitige Wiederverwendung)
    dayKey: dayKey,
    bucket: bucket,
    featuresUsed: featuresUsed,
    buildUsageSnapshot: buildUsageSnapshot,
  };
})();
