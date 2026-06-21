/*
 * view-helpers.js  (SC.view) – Geteilte, zustandsfreie Render-Primitive für ui.js
 * und die Feature-Module. Reine vm/Args → HTML-Strings: KEIN App-State, KEINE
 * Logik, kein Speicher. Läuft NACH i18n.js und VOR ui.js, damit View und Feature-
 * Module dieselbe Quelle teilen (statt Duplikate). Übersetzungs-Helfer t() wird –
 * wie in ui.js – lokal gebunden (i18n.js setzt SC.i18n.t vorher).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Sharepic verfügbar? (Modul geladen + Canvas vorhanden)
  function canShare() {
    return !!(window.SC && window.SC.share);
  }

  // Sprachausgabe verfügbar? (TTS-Modul geladen + vom Browser unterstützt).
  // Steuert, ob der Hör-Modus und 🔊-Buttons überhaupt angeboten werden.
  function speechReady() {
    const sp = window.SC && window.SC.speech;
    return !!(sp && sp.isSupported());
  }

  // Format-Umschalter (1:1 / 9:16) + Teilen-Button als ein Block.
  // fmt = aktuell gewähltes Format ('square'|'story'), action = Teilen-Aktion.
  function shareBlock(fmt, action, label) {
    if (!canShare()) return "";
    const chip = (id, txt) =>
      `<button class="fmtchip ${fmt === id ? "is-active" : ""}" type="button"
               data-action="set-share-format" data-format="${id}"
               aria-pressed="${fmt === id}">${txt}</button>`;
    return `
      <div class="sharebar">
        <div class="fmtrow" role="group" aria-label="${esc(t("common.imageFormat"))}">
          ${chip("square", "▢ 1:1")}${chip("story", "▯ 9:16")}
        </div>
        <button class="ghostbtn" data-action="${action}">📤 ${esc(label)}</button>
      </div>`;
  }

  // Land-Auswahl als <select> mit Regionen-<optgroup>, geteilt von Länderkunde,
  // Reise-Knigge & Bebidas (alle teilen state.countryId via data-action=
  // "select-country"). groups = vm.groups (Regionen mit ihren Ländern).
  function countryPicker(groups) {
    const options = (groups || [])
      .map((g) => {
        const opts = g.countries
          .map((c) => `<option value="${esc(c.id)}"${c.selected ? " selected" : ""}>${c.flag} ${esc(c.name)}</option>`)
          .join("");
        return `<optgroup label="${esc(g.region)}">${opts}</optgroup>`;
      })
      .join("");
    return `
      <label class="cinfo-pick">
        <span class="cinfo-pick__cap">${esc(t("discover.infoPickCountry"))}</span>
        <select class="cinfo-pick__sel" id="country-select" data-action="select-country">${options}</select>
      </label>`;
  }

  // „Modul teilen"-Knopf für die Entdecken-Module: empfiehlt das ganze Modul als
  // Sharepic weiter (Logik in app.shareModule, Motiv „module"). mod = Modul-Id
  // (siehe MODULE_SHARE in app.js). Sitzt oben direkt unter der Einleitung – wie
  // bei Historia. Ohne Teilen-Fähigkeit (kein Share-Modul) entfällt der Knopf.
  function moduleShareBtn(mod) {
    if (!canShare()) return "";
    return `<div class="hist-modshare"><button class="hist-share mod-share" type="button" data-action="share-module" data-mod="${esc(mod)}">📤 ${esc(t("discover.moduleShare"))}</button></div>`;
  }

  // Topbar-Helfer für alle Hostel-Mode-Screens. back = data-action des Zurück-Knopfs.
  function hmTopbar(title, back) {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="${back}" aria-label="${esc(t("common.backShort"))}">‹</button>
        <div class="topbar__title">${title}</div>
        <span></span>
      </div>`;
  }

  window.SC.view = {
    esc, canShare, speechReady, shareBlock, countryPicker, moduleShareBtn, hmTopbar,
  };
})();
