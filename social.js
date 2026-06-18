/*
 * social.js  (SC.social) – OPTIONALE, opt-in Sozial-/Wettbewerbs-Schicht.
 *
 * Zweck: Freunde verbinden und eine TAGES-RANGLISTE zeigen ("wie viele Karten
 * hat wer heute gemacht?") – der soziale/kompetitive Aufsatz auf der Stufe-3-
 * Cloud (BACKEND.md). Wie sync.js ist dieses Modul so geschnitten, dass NUR
 * noch der Server fehlt: der reine Kern (Snapshot bauen, Rangliste sortieren,
 * Freundes-Code kodieren) ist hier fertig + testbar, der dünne fetch-Adapter
 * spricht die in BACKEND.md §16 spezifizierten Endpunkte.
 *
 * Prinzipien (identisch zu sync.js / BACKEND.md §1):
 *  - Opt-in: ohne `SC.config.social.enabled` macht das Modul NICHTS (kein fetch,
 *    kein Netzwerk). Die App bleibt exakt offline-first wie heute.
 *  - Datenminimierung: der veröffentlichte Snapshot enthält NUR, was die
 *    Rangliste braucht (Anzeigename, Tag, Karten heute, Streak, Reviews) –
 *    KEIN Lernfortschritt, KEINE Inhalte, keine PII über den Wunsch-Namen hinaus.
 *  - Geteilte Anmeldung: die Identität kommt vom selben passwortlosen Login wie
 *    sync.js (gemeinsamer Token-Key) – ein Login deckt Cloud-Sync UND Freunde ab.
 *  - Reiner Kern: `buildSnapshot` / `buildLeaderboard` / `*FriendCode` sind
 *    seiteneffektfreie Funktionen (wie srs/matcher/sync.merge) und in
 *    test/social.test.js geprüft – ganz ohne Server.
 *
 * REIN-DATEN + ein dünner fetch-Adapter. Kein DOM. Kein Framework.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // Auth-Token + Login liegen in SC.net und werden mit sync.js geteilt -> ein
  // passwortloser Login gilt für Cloud-Sync UND Freunde/Rangliste (eine
  // Identität, ein Server).
  var FRIEND_TAG = "HRF1."; // Präfix des teilbaren Freundes-Codes (analog HRT1. bei Aufgaben).

  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }
  function str(v) { return typeof v === "string" ? v : ""; }
  function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64decode(b) { return decodeURIComponent(escape(atob(b))); }

  // Lokaler Tagesschlüssel "YYYY-MM-DD" – IDENTISCH zu app.dayKey, damit der
  // Snapshot denselben Tag meint wie der lokale Tageszähler (gamestats.dailyCounts).
  function dayKey(ms) {
    var d = new Date(typeof ms === "number" ? ms : Date.now());
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // ---------- reiner Kern (testbar, ohne Server) ----------

  // Wie viele Karten an einem Tag? Liest den vorhandenen Tageszähler aus den
  // gamestats (store.js: dailyCounts["YYYY-MM-DD"] -> Anzahl Bewertungen).
  function cardsOn(gamestats, key) {
    var g = isObj(gamestats) ? gamestats : {};
    var counts = isObj(g.dailyCounts) ? g.dailyCounts : {};
    return num(counts[key]);
  }

  // Baut den ÖFFENTLICHEN Tages-Snapshot, den der Client veröffentlicht. Bewusst
  // minimal (Datenminimierung): nur was die Rangliste anzeigt. Der Server hängt
  // die Nutzer-Identität aus dem Token an – hier reist KEINE ID mit.
  function buildSnapshot(gamestats, opts) {
    var g = isObj(gamestats) ? gamestats : {};
    var o = isObj(opts) ? opts : {};
    var day = str(o.day) || dayKey(o.now);
    return {
      day: day,
      name: str(o.name).slice(0, 40),       // selbst gewählter Anzeigename (kein Klarname nötig)
      cards: cardsOn(g, day),               // Karten HEUTE (Wettbewerbs-Kennzahl)
      streak: num(g.dailyStreak),           // aktuelle Tagesserie
      reviews: num(g.reviews),              // Gesamt-Bewertungen (Lebenszeit) – sekundäre Sortierung
    };
  }

  // Standard-Wettbewerbsrang ("1224") über die Tages-Karten: Gleichstand teilt
  // sich denselben Rang, danach folgt eine Lücke. Sekundär nach Streak, dann
  // Reviews, dann Name – DETERMINISTISCH (egal in welcher Reihenfolge der Server
  // liefert), damit zwei Geräte dieselbe Liste sehen.
  function buildLeaderboard(entries, opts) {
    var list = Array.isArray(entries) ? entries : [];
    var o = isObj(opts) ? opts : {};
    var day = str(o.day);
    var meId = (o.meId === 0 || o.meId) ? String(o.meId) : null;

    var rows = list
      .filter(function (e) { return isObj(e) && (!day || str(e.day) === day); })
      .map(function (e) {
        return {
          id: (e.id === 0 || e.id) ? String(e.id) : "",
          name: str(e.name).slice(0, 40),
          cards: num(e.cards),
          streak: num(e.streak),
          reviews: num(e.reviews),
          day: str(e.day),
        };
      });

    rows.sort(function (a, b) {
      return (b.cards - a.cards) || (b.streak - a.streak) ||
        (b.reviews - a.reviews) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    });

    var me = null;
    var lastCards = null, lastRank = 0;
    rows.forEach(function (r, i) {
      r.pos = i + 1;                                  // fortlaufende Listenposition
      r.rank = (r.cards === lastCards) ? lastRank : (i + 1); // geteilter Wettbewerbsrang bei Gleichstand
      lastCards = r.cards; lastRank = r.rank;
      r.me = meId !== null && r.id === meId;
      if (r.me) me = r;
    });

    return { entries: rows, me: me, day: day || (rows[0] && rows[0].day) || "" };
  }

  // Teilbarer Freundes-Code: kapselt die eigene (Server-)Konto-Id in einen
  // kurzen String, den man per WhatsApp/Mail teilt. Analog zu store.encodeTask
  // (HRT1.) – eigenes Tag HRF1. zur Validierung. Der Server gibt diesen Code via
  // GET /v1/me/code aus; POST /v1/friends nimmt ihn entgegen.
  function makeFriendCode(id) {
    var s = (id === 0 || id) ? String(id) : "";
    if (!s) return "";
    try { return FRIEND_TAG + b64encode(JSON.stringify({ app: "holaruta-friend", v: 1, id: s })); }
    catch (e) { return ""; }
  }
  function parseFriendCode(code) {
    if (typeof code !== "string") return null;
    var s = code.trim();
    if (s.indexOf(FRIEND_TAG) === 0) s = s.slice(FRIEND_TAG.length);
    if (!s) return null;
    var obj = null;
    try { obj = JSON.parse(b64decode(s)); } catch (e) { return null; }
    if (!isObj(obj) || obj.app !== "holaruta-friend") return null;
    var id = (obj.id === 0 || obj.id) ? String(obj.id) : "";
    return id ? { id: id } : null;
  }

  // ---------- dünner Client-Adapter (opt-in, fetch-basiert) ----------
  // Auth-Token, Login und der fetch-Wrapper liegen in SC.net (geteilt mit
  // sync.js – eine Identität, ein Server). Hier bleibt nur das Social-Spezifische.

  function cfg() { return (SC.config && SC.config.social) || null; }
  function syncCfg() { return (SC.config && SC.config.sync) || null; }
  // apiBase fällt auf die Sync-Adresse zurück: derselbe Server liefert Sync UND
  // Freunde (BACKEND.md §16). Eine Edition kann social.apiBase separat setzen.
  function apiBase() {
    var base = (cfg() && cfg().apiBase) || (syncCfg() && syncCfg().apiBase) || "";
    return base.replace(/\/+$/, "");
  }
  function enabled() { return !!(cfg() && cfg().enabled && apiBase() && typeof fetch === "function"); }

  function loggedIn() { return SC.net.loggedIn(); }
  function req(method, path, body) { return SC.net.request(apiBase(), method, path, body); }

  // Passwortloser Login (BACKEND.md §7), geteilt über SC.net. So ist die
  // Sozial-Schicht eigenständig anmeldefähig, auch wenn eine Edition nur
  // `social` (ohne `sync`) aktiviert.
  function login(email) {
    if (!enabled()) return Promise.reject(new Error("social disabled"));
    return SC.net.login(apiBase(), email);
  }
  function confirm(email, token) {
    if (!enabled()) return Promise.reject(new Error("social disabled"));
    return SC.net.confirm(apiBase(), email, token);
  }
  function logout() { SC.net.logout(); }

  // Eigener teilbarer Freundes-Code (vom Server). Fällt offline-tolerant auf null.
  function myCode() { return req("GET", "/v1/me/code"); }
  // Freund per Code hinzufügen / entfernen / auflisten.
  function addFriend(code) { return req("POST", "/v1/friends", { code: String(code || "").trim() }); }
  function removeFriend(id) { return req("DELETE", "/v1/friends/" + encodeURIComponent(id)); }
  function friends() { return req("GET", "/v1/friends"); }
  // Eigenen Tages-Snapshot veröffentlichen.
  function publish(snapshot) { return req("PUT", "/v1/social/snapshot", { snapshot: snapshot }); }
  // Rangliste der Freunde (optional für einen bestimmten Tag).
  function leaderboard(day) { return req("GET", "/v1/leaderboard" + (day ? "?day=" + encodeURIComponent(day) : "")); }

  // Ein vollständiger Durchlauf für die UI: eigenen Snapshot veröffentlichen,
  // dann die Rangliste holen und mit dem reinen Kern sortieren/markieren.
  // Erfüllt mit { ok:true, board }; Fehler werden als rejectete Promise gemeldet
  // (vom Aufrufer .catch-t). Macht NICHTS ohne enabled() + Login.
  function refresh(gamestats, opts) {
    if (!enabled() || !loggedIn()) return Promise.reject(new Error("not ready"));
    var o = isObj(opts) ? opts : {};
    var snap = buildSnapshot(gamestats, o);
    return publish(snap).then(function () {
      return leaderboard(snap.day);
    }).then(function (r) {
      var entries = (r && r.ok && r.body && Array.isArray(r.body.entries)) ? r.body.entries : [];
      var meId = (r && r.ok && r.body && (r.body.meId === 0 || r.body.meId)) ? r.body.meId : (o.meId != null ? o.meId : null);
      return { ok: true, board: buildLeaderboard(entries, { day: snap.day, meId: meId }) };
    });
  }

  SC.social = {
    // Adapter
    enabled: enabled,
    loggedIn: loggedIn,
    login: login,
    confirm: confirm,
    logout: logout,
    myCode: myCode,
    addFriend: addFriend,
    removeFriend: removeFriend,
    friends: friends,
    publish: publish,
    leaderboard: leaderboard,
    refresh: refresh,
    // Reiner Kern (für Tests + Wiederverwendung serverseitig)
    dayKey: dayKey,
    cardsOn: cardsOn,
    buildSnapshot: buildSnapshot,
    buildLeaderboard: buildLeaderboard,
    makeFriendCode: makeFriendCode,
    parseFriendCode: parseFriendCode,
  };
})();
