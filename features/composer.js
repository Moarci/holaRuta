/*
 * features/composer.js  (SC.composer) – „Aufgaben-Studio": Aufgaben & Pakete
 * erstellen und teilen (Lehrkräfte & Reiseleitung). Ersetzt das frühere
 * Inline-Formular im Modo profe (Ziel-Picker-Modal + „Code erzeugen") durch
 * einen geführten 3-Schritte-Ablauf:
 *
 *   1 Inhalte  – Vorlagen (kuratierte Pakete) & Katalog (Pläne / Starter-Sets /
 *                Themen) mit Suche; Mehrfachauswahl mit Live-Zusammenfassung.
 *   2 Details  – gewähltes Paket prüfen (je Ziel Kartenzahl, entfernbar),
 *                optional Titel + Frist.
 *   3 Teilen   – Link, großer QR-Code, WhatsApp/System-Teilen; der rohe Code
 *                bleibt als Notlösung einklappbar. Plus „So kommt es an".
 *
 * Die erzeugten Codes sind unverändert HRT1 (1 Ziel) bzw. HRB1 (≥2 Ziele,
 * store.encodeTask/encodeBundle) – alte Links und die Lernenden-Seite („Tarea")
 * funktionieren ohne Änderung weiter. Backend-frei: kein Server, kein Konto.
 *
 * Zustand: die AUSWAHL lebt wie bisher im zentralen State (ctx.state.taskItems,
 * taskTitle, taskDue) und überlebt Re-Render + Navigation; reine Ansichts-
 * Zustände (Schritt, Katalog-Reiter, Suchtext, Anleitung offen, erzeugter
 * Link) sind modul-lokal und transient. Controller-Dienste per init(ctx);
 * app.js behält die Dispatch-Tabellen und delegiert an die Methoden hier.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, renderIcon, hmTopbar } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  // Größen-Deckel je Paket: direkt aus store (der beim Encodieren hart abschneidet),
  // damit hier keine zweite Zahl gepflegt werden muss, die auseinanderlaufen kann.
  const maxItems = () => (window.SC.store && window.SC.store.MAX_BUNDLE_ITEMS) || 20;

  // Ansichts-Zustand (transient, überlebt Re-Render, aber keinen Reload).
  const ui = {
    step: 1,        // 1 Inhalte · 2 Details · 3 Teilen
    tab: "",        // aktiver Katalog-Reiter ("" = erster verfügbarer)
    search: "",     // Suchtext (filtert über ALLE Gruppen, nicht nur den Reiter)
    guide: false,   // Anleitung-Overlay offen?
    result: null,   // { code, link, label, kind } nach „Link & QR erzeugen"
    groups: null,   // auf-/zugeklappte Vorlagen-Gruppen { id: bool } (null = Defaults)
  };

  // Locals-Track (Spanisch lernt Englisch)? Steuert nur Beschriftungen –
  // welche Ziele/Vorlagen es gibt, entscheidet der Controller (ctx.taskTargets).
  const isLocalsTrack = () => !!(window.SC.track && window.SC.track.id && window.SC.track.id() === "es-en");

  // ---------- Daten-Helfer ----------

  // "kind:scope" <-> {kind, scope} – deckungsgleich mit taskTargets().value.
  const itemKey = (it) => it.kind + ":" + it.scope;
  const keyToItem = (value) => { const p = String(value).split(":"); return { kind: p[0], scope: p.slice(1).join(":") }; };

  // Karten-Ids eines Ziels (gecacht – der Korpus ändert sich zur Laufzeit nicht).
  // Basis fürs deduplizierte Zählen: Ziele teilen sich oft Karten (ein Pre-Trip-
  // Plan enthält z. B. sein Pre-Arrival-Paket komplett), darum zählt die reine
  // Summe pro Ziel zu hoch – die Lernenden bekommen die Vereinigung, nicht die Summe.
  let _idsCache = null;
  function targetCardIds(value) {
    if (!_idsCache) _idsCache = new Map();
    if (_idsCache.has(value)) return _idsCache.get(value);
    const it = keyToItem(value);
    let ids;
    if (it.kind === "pretrip") {
      const plan = (ctx.data.PRETRIP || []).find((p) => p.scope === it.scope);
      ids = plan ? (plan.days || []).reduce((a, d) => a.concat(d.cardIds || []), []) : [];
    } else {
      ids = ctx.taskCardsFor(it).map((c) => c.id);
    }
    _idsCache.set(value, ids);
    return ids;
  }
  // Distinkte Karten über eine Menge von Ziel-Schlüsseln (Vereinigung, keine Dopplung).
  function uniqueCardCount(keys) {
    const set = new Set();
    keys.forEach((k) => targetCardIds(k).forEach((id) => set.add(id)));
    return set.size;
  }
  // Umfang eines EINZELNEN Ziels: distinkte Kartenzahl (+ Etappen bei Plänen). Gecacht.
  let _sizeCache = null;
  function targetSize(value) {
    if (!_sizeCache) _sizeCache = new Map();
    if (_sizeCache.has(value)) return _sizeCache.get(value);
    const it = keyToItem(value);
    let stages = 0;
    if (it.kind === "pretrip") {
      const plan = (ctx.data.PRETRIP || []).find((p) => p.scope === it.scope);
      stages = plan ? (plan.days || []).length : 0;
    }
    const size = { cards: uniqueCardCount([value]), stages };
    _sizeCache.set(value, size);
    return size;
  }

  // Alle wählbaren Ziele, angereichert um Umfang (Basis: ctx.taskTargets –
  // dieselbe Quelle wie das Aktivitätsblatt, inkl. Locals-Filter).
  function targets() {
    return ctx.taskTargets().map((x) => Object.assign({ size: targetSize(x.value) }, x));
  }

  // Vorlagen (kuratierte Pakete) mit lokalisierten Labels + Umfang. Im Locals-
  // Track leer (die fertigen Pakete sind reise-spezifisch) – wie bisher.
  function bundles() {
    if (isLocalsTrack()) return [];
    return (ctx.data.BUNDLES || []).map((b) => {
      const keys = (b.items || []).map(itemKey);
      return {
        id: b.id, icon: b.icon || "📦", group: b.group || "tema",
        label: ctx.natk(b, "label"), keys,
        cards: uniqueCardCount(keys),
      };
    });
  }

  const selectedKeys = () => ctx.state.taskItems.map(itemKey);
  // Gesamtumfang der Auswahl fürs Zähler-Band und die Zusammenfassung.
  function selectionStats() {
    const keys = selectedKeys();
    return { n: keys.length, cards: uniqueCardCount(keys) };
  }
  // Deckt sich die Auswahl EXAKT mit einer Vorlage? Dann trägt das Paket deren Namen.
  function matchedBundle() {
    const set = selectedKeys().slice().sort().join("|");
    return bundles().find((b) => b.keys.slice().sort().join("|") === set) || null;
  }
  // Lesbarer Paket-Name: 1 Ziel = dessen Label, sonst Vorlagen-Name oder „Eigenes Paket".
  function selectionLabel() {
    const items = ctx.state.taskItems;
    if (!items.length) return "";
    if (items.length === 1) return ctx.taskTargetLabel(items[0]);
    const m = matchedBundle();
    return m ? m.label : t("composer.customBundle");
  }

  // ---------- Katalog-Reiter ----------
  // Nur Reiter mit Inhalt anbieten; „Vorlagen" zuerst (der schnellste Weg).
  function tabList() {
    const tg = targets();
    const has = (g) => tg.some((x) => x.group === g);
    const out = [];
    if (bundles().length) out.push({ id: "vorlagen", label: t("composer.tabVorlagen"), icon: "lc:sparkles" });
    if (has("pretrip")) out.push({ id: "pretrip", label: t(isLocalsTrack() ? "composer.tabCurso" : "composer.tabPretrip"), icon: "lc:calendar" });
    if (has("preset")) out.push({ id: "preset", label: t("composer.tabPreset"), icon: "lc:backpack" });
    if (has("category")) out.push({ id: "category", label: t("composer.tabCategory"), icon: "lc:package" });
    return out;
  }
  function activeTab() {
    const list = tabList();
    return list.some((x) => x.id === ui.tab) ? ui.tab : (list[0] ? list[0].id : "");
  }

  // ---------- Aktionen (von app.js' Dispatch-Tabelle delegiert) ----------

  function open() {
    ctx.dismissBadgeToast();
    ui.step = 1; ui.guide = false; ui.result = null; ui.search = "";
    // QR-Generator fürs Teilen (Schritt 3) im Hintergrund nachladen; ist er da,
    // still neu rendern, damit der QR ohne Reload erscheint.
    ctx.loadModule("qr", () => { if (ctx.state.screen === "composer") ctx.render(); });
    ctx.setState({ screen: "composer" });
  }

  // Topbar-Zurück & Systemgeste: einen Schritt zurück, aus Schritt 1 zum Modo profe.
  function back() {
    if (ui.guide) { ui.guide = false; ctx.render(); return; }
    if (ui.step > 1) { goStep(ui.step - 1); return; }
    ctx.setState({ screen: "teacher" });
  }

  function goStep(n) {
    n = Math.max(1, Math.min(3, Number(n) || 1));
    if (n >= 2 && !ctx.state.taskItems.length) { ctx.showNotice(t("composer.needItems")); return; }
    if (ui.step === 2) captureDraft(); // Titel/Frist mitnehmen (DOM ist die Wahrheit)
    // Vor Schritt 3 den Code bauen; scheitert das (Store fehlt / leerer Code),
    // NICHT auf die Teilen-Ansicht wechseln – sonst stünde dort die irreführende
    // „wähle erst Inhalte"-Meldung, obwohl ein Paket gewählt ist.
    if (n === 3) { generate(); if (!ui.result) { ctx.showNotice(t("composer.genFailed")); return; } }
    ui.step = n;
    ctx.render();
    try { window.scrollTo(0, 0); } catch (e) { /* egal */ }
  }
  function next() { goStep(ui.step + 1); }

  function setTab(id) { ui.tab = String(id || ""); ui.search = ""; ctx.render(); }

  // Vorlagen-Gruppe auf-/zuklappen (Zustand überlebt Re-Render). Der Klick läuft
  // über die Dispatch-Tabelle; das anschließende render() setzt das open-Attribut.
  function toggleGroup(id) {
    if (!ui.groups) ui.groups = { destino: false, kurs: true, situation: true, orga: true };
    ui.groups[id] = !ui.groups[id];
    ctx.render();
  }

  // Live-Suche: nur Katalogliste + Fußzeile neu zeichnen (Feld behält Fokus/Cursor).
  function onSearch(value) {
    ui.search = String(value || "");
    const list = document.getElementById("cmp-catalog");
    if (list) list.innerHTML = catalogHtml();
    const foot = document.getElementById("cmp-footbar");
    if (foot) foot.innerHTML = footbarHtml();
  }

  // Ziel an-/abwählen (Schritt 1 und „Entfernen" in Schritt 2).
  function toggleTarget(value) {
    if (!value) return;
    const items = ctx.state.taskItems;
    const idx = items.findIndex((x) => itemKey(x) === value);
    const cap = maxItems();
    if (idx >= 0) ctx.state.taskItems = items.filter((_, i) => i !== idx);
    else if (items.length >= cap) { ctx.showNotice(t("composer.tooMany", { n: cap })); return; }
    else ctx.state.taskItems = items.concat([keyToItem(value)]);
    ui.result = null; // Auswahl geändert -> alter Link gilt nicht mehr
    ctx.render();
    restoreSearchFocus();
  }

  // Vorlage umschalten: komplett enthalten -> ihre Ziele entfernen; sonst
  // dazunehmen (Vereinigung) – Vorlagen und Einzelziele bleiben frei kombinierbar.
  function toggleBundle(id) {
    const b = bundles().find((x) => x.id === id);
    if (!b) return;
    const keys = selectedKeys();
    const fullyIn = b.keys.length && b.keys.every((k) => keys.indexOf(k) >= 0);
    if (fullyIn) {
      ctx.state.taskItems = ctx.state.taskItems.filter((it) => b.keys.indexOf(itemKey(it)) < 0);
    } else {
      const cap = maxItems();
      let capped = false;
      b.keys.forEach((k) => {
        if (keys.indexOf(k) >= 0) return;
        if (ctx.state.taskItems.length >= cap) { capped = true; return; }
        keys.push(k);
        ctx.state.taskItems = ctx.state.taskItems.concat([keyToItem(k)]);
      });
      if (capped) ctx.showNotice(t("composer.tooMany", { n: cap }));
    }
    ui.result = null;
    ctx.render();
    restoreSearchFocus();
  }

  function clearAll() {
    ui.result = null;
    ctx.setState({ taskItems: [] });
  }

  // Nach einem Re-Render aus der Trefferliste heraus den Fokus zurück ins
  // Suchfeld legen: läuft eine Suche (Feld nicht leer), soll ein Treffer-Tipp die
  // Eingabe nicht abbrechen. Bedingung an ui.search statt an den vorherigen Fokus –
  // beim delegierten Klick trägt längst der Treffer-Button den Fokus, nicht das Feld.
  function restoreSearchFocus() {
    if (!ui.search) return;
    const el = document.getElementById("cmp-search");
    if (el && document.activeElement !== el) {
      try { const v = el.value.length; el.focus(); el.setSelectionRange(v, v); } catch (e) { /* egal */ }
    }
  }

  // Titel/Frist aus dem DOM in den zentralen State spiegeln (überlebt Re-Render).
  function captureDraft() {
    const titleEl = document.getElementById("cmp-title");
    const dueEl = document.getElementById("cmp-due");
    if (titleEl) ctx.state.taskTitle = titleEl.value;
    if (dueEl) ctx.state.taskDue = dueEl.value;
  }

  // Code + Link bauen (Schritt 2 -> 3). 1 Ziel = HRT1, ≥2 Ziele = HRB1 –
  // unverändert kompatibel zur Lernenden-Seite und zu alten Links.
  function generate() {
    const store = window.SC.store;
    const items = ctx.state.taskItems;
    if (!items.length || !store) return;
    const title = (ctx.state.taskTitle || "").trim();
    const due = ctx.state.taskDue || "";
    const code = items.length === 1
      ? store.encodeTask({ kind: items[0].kind, scope: items[0].scope, title, due })
      : store.encodeBundle({ items, title, due });
    if (!code) return;
    ui.result = {
      code,
      link: ctx.taskShareLink(code),
      label: selectionLabel(),
      kind: items.length === 1 ? "single" : "bundle",
    };
  }

  // Alles auf Anfang für das nächste Paket (Auswahl, Titel, Frist, Ergebnis).
  function restart() {
    ui.result = null; ui.step = 1; ui.search = "";
    ctx.setState({ taskItems: [], taskTitle: "", taskDue: "" });
  }

  // ---------- Teilen ----------

  // Kopieren mit execCommand-Fallback (WebView/file:// blockt die Clipboard-API oft).
  function copyText(text, action) {
    let ok = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, text.length);
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
    if (ok) { ctx.flashButton(action, t("composer.copied")); ctx.buzz(8); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { ctx.flashButton(action, t("composer.copied")); ctx.buzz(8); },
        () => { ctx.showNotice(text); }
      );
      return;
    }
    ctx.showNotice(text); // letzte Notlösung: anzeigen zum manuellen Kopieren
  }
  function copyLink() { if (ui.result) copyText(ui.result.link, "composer-copy-link"); }
  function copyCode() { if (ui.result) copyText(ui.result.code, "composer-copy-code"); }

  // Nachricht für WhatsApp/System-Teilen: Titel (falls gesetzt) + Anleitung + Link.
  function shareMessage() {
    const title = (ctx.state.taskTitle || "").trim() || ui.result.label;
    return t("composer.shareMsg", { title }) + "\n" + ui.result.link;
  }
  function shareWhatsApp() {
    if (!ui.result) return;
    try { window.open("https://wa.me/?text=" + encodeURIComponent(shareMessage()), "_blank", "noopener"); } catch (e) { /* egal */ }
  }
  function shareNative() {
    if (!ui.result || !navigator.share) return;
    navigator.share({ title: (ctx.state.taskTitle || "").trim() || ui.result.label, text: shareMessage() }).catch(() => { /* abgebrochen */ });
  }

  function toggleGuide(openIt) { ui.guide = !!openIt; ctx.render(); }

  // ---------- View ----------

  // Schritt-Anzeige: erledigte Schritte sind antippbar (zurückspringen),
  // vorwärts geht es nur über die Weiter-Knöpfe (geführter Ablauf).
  function stepperHtml() {
    const steps = [t("composer.step1"), t("composer.step2"), t("composer.step3")];
    return `
      <ol class="cmp-steps" aria-label="${esc(t("composer.stepOf", { n: ui.step }))}">
        ${steps.map((label, i) => {
          const n = i + 1;
          const cls = n < ui.step ? " cmp-step--done" : n === ui.step ? " cmp-step--current" : "";
          const inner = `
            <span class="cmp-step__dot" aria-hidden="true">${n < ui.step ? "✓" : n}</span>
            <span class="cmp-step__label">${esc(label)}</span>`;
          // Nur RÜCK-Sprünge als Button (vorwärts führt der Weiter-Knopf).
          const body = n < ui.step
            ? `<button type="button" class="cmp-step__btn" data-action="composer-step" data-step="${n}">${inner}</button>`
            : `<span class="cmp-step__btn"${n === ui.step ? ' aria-current="step"' : ""}>${inner}</span>`;
          return `<li class="cmp-step${cls}">${body}</li>`;
        }).join("")}
      </ol>`;
  }

  // Eine Ziel-Zeile im Katalog (Schritt 1). Zeigt Umfang; gewählt = ✓.
  function targetRow(x, active) {
    const meta = x.size.stages
      ? t("composer.metaStages", { n: x.size.stages, cards: x.size.cards })
      : t("composer.metaCards", { n: x.size.cards });
    return `
      <button type="button" class="cmp-item${active ? " is-active" : ""}" data-action="composer-toggle" data-value="${esc(x.value)}" aria-pressed="${active}">
        <span class="cmp-item__text">
          <span class="cmp-item__label">${esc(x.label)}</span>
          <span class="cmp-item__meta">${esc(meta)}</span>
        </span>
        <span class="cmp-item__check" aria-hidden="true">${active ? "✓" : "+"}</span>
      </button>`;
  }

  // Eine Vorlagen-Karte (kuratiertes Paket): Umfang + enthaltene Ziele als Vorschau.
  // labelByKey = einmalige Map über alle Ziele (statt Suche je Karte); die Vorschau
  // dedupliziert gleichnamige Ziele (Plan + Starter-Set desselben Ziels).
  function bundleCard(b, keys, labelByKey) {
    const active = b.keys.length && b.keys.every((k) => keys.indexOf(k) >= 0);
    const names = [];
    b.keys.forEach((k) => {
      const label = labelByKey.get(k);
      if (label && names.indexOf(label) < 0) names.push(label);
    });
    return `
      <button type="button" class="cmp-bundle${active ? " is-active" : ""}" data-action="composer-bundle" data-bundle="${esc(b.id)}" aria-pressed="${active}">
        <span class="cmp-bundle__icon" aria-hidden="true">${renderIcon(b.icon)}</span>
        <span class="cmp-bundle__text">
          <span class="cmp-bundle__label">${esc(b.label)}</span>
          <span class="cmp-bundle__meta">${esc(t("composer.bundleMeta", { n: b.keys.length, cards: b.cards }))}</span>
          <span class="cmp-bundle__items">${esc(names.join(" · "))}</span>
        </span>
        <span class="cmp-item__check" aria-hidden="true">${active ? "✓" : "+"}</span>
      </button>`;
  }

  // Abschnitte der Vorlagen-Reiter (Reihenfolge = Anzeige).
  const BUNDLE_GROUPS = [
    { id: "destino", labelKey: "composer.bgDestino" },
    { id: "kurs", labelKey: "composer.bgKurs" },
    { id: "situation", labelKey: "composer.bgSituation" },
    { id: "orga", labelKey: "composer.bgOrga" },
  ];

  // Katalog-Inhalt (Schritt 1): bei Suche gruppenübergreifende Treffer, sonst
  // der aktive Reiter. Als eigene Funktion, damit die Live-Suche NUR diesen
  // Block neu zeichnet (Suchfeld behält den Fokus).
  function catalogHtml() {
    const keys = selectedKeys();
    const allTargets = targets();
    const labelByKey = new Map(allTargets.map((x) => [x.value, x.label]));
    const q = ui.search.trim().toLowerCase();
    if (q) {
      const hitT = allTargets.filter((x) => x.label.toLowerCase().indexOf(q) >= 0);
      const hitB = bundles().filter((b) => b.label.toLowerCase().indexOf(q) >= 0);
      if (!hitT.length && !hitB.length) return `<p class="cmp-empty">${esc(t("composer.searchNone"))}</p>`;
      const grpLabel = { pretrip: t(isLocalsTrack() ? "composer.tabCurso" : "composer.tabPretrip"), preset: t("composer.tabPreset"), category: t("composer.tabCategory") };
      return `
        ${hitB.length ? `<h3 class="cmp-grouphead">${esc(t("composer.tabVorlagen"))}</h3><div class="cmp-list">${hitB.map((b) => bundleCard(b, keys, labelByKey)).join("")}</div>` : ""}
        ${["pretrip", "preset", "category"].map((g) => {
          const list = hitT.filter((x) => x.group === g);
          if (!list.length) return "";
          return `<h3 class="cmp-grouphead">${esc(grpLabel[g])}</h3><div class="cmp-list">${list.map((x) => targetRow(x, keys.indexOf(x.value) >= 0)).join("")}</div>`;
        }).join("")}`;
    }
    const tab = activeTab();
    if (tab === "vorlagen") {
      const bs = bundles();
      // Jede Gruppe als einklappbarer Abschnitt; die lange Reiseziel-Liste
      // („Komplett: …", ~30 Einträge) startet zugeklappt, der Rest offen. Der
      // Auf/Zu-Zustand lebt in ui.groups, damit ihn ein Re-Render (Ziel antippen)
      // nicht zurücksetzt; der summary-Klick läuft über die Dispatch-Tabelle.
      if (!ui.groups) ui.groups = { destino: false, kurs: true, situation: true, orga: true };
      const sections = BUNDLE_GROUPS.map((g) => {
        const list = bs.filter((b) => b.group === g.id);
        if (!list.length) return "";
        return `
          <details class="cmp-groupsec"${ui.groups[g.id] ? " open" : ""}>
            <summary data-action="composer-group" data-group="${esc(g.id)}">${esc(t(g.labelKey))} <span class="cmp-groupsec__count">(${list.length})</span></summary>
            <div class="cmp-list">${list.map((b) => bundleCard(b, keys, labelByKey)).join("")}</div>
          </details>`;
      }).join("");
      const known = BUNDLE_GROUPS.map((g) => g.id);
      const rest = bs.filter((b) => known.indexOf(b.group) < 0);
      return `<p class="cmp-tabhelp">${esc(t("composer.helpVorlagen"))}</p>${sections}${rest.length ? `<div class="cmp-list">${rest.map((b) => bundleCard(b, keys, labelByKey)).join("")}</div>` : ""}`;
    }
    const helpKey = tab === "pretrip" ? (isLocalsTrack() ? "composer.helpCurso" : "composer.helpPretrip") : tab === "preset" ? "composer.helpPreset" : "composer.helpCategory";
    const list = targets().filter((x) => x.group === tab);
    return `<p class="cmp-tabhelp">${esc(t(helpKey))}</p><div class="cmp-list">${list.map((x) => targetRow(x, keys.indexOf(x.value) >= 0)).join("")}</div>`;
  }

  // Klebrige Fußleiste (Schritt 1): Auswahl-Zähler + Leeren + Weiter.
  function footbarHtml() {
    const s = selectionStats();
    const count = s.n
      ? `<strong>${esc(t("composer.selCount", { n: s.n }))}</strong> · ${esc(t("composer.metaCards", { n: s.cards }))}`
      : esc(t("composer.selEmpty"));
    return `
      <span class="cmp-foot__count" role="status">${count}</span>
      <span class="cmp-foot__btns">
        ${s.n ? `<button type="button" class="cmp-ghostbtn" data-action="composer-clear">${esc(t("composer.clear"))}</button>` : ""}
        <button type="button" class="cta cmp-nextbtn" data-action="composer-next"${s.n ? "" : " disabled"}>${esc(t("composer.next"))} →</button>
      </span>`;
  }

  function step1Html() {
    const tabs = tabList();
    const tab = activeTab();
    return `
      <p class="cmp-intro">${esc(t("composer.introStep1"))}</p>
      <div class="cmp-search">
        ${renderIcon("lc:search")}
        <input id="cmp-search" class="cmp-search__input" type="search" autocomplete="off"
               placeholder="${esc(t("composer.searchPh"))}" value="${esc(ui.search)}" aria-label="${esc(t("composer.searchPh"))}">
      </div>
      <div class="cmp-tabs" role="tablist" aria-label="${esc(t("composer.catalogLabel"))}">
        ${tabs.map((x) => `
          <button type="button" class="cmp-tab${!ui.search && x.id === tab ? " is-active" : ""}" role="tab" aria-selected="${!ui.search && x.id === tab}"
                  data-action="composer-tab" data-tab="${esc(x.id)}">${renderIcon(x.icon)} ${esc(x.label)}</button>`).join("")}
      </div>
      <div id="cmp-catalog" class="cmp-catalog">${catalogHtml()}</div>
      <div id="cmp-footbar" class="cmp-footbar">${footbarHtml()}</div>`;
  }

  // Auswahl-Zusammenfassung (Schritt 2): jede Zeile entfernbar, unten die Summe.
  function step2Html() {
    const items = ctx.state.taskItems.map((it) => {
      const key = itemKey(it);
      const size = targetSize(key);
      const meta = size.stages ? t("composer.metaStages", { n: size.stages, cards: size.cards }) : t("composer.metaCards", { n: size.cards });
      return `
        <li class="cmp-sel">
          <span class="cmp-sel__text">
            <span class="cmp-sel__label">${esc(ctx.taskTargetLabel(it))}</span>
            <span class="cmp-sel__meta">${esc(meta)}</span>
          </span>
          <button type="button" class="cmp-sel__x" data-action="composer-toggle" data-value="${esc(key)}"
                  aria-label="${esc(t("composer.remove"))}" title="${esc(t("composer.remove"))}">✕</button>
        </li>`;
    }).join("");
    const s = selectionStats();
    return `
      <p class="cmp-intro">${esc(t("composer.introStep2"))}</p>
      <section class="cmp-card">
        <h3 class="cmp-h3">${renderIcon("lc:package")} ${esc(t("composer.summaryHeading"))}: ${esc(selectionLabel())}</h3>
        <ul class="cmp-sels">${items}</ul>
        <p class="cmp-total">${esc(t("composer.selSummary", { n: s.n, cards: s.cards }))}</p>
        <button type="button" class="cmp-ghostbtn" data-action="composer-step" data-step="1">${renderIcon("lc:plus")} ${esc(t("composer.addMore"))}</button>
      </section>
      <section class="cmp-card">
        <label class="cmp-field">
          <span class="cmp-field__label">${esc(t("composer.titleLabel"))}</span>
          <input id="cmp-title" class="task-input" type="text" maxlength="80" placeholder="${esc(t("composer.titlePh"))}" value="${esc(ctx.state.taskTitle || "")}">
          <span class="cmp-field__hint">${esc(t("composer.titleHint"))}</span>
        </label>
        <label class="cmp-field">
          <span class="cmp-field__label">${esc(t("composer.dueLabel"))}</span>
          <input id="cmp-due" class="task-input" type="date" value="${esc(ctx.state.taskDue || "")}">
          <span class="cmp-field__hint">${esc(t("composer.dueHint"))}</span>
        </label>
      </section>
      <div class="cmp-footbar">
        <button type="button" class="cmp-ghostbtn" data-action="composer-step" data-step="1">← ${esc(t("composer.backStep"))}</button>
        <button type="button" class="cta cmp-nextbtn" data-action="composer-next">${esc(t("composer.toShare"))} →</button>
      </div>`;
  }

  function step3Html() {
    const r = ui.result;
    if (!r) return `<p class="cmp-empty">${esc(t("composer.needItems"))}</p>`;
    const title = (ctx.state.taskTitle || "").trim();
    const due = ctx.state.taskDue || "";
    const s = selectionStats();
    const kindLine = r.kind === "single" ? t("composer.singleKind") : t("composer.bundleKind", { n: s.n });
    // QR auf den Abo-Link – Lernende scannen statt abzutippen (SC.qr wird beim
    // Öffnen nachgeladen; bis dahin ein stiller Platzhalter).
    const qr = window.SC.qr ? window.SC.qr.svg(r.link, { ecc: "M", margin: 0 }) : "";
    return `
      <section class="cmp-card cmp-ready">
        <h3 class="cmp-h3">${renderIcon("lc:check-circle")} ${esc(t("composer.readyHeading"))}</h3>
        <p class="cmp-ready__what">
          <strong>${esc(title || r.label)}</strong><br>
          ${esc(kindLine)} · ${esc(t("composer.metaCards", { n: s.cards }))}${due ? ` · ${esc(t("composer.dueShort", { date: due }))}` : ""}
        </p>
        ${qr ? `<div class="cmp-qr" role="img" aria-label="${esc(t("composer.qrAria"))}">${qr}</div>
        <p class="cmp-qrhint">${esc(t("composer.qrHint"))}</p>` : ""}
        <div class="cmp-sharebtns">
          <button type="button" class="cta cmp-sharebtn" data-action="composer-copy-link">${renderIcon("lc:link")} ${esc(t("composer.copyLink"))}</button>
          <button type="button" class="cmp-sharebtn cmp-sharebtn--wa" data-action="composer-whatsapp">${renderIcon("lc:message-circle")} ${esc(t("composer.whatsapp"))}</button>
          ${navigator.share ? `<button type="button" class="cmp-sharebtn" data-action="composer-share">${renderIcon("lc:upload")} ${esc(t("composer.shareSystem"))}</button>` : ""}
        </div>
        <details class="cmp-codebox">
          <summary>${esc(t("composer.codeDetails"))}</summary>
          <p class="cmp-field__hint">${esc(t("composer.codeHint"))}</p>
          <textarea class="task-code" readonly rows="2" aria-label="${esc(t("composer.codeDetails"))}">${esc(r.code)}</textarea>
          <button type="button" class="cmp-ghostbtn" data-action="composer-copy-code">${renderIcon("lc:clipboard-list")} ${esc(t("composer.copyCode"))}</button>
        </details>
      </section>
      <section class="cmp-card cmp-how">
        <h3 class="cmp-h3">${renderIcon("lc:route")} ${esc(t("composer.howHeading"))}</h3>
        <ol class="cmp-hownums">
          <li>${esc(t("composer.how1"))}</li>
          <li>${esc(t("composer.how2"))}</li>
          <li>${esc(t("composer.how3"))}</li>
        </ol>
      </section>
      <div class="cmp-footbar">
        <button type="button" class="cmp-ghostbtn" data-action="composer-step" data-step="2">← ${esc(t("composer.backStep"))}</button>
        <button type="button" class="cmp-ghostbtn" data-action="composer-new">${renderIcon("lc:plus")} ${esc(t("composer.newTask"))}</button>
      </div>`;
  }

  // Anleitung-Overlay: kompakte Hilfe für Lehrkräfte & Reiseleitung. Native
  // <details>-Abschnitte (ohne JS-State); Schließen über ✕, Scrim oder Zurück.
  function guideHtml() {
    const sec = (icon, hKey, bKey) => `
      <details class="cmp-guide__sec">
        <summary>${renderIcon(icon)} ${esc(t(hKey))}</summary>
        <p>${esc(t(bKey))}</p>
      </details>`;
    return `
      <div class="tgt-scrim" data-action="composer-guide-close">
        <div class="tgt-modal cmp-guide" role="dialog" aria-modal="true" aria-labelledby="cmp-guide-title" data-action="composer-guide-stop">
          <div class="tgt-modal__head">
            <h2 class="tgt-modal__title" id="cmp-guide-title">${renderIcon("lc:graduation-cap")} ${esc(t("composer.guideTitle"))}</h2>
            <button type="button" class="tgt-modal__x" data-action="composer-guide-close" aria-label="${esc(t("composer.close"))}">✕</button>
          </div>
          <div class="tgt-modal__body cmp-guide__body">
            <p class="cmp-guide__lead">${esc(t("composer.gLead"))}</p>
            ${sec("lc:lightbulb", "composer.gWhatH", "composer.gWhat")}
            ${sec("lc:clipboard-list", "composer.gStepsH", "composer.gSteps")}
            ${sec("lc:graduation-cap", "composer.gTeachH", "composer.gTeach")}
            ${sec("lc:map", "composer.gGuideH", "composer.gGuide")}
            ${sec("lc:users", "composer.gLearnersH", "composer.gLearners")}
            <p class="cmp-guide__privacy">${esc(t("composer.gPrivacy"))}</p>
            <div class="cmp-guide__links">
              <button type="button" class="cmp-ghostbtn" data-action="open-teacher">${renderIcon("lc:bar-chart-3")} ${esc(t("composer.linkRoster"))}</button>
              <button type="button" class="cmp-ghostbtn" data-action="open-printsheet">${renderIcon("lc:file-text")} ${esc(t("composer.linkSheets"))}</button>
            </div>
          </div>
          <div class="tgt-modal__foot">
            <button type="button" class="cta tgt-modal__done" data-action="composer-guide-close">${esc(t("composer.close"))}</button>
          </div>
        </div>
      </div>`;
  }

  function screen() {
    const body = ui.step === 1 ? step1Html() : ui.step === 2 ? step2Html() : step3Html();
    return `
      <section class="screen cmp">
        ${hmTopbar(`${renderIcon("lc:package")} ` + esc(t("composer.title")), "composer-back")}
        <div class="cmp-head">
          ${stepperHtml()}
          <button type="button" class="cmp-guidebtn" data-action="composer-guide" aria-haspopup="dialog">${renderIcon("lc:help-circle")} ${esc(t("composer.guideBtn"))}</button>
        </div>
        ${body}
      </section>
      ${ui.guide ? guideHtml() : ""}`;
  }

  window.SC.composer = {
    init(c) { ctx = c; },
    screen,
    open, back, next, goStep, setTab, toggleGroup, onSearch,
    toggleTarget, toggleBundle,
    clearAll, restart, captureDraft,
    copyLink, copyCode, shareWhatsApp, shareNative,
    openGuide: () => toggleGuide(true),
    closeGuide: () => toggleGuide(false),
    // Nur das Anleitung-Overlay schließen (für die Escape-Taste): true = war offen
    // und wurde geschlossen. Anders als handleBack navigiert das NIE die Schritte.
    closeGuideIfOpen() {
      if (ctx.state.screen === "composer" && ui.guide) { ui.guide = false; ctx.render(); return true; }
      return false;
    },
    // Systemgeste „Zurück": true = hier behandelt (Schritt/Overlay), false = App-Navigation.
    handleBack() {
      if (ctx.state.screen !== "composer") return false;
      if (ui.guide) { ui.guide = false; ctx.render(); return true; }
      if (ui.step > 1) { goStep(ui.step - 1); return true; }
      return false;
    },
  };
})();
