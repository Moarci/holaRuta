/*
 * features/bailar.js  (SC.bailarSheet) – „Bailar": Tanzen in Lateinamerika.
 * Pro Tanz eine aufklappbare Karte mit stilisiertem Schritt-Diagramm am Boden:
 * Fußabdrücke an den Koordinaten aus den Daten, die in Tanzreihenfolge als Welle
 * aufleuchten (reine CSS-Animation, pausierbar per CSS-Checkbox, respektiert
 * prefers-reduced-motion). Dazu Zählrhythmus, Tipps, spanisches Lesetraining und
 * Video-Links. Struktur (Topbar, Nav-Chips, Sätze, Glossar, Knigge) wie das
 * Fotos-Blatt. Inhalte aus dem Content-Modul SC.bailar (bailar.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Custom-Render-Screens, wie cronologia): VM
 * (Daten 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render
 * leben hier zusammen; Controller-Dienste (i18n) kommen per init(ctx). Der
 * Opener (openBailar) bleibt im Controller.
 *
 * WICHTIG: Der Opener läuft über navAfterLoad("bailar", …) – das Content-Modul
 * kann lazy nachgeladen werden und zur init-Zeit noch fehlen. Darum liest die
 * VM window.SC.bailar LIVE statt ctx.bailar (Konvention für lazy/optionale
 * Module, siehe featureCtx-Kommentar in app.js).
 *
 * Namensgebung: Content-Modul SC.bailar (Daten), Feature-Modul SC.bailarSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, levelMeta, readingBlock, tipsShareBtn, phraseGroups, moduleShareBtn } = window.SC.view;
  const t = (key, vars) => window.t(key, vars);

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function bailarVM() {
    const bailar = window.SC.bailar; // live: kann per navAfterLoad nachgeladen sein
    if (!bailar) return { intro: "", dances: [], phrases: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && bailar.INTRO_EN) ? bailar.INTRO_EN : bailar.INTRO,
      dances: loc(bailar.DANCES || []),
      phrases: loc(bailar.PHRASES || []),
      glossary: loc(bailar.GLOSSARY || []),
      checklist: loc(bailar.CHECKLIST || []),
    };
  }

  // ----- Render -----
  function renderBailar(vm) {
    const liList = (items, cls, marker) => {
      // Marker als role="img" mit Label, damit Screenreader „Empfohlen/Vermeiden"
      // hören – sonst sind DO- und Don't-Liste nur über Emoji+Farbe unterscheidbar.
      const srLabel = cls === "knigge-do" ? t("discover.kniggeDo") : t("discover.kniggeDont");
      return (items || [])
        .map((x) => `<li class="${cls}"><span class="knigge-mark" role="img" aria-label="${esc(srLabel)}">${marker}</span>${esc(x)}</li>`)
        .join("");
    };

    // Ein Fußabdruck: äußere <g> trägt Position/Drehung (SVG-transform) und den
    // Wellen-Index (--bi); die innere __pop-Gruppe wird per CSS skaliert (eigenes
    // transform, daher getrennt). Die Zählzahl steht auf dem Ballen.
    const footEl = (s, i) => {
      const side = s.foot === "L" ? "l" : "r";
      const tap = s.tap ? " bf-foot--tap" : "";
      return `
        <g class="bf-foot bf-foot--${side}${tap}" style="--bi:${i}" transform="translate(${s.x},${s.y}) rotate(${s.rot || 0})">
          <g class="bf-foot__pop">
            <ellipse class="bf-foot__ball" cx="0" cy="-7" rx="11" ry="14"/>
            <ellipse class="bf-foot__heel" cx="0" cy="13" rx="7.5" ry="9"/>
          </g>
          <text class="bf-foot__beat" x="0" y="-3">${esc(s.beat)}</text>
        </g>`;
    };

    // Das Tanz-„Parkett": gepunktete Spur durch die Schritte + die Fußabdrücke.
    const floor = (d) => {
      const w = (d.view && d.view.w) || 200;
      const h = (d.view && d.view.h) || 260;
      const n = (d.steps || []).length || 1;
      const cycle = Math.max(3.6, n * 0.7).toFixed(1); // ~0,7 s pro Schritt, mind. 3,6 s
      const trail = (d.steps || []).map((s) => `${s.x},${s.y}`).join(" ");
      const feet = (d.steps || []).map(footEl).join("");
      const pauseId = "bf-pause-" + d.id;
      return `
        <div class="bf-stage">
          <input type="checkbox" id="${pauseId}" class="bf-pause-cb" />
          <div class="bf-stage__bar">
            <label class="bf-pause" for="${pauseId}">
              <span class="bf-pause__play" aria-hidden="true">▶</span>
              <span class="bf-pause__pause" aria-hidden="true">${renderIcon("lc:pause")}</span>
              <span class="bf-pause__t bf-pause__t--play">${esc(t("discover.blPlay"))}</span>
              <span class="bf-pause__t bf-pause__t--pause">${esc(t("discover.blPause"))}</span>
            </label>
            <span class="bf-front" aria-hidden="true">↑ ${esc(t("discover.blFront"))}</span>
          </div>
          <div class="bf-floor" style="--baccent:${esc(d.accent || "#C2502E")};--bcount:${n};--bcycle:${cycle}s">
            <svg class="bf-floor__svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(t("discover.blFloorAlt", { name: d.name }))}">
              <polyline class="bf-trail" points="${trail}" />
              ${feet}
            </svg>
          </div>
          <ul class="bf-legend">
            <li><span class="bf-legend__dot bf-legend__dot--l" style="--baccent:${esc(d.accent || "#C2502E")}"></span>${esc(t("discover.blLegLeft"))}</li>
            <li><span class="bf-legend__dot bf-legend__dot--r"></span>${esc(t("discover.blLegRight"))}</li>
            <li><span class="bf-legend__dot bf-legend__dot--tap"></span>${esc(t("discover.blLegTap"))}</li>
          </ul>
        </div>`;
    };

    // Eine Tanz-Karte (aufklappbar wie knigge-topic): Diagramm, Rhythmus, Videos,
    // Tipps, Lesetraining.
    const danceBlock = (d, i) => {
      const lvl = levelMeta(d.level);
      const reading = (d.es && d.es.length)
        ? `<details class="hist-read">
             <summary class="hist-read__sum">${renderIcon("lc:book-open")} ${esc(t("discover.histReadToggle"))}${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}<span class="hist-read__chev" aria-hidden="true">▾</span></summary>
             <div class="hist-read__body">${readingBlock({ es: d.es, vocab: d.vocab, level: d.level, quiz: true })}</div>
           </details>`
        : "";
      const videos = (d.videos && d.videos.length)
        ? `<div class="bf-videos">
             <p class="bf-videos__cap">${renderIcon("lc:clapperboard")} ${esc(t("discover.blVideos"))}</p>
             ${d.videos.map((v) => `<a class="bf-video" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer"><span class="bf-video__play" aria-hidden="true">▶</span><span class="bf-video__t">${esc(v.title)}</span><span class="bf-video__src">${esc(v.source || "")}</span></a>`).join("")}
           </div>`
        : "";
      return `
        <details class="knigge-topic bf-dance">
          <summary class="knigge-topic__head">
            <span class="knigge-topic__icon" aria-hidden="true">${renderIcon(d.icon)}</span>
            <span class="knigge-topic__title">${esc(d.name)}${d.origin ? `<span class="bf-dance__origin">${esc(d.origin)}</span>` : ""}</span>
            ${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}
            <span class="knigge-topic__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="knigge-topic__body bf-dance__body">
            ${d.intro ? `<p class="knigge-intro">${esc(d.intro)}</p>` : ""}
            ${floor(d)}
            <p class="bf-count" lang="es">${esc(d.count || "")}</p>
            ${d.compas ? `<p class="bf-compas">${renderIcon("lc:music")} ${esc(d.compas)}</p>` : ""}
            ${videos}
            ${d.dos && d.dos.length ? `<ul class="knigge-list">${liList(d.dos, "knigge-do", "✅")}</ul>` : ""}
            ${d.donts && d.donts.length ? `<ul class="knigge-list">${liList(d.donts, "knigge-dont", "🚫")}</ul>` : ""}
            ${reading}
            ${tipsShareBtn("bailar", i)}
          </div>
        </details>`;
    };
    const dances = (vm.dances || []).map(danceBlock).join("");

    // Sätze: pro Situation eine zweispaltige Liste (es / de) – wie Fotos/Salud,
    // jeder Satz mit Stern → „Mi léxico".
    const phrases = phraseGroups(vm.phrases, { fav: ctx.isFavorite, cat: "bailar" });

    const glossary = (vm.glossary || []).map((g) => `
      <li class="rg-gloss">
        <span class="rg-gloss__es" lang="es">${esc(g.es)}</span>
        <span class="rg-gloss__de">${esc(g.de)}</span>
      </li>`).join("");

    const checklist = (vm.checklist || []).map((c) => `
      <li class="rg-region">
        <span class="rg-region__flag" aria-hidden="true">${renderIcon(c.icon)}</span>
        <span class="rg-region__body">
          <span class="rg-region__country">${esc(c.item)}</span>
          <span class="rg-region__note">${esc(c.why)}</span>
        </span>
      </li>`).join("");

    const navItems = [
      dances && { id: "bl-dances", icon: "lc:footprints", label: t("discover.blNavDances") },
      phrases && { id: "bl-phrases", icon: "lc:message-circle", label: t("discover.blNavPhrases") },
      glossary && { id: "bl-words", icon: "lc:megaphone", label: t("discover.blNavWords") },
      (vm.checklist && vm.checklist.length) && { id: "bl-etiquette", icon: "lc:handshake", label: t("discover.blNavEtiquette") },
    ].filter(Boolean);
    const nav = navItems.length > 1
      ? `<nav class="ft-nav" aria-label="${esc(t("discover.blAreas"))}">${navItems.map((n) =>
          `<a class="ft-nav__chip" href="#${n.id}" data-action="scroll-to" data-target="${n.id}"><span aria-hidden="true">${renderIcon(n.icon)}</span> ${esc(n.label)}</a>`).join("")}</nav>`
      : "";

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon("lc:footprints")} Bailar</div>
          <span></span>
        </div>
        <p class="pageintro">${esc(vm.intro)}</p>
        ${moduleShareBtn("bailar")}
        ${nav}

        ${dances ? `<h2 class="rg-head" id="bl-dances">${esc(t("discover.blDances"))}</h2><p class="hm-intro">${esc(t("discover.blDancesHint"))}</p>${dances}` : ""}
        ${phrases ? `<h2 class="rg-head" id="bl-phrases">${esc(t("discover.blPhrases"))}</h2>${phrases}` : ""}
        ${glossary ? `<h2 class="rg-head" id="bl-words">${esc(t("discover.blWords"))}</h2><ul class="rg-glosslist">${glossary}</ul>` : ""}
        ${(vm.checklist && vm.checklist.length)
          ? `<h2 class="rg-head" id="bl-etiquette">${esc(t("discover.blEtiquette"))}</h2>
             <p class="hm-intro">${esc(t("discover.blEtiquetteHint"))}</p>
             <ul class="rg-regions">${checklist}</ul>`
          : ""}
      </section>`;
  }

  window.SC.bailarSheet = {
    init(injected) { ctx = injected; },
    vm: bailarVM,
    screen: () => renderBailar(bailarVM()),
  };
})();
