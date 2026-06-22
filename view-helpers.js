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
  // Der Titel ist die <h1> des Screens (eine echte Top-Überschrift je Screen).
  // Ausnahme via opts.plainTitle: Screens mit eigener Inhalts-<h1> (z. B. das
  // Aktivitätsblatt mit .sheet-title) rendern den Topbar-Titel als <div>, damit nicht
  // zwei <h1> auf einem Screen stehen.
  function hmTopbar(title, back, opts) {
    const tag = opts && opts.plainTitle ? "div" : "h1";
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="${back}" aria-label="${esc(t("common.backShort"))}">‹</button>
        <${tag} class="topbar__title">${title}</${tag}>
        <span></span>
      </div>`;
  }

  // Favoriten-Stern als Umschalt-Knopf (data-action="fav-toggle"). Geteilt von der
  // Kartendetail-Ansicht und Modulen wie Spickzettel/Mi léxico. id = Karten-Id,
  // on = ist Favorit?, opts.cls = zusätzliche CSS-Klasse.
  function favStar(id, on, opts) {
    const o = opts || {};
    const cls = "favstar" + (on ? " is-on" : "") + (o.cls ? " " + o.cls : "");
    const label = on ? t("favorites.remove") : t("favorites.add");
    return `<button class="${cls}" type="button" data-action="fav-toggle" data-id="${esc(id)}"
              aria-pressed="${on ? "true" : "false"}" aria-label="${esc(label)}" title="${esc(label)}">${on ? "★" : "☆"}</button>`;
  }

  // Ein Themenblock (Überschrift + Inhalt) – gemeinsamer Baustein der Infoseiten
  // Länderkunde (renderInfo) und Conjugación (ui.js) sowie Tiempos (Feature-Modul).
  function sect(icon, title, body, id) {
    return `
      <div class="cinfo-sect"${id ? ` id="${esc(id)}"` : ""}>
        <h3 class="cinfo-sect__h">${icon} ${esc(title)}</h3>
        ${body}
      </div>`;
  }

  // Teilen-Knopf für die Entdecken-Tipp-Kategorien (Knigge/Regatear/Logística/
  // Salud/Fotos/Bailar): erzeugt ein Sharepic des Themas mit seinen DOs/Don'ts
  // „zum Versenden" (Logik in app.shareTips). cat = Kategorie, i = Index des Themas.
  function tipsShareBtn(cat, i) {
    return `<button class="hist-share" type="button" data-action="share-tips" data-cat="${esc(cat)}" data-idx="${i}">📤 ${esc(t("discover.tipsShare"))}</button>`;
  }

  // Runder Eck-Icon-Button (Karten-Ecken/Panels): geteilt von Lernkarte (🔊/🧭),
  // El Cuerpo (Vorlesen) und Einkaufszettel. base = Modifier-Klasse, on = farbige
  // Variante (bunte Rückseite), extra = zusätzliche Attribute (z.B. aria-expanded),
  // icon/label/action wie üblich.
  function cornerBtn({ base, on, icon, label, action, extra = "" }) {
    const cls = `cardbtn ${base}${on ? " is-on" : ""}`;
    return `<button class="${cls}" type="button" data-action="${action}"
              aria-label="${esc(label)}" title="${esc(label)}"${extra ? " " + extra : ""}>${icon}</button>`;
  }

  // ----- Lesetraining-Bausteine (geteilt: Historia-Feature, Logística/Salud-
  // Modulblätter, Bebidas, Bailar). Ein spanischer Lesetext mit antippbaren Vokabel-
  // Chips, Wörterliste, optionalem Mini-Quiz, optionaler Komplett-Übersetzung und
  // Teilen-Knopf – plus die CEFR-Niveau-Plakette levelMeta(). Reine HTML-Bausteine. -----

  // CEFR-Schwierigkeit → Punkte-Meter + lokalisiertes Wort (Selbst-Einstufung).
  const HIST_LEVEL_DOTS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
  function levelMeta(level) {
    if (!level) return null;
    const dots = HIST_LEVEL_DOTS[level] || 3;
    return { code: level, word: t("discover.histLvl" + level), meter: "●".repeat(dots) + "○".repeat(5 - dots) };
  }
  // Spanischer Lesetext: *markierte* Wörter werden zu antippbaren Chips, die die
  // Übersetzung (aus der Wörterliste der Epoche, in der aktiven Sprache) zeigen.
  function esRich(paras, vocab) {
    const vmap = {};
    (vocab || []).forEach((v) => { vmap[String(v.es).toLowerCase().trim()] = v; });
    return (paras || []).map((p) => {
      let html = "", last = 0; const re = /\*([^*]+)\*/g; let m;
      while ((m = re.exec(p))) {
        html += esc(p.slice(last, m.index));
        const w = m[1];
        const v = vmap[w.toLowerCase().trim()];
        const tr = v ? v.de : "";
        html += `<button class="hist-w" type="button" data-action="hist-word" aria-label="${esc(w + " – " + tr)}">${esc(w)}<span class="hist-w__pop" aria-hidden="true">${esc(tr)}</span></button>`;
        last = re.lastIndex;
      }
      html += esc(p.slice(last));
      return `<p class="hist-es__p" lang="es">${html}</p>`;
    }).join("");
  }
  // Wörterliste pro Text: zum schnellen Nachschlagen, gruppiert in „mitnehmen"
  // (lohnt sich) und „nicht so wichtig" (kannst du überspringen).
  function vocabBlock(vocab) {
    if (!vocab || !vocab.length) return "";
    const row = (v) => `<li class="hist-voc__row"><span class="hist-voc__es" lang="es">${esc(v.es)}</span><span class="hist-voc__de">${esc(v.de)}</span></li>`;
    const take = vocab.filter((v) => v.take), skip = vocab.filter((v) => !v.take);
    const takeList = take.length
      ? `<p class="hist-voc__cap hist-voc__cap--take">✅ ${esc(t("discover.histTake"))}</p><ul class="hist-voc__list">${take.map(row).join("")}</ul>`
      : "";
    const skipList = skip.length
      ? `<p class="hist-voc__cap hist-voc__cap--skip">○ ${esc(t("discover.histSkip"))}</p><ul class="hist-voc__list hist-voc__list--skip">${skip.map(row).join("")}</ul>`
      : "";
    return `
      <details class="hist-voc">
        <summary class="hist-voc__sum">📒 ${esc(t("discover.histVocab"))} <span class="hist-voc__n">${vocab.length}</span><span class="hist-voc__chev" aria-hidden="true">▾</span></summary>
        <div class="hist-voc__body">${takeList}${skipList}</div>
      </details>`;
  }
  // Mini-Quiz zum Text: Spanisches Wort → richtige Übersetzung wählen. Distraktoren
  // aus denselben Vokabeln. Selbstprüfung per DOM-Klasse (kein Re-Render, s. app.js).
  function quizBlock(vocab) {
    const items = vocab || [];
    const pool = items.filter((v) => v.take);
    if (pool.length < 3 || items.length < 4) return ""; // zu wenige für sinnvolle Optionen
    const qs = pool.slice(0, 4);
    const questions = qs.map((v, i) => {
      const others = items.filter((x) => x.es !== v.es).map((x) => x.de);
      const opts = [v.de];
      for (let k = 0; k < others.length && opts.length < 4; k++) {
        if (opts.indexOf(others[k]) === -1) opts.push(others[k]);
      }
      const rot = (i + 1) % opts.length; // richtige Antwort nicht immer oben
      const rotated = opts.slice(rot).concat(opts.slice(0, rot));
      const optsHtml = rotated
        .map((o) => `<button class="hist-quiz__opt" type="button" data-action="hist-quiz-answer" data-correct="${o === v.de ? "1" : "0"}">${esc(o)}</button>`)
        .join("");
      return `
        <div class="hist-quiz__q">
          <p class="hist-quiz__prompt" lang="es">${esc(v.es)}</p>
          <div class="hist-quiz__opts">${optsHtml}</div>
        </div>`;
    }).join("");
    return `
      <details class="hist-quiz">
        <summary class="hist-quiz__sum">🧩 ${esc(t("discover.histQuiz"))}<span class="hist-quiz__chev" aria-hidden="true">▾</span></summary>
        <div class="hist-quiz__body">
          <p class="hist-quiz__intro">${esc(t("discover.histQuizIntro"))}</p>
          ${questions}
        </div>
      </details>`;
  }
  // Gemeinsamer Lesetraining-Block (Epoche, Protagonist, Spannung teilen ihn).
  // opts: { es:[Absatz], vocab, level, trans?:[Absatz], shareId, quiz?:bool }
  // trans = optionale „Ganze Übersetzung", nur wo der Text nicht ohnehin schon
  // in der UI-Sprache danebensteht (Epochen ja, Karten nein).
  function readingBlock(opts) {
    const o = opts || {};
    if (!o.es || !o.es.length) return "";
    const lvl = levelMeta(o.level);
    const bar = `
      <div class="hist-es__bar">
        <span class="hist-es__label">📖 ${esc(t("discover.histReadEs"))}</span>
        ${lvl ? `<span class="hist-lvl hist-lvl--${esc(lvl.code)}" title="${esc(t("discover.histLevelTitle"))}"><span class="hist-lvl__code">${esc(lvl.code)}</span> ${esc(lvl.word)} <span class="hist-lvl__meter" aria-hidden="true">${lvl.meter}</span></span>` : ""}
      </div>`;
    const text = `<div class="hist-es">${bar}${esRich(o.es, o.vocab)}<p class="hist-es__hint">👆 ${esc(t("discover.histTapHint"))}</p></div>`;
    const vocab = vocabBlock(o.vocab);
    const quiz = o.quiz ? quizBlock(o.vocab) : "";
    const trans = (o.trans && o.trans.length)
      ? `<details class="hist-trans"><summary class="hist-trans__sum">🌐 ${esc(t("discover.histTranslation"))}<span class="hist-trans__chev" aria-hidden="true">▾</span></summary><div class="hist-trans__body">${o.trans.map((p) => `<p class="hist-era__p">${esc(p)}</p>`).join("")}</div></details>`
      : "";
    const share = o.shareId
      ? `<button class="hist-share" type="button" data-action="share-historia" data-id="${esc(o.shareId)}">📤 ${esc(t("discover.histShare"))}</button>`
      : "";
    return `${text}${vocab}${quiz}${trans}${share}`;
  }

  window.SC.view = {
    esc, canShare, speechReady, shareBlock, countryPicker, moduleShareBtn, hmTopbar, favStar, sect, tipsShareBtn, cornerBtn,
    levelMeta, readingBlock,
  };
})();
