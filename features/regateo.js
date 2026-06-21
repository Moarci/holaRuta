/*
 * features/regateo.js  (SC.regateo) – „Regatear": Verhandeln/Feilschen-Erklärseite.
 * Taktik-Blöcke (DOs/Don'ts, aufklappbar), Glossar, wichtige Sätze nach Phase,
 * Maß-/Mengeneinheiten, regionale Unterschiede und aufklappbare Rollenspiele.
 * Inhalte aus dem optionalen Content-Modul SC.regatear (regatear.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D, Info-Screens). Reine Anzeige-Seite ohne
 * eigenen State: VM (Daten 1:1 durchgereicht, nur Stufen-Kurzlabel an Rollenspiele
 * gehängt, {name} aufgelöst) und Render leben hier zusammen; Controller-Dienste
 * (i18n, levelById, withName) kommen per init(ctx). Der Opener (openRegatear) bleibt
 * im Controller (Entdecken-Kachel + Shortcut-Map). Der geteilte Tipp-Teilen-Knopf
 * tipsShareBtn() (auch Knigge/Logística/Salud/Fotos/Bailar) kommt aus SC.view.
 *
 * Hinweis Namensgebung: das Content-Modul heißt SC.regatear (Verb), dieses
 * Feature-Modul SC.regateo (Substantiv „das Feilschen") – so kollidieren die
 * beiden Globals nicht.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, tipsShareBtn, moduleShareBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  // Pass-Through-Ansicht des Regatear-Moduls (Intro, Tipps, Glossar, Sätze,
  // Einheiten, Rollenspiele). Reicht die Daten 1:1 durch, hängt nur an den
  // Rollenspielen das Kurz-Label der Schwierigkeitsstufe an.
  function regatearVM() {
    const regatear = window.SC.regatear || null;
    if (!regatear) return { intro: "", tips: [], glossary: [], phrases: [], units: [], regional: [], roleplays: [] };
    const roleplays = (regatear.ROLEPLAYS || []).map((r) => {
      const lvl = ctx.levelById(r.level);
      return Object.assign({}, r, { lvlShort: lvl ? lvl.short : "" });
    });
    // Pass-Through-Ansicht: alle …En-Felder (Tipps, Glossar, Sätze, Regionales,
    // Rollenspiele) per localizeDeep für die aktive Sprache überlagern. INTRO ist
    // eine eigenständige Konstante (INTRO_EN) und wird separat aufgelöst.
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && regatear.INTRO_EN) ? regatear.INTRO_EN : regatear.INTRO,
      tips: loc(regatear.TIPS || []),
      glossary: loc(regatear.GLOSSARY || []),
      phrases: loc(regatear.PHRASES || []),
      units: loc(regatear.UNITS || []),
      regional: loc(regatear.REGIONAL || []),
      // {name} auch hier auflösen – symmetrisch zu roleplayVM, falls künftig ein
      // Regatear-Rollenspiel den Platzhalter nutzt (sonst stünde „{name}" im Text).
      roleplays: loc(roleplays).map((r) => Object.assign({}, r, {
        dialogue: (r.dialogue || []).map((d) => Object.assign({}, d, { es: ctx.withName(d.es), de: ctx.withName(d.de) })),
        usefulPhrases: (r.usefulPhrases || []).map(ctx.withName),
      })),
    };
  }

  // ----- Render -----
  function renderRegatear(vm) {
    // Erklärung: Taktik-Blöcke (DOs/Don'ts) wie im Knigge, aufklappbar.
    const liList = (items, cls, marker) =>
      (items || [])
        .map((t) => `<li class="${cls}"><span class="knigge-mark" aria-hidden="true">${marker}</span>${esc(t)}</li>`)
        .join("");
    const tipBlock = (t, i) => `
      <details class="knigge-topic">
        <summary class="knigge-topic__head">
          <span class="knigge-topic__icon" aria-hidden="true">${t.icon}</span>
          <span class="knigge-topic__title">${esc(t.title)}</span>
          <span class="knigge-topic__chev" aria-hidden="true">▾</span>
        </summary>
        <div class="knigge-topic__body">
          ${t.intro ? `<p class="knigge-intro">${esc(t.intro)}</p>` : ""}
          ${t.dos && t.dos.length ? `<ul class="knigge-list">${liList(t.dos, "knigge-do", "✅")}</ul>` : ""}
          ${t.donts && t.donts.length ? `<ul class="knigge-list">${liList(t.donts, "knigge-dont", "🚫")}</ul>` : ""}
          ${tipsShareBtn("regatear", i)}
        </div>
      </details>`;
    const tips = (vm.tips || []).map(tipBlock).join("");

    // Glossar: kompakte zweispaltige Wortliste (es · de).
    const glossary = (vm.glossary || []).map((g) => `
      <li class="rg-gloss">
        <span class="rg-gloss__es" lang="es">${esc(g.es)}</span>
        <span class="rg-gloss__de">${esc(g.de)}</span>
      </li>`).join("");

    // Wichtige Sätze: pro Phase eine kleine zweispaltige Liste (es / de).
    const phraseGroup = (g) => `
      <div class="rg-group">
        <h3 class="rg-group__title"><span aria-hidden="true">${g.icon}</span> ${esc(g.title)}</h3>
        <ul class="rg-phrases">
          ${g.items.map((p) => `
            <li class="rg-phrase">
              <span class="rg-phrase__es" lang="es">${esc(p.es)}</span>
              <span class="rg-phrase__de">${esc(p.de)}</span>
            </li>`).join("")}
        </ul>
      </div>`;
    const phrases = (vm.phrases || []).map(phraseGroup).join("");

    // Einheiten: kompakte Tabelle Spanisch · Deutsch · Beispiel.
    const units = (vm.units || []).map((u) => `
      <li class="rg-unit">
        <span class="rg-unit__es" lang="es">${esc(u.es)}</span>
        <span class="rg-unit__de">${esc(u.de)}</span>
        <span class="rg-unit__ej" lang="es">${esc(u.ejemplo)}</span>
      </li>`).join("");

    // Regionale Unterschiede: Flagge + Land + kurze Notiz.
    const regional = (vm.regional || []).map((r) => `
      <li class="rg-region">
        <span class="rg-region__flag" aria-hidden="true">${esc(r.flag)}</span>
        <span class="rg-region__body">
          <span class="rg-region__country">${esc(r.country)}</span>
          <span class="rg-region__note">${esc(r.note)}</span>
        </span>
      </li>`).join("");

    // Rollenspiele: pro Szene ein aufklappbarer Dialog (A/B) + nützliche Sätze.
    const rpBlock = (r) => {
      const lines = r.dialogue.map((d) => `
        <div class="hm-line hm-line--${d.speaker === "A" ? "a" : "b"}">
          <span class="hm-line__who">${esc(d.speaker)}</span>
          <span class="hm-line__bubble">
            <span class="hm-line__es" lang="es">${esc(d.es)}</span>
            <span class="hm-line__de">${esc(d.de)}</span>
          </span>
        </div>`).join("");
      const useful = r.usefulPhrases && r.usefulPhrases.length
        ? `<div class="hm-phrases">
             <span class="hm-phrases__cap">${esc(t("discover.rgUseful"))}</span>
             <ul class="hm-phrases__list">${r.usefulPhrases.map((p) => `<li lang="es">${esc(p)}</li>`).join("")}</ul>
           </div>`
        : "";
      return `
        <details class="knigge-topic rg-rp">
          <summary class="knigge-topic__head">
            <span class="knigge-topic__icon" aria-hidden="true">🎭</span>
            <span class="knigge-topic__title">${esc(r.title)}</span>
            ${r.lvlShort ? `<span class="hm-rp__lvl">${esc(r.lvlShort)}</span>` : ""}
            <span class="knigge-topic__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="knigge-topic__body">
            <p class="hm-rphead__sit">${esc(r.situationDe)}</p>
            <div class="hm-roles">
              <div class="hm-role hm-role--a">
                <span class="hm-role__tag">A · ${esc(r.roleA)}</span>
                <span class="hm-role__goal">${esc(r.goalA)}</span>
              </div>
              <div class="hm-role hm-role--b">
                <span class="hm-role__tag">B · ${esc(r.roleB)}</span>
                <span class="hm-role__goal">${esc(r.goalB)}</span>
              </div>
            </div>
            <div class="hm-dialogue">${lines}</div>
            ${useful}
          </div>
        </details>`;
    };
    const roleplays = (vm.roleplays || []).map(rpBlock).join("");

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">🤝 Regatear</div>
          <span></span>
        </div>
        <p class="pageintro">${esc(vm.intro)}</p>
        ${moduleShareBtn("regatear")}

        <h2 class="rg-head">${esc(t("discover.rgTactics"))}</h2>
        ${tips}

        <h2 class="rg-head">${esc(t("discover.rgWords"))}</h2>
        <ul class="rg-glosslist">${glossary}</ul>

        <h2 class="rg-head">${esc(t("discover.rgPhrases"))}</h2>
        ${phrases}

        <h2 class="rg-head">${esc(t("discover.rgUnits"))}</h2>
        <ul class="rg-units">${units}</ul>

        <h2 class="rg-head">${esc(t("discover.rgRegions"))}</h2>
        <ul class="rg-regions">${regional}</ul>

        <h2 class="rg-head">${esc(t("discover.rgRoleplays"))}</h2>
        <p class="hm-intro">${esc(t("discover.rgRoleplayHint"))}</p>
        ${roleplays}
      </section>`;
  }

  window.SC.regateo = {
    init(injected) { ctx = injected; },
    vm: regatearVM,
    // SCREENS-Eintrag (app.js delegiert) + Spotlight-Vorschau (app.js liest vm().tips).
    screen: () => renderRegatear(regatearVM()),
  };
})();
