/*
 * net.js  (SC.net) – geteilte, schlanke Netz-/Auth-Schicht für die OPTIONALEN
 * opt-in Cloud-Module (sync.js, social.js).
 *
 * Warum eigenes Modul: Cloud-Sync und Freunde/Rangliste nutzen DIESELBE
 * Identität (BACKEND.md §7/§16) – denselben passwortlosen Login, denselben
 * Auth-Token, denselben fetch-Wrapper gegen denselben Server. Damit eine
 * Auth-Änderung (z. B. Refresh-Token, Cookie statt Bearer, andere Endpunkte)
 * nur an EINER Stelle passiert, liegt der gemeinsame Teil hier statt doppelt
 * in beiden Adaptern.
 *
 * Jedes Modul bringt weiterhin SEINE eigene Config/`apiBase`/`enabled` mit und
 * reicht die (bereits normalisierte) Basis-Adresse an die Funktionen hier durch.
 *
 * Kein DOM. Kein Framework. Nur fetch + localStorage.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // Auth-Token: bewusst NICHT in store.KNOWN_KEYS -> reist nicht im Backup mit.
  var TOKEN_KEY = "spanischcard.synctoken.v1";

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || null; } catch (e) { return null; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* egal */ } }
  function loggedIn() { return !!getToken(); }
  function logout() { setToken(null); }

  // base = bereits normalisierte API-Adresse (ohne Slash am Ende). Hängt den
  // Bearer-Token an (falls vorhanden) und parst die JSON-Antwort tolerant.
  function request(base, method, path, body) {
    var headers = { "Content-Type": "application/json" };
    var tok = getToken();
    if (tok) headers.Authorization = "Bearer " + tok;
    return fetch(base + path, {
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
  function login(base, email) {
    return request(base, "POST", "/v1/auth/start", { email: String(email || "").trim() })
      .then(function (r) {
        if (r.ok && r.body && r.body.devToken) { setToken(r.body.devToken); return { account: r.body.account || { email: email } }; }
        return { pending: true }; // echter Flow: auf Magic-Link/OTP warten
      });
  }
  function confirm(base, email, token) {
    return request(base, "POST", "/v1/auth/confirm", { email: email, token: token })
      .then(function (r) { if (r.ok && r.body && r.body.accessToken) { setToken(r.body.accessToken); return r.body; } throw new Error("confirm failed"); });
  }

  SC.net = {
    TOKEN_KEY: TOKEN_KEY,
    getToken: getToken,
    setToken: setToken,
    loggedIn: loggedIn,
    logout: logout,
    request: request,
    login: login,
    confirm: confirm,
  };
})();
