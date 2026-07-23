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

  // Standard-Timeout pro Versuch (ms). Verhindert, dass ein hängender fetch die
  // UI bis zum Browser-Default (~90 s) blockiert. Pro Aufruf via opts.timeout
  // überschreibbar; opts.timeout <= 0 schaltet ihn ab.
  var DEFAULT_TIMEOUT_MS = 12000;

  // HTTP-Status, die ein transienter Server-/Rate-Limit-Fehler sein können und
  // sich für einen erneuten Versuch eignen – aber NUR, wenn der Aufrufer ein
  // Retry-Budget (opts.retries) mitgibt. Dauerhafte 4xx (401, 404 …) niemals.
  var TRANSIENT_STATUS = { 408: 1, 425: 1, 429: 1, 500: 1, 502: 1, 503: 1, 504: 1 };

  function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  // Ein einzelner fetch-Versuch mit Timeout (AbortController, falls verfügbar).
  // Der Timer wird auf JEDEM Ausgang (Erfolg wie Fehler) wieder gelöscht, damit
  // er den Event-Loop nicht offen hält.
  function attemptFetch(base, method, path, body, timeout) {
    var headers = { "Content-Type": "application/json" };
    var tok = getToken();
    if (tok) headers.Authorization = "Bearer " + tok;
    var ctrl = (typeof AbortController !== "undefined" && timeout > 0) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeout) : null;
    function clear() { if (timer) { clearTimeout(timer); timer = null; } }
    return fetch(base + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (res) {
      return res.text().then(function (txt) {
        clear();
        var json = null; try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
        return { ok: res.ok, status: res.status, body: json };
      });
    }, function (err) { clear(); throw err; });
  }

  // base = bereits normalisierte API-Adresse (ohne Slash am Ende). Hängt den
  // Bearer-Token an (falls vorhanden) und parst die JSON-Antwort tolerant.
  // opts (optional): { timeout, retries, backoff }. Ohne opts genau EIN Versuch
  // mit DEFAULT_TIMEOUT_MS – das bisherige Verhalten bleibt damit unverändert.
  // Mit opts.retries > 0 wird bei transientem Status oder Netzwerkfehler/Timeout
  // mit exponentiellem Backoff erneut versucht (für idempotente/rev-gesicherte
  // Aufrufe wie GET /sync und PUT /sync, siehe sync.js).
  function request(base, method, path, body, opts) {
    opts = opts || {};
    var timeout = (typeof opts.timeout === "number") ? opts.timeout : DEFAULT_TIMEOUT_MS;
    var retries = (opts.retries > 0) ? opts.retries : 0;
    var backoff = (typeof opts.backoff === "number") ? opts.backoff : 400;
    var attempt = 0;
    function run() {
      return attemptFetch(base, method, path, body, timeout).then(function (r) {
        if (attempt < retries && TRANSIENT_STATUS[r.status]) {
          attempt++; return delay(backoff * Math.pow(2, attempt - 1)).then(run);
        }
        return r;
      }, function (err) {
        if (attempt < retries) { attempt++; return delay(backoff * Math.pow(2, attempt - 1)).then(run); }
        throw err;
      });
    }
    return run();
  }

  // Passwortloser Login (BACKEND.md §7): start -> (E-Mail/OTP) -> confirm.
  // Der Mock-Server (tools/mock-sync-server.js) liefert für die Demo direkt
  // einen devToken zurück, sodass `login` allein schon anmeldet.
  function login(base, email) {
    return request(base, "POST", "/v1/auth/start", { email: String(email || "").trim() })
      .then(function (r) {
        if (r.ok && r.body && r.body.devToken) { setToken(r.body.devToken); return { account: r.body.account || { email: email } }; }
        if (r.ok) return { pending: true }; // echter Flow: auf Magic-Link/OTP warten
        // Echte Fehlerantwort (400 ungültige Mail, 429 Rate-Limit, 502 Mailversand)
        // NICHT als pending verschlucken – sonst zeigt die UI „Mail prüfen", obwohl
        // nie eine kommt. Ablehnen -> der Aufrufer (app.js) nimmt den Fehler-Pfad.
        var err = new Error("login failed");
        err.status = r.status;
        throw err;
      });
  }
  // `locale` (optional, "de"/"en"/"es"): aktuelle UI-Sprache, wird beim Confirm im
  // profile gespeichert – damit Betreiber-Mails später in der richtigen Sprache
  // rausgehen können (wichtig für den Locals-Track). Nur mitschicken, wenn gesetzt.
  function confirm(base, email, token, locale) {
    var body = { email: email, token: token };
    if (locale) body.locale = locale;
    return request(base, "POST", "/v1/auth/confirm", body)
      .then(function (r) { if (r.ok && r.body && r.body.accessToken) { setToken(r.body.accessToken); return r.body; } throw new Error("confirm failed"); });
  }

  // Google-OAuth (BACKEND.md §7): den Browser zur serverseitig gebauten Google-URL
  // navigieren. redirect = eigene Callback-Seite (auth-callback.html), die das
  // zurückkommende Supabase-Token via googleConfirm gegen unseren Session-Token
  // tauscht. Voll-Redirect statt eingebettetem Google-Script -> CSP bleibt eng
  // (kein `script-src accounts.google.com`), keine Framework-Abhängigkeit im Client.
  function googleStart(base, redirect) {
    var url = base + "/v1/auth/google/start?redirect=" + encodeURIComponent(redirect || "");
    try { window.location.href = url; } catch (e) { /* kein window -> No-op (Tests) */ }
    return url;
  }
  // Von der Callback-Seite genutzt: das Supabase-Access-Token (aus dem Implicit-
  // Redirect-Fragment) gegen unseren Opaque-Session-Token tauschen und speichern.
  // `locale` optional wie bei confirm(): UI-Sprache für das profile mitgeben.
  function googleConfirm(base, supabaseToken, locale) {
    var body = { supabaseToken: supabaseToken };
    if (locale) body.locale = locale;
    return request(base, "POST", "/v1/auth/google/confirm", body)
      .then(function (r) { if (r.ok && r.body && r.body.accessToken) { setToken(r.body.accessToken); return r.body; } throw new Error("google confirm failed"); });
  }

  // ---- Login-CSRF-Schutz für den Google-Redirect-Flow -----------------------
  // Der `state` bindet den OAuth-Roundtrip an DEN Browser, der ihn gestartet hat:
  // beim Start zufällig erzeugt und im sessionStorage abgelegt, über redirectTo (?s=)
  // zurückgespielt, im Callback exakt verglichen. Ein untergeschobenes fremdes Token
  // trägt einen fremden state -> kein passender sessionStorage-Eintrag -> abgewiesen.
  var OAUTH_STATE_KEY = "spanischcard.oauthstate.v1";

  // Zufälligen state erzeugen + im sessionStorage ablegen; gibt ihn zurück. Leerer
  // String, wenn keine sichere Zufallsquelle/kein sessionStorage vorhanden ist – der
  // Aufrufer bricht dann ab (fail closed statt ungeschützt weiterzuleiten).
  function oauthStateStart() {
    try {
      if (typeof crypto === "undefined" || !crypto.getRandomValues || typeof sessionStorage === "undefined") return "";
      var buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      var st = Array.prototype.map.call(buf, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      sessionStorage.setItem(OAUTH_STATE_KEY, st);
      return st;
    } catch (e) { return ""; }
  }

  // Zurückgegebenen state gegen den gespeicherten prüfen und diesen EINMALIG löschen.
  // true NUR bei nicht-leerer, exakter Übereinstimmung (fehlt/mismatcht er -> false).
  function oauthStateCheck(got) {
    var want = "";
    try { want = sessionStorage.getItem(OAUTH_STATE_KEY) || ""; } catch (e) { want = ""; }
    try { sessionStorage.removeItem(OAUTH_STATE_KEY); } catch (e) { /* egal */ }
    return !!want && !!got && got === want;
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
    googleStart: googleStart,
    googleConfirm: googleConfirm,
    oauthStateStart: oauthStateStart,
    oauthStateCheck: oauthStateCheck,
  };
})();
