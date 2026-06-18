/*
 * sync.js  (SC.sync) – OPTIONALE, opt-in Cloud-Sync-Schicht (Stufe 3).
 *
 * Vollständige Spezifikation: BACKEND.md. Dieses Modul ist der schlanke
 * Client-Adapter + die ARCHITEKTUR-KERNFUNKTION `merge` (rein, testbar) aus
 * Phase 1/2 des Migrationspfads.
 *
 * Prinzipien (wie BACKEND.md §1):
 *  - Opt-in: ohne `SC.config.sync.enabled` macht das Modul NICHTS (kein fetch,
 *    kein Netzwerk) – die App bleibt exakt offline-first wie heute.
 *  - Anschlussfähig: Sync-Einheit ist das BESTEHENDE Backup-Payload aus
 *    store.exportData() ({ data: { <key>: … } }); store.importData wendet das
 *    gemergte Ergebnis an. Kein neues Datenformat.
 *  - Reiner Kern: `merge*` sind seiteneffektfreie Funktionen (wie srs/matcher)
 *    und werden in test/sync.test.js geprüft – ganz ohne Server.
 *
 * REIN-DATEN + ein dünner fetch-Adapter. Kein DOM. Kein Framework.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // Kanonische lokale Keys (stabil; identisch zu store.js).
  var PROGRESS_KEY = "spanischcard.progress.v2";
  var SETTINGS_KEY = "spanischcard.settings.v1";
  var USERCARDS_KEY = "spanischcard.usercards.v1";
  var GAMESTATS_KEY = "spanischcard.gamestats.v1";
  // Auth-Token: bewusst NICHT in store.KNOWN_KEYS -> reist nicht im Backup mit.
  var TOKEN_KEY = "spanischcard.synctoken.v1";

  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }

  // ---------- reine Merge-Funktionen (Phase 2, BACKEND.md §8) ----------

  // Karten-Fortschritt: pro Karte gewinnt der Datensatz mit MEHR Wiederholungen
  // (reps ist monoton), Gleichstand -> spätere Fälligkeit (due). Verlustarm.
  function progressScore(r) { return num(r && r.reps) * 1e15 + num(r && r.due); }
  function mergeProgress(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {}, id;
    for (id in a) if (Object.prototype.hasOwnProperty.call(a, id)) out[id] = a[id];
    for (id in b) if (Object.prototype.hasOwnProperty.call(b, id)) {
      if (!(id in out) || progressScore(b[id]) > progressScore(out[id])) out[id] = b[id];
    }
    return out;
  }

  // Tiefe Vereinigung zweier Mengen-/Zähler-Maps: Zahlen -> max, true/true ->
  // true, Objekte -> rekursiv. Für gamestats-Maps (challengesDone, pretripDays
  // {scope:{day}}, rutaDays, dailyCounts …) – verlustfrei über Geräte.
  function deepUnion(a, b) {
    if (isObj(a) && isObj(b)) {
      var out = {}, k;
      for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
      for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) {
        out[k] = (k in out) ? deepUnion(out[k], b[k]) : b[k];
      }
      return out;
    }
    if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
    if (typeof a === "boolean" && typeof b === "boolean") return a || b;
    return a !== undefined ? a : b;
  }

  // Ruta-Check-Verlauf über Geräte vereinen: alle Durchläufe beider Seiten,
  // dedupliziert (nach Zeitstempel/Inhalt), chronologisch, gedeckelt – kein
  // Ergebnis geht beim Sync verloren.
  function mergePlacementHistory(a, b) {
    var la = Array.isArray(a) ? a : [], lb = Array.isArray(b) ? b : [];
    var seen = {}, all = [], i;
    function add(e) {
      if (!isObj(e)) return;
      // Fingerabdruck über mehrere Felder: echte Duplikate (dasselbe Ergebnis von
      // zwei Geräten) fallen zusammen, zwei verschiedene Läufe am selben Tag (Alt-
      // daten ohne ts) bleiben aber erhalten – sie unterscheiden sich praktisch
      // immer in Trefferquote/Unknown-Rate/Tempo.
      var key = [e.ts || "", e.at || "", e.level || "", e.finalScore || "",
                 e.accuracy || "", e.unknownRate || "", e.tempo || ""].join("|");
      if (seen[key]) return;
      seen[key] = 1; all.push(e);
    }
    for (i = 0; i < la.length; i++) add(la[i]);
    for (i = 0; i < lb.length; i++) add(lb[i]);
    all.sort(function (x, y) {
      var tx = (x.ts || x.at) || "", ty = (y.ts || y.at) || "";
      return tx < ty ? -1 : (tx > ty ? 1 : 0);
    });
    return all.slice(-50);
  }

  function mergeGamestats(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {}, k;
    var keys = {};
    for (k in a) keys[k] = 1;
    for (k in b) keys[k] = 1;
    for (k in keys) {
      var va = a[k], vb = b[k];
      if (vb === undefined) { out[k] = va; continue; }
      if (va === undefined) { out[k] = vb; continue; }
      if (k === "placementHistory") {
        out[k] = mergePlacementHistory(va, vb); continue;
      }
      if (k === "placement") {
        // Letztes Ergebnis: das spätere gewinnt (ts, sonst at) – nicht zwei Läufe
        // vermischen (sonst entstünde ein Frankenstein-Ergebnis über deepUnion).
        var pa = (isObj(va) && (va.ts || va.at)) || "", pb = (isObj(vb) && (vb.ts || vb.at)) || "";
        out[k] = (pb > pa) ? vb : va; continue;
      }
      if (k === "tripGoal") {
        // Späteres Ziel gewinnt (startedAt), sonst das nicht-leere, sonst a.
        var sa = (isObj(va) && va.startedAt) || "", sb = (isObj(vb) && vb.startedAt) || "";
        out[k] = (sb > sa) ? vb : (va || vb);
      } else if (typeof va === "number" && typeof vb === "number") {
        out[k] = Math.max(va, vb); // Zähler über Geräte: max (nie Summe -> kein Aufblähen)
      } else if (typeof va === "boolean" && typeof vb === "boolean") {
        out[k] = va || vb;
      } else if (typeof va === "string" && typeof vb === "string") {
        out[k] = va >= vb ? va : vb; // z. B. lastStudyDate (YYYY-MM-DD)
      } else if (isObj(va) && isObj(vb)) {
        out[k] = deepUnion(va, vb);
      } else {
        out[k] = va;
      }
    }
    return out;
  }

  // Eigene Karten: Vereinigung per id. Bei id-Kollision DETERMINISTISCH (egal in
  // welcher Reihenfolge gemergt wird): die inhaltsreichere Variante gewinnt
  // (längere JSON-Repräsentation) – reihenfolgeunabhängig, kein Karten-Verlust.
  function mergeUsercards(a, b) {
    var la = Array.isArray(a) ? a : [], lb = Array.isArray(b) ? b : [];
    var byId = {}, order = [];
    function add(c) {
      if (!c || !c.id) return;
      var id = c.id;
      if (!(id in byId)) { byId[id] = c; order.push(id); }
      else if (JSON.stringify(c).length > JSON.stringify(byId[id]).length) byId[id] = c;
    }
    var i;
    for (i = 0; i < la.length; i++) add(la[i]);
    for (i = 0; i < lb.length; i++) add(lb[i]);
    return order.map(function (id) { return byId[id]; });
  }

  // Zwei `data`-Maps (aus exportData().data) verschmelzen.
  function mergeData(localData, remoteData) {
    var l = isObj(localData) ? localData : {}, r = isObj(remoteData) ? remoteData : {};
    var out = {}, keys = {}, k;
    for (k in l) keys[k] = 1;
    for (k in r) keys[k] = 1;
    for (k in keys) {
      if (k === PROGRESS_KEY) out[k] = mergeProgress(l[k], r[k]);
      else if (k === GAMESTATS_KEY) out[k] = mergeGamestats(l[k], r[k]);
      else if (k === USERCARDS_KEY) out[k] = mergeUsercards(l[k], r[k]);
      else if (k === SETTINGS_KEY) out[k] = (k in l) ? l[k] : r[k]; // Einstellungen bleiben gerätelokal
      else out[k] = deepUnion(l[k], r[k]); // unbekannte/künftige Keys konservativ vereinen
    }
    return out;
  }

  // Vollständige Backup-Payloads mergen -> neue Payload (Phase 1/2).
  function mergePayloads(localPayload, remotePayload) {
    var l = isObj(localPayload) ? localPayload : {}, r = isObj(remotePayload) ? remotePayload : {};
    return {
      app: "holaruta",
      format: l.format || r.format || 1,
      exportedAt: new Date().toISOString(),
      data: mergeData(l.data, r.data),
    };
  }

  // ---------- dünner Client-Adapter (opt-in, fetch-basiert) ----------

  function cfg() { return (SC.config && SC.config.sync) || null; }
  function enabled() { return !!(cfg() && cfg().enabled && cfg().apiBase && typeof fetch === "function"); }
  function apiBase() { return (cfg() && cfg().apiBase || "").replace(/\/+$/, ""); }

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || null; } catch (e) { return null; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* egal */ } }
  function loggedIn() { return !!getToken(); }

  function request(method, path, body) {
    var headers = { "Content-Type": "application/json" };
    var tok = getToken();
    if (tok) headers.Authorization = "Bearer " + tok;
    return fetch(apiBase() + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json = null; try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
        return { ok: res.ok, status: res.status, body: json };
      });
    });
  }

  // Passwortloser Login (BACKEND.md §7): start -> (E-Mail/OTP) -> confirm.
  // Der Mock-Server (tools/mock-sync-server.js) liefert für die Demo direkt
  // einen devToken zurück, sodass `login` allein schon anmeldet.
  function login(email) {
    if (!enabled()) return Promise.reject(new Error("sync disabled"));
    return request("POST", "/v1/auth/start", { email: String(email || "").trim() })
      .then(function (r) {
        if (r.ok && r.body && r.body.devToken) { setToken(r.body.devToken); return { account: r.body.account || { email: email } }; }
        return { pending: true }; // echter Flow: auf Magic-Link/OTP warten
      });
  }
  function confirm(email, token) {
    if (!enabled()) return Promise.reject(new Error("sync disabled"));
    return request("POST", "/v1/auth/confirm", { email: email, token: token })
      .then(function (r) { if (r.ok && r.body && r.body.accessToken) { setToken(r.body.accessToken); return r.body; } throw new Error("confirm failed"); });
  }
  function logout() { setToken(null); }

  function pull() { return request("GET", "/v1/sync"); }
  function push(payload, baseRev) { return request("PUT", "/v1/sync", { baseRev: baseRev || 0, payload: payload }); }

  // Ein vollständiger Sync: pull -> merge(local, remote) -> lokal anwenden -> push.
  // Gibt { ok, changedLocal, rev } zurück. store wird für Export/Import genutzt.
  function syncNow() {
    if (!enabled() || !loggedIn()) return Promise.reject(new Error("not ready"));
    var store = SC.store;
    var local = store.exportData();
    return pull().then(function (r) {
      var remote = (r.ok && r.body && r.body.payload) ? { data: r.body.payload } : { data: {} };
      var baseRev = (r.ok && r.body && r.body.rev) || 0;
      var merged = mergePayloads(local, remote);
      var changedLocal = JSON.stringify(local.data) !== JSON.stringify(merged.data);
      if (changedLocal) store.importData(merged); // wendet das gemergte Ergebnis lokal an
      return push(merged.data, baseRev).then(function (pr) {
        // Konflikt (ein anderes Gerät war schneller): mit dessen Stand neu mergen
        // und genau einmal erneut pushen (BACKEND.md §8: 409 -> merge -> retry).
        if (pr.status === 409 && pr.body && pr.body.payload) {
          var remerged = mergePayloads(merged, { data: pr.body.payload });
          var changed2 = JSON.stringify(merged.data) !== JSON.stringify(remerged.data);
          if (changed2) store.importData(remerged);
          return push(remerged.data, pr.body.rev || 0).then(function (pr2) {
            return { ok: !!pr2.ok, changedLocal: changedLocal || changed2, rev: (pr2.body && pr2.body.rev) || 0, status: pr2.status };
          });
        }
        return { ok: !!pr.ok, changedLocal: changedLocal, rev: (pr.body && pr.body.rev) || baseRev, status: pr.status };
      });
    });
  }

  SC.sync = {
    // Adapter
    enabled: enabled,
    loggedIn: loggedIn,
    account: function () { return loggedIn() ? {} : null; },
    login: login,
    confirm: confirm,
    logout: logout,
    pull: pull,
    push: push,
    syncNow: syncNow,
    // Reiner Kern (für Tests + Wiederverwendung serverseitig)
    merge: mergePayloads,
    mergeData: mergeData,
    mergeProgress: mergeProgress,
    mergeGamestats: mergeGamestats,
    mergeUsercards: mergeUsercards,
    deepUnion: deepUnion,
  };
})();
