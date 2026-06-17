/*
 * handout.js – winziger Sprachumschalter für die druckbaren Anleitungen.
 * Setzt <html data-lang="de|en|es">; CSS blendet die passenden .lang--*-Blöcke ein.
 * Zero-Dependency, kein Framework. Default: Deutsch (oder Browsersprache, falls EN/ES).
 */
(function () {
  "use strict";
  var html = document.documentElement;
  var LANGS = ["de", "en", "es"];

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = "de";
    html.setAttribute("data-lang", l);
    html.setAttribute("lang", l);
    var bar = document.querySelector(".langbar");
    if (bar) {
      bar.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.lang === l));
      });
    }
  }

  // Startsprache: Browser bevorzugt EN/ES, sonst Deutsch.
  var nav = (navigator.language || "de").slice(0, 2).toLowerCase();
  setLang(LANGS.indexOf(nav) >= 0 ? nav : "de");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang]");
    if (btn) setLang(btn.dataset.lang);
  });
})();
