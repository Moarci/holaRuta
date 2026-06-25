/*
 * features/etiqueta.js  (SC.etiqueta) – „Etiqueta de viaje" (Reise-Knigge):
 * allgemeine DOs & Don'ts unterwegs (Hostel, Bus, Gruppen, Kultur) plus
 * landesspezifische Akzente. Land-Dropdown wie in der Länderkunde – es teilt
 * state.countryId mit Länderkunde/Bebidas/Bailar/Musica. Themenblöcke sind native
 * <details> (kein JS-State). Inhalte aus dem Content-Modul SC.knigge (Akzente je
 * Land in ACCENTS, Themen in TOPICS) und den Ländern aus SC.countries.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle E, vormals „blockierte" Screens): VM und
 * Render leben hier zusammen; Controller-Dienste kommen per init(ctx). Die
 * geteilte Länder-Auswahl bleibt controller-seitig: das gerenderte countryPicker
 * (SC.view) emittiert data-action="select-country" -> der Controller-Handler
 * setzt state.countryId und rendert neu (auch Länderkunde/Bebidas hängen daran).
 * Der Opener (openKnigge) bleibt im Controller (Entdecken-Kachel + Shortcut-Map).
 * Der Tipp-Teilen-Knopf tipsShareBtn() kommt aus SC.view.
 *
 * Namensgebung: das Content-Modul heißt SC.knigge, dieses Feature-Modul SC.etiqueta
 * (nach dem Bildschirmtitel „Etiqueta de viaje") – so kollidieren die Globals nicht.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, countryPicker, tipsShareBtn, moduleShareBtn } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  // Reise-Knigge: gewähltes Land (teilt state.countryId mit der Länderkunde),
  // Region-Gruppen fürs Dropdown wie infoVM, plus die allgemeinen Themenblöcke
  // mit eingehängtem landesspezifischem Akzent.
  function kniggeVM() {
    const countries = ctx.countries;
    const knigge = ctx.knigge;
    const list = countries ? countries.LIST : [];
    const regions = countries ? countries.REGIONS : [];
    const country = list.find((c) => c.id === ctx.state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: ctx.natk(c, "name"), flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    const accents = (country && knigge && knigge.ACCENTS[country.id]) || {};
    const topics = (knigge ? knigge.TOPICS : []).map((tp) => ({
      icon: tp.icon,
      title: ctx.natk(tp, "title"),
      intro: ctx.natk(tp, "intro"),
      dos: ctx.natk(tp, "dos"),
      donts: ctx.natk(tp, "donts"),
      accent: ctx.natk(accents, tp.id) || "",
    }));
    return { country, groups, topics };
  }

  // ----- Render -----
  function renderKnigge(vm) {
    const selector = countryPicker(vm.groups);

    const countryName = vm.country ? vm.country.name : "";

    const liList = (items, cls, marker) => {
      // Marker als role="img" mit Label, damit Screenreader „Empfohlen/Vermeiden"
      // hören – sonst sind DO- und Don't-Liste nur über Emoji+Farbe unterscheidbar.
      const srLabel = cls === "knigge-do" ? t("discover.kniggeDo") : t("discover.kniggeDont");
      return (items || [])
        .map((it) => `<li class="${cls}"><span class="knigge-mark" role="img" aria-label="${esc(srLabel)}">${marker}</span>${esc(it)}</li>`)
        .join("");
    };

    const block = (tp, i) => {
      const dos = liList(tp.dos, "knigge-do", "✅");
      const donts = liList(tp.donts, "knigge-dont", "🚫");
      const accent = tp.accent
        ? `<div class="knigge-accent">${renderIcon("lc:lightbulb")} <strong>${esc(window.t("discover.kniggeAccentIn", { country: countryName }))}</strong> ${esc(tp.accent)}</div>`
        : "";
      return `
        <details class="knigge-topic">
          <summary class="knigge-topic__head">
            <span class="knigge-topic__icon" aria-hidden="true">${renderIcon(tp.icon)}</span>
            <span class="knigge-topic__title">${esc(tp.title)}</span>
            <span class="knigge-topic__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="knigge-topic__body">
            ${tp.intro ? `<p class="knigge-intro">${esc(tp.intro)}</p>` : ""}
            ${dos ? `<ul class="knigge-list">${dos}</ul>` : ""}
            ${donts ? `<ul class="knigge-list">${donts}</ul>` : ""}
            ${accent}
            ${tipsShareBtn("knigge", i)}
          </div>
        </details>`;
    };

    const topics = (vm.topics || []).map(block).join("");

    return `
      <section class="screen">
        ${kniggeTopbar()}
        ${selector}
        <p class="pageintro">${t("discover.kniggeIntroPre")}${countryName ? esc(t("discover.kniggeIntroFor", { country: countryName })) : ""}.</p>
        ${moduleShareBtn("knigge")}
        ${topics}
      </section>`;
  }

  function kniggeTopbar() {
    return `
      <div class="topbar">
        <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
        <div class="topbar__title">${renderIcon("lc:compass")} Etiqueta de viaje</div>
        <span></span>
      </div>`;
  }

  window.SC.etiqueta = {
    init(injected) { ctx = injected; },
    vm: kniggeVM,
    // SCREENS-Eintrag (app.js delegiert) + Spotlight-Vorschau (app.js liest vm().topics).
    screen: () => renderKnigge(kniggeVM()),
  };
})();
