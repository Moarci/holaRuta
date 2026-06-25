/*
 * features/cuerpo.js  (SC.cuerpo) – „El Cuerpo": interaktive Körperkarte mit einem
 * drehbaren 3D-Modell. Antippbare Hotspots je Körperteil (Wort + Reisetipp), ein
 * Fortschrittsbalken (erkundete Teile) und eine CSS-3D-Figur aus Kugel-Impostoren,
 * die per Ziehgeste oder ↺/↻-Knöpfen gedreht wird. Inhalte aus data.BODY_PARTS.
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D) – der ERSTE interaktive Screen mit
 * Post-Render-Hook: VM, Render, die 3D-Geometrie-Konstanten und die komplette
 * Dreh-/Auswahl-Logik (inkl. globaler Pointer-Listener) leben hier zusammen.
 * Controller-Dienste kommen per init(ctx); das Modul verdrahtet seine globalen
 * Pointer-Listener selbst (auf ctx.root/window) und exponiert:
 *   - screen()  : SCREENS-Render (app.js delegiert)
 *   - init3D()  : Post-Render-Hook (app.js ruft nach jedem Cuerpo-Render auf –
 *                 Elemente neu einsammeln, Drehung erhalten)
 *   - select(id), rotate(dir), speak() : die data-action-Handler
 * Der Opener (openCuerpo) bleibt im Controller (Entdecken-Kachel + Shortcut-Map +
 * setzt die Start-Drehung zurück). Der Eckknopf cornerBtn() kommt aus SC.view.
 *
 * 3D-Prinzip: Die Figur ist eine CSS-3D-Szene aus Kugeln (Orbs) und Hotspot-Punkten.
 * Beim Drehen ändert sich nur der eine Eltern-Transform plus pro Element ein
 * Billboard-Konter (rotateY/X invers), damit jede Kugel rund zur Kamera bleibt.
 * Läuft in-place ohne Voll-Re-Render – darum die direkten DOM-/state-Zugriffe.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  // Übersetzer wie in ui.js binden (i18n.js setzt SC.i18n.t === window.t vorab).
  const t = (window.SC && window.SC.i18n && window.SC.i18n.t) || window.t;
  const { esc, hmTopbar, moduleShareBtn, cornerBtn } = window.SC.view;

  let ctx = null;  // vom Controller injizierte Dienste (init)
  let root = null; // App-Container (ctx.root) – Bühne der 3D-Szene

  // Orb-Daten: [x, y, z, durchmesser] in px, Ursprung in Figurmitte (y nach oben).
  // Die Figur (Avatar) ist absichtlich kein externes Modell, sondern aus
  // schattierten Kugel-Impostoren (Orbs) aufgebaut, die per CSS-3D im Raum sitzen
  // (translate3d) und zur Kamera ausgerichtet werden – läuft offline (PWA-Prinzip).
  const BP_ORBS = [
    [0, -150, 0, 72], [0, -112, 4, 26],                                   // Kopf, Hals
    [0, -86, 8, 66], [0, -52, 10, 62], [0, -18, 8, 58], [0, 16, 4, 60],   // Rumpf
    [-40, -92, 2, 34], [40, -92, 2, 34],                                  // Schultern
    [-50, -64, 2, 30], [-56, -34, 4, 26], [-60, -4, 6, 24], [-62, 22, 8, 28], // li. Arm
    [50, -64, 2, 30], [56, -34, 4, 26], [60, -4, 6, 24], [62, 22, 8, 28], // re. Arm
    [-20, 48, 6, 40], [-21, 80, 6, 34], [-22, 106, 8, 30], [-23, 136, 6, 28], [-24, 162, 6, 24], [-22, 176, 20, 30], // li. Bein
    [20, 48, 6, 40], [21, 80, 6, 34], [22, 106, 8, 30], [23, 136, 6, 28], [24, 162, 6, 24], [22, 176, 20, 30],       // re. Bein
  ];
  const BP_FIGURE_3D = BP_ORBS.map(
    ([x, y, z, d]) => `<i class="bp-orb" data-x="${x}" data-y="${y}" data-z="${z}" style="width:${d}px;height:${d}px"></i>`
  ).join("");

  // Interaktive Hotspots je Körperteil-Id: Position (x,y,z), Azimut az (Grad um
  // die Hochachse: 0 = vorne, ±90 = Seite, 180 = Rücken – steuert das Ausblenden
  // beim Wegdrehen) und Punktgröße d. Bewusst hier (View) statt in den
  // Vokabeldaten gehalten: data.js bleibt reine Vokabel-Wahrheit.
  const BP_LAYOUT3D = {
    bp_pelo:     { x: 0,   y: -182, z: 10,  az: 0,   d: 20 },
    bp_cabeza:   { x: -20, y: -170, z: 20,  az: -20, d: 20 },
    bp_ojo:      { x: -12, y: -156, z: 34,  az: -8,  d: 16 },
    bp_nariz:    { x: 0,   y: -148, z: 39,  az: 0,   d: 15 },
    bp_boca:     { x: 0,   y: -136, z: 36,  az: 0,   d: 16 },
    bp_cara:     { x: 18,  y: -146, z: 30,  az: 18,  d: 16 },
    bp_oreja:    { x: 31,  y: -150, z: 4,   az: 72,  d: 16 },
    bp_cuello:   { x: 0,   y: -112, z: 18,  az: 0,   d: 22 },
    bp_hombro:   { x: -40, y: -92,  z: 16,  az: -35, d: 24 },
    bp_pecho:    { x: 0,   y: -82,  z: 42,  az: 0,   d: 26 },
    bp_espalda:  { x: 0,   y: -70,  z: -36, az: 180, d: 24 },
    bp_estomago: { x: 0,   y: -22,  z: 40,  az: 0,   d: 26 },
    bp_brazo:    { x: -52, y: -60,  z: 18,  az: -50, d: 24 },
    bp_codo:     { x: -57, y: -32,  z: 20,  az: -55, d: 22 },
    bp_mano:     { x: -63, y: 22,   z: 22,  az: -55, d: 26 },
    bp_dedo:     { x: -64, y: 40,   z: 22,  az: -55, d: 18 },
    bp_pierna:   { x: -22, y: 60,   z: 30,  az: -10, d: 26 },
    bp_rodilla:  { x: -22, y: 106,  z: 28,  az: -10, d: 24 },
    bp_tobillo:  { x: -24, y: 160,  z: 24,  az: -10, d: 20 },
    bp_pie:      { x: -22, y: 178,  z: 38,  az: 0,   d: 24 },
  };

  // ----- 3D-Laufzeitzustand (in-place, ohne Voll-Re-Render) -----
  const bp3d = { fig: null, orbs: [], nodes: [], raf: 0 };
  let bpDrag = null;        // { x, y, yaw, pitch } während einer Ziehgeste, sonst null
  let bpDragMoved = false;  // wurde wirklich gedreht? (unterscheidet Zieh- von Tipp-Geste)
  let bpDragEndAt = 0;      // Zeitpunkt der letzten echten Drehung – schluckt nur den
                            // unmittelbar folgenden Maus-Klick, nicht spätere Tastatur-Auswahl
  let bpAnimTimer = null;

  const bodyPartById = (id) => ctx.data.BODY_PARTS.find((p) => p.id === id) || null;

  // ----- View-Modell -----
  function cuerpoVM() {
    const gamestats = ctx.gameStats();
    const selId = ctx.state.bodyPartId;
    const parts = ctx.data.BODY_PARTS.map((p) => ({
      id: p.id, de: ctx.nat(p), x: p.x, y: p.y,
      selected: p.id === selId,
      seen: !!(gamestats.bodyPartsSeen && gamestats.bodyPartsSeen[p.id]),
    }));
    const sel = bodyPartById(selId);
    return {
      parts,
      selected: sel ? { id: sel.id, es: sel.es, de: ctx.nat(sel), tip: sel.tip, note: sel.note } : null,
      exploredCount: gamestats.bodyPartsSeen ? Object.keys(gamestats.bodyPartsSeen).length : 0,
      total: ctx.data.BODY_PARTS.length,
      speakable: !!(ctx.speech && ctx.speech.isSupported()),
    };
  }

  // ----- Render -----
  function renderCuerpo(vm) {
    const nodes = vm.parts
      .map((p) => {
        const L = BP_LAYOUT3D[p.id] || { x: 0, y: 0, z: 0, az: 0, d: 22 };
        const cls = `bp-node${p.selected ? " is-active" : ""}${p.seen ? " is-seen" : ""}`;
        return `
          <button class="${cls}" type="button" data-action="cuerpo-select" data-id="${esc(p.id)}"
                  data-x="${L.x}" data-y="${L.y}" data-z="${L.z}" data-az="${L.az}"
                  style="width:${L.d}px;height:${L.d}px" aria-label="${esc(p.de)}" title="${esc(p.de)}"
                  aria-pressed="${p.selected ? "true" : "false"}">
            <span class="bp-node__hit" aria-hidden="true"></span>
            <span class="bp-node__ring" aria-hidden="true"></span>
          </button>`;
      })
      .join("");

    const sel = vm.selected;
    const speak = sel && vm.speakable
      ? cornerBtn({ base: "cardbtn--speak bp-speak", on: false, icon: "lc:volume-2", label: t("discover.cuerpoSpeak"), action: "cuerpo-speak" })
      : "";
    const panel = sel
      ? `
        <div class="bp-panel bp-panel--filled" role="status" aria-live="polite">
          <div class="bp-panel__top">
            <span class="bp-panel__de">${esc(sel.de)}</span>
            ${speak}
          </div>
          <p class="bp-panel__es" lang="es">${esc(sel.es)}</p>
          ${sel.tip ? `<p class="bp-panel__tip"><span aria-hidden="true">🗣️</span> ${esc(sel.tip)}</p>` : ""}
          ${sel.note ? `<p class="bp-panel__note">${esc(sel.note)}</p>` : ""}
        </div>`
      : `
        <div class="bp-panel" role="status" aria-live="polite">
          <p class="bp-panel__hint">${esc(t("discover.cuerpoHint"))}</p>
        </div>`;

    const pct = vm.total > 0 ? Math.round((vm.exploredCount / vm.total) * 100) : 0;
    const done = vm.total > 0 && vm.exploredCount >= vm.total;
    const progLabel = done ? t("discover.cuerpoComplete", { total: vm.total }) : t("discover.cuerpoExplored", { n: vm.exploredCount, total: vm.total });
    const progress = `
      <div class="bp-progress">
        <div class="bp-progress__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(progLabel)}"><div class="bp-progress__fill" style="width:${pct}%"></div></div>
        <span class="bp-progress__label">${progLabel}</span>
      </div>`;

    return `
      <section class="screen bp-screen">
        ${hmTopbar("🧍 El Cuerpo", "home")}
        <p class="hm-intro">${esc(t("discover.cuerpoIntro"))}</p>
        ${moduleShareBtn("cuerpo")}
        ${progress}
        <div class="bp-stage">
          <div class="bp-3d-stage" data-bp-stage>
            <div class="bp-3d" data-bp-fig>
              ${BP_FIGURE_3D}
              ${nodes}
            </div>
            <div class="bp-rotor">
              <button class="bp-rotor__btn" type="button" data-action="cuerpo-rotate" data-dir="-1" aria-label="${esc(t("discover.cuerpoRotateLeft"))}">↺</button>
              <span class="bp-rotor__hint" aria-hidden="true">${esc(t("discover.cuerpoDragHint"))}</span>
              <button class="bp-rotor__btn" type="button" data-action="cuerpo-rotate" data-dir="1" aria-label="${esc(t("discover.cuerpoRotateRight"))}">↻</button>
            </div>
          </div>
          ${panel}
        </div>
      </section>`;
  }

  // ----- Auswahl / Vorlesen / Ruta-Pass -----
  // Ein Körperteil antippen: Wort anzeigen, vorlesen und (einmalig) für den
  // Ruta-Pass einbuchen. Direkt nach einer echten Drehung wird der mitgelieferte
  // Klick geschluckt (bpDragEndAt), damit Ziehen keinen Hotspot auswählt.
  function select(id) {
    if (Date.now() - bpDragEndAt < 350) return;
    const part = bodyPartById(id);
    if (!part) return;
    ctx.state.bodyPartId = id;
    ctx.buzz(8);
    recordBodyPartView(id, Date.now());
    ctx.render();
    if (ctx.speech && ctx.speech.isSupported()) ctx.speech.speak(part.es, ctx.settings().speechRate);
  }

  // Distinkt erkundetes Körperteil vermerken und erfüllte 🧍-Badges freischalten.
  function recordBodyPartView(id, now) {
    const gamestats = ctx.gameStats();
    if (!ctx.badges || !id || (gamestats.bodyPartsSeen && gamestats.bodyPartsSeen[id])) return;
    const seen = Object.assign({}, gamestats.bodyPartsSeen, { [id]: true });
    ctx.setGameStats(Object.assign({}, gamestats, { bodyPartsSeen: seen }));
    ctx.syncBadges(now, true); // render() malt den Toast anschließend über den Screen
  }

  // 🔊-Knopf im Körperteil-Panel: das gewählte Wort (er-)neut vorlesen.
  function speak() {
    const part = bodyPartById(ctx.state.bodyPartId);
    if (part && ctx.speech && ctx.speech.isSupported()) ctx.speech.speak(part.es, ctx.settings().speechRate);
  }

  // ----- 3D-Bühne -----
  // Nach jedem Render der Cuerpo-Ansicht: Elemente neu einsammeln, Koordinaten
  // aus den data-Attributen cachen und die aktuelle Drehung anwenden.
  function init3D() {
    bp3d.fig = root.querySelector("[data-bp-fig]");
    if (!bp3d.fig) { bp3d.orbs = []; bp3d.nodes = []; return; }
    const num = (el, k) => Number(el.dataset[k]);
    bp3d.orbs = Array.prototype.map.call(bp3d.fig.querySelectorAll(".bp-orb"), (el) => {
      el._x = num(el, "x"); el._y = num(el, "y"); el._z = num(el, "z"); return el;
    });
    bp3d.nodes = Array.prototype.map.call(bp3d.fig.querySelectorAll(".bp-node"), (el) => {
      el._x = num(el, "x"); el._y = num(el, "y"); el._z = num(el, "z"); el._az = num(el, "az"); return el;
    });
    bpApplyRot();
  }

  // Drehung auf Figur (Eltern) und alle Kinder schreiben. Kinder bekommen den
  // inversen Dreh-Anteil (Billboard) -> bleiben runde, zur Kamera gerichtete
  // Scheiben. Hotspots auf der abgewandten Seite werden gedämpft/gesperrt.
  function bpApplyRot() {
    // Eine nach dem Verlassen des Screens noch feuernde RAF würde sonst Transforms
    // auf den alten, abgelösten Knoten schreiben (unsichtbar, aber unnötig).
    if (!bp3d.fig || bp3d.fig.isConnected === false) return;
    const yaw = ctx.state.bodyYaw, pitch = ctx.state.bodyPitch;
    bp3d.fig.style.transform = `translateZ(-30px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    const inv = `rotateY(${-yaw}deg) rotateX(${-pitch}deg)`;
    for (let i = 0; i < bp3d.orbs.length; i++) {
      const el = bp3d.orbs[i];
      el.style.transform = `translate3d(${el._x}px,${el._y}px,${el._z}px) ${inv} translate(-50%,-50%)`;
    }
    for (let i = 0; i < bp3d.nodes.length; i++) {
      const n = bp3d.nodes[i];
      n.style.transform = `translate3d(${n._x}px,${n._y}px,${n._z}px) ${inv} translate(-50%,-50%)`;
      const back = Math.cos((n._az + yaw) * Math.PI / 180) < -0.15;
      n.classList.toggle("is-back", back);
    }
  }

  function bpScheduleApply() {
    if (!bp3d.raf) bp3d.raf = requestAnimationFrame(() => { bp3d.raf = 0; bpApplyRot(); });
  }

  // Dreh-Knöpfe ↺/↻ (Tastatur-/Klick-Alternative zum Ziehen). Kurz mit
  // Transition (is-anim), damit der Sprung weich statt hart wirkt – außer bei
  // prefers-reduced-motion, dann sofort ohne Animation.
  function rotate(dir) {
    ctx.state.bodyYaw = (ctx.state.bodyYaw || 0) + dir * 32;
    const stage = root.querySelector("[data-bp-stage]");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stage && !reduce) {
      stage.classList.add("is-anim");
      clearTimeout(bpAnimTimer);
      bpAnimTimer = setTimeout(() => stage.classList.remove("is-anim"), 320);
    }
    bpApplyRot();
  }

  // Zeigegesten: Ziehen über der Bühne dreht die Figur. Unter dem 6px-Schwellwert
  // bleibt es ein Tipp (Hotspot wählen); darüber wird es eine Drehung.
  function onPointerDown(e) {
    if (ctx.state.screen !== "cuerpo") return;
    if (e.button != null && e.button > 0) return; // nur primäre Maustaste / Touch / Stift
    const stage = e.target.closest("[data-bp-stage]");
    if (!stage || e.target.closest(".bp-rotor")) return; // Dreh-Knöpfe nicht als Ziehstart werten
    bpDrag = { x: e.clientX, y: e.clientY, yaw: ctx.state.bodyYaw || 0, pitch: ctx.state.bodyPitch || 0 };
    bpDragMoved = false;
    stage.classList.add("is-grab");
  }
  function onPointerMove(e) {
    if (!bpDrag) return;
    const dx = e.clientX - bpDrag.x, dy = e.clientY - bpDrag.y;
    if (!bpDragMoved && Math.hypot(dx, dy) > 6) bpDragMoved = true;
    if (!bpDragMoved) return;
    ctx.state.bodyYaw = bpDrag.yaw + dx * 0.6;
    ctx.state.bodyPitch = Math.max(-32, Math.min(32, bpDrag.pitch - dy * 0.4));
    bpScheduleApply();
  }
  function onPointerUp() {
    if (!bpDrag) return;
    if (bpDragMoved) bpDragEndAt = Date.now(); // den gleich folgenden Klick auf den Hotspot schlucken
    bpDrag = null;
    const stage = root.querySelector("[data-bp-stage].is-grab");
    if (stage) stage.classList.remove("is-grab");
  }

  window.SC.cuerpo = {
    init(injected) {
      ctx = injected;
      root = ctx.root;
      // Globale Pointer-Listener für das Drehen (greifen nur auf der Cuerpo-Bühne,
      // onPointerDown prüft state.screen). Einmalig beim Boot verdrahtet.
      root.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    vm: cuerpoVM,
    // SCREENS-Eintrag (app.js delegiert).
    screen: () => renderCuerpo(cuerpoVM()),
    // Post-Render-Hook: app.js ruft nach jedem Cuerpo-Render auf.
    init3D,
    // data-action-Handler (app.js-Dispatch delegiert).
    select, rotate, speak,
  };
})();
