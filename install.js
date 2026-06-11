/*
 * install.js  (SC.install) – „Zum Startbildschirm hinzufügen" (PWA-Installation).
 *
 * Hintergrund: Wer HolaRuta als Einzeldatei per file:// öffnet, muss die Datei
 * jedes Mal im Dateimanager suchen. Läuft die App dagegen von einer echten
 * Web-Adresse (z. B. GitHub Pages), lässt sie sich mit einem eigenen App-Icon
 * auf den Startbildschirm legen – ein Tipp genügt, kein Datei-Suchen, offline.
 *
 * Dieses Modul kapselt die Browser-Eigenheiten dafür:
 *   - Android/Chromium feuert `beforeinstallprompt`; wir fangen es ab und bieten
 *     einen eigenen Knopf an, der den nativen Installations-Dialog auslöst.
 *   - iOS/Safari kennt keinen Prompt – dort zeigen wir nur eine kurze Anleitung.
 *
 * KENNT KEINEN App-Zustand. Der Controller (app.js) fragt den Status ab und
 * bekommt per setOnChange() Bescheid, wenn sich etwas ändert (Re-Render).
 *
 * Öffentlich (window.SC.install):
 *   shouldOffer()   – soll der Startbildschirm-Hinweis im Profil erscheinen?
 *   canPrompt()     – ist der native Installations-Dialog verfügbar? (Android)
 *   isIOS()         – braucht es die manuelle iOS-Anleitung?
 *   promptInstall() – nativen Dialog zeigen -> 'accepted'|'dismissed'|'unavailable'
 *   isInstalled()   – läuft die App bereits installiert (standalone)?
 *   setOnChange(fn) – Callback für „Status hat sich geändert" setzen.
 */
(function () {
  "use strict";

  let deferred = null;   // gestashtes beforeinstallprompt-Event (nur Android/Chromium)
  let installed = false; // läuft die App bereits als installierte PWA?
  let onChange = null;   // Re-Render-Callback (vom Controller gesetzt)

  // Läuft die App im eigenständigen App-Fenster (also bereits installiert)?
  function standalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true; // iOS Safari kennt nur dieses Flag
  }

  // iPhone/iPad? (iPadOS gibt sich neuerdings als „Macintosh" mit Touch aus.)
  function isIOS() {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua)
      || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }

  // Echte Web-Adresse (http/https) – nur dann ist eine Installation überhaupt
  // möglich. Als file:// Einzeldatei gibt es keinen Service Worker und keinen
  // Install-Prompt, deshalb bieten wir dort nichts an.
  function hosted() {
    return location.protocol === "https:" || location.protocol === "http:";
  }

  function canPrompt() {
    return !!deferred;
  }

  function isInstalled() {
    return installed || standalone();
  }

  // Soll im Profil der „Auf den Startbildschirm"-Hinweis auftauchen?
  function shouldOffer() {
    if (isInstalled()) return false; // schon installiert -> nichts zu tun
    if (!hosted()) return false;     // Einzeldatei -> Installation nicht möglich
    return canPrompt() || isIOS();   // Android-Dialog ODER iOS-Anleitung
  }

  // Nativen Installations-Dialog zeigen (nur Android/Chromium).
  // Gibt zurück: 'accepted' | 'dismissed' | 'unavailable'.
  async function promptInstall() {
    if (!deferred) return "unavailable";
    const evt = deferred;
    deferred = null; // jedes beforeinstallprompt-Event ist nur einmal verwendbar
    try {
      evt.prompt();
      const choice = await evt.userChoice;
      if (onChange) onChange();
      return choice && choice.outcome === "accepted" ? "accepted" : "dismissed";
    } catch (e) {
      if (onChange) onChange();
      return "dismissed";
    }
  }

  installed = standalone();

  // Android/Chromium: Mini-Infobar unterdrücken und Event für unseren Knopf merken.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    if (onChange) onChange();
  });

  // Erfolgreich installiert: Hinweis ausblenden.
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    if (onChange) onChange();
  });

  window.SC = window.SC || {};
  window.SC.install = {
    shouldOffer,
    canPrompt,
    isIOS,
    promptInstall,
    isInstalled,
    setOnChange(fn) { onChange = typeof fn === "function" ? fn : null; },
  };
})();
