/*
 * celebrate.js  (SC.celebrate) – Belohnungs-/Fertig-Inszenierung.
 *
 * Zwei Schichten, sauber getrennt (wie srs/matcher):
 *   1) ENTSCHEIDUNG  – `decide(result)` ist eine REINE FUNKTION: nimmt ein
 *      Runden-Ergebnis, gibt einen Szenen-Deskriptor zurück. Kennt kein DOM,
 *      keinen Speicher, keine Zeit (außer der mitgelieferten). Voll testbar.
 *   2) DARSTELLUNG   – `play(scene, result, mountEl, opts)` baut das DOM, fährt
 *      die Animationen (Web Animations API), Konfetti, Count-ups, Sound/Haptik.
 *      Degradiert sauber: prefers-reduced-motion -> nur Fades; kein WebAudio ->
 *      still; kein vibrate -> stumm. A11y: aria-live-Ansage + Fokus auf Haupt-CTA.
 *
 * result-Vertrag (alles optional, robuste Defaults):
 *   { scope, mode, total, right, wrong, accuracy,
 *     xpBefore, xpGained, xpAfter, levelBefore, levelAfter,
 *     streakBefore, streak, streakIsNew,
 *     newBadges:[{id,icon,name}], destinationComplete:{name,country}|null,
 *     isFirstEver, origin:'pretrip'|'task'|null, seed }
 *
 * Szenen-Deskriptor (Rückgabe von decide):
 *   { id, staging, tone, headline, sub, confetti, sparks, sound, haptic,
 *     badge, destination, level, streakLabel, milestone, stats }
 */
(function () {
  "use strict";

  // ---- Reise-Ränge (XP-Leiter). Rein additiver Layer; fehlt XP, bleibt alles still. ----
  var VIAJERO_LEVELS = [
    { n: 0, key: "turista",     name: "Turista",            min: 0 },
    { n: 1, key: "mochilero",   name: "Mochilero",          min: 100 },
    { n: 2, key: "explorador",  name: "Explorador",         min: 300 },
    { n: 3, key: "trotamundos", name: "Trotamundos",        min: 700 },
    { n: 4, key: "aventurero",  name: "Aventurero",         min: 1400 },
    { n: 5, key: "baqueano",    name: "Baqueano",           min: 2600 },
    { n: 6, key: "leyenda",     name: "Leyenda del Camino", min: 4500 },
  ];

  var STREAK_MILESTONES = [3, 7, 14, 30, 50, 75, 100, 150, 200, 300, 365];

  // Akzent-Tonalitäten (mappen auf eure CSS-Variablen).
  var TONE = {
    gold:  { accent: "var(--warn)",  glow: "rgba(185,124,36,.30)" },
    brand: { accent: "var(--brand)", glow: "rgba(194,80,46,.28)" },
    ok:    { accent: "var(--ok)",    glow: "rgba(63,115,85,.26)" },
    warn:  { accent: "var(--warn)",  glow: "rgba(185,124,36,.30)" },
    easy:  { accent: "var(--easy)",  glow: "rgba(47,107,112,.26)" },
  };

  // CI-Farben für Konfetti/Funken.
  var CI = ["#C2502E", "#E9A23B", "#2F6B70", "#3F7355", "#B97C24"];

  // --- Kleine reine Helfer ---
  function num(x, d) { return typeof x === "number" && isFinite(x) ? x : d; }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  // Deterministische Auswahl (seedbar) – macht decide() und damit die Texte testbar.
  function pick(pool, seed) {
    if (!pool || !pool.length) return "";
    var i = Math.abs(Math.floor(num(seed, 0))) % pool.length;
    return pool[i];
  }

  // Rang zu einem XP-Stand (höchster erreichter).
  function levelForXp(xp) {
    var x = num(xp, 0), lvl = VIAJERO_LEVELS[0];
    for (var i = 0; i < VIAJERO_LEVELS.length; i++) {
      if (x >= VIAJERO_LEVELS[i].min) lvl = VIAJERO_LEVELS[i];
    }
    return lvl;
  }

  // Genauigkeits-Band -> steuert Ton & Konfettimenge der Standard-/Perfekt-Szene.
  function accuracyBand(acc) {
    if (acc >= 100) return "perfect";
    if (acc >= 80) return "great";
    if (acc >= 55) return "good";
    return "practice";
  }

  // --- Text-Pools (deutsche UI mit spanischem Flair, passend zur App) ---
  var COPY = {
    perfect:   ["¡Perfecto!", "¡Impecable!", "¡Sin fallos!"],
    great:     ["¡Muy bien!", "¡Genial!", "Stark gemacht"],
    good:      ["¡Completado!", "¡Bien hecho!", "Runde geschafft"],
    practice:  ["¡Sigue así!", "Dranbleiben zahlt sich aus", "Jede Runde zählt"],
    first:     ["¡Bienvenido!", "Deine Reise beginnt"],
    comeback:  ["¡Qué bueno verte!", "Willkommen zurück"],
    streak:    ["¡Racha en marcha!", "Serie gehalten"],
    badge:     ["¡Nuevo sello!", "Stempel gesichert"],
    destino:   ["¡Destino completo!", "Reiseziel gemeistert"],
    levelup:   ["¡Subiste de nivel!", "Neuer Rang"],
    trophy:    ["¡Pleno!", "¡Ronda perfecta!", "¡Lo clavaste!"],
  };

  // ---------- 1) ENTSCHEIDUNG ----------
  // Prioritätenliste, von „seltenstes/größtes Ereignis“ nach „Alltag“.
  function decide(result) {
    var r = result || {};
    var right = Math.max(0, num(r.right, 0));
    var wrong = Math.max(0, num(r.wrong, 0));
    var answered = right + wrong;
    var accuracy = num(r.accuracy, answered ? Math.round((right / answered) * 100) : 0);
    var total = Math.max(0, num(r.total, answered));
    var seed = num(r.seed, right * 7 + wrong * 3 + total);
    var newBadges = Array.isArray(r.newBadges) ? r.newBadges : [];
    var streak = Math.max(0, num(r.streak, 0));
    var streakBefore = Math.max(0, num(r.streakBefore, 0));
    var streakIsNew = !!r.streakIsNew;
    var isMilestone = streakIsNew && STREAK_MILESTONES.indexOf(streak) !== -1;
    var levelUp = num(r.levelAfter, 0) > num(r.levelBefore, 0);
    var band = accuracyBand(accuracy);

    var streakLabel = streak > 0 ? ("Tag " + streak) : null;

    var stats = {
      right: right, wrong: wrong, total: total, accuracy: accuracy,
      xpGained: Math.max(0, num(r.xpGained, 0)),
      streak: streak, streakLabel: streakLabel, streakIsNew: streakIsNew,
    };

    function scene(o) {
      o.stats = stats;
      o.confetti = num(o.confetti, 0);
      o.sparks = num(o.sparks, 0);
      o.sound = o.sound || "none";
      o.haptic = o.haptic || null;
      return o;
    }

    // (1) Level-Up – das größte Ereignis.
    if (levelUp) {
      var lvl = levelForXp(r.xpAfter);
      return scene({
        id: "levelup", staging: "levelup", tone: "gold",
        headline: pick(COPY.levelup, seed),
        sub: "Nivel " + lvl.n + " · " + lvl.name + " erreicht.",
        level: { from: num(r.levelBefore, lvl.n - 1), to: lvl.n, name: lvl.name },
        confetti: 64, sparks: 0, sound: "fanfare", haptic: [18, 40, 18, 40, 30],
      });
    }

    // (2) Ganzes Reiseziel-Pack abgeschlossen.
    if (r.destinationComplete && r.destinationComplete.name) {
      var d = r.destinationComplete;
      return scene({
        id: "destination", staging: "stamp", tone: "gold",
        headline: pick(COPY.destino, seed),
        sub: d.name + (d.country ? " · " + d.country : "") + " ist komplett gelernt.",
        destination: d,
        confetti: 50, sparks: 14, sound: "fanfare", haptic: [15, 30, 15, 30, 25],
      });
    }

    // (3) Neuer Ruta-Pass-Stempel.
    if (newBadges.length) {
      var b = newBadges[0];
      return scene({
        id: "badge", staging: "badge", tone: "brand",
        headline: pick(COPY.badge, seed),
        sub: b.name + (newBadges.length > 1 ? " (+" + (newBadges.length - 1) + " weitere)" : ""),
        badge: b,
        confetti: 30, sparks: 0, sound: "chime", haptic: [12, 24, 30],
      });
    }

    // (4) Streak-Meilenstein.
    if (isMilestone) {
      return scene({
        id: "streakMilestone", staging: "flame", tone: "warn",
        headline: pick(COPY.streak, seed),
        sub: "Racha de " + streak + " días · ¡no la pierdas mañana!",
        milestone: streak, streakLabel: streakLabel,
        confetti: 24, sparks: 18, sound: "fanfare", haptic: [14, 28, 14, 28],
      });
    }

    // (5a) Perfekte MINI-SPIEL-Runde -> eigener Pokal-Hero. Nur für Spiele
    // (r.isGame): ein fehlerfreier Drill-Sieg verdient mehr Tamtam als der
    // Alltags-Ring. Der Karteikarten-Pfad behält bewusst die ruhigere Ring-
    // Perfekt-Szene (§ Showcase-Treue) – darum steht dieser Zweig DAVOR.
    if (r.isGame && band === "perfect" && total >= 4) {
      return scene({
        id: "gameperfect", staging: "trophy", tone: "gold",
        headline: pick(COPY.trophy, seed),
        sub: r.scope ? (r.scope + " · sin fallos.") : "Sin fallos.",
        confetti: 60, sparks: 16, sound: "fanfare", haptic: [16, 30, 16, 30, 24],
      });
    }

    // (5) Perfekte Runde (genug Karten, damit es zählt).
    if (band === "perfect" && total >= 4) {
      return scene({
        id: "perfect", staging: "ring", tone: "gold",
        headline: pick(COPY.perfect, seed),
        sub: r.scope ? (r.scope + " · alles richtig.") : "Alles richtig.",
        confetti: 46, sparks: 8, sound: "chime", haptic: [12, 30, 12],
      });
    }

    // (6) Allererste abgeschlossene Runde – Willkommen.
    if (r.isFirstEver) {
      return scene({
        id: "first", staging: "ring", tone: "brand",
        headline: pick(COPY.first, seed),
        sub: "Erste Runde geschafft. So fühlt sich Fortschritt an.",
        confetti: 30, sparks: 0, sound: "pop", haptic: [10, 20, 10],
      });
    }

    // (7) Comeback nach Pause (Streak war gerissen, jetzt wieder da).
    if (streakIsNew && streakBefore === 0 && streak === 1 && !r.isFirstEver) {
      return scene({
        id: "comeback", staging: "ring", tone: "ok",
        headline: pick(COPY.comeback, seed),
        sub: "Neuer Anlauf, neue Racha. Genau richtig.",
        confetti: 22, sparks: 0, sound: "pop", haptic: [10, 20],
      });
    }

    // (8) Standard – Ton & Konfetti nach Genauigkeit.
    var confByBand = { great: 28, good: 18, practice: 10 };
    var toneByBand = { great: "ok", good: "brand", practice: "easy" };
    return scene({
      id: "standard", staging: "ring", tone: toneByBand[band] || "brand",
      headline: pick(COPY[band] || COPY.good, seed),
      sub: streakLabel
        ? (r.scope ? r.scope + " · " + streakLabel : streakLabel)
        : (r.scope || "Runde abgeschlossen."),
      confetti: confByBand[band] || 14, sparks: 0,
      sound: band === "great" ? "chime" : "pop", haptic: [10, 18],
    });
  }

  // ---------- 2) DARSTELLUNG ----------
  function prefersReducedMotion() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function elx(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Kleiner zustandsloser WebAudio-Synth (kein Asset, opt-in über opts.sound).
  var _ac = null;
  function audioCtx() {
    if (_ac) return _ac;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      _ac = new C();
    } catch (e) { _ac = null; }
    return _ac;
  }
  function tone(ac, freq, t0, dur, gain, type) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function playSound(name) {
    var ac = audioCtx(); if (!ac || name === "none") return;
    try { if (ac.state === "suspended") ac.resume(); } catch (e) {}
    var t0 = ac.currentTime + 0.01;
    if (name === "fanfare") {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(ac, f, t0 + i * 0.09, 0.5, 0.16); });
    } else if (name === "chime") {
      [659.25, 987.77].forEach(function (f, i) { tone(ac, f, t0 + i * 0.08, 0.45, 0.15); });
    } else if (name === "pop") {
      tone(ac, 587.33, t0, 0.22, 0.14, "sine");
    } else if (name === "spark") {
      tone(ac, 1320, t0, 0.12, 0.08, "square");
    }
  }
  function haptic(pattern) {
    try { if (navigator.vibrate && pattern) navigator.vibrate(pattern); } catch (e) {}
  }

  function countTo(node, to, dur, suffix, rm) {
    suffix = suffix || "";
    if (rm) { node.textContent = to + suffix; return; }
    var start = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - start) / dur);
      node.textContent = Math.round(easeOut(p) * to) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function pop(node, from, to, dur, delay, rm, easing) {
    if (rm || !node.animate) { node.style.opacity = 1; node.style.transform = "none"; return; }
    node.animate([{ transform: from, opacity: 0 }, { transform: to, opacity: 1 }],
      { duration: dur || 420, delay: delay || 0, easing: easing || "cubic-bezier(.34,1.56,.64,1)", fill: "both" });
  }
  function burst(host, n, rm) {
    if (rm || !n) return;
    for (var i = 0; i < n; i++) {
      var c = elx("div", "cb-confetti");
      c.style.background = CI[i % CI.length];
      host.appendChild(c);
      var ang = (Math.random() * Math.PI) - Math.PI / 2;
      var dist = 120 + Math.random() * 170;
      var dx = Math.cos(ang) * dist * (Math.random() < 0.5 ? -1 : 1);
      var dy = -Math.abs(Math.sin(ang) * dist) - 40;
      var rot = Math.random() * 720 - 360;
      c.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + dx * 0.6 + "px," + dy + "px) rotate(" + rot * 0.5 + "deg)", opacity: 1, offset: 0.6 },
        { transform: "translate(" + dx + "px," + (dy + 280) + "px) rotate(" + rot + "deg)", opacity: 0 },
      ], { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" });
    }
  }
  function sparkle(host, n, rm) {
    if (rm || !n) return;
    for (var i = 0; i < n; i++) {
      var s = elx("div", "cb-spark");
      s.style.background = i % 2 ? "#E9A23B" : "#C2502E";
      host.appendChild(s);
      var dx = Math.random() * 130 - 65, dy = -(80 + Math.random() * 130);
      s.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(0)", opacity: 0 }],
        { duration: 700 + Math.random() * 500, delay: Math.random() * 250, easing: "ease-out", fill: "forwards" });
    }
  }

  function statStrip(stats) {
    var parts = [];
    parts.push('<span class="cb-pill cb-pill--ok">\u2713 <b data-cb="ok">0</b>/' + stats.total + '</span>');
    if (stats.wrong > 0) parts.push('<span class="cb-pill cb-pill--no">\u2717 <b data-cb="no">0</b></span>');
    if (stats.xpGained > 0) parts.push('<span class="cb-pill cb-pill--xp">+<b data-cb="xp">0</b> XP</span>');
    if (stats.streakLabel) parts.push('<span class="cb-pill cb-pill--st">\uD83D\uDD25 ' + stats.streakLabel + '</span>');
    return '<div class="cb-stats">' + parts.join("") + '</div>';
  }
  function animateStats(root, stats, rm) {
    var ok = root.querySelector('[data-cb="ok"]'); if (ok) countTo(ok, stats.right, 700, "", rm);
    var no = root.querySelector('[data-cb="no"]'); if (no) countTo(no, stats.wrong, 700, "", rm);
    var xp = root.querySelector('[data-cb="xp"]'); if (xp) countTo(xp, stats.xpGained, 900, "", rm);
  }

  // Der Stempel bringt seinen rauen Rand-Filter selbst mit (einmalig, idempotent) –
  // so braucht es keinen <filter> in index.html und kein url(#…) in styles.css
  // (das würde sonst den SW-Asset-Drift-Test auslösen). Fehlt document, no-op.
  function ensureRoughFilter() {
    try {
      if (typeof document === "undefined" || document.getElementById("cbRoughen")) return;
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
      svg.setAttribute("aria-hidden", "true");
      svg.style.position = "absolute";
      svg.innerHTML = '<filter id="cbRoughen">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.04 0.05" numOctaves="2" seed="7" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/></filter>';
      document.body.appendChild(svg);
    } catch (e) { /* egal – Stempel rendert dann ohne rauen Rand */ }
  }

  // SVG-Stempel (Reisepass) – Bogen-Text wie im Entwurf. Der raue Rand kommt über
  // ein <g filter="url(#cbRoughen)"> (SVG-Attribut, nicht CSS) – siehe ensureRoughFilter.
  function stampSVG(top, bottom, mark) {
    var cx = 105, cy = 105, R = 96;
    return '<svg class="cb-stamp__ink" width="210" height="210" viewBox="0 0 210 210">' +
      '<defs><path id="cbArcTop" d="M ' + (cx - 72) + ' ' + cy + ' A 72 72 0 0 1 ' + (cx + 72) + ' ' + cy + '"/>' +
      '<path id="cbArcBot" d="M ' + (cx - 72) + ' ' + cy + ' A 72 72 0 0 0 ' + (cx + 72) + ' ' + cy + '"/></defs>' +
      '<g filter="url(#cbRoughen)">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="var(--brand)" stroke-width="3.5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 9) + '" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-dasharray="2 5"/>' +
      '<text fill="var(--brand)" font-family="Bricolage Grotesque,Arial" font-weight="800" font-size="15" letter-spacing="3.5">' +
      '<textPath href="#cbArcTop" startOffset="50%" text-anchor="middle">' + top + '</textPath></text>' +
      '<text fill="var(--brand)" font-family="Bricolage Grotesque,Arial" font-weight="800" font-size="11" letter-spacing="3">' +
      '<textPath href="#cbArcBot" startOffset="50%" text-anchor="middle">' + bottom + '</textPath></text>' +
      '</g>' +
      '</svg><div class="cb-stamp__center"><div class="cb-stamp__mark">' + mark + '</div>' +
      '<div class="cb-stamp__done">Completado</div></div>';
  }

  // Baut den Hero je nach staging. Gibt {node, run(fx,rm)} zurück.
  function buildHero(scene) {
    var acc = (TONE[scene.tone] || TONE.brand).accent;
    if (scene.staging === "ring") {
      var ring = elx("div", "cb-ring");
      var off = 534 - 534 * (scene.stats.accuracy / 100);
      ring.innerHTML = '<svg width="188" height="188" viewBox="0 0 188 188">' +
        '<circle class="cb-ring__track" cx="94" cy="94" r="85"/>' +
        '<circle class="cb-ring__bar" cx="94" cy="94" r="85" style="stroke:' + acc + '"/></svg>' +
        '<div class="cb-ring__pct"><div class="cb-ring__num">0%</div><div class="cb-ring__lbl">Genauigkeit</div></div>';
      return { node: ring, run: function (fx, rm) {
        var bar = ring.querySelector(".cb-ring__bar");
        if (rm || !bar.animate) bar.style.strokeDashoffset = off;
        else bar.animate([{ strokeDashoffset: 534 }, { strokeDashoffset: off }],
          { duration: 900, delay: 150, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" });
        pop(ring, "scale(.7)", "scale(1)", 520, 80, rm);
        countTo(ring.querySelector(".cb-ring__num"), scene.stats.accuracy, 900, "%", rm);
      } };
    }
    if (scene.staging === "stamp") {
      ensureRoughFilter();
      var d = scene.destination || { name: "Ruta", country: "" };
      var stamp = elx("div", "cb-stamp");
      stamp.innerHTML = stampSVG((d.name || "").toUpperCase(), (d.country || "").toUpperCase(), "\uD83E\uDDED");
      return { node: stamp, run: function (fx, rm) {
        if (rm || !stamp.animate) { stamp.style.opacity = 1; return; }
        stamp.animate([
          { transform: "scale(1.9) rotate(-14deg)", opacity: 0 },
          { transform: "scale(.92) rotate(3deg)", opacity: 1, offset: 0.55 },
          { transform: "scale(1.04) rotate(-2deg)", offset: 0.78 },
          { transform: "scale(1) rotate(0deg)", opacity: 1 },
        ], { duration: 560, easing: "cubic-bezier(.3,1.3,.5,1)", fill: "both" });
      } };
    }
    if (scene.staging === "flame") {
      var fw = elx("div", "cb-flamewrap");
      var start = Math.max(0, (scene.milestone || scene.stats.streak) - 1);
      fw.innerHTML = '<div class="cb-glow" style="background:radial-gradient(closest-side,' +
        (TONE[scene.tone] || TONE.warn).glow + ',transparent)"></div>' +
        '<div class="cb-flame">\uD83D\uDD25</div><div class="cb-flame__num" data-cb="streak">' + start + '</div>';
      return { node: fw, run: function (fx, rm) {
        var flame = fw.querySelector(".cb-flame"), glow = fw.querySelector(".cb-glow");
        pop(flame, "scale(.4)", "scale(1)", 520, 60, rm);
        if (!rm && flame.animate) {
          flame.animate([{ transform: "scale(1) translateY(0)" }, { transform: "scale(1.06) translateY(-3px)" }, { transform: "scale(1) translateY(0)" }],
            { duration: 1600, delay: 560, iterations: Infinity, easing: "ease-in-out" });
          glow.animate([{ opacity: .5 }, { opacity: .9 }, { opacity: .5 }],
            { duration: 1600, delay: 560, iterations: Infinity, easing: "ease-in-out" });
        }
        var nn = fw.querySelector('[data-cb="streak"]');
        setTimeout(function () { countTo(nn, scene.milestone || scene.stats.streak, 500, "", rm); }, rm ? 0 : 560);
      } };
    }
    if (scene.staging === "badge") {
      var b = scene.badge || { icon: "\uD83C\uDFC5", name: "Sello" };
      var holder = elx("div", "cb-badgeholder");
      holder.innerHTML = '<div class="cb-shock"></div>' +
        '<div class="cb-badgebig"><div class="cb-badgebig__icon">' + b.icon + '</div><div class="cb-shine"></div></div>';
      return { node: holder, run: function (fx, rm) {
        var badge = holder.querySelector(".cb-badgebig"), shock = holder.querySelector(".cb-shock");
        if (rm || !badge.animate) { badge.style.opacity = 1; return; }
        badge.animate([
          { transform: "translateY(-160px) scale(1.4)", opacity: 0, offset: 0 },
          { transform: "translateY(0) scale(1.4)", opacity: 1, offset: 0.42 },
          { transform: "translateY(0) scale(.9)", offset: 0.6 },
          { transform: "translateY(0) scale(1.06)", offset: 0.78 },
          { transform: "translateY(0) scale(1)", offset: 1 },
        ], { duration: 680, easing: "cubic-bezier(.5,0,.3,1)", fill: "both" });
        shock.animate([{ transform: "scale(.6)", opacity: 0, offset: 0 }, { transform: "scale(.7)", opacity: .7, offset: 0.42 },
          { transform: "scale(2.1)", opacity: 0, offset: 1 }], { duration: 680, easing: "ease-out", fill: "forwards" });
        holder.querySelector(".cb-shine").classList.add("go");
      } };
    }
    if (scene.staging === "trophy") {
      var tw = elx("div", "cb-trophy");
      tw.innerHTML = '<div class="cb-rays"></div>' +
        '<div class="cb-glow" style="background:radial-gradient(closest-side,' +
        (TONE[scene.tone] || TONE.gold).glow + ',transparent)"></div>' +
        '<div class="cb-trophy__cup">🏆<span class="cb-shine"></span></div>';
      return { node: tw, run: function (fx, rm) {
        var cup = tw.querySelector(".cb-trophy__cup"), rays = tw.querySelector(".cb-rays"), glow = tw.querySelector(".cb-glow");
        if (rm || !cup.animate) { cup.style.opacity = 1; return; }
        cup.animate([
          { transform: "scale(.3) translateY(40px) rotate(-12deg)", opacity: 0, offset: 0 },
          { transform: "scale(1.18) translateY(0) rotate(4deg)", opacity: 1, offset: 0.5 },
          { transform: "scale(.94) rotate(-2deg)", offset: 0.72 },
          { transform: "scale(1) rotate(0deg)", opacity: 1, offset: 1 },
        ], { duration: 660, easing: "cubic-bezier(.4,1.4,.5,1)", fill: "both" });
        if (rays.animate) rays.animate([{ transform: "rotate(0deg)", opacity: 0 }, { transform: "rotate(90deg)", opacity: .9, offset: .4 }, { transform: "rotate(180deg)", opacity: .9 }],
          { duration: 1400, delay: 120, iterations: Infinity, easing: "linear" });
        if (glow.animate) glow.animate([{ opacity: .45 }, { opacity: .85 }, { opacity: .45 }],
          { duration: 1500, delay: 300, iterations: Infinity, easing: "ease-in-out" });
        var sh = tw.querySelector(".cb-shine"); if (sh) sh.classList.add("go");
      } };
    }
    // levelup
    var lv = scene.level || { to: 1, name: "Mochilero" };
    var stage = elx("div", "cb-levelup");
    stage.innerHTML = '<div class="cb-rays"></div>' +
      '<div class="cb-emblem"><div class="cb-emblem__n">' + lv.to + '</div></div>' +
      '<div class="cb-emblem__name">' + lv.name + '</div>';
    return { node: stage, run: function (fx, rm) {
      var em = stage.querySelector(".cb-emblem"), rays = stage.querySelector(".cb-rays");
      pop(em, "scale(.3) rotate(-20deg)", "scale(1) rotate(0deg)", 640, 60, rm);
      if (!rm && rays.animate) rays.animate([{ transform: "rotate(0deg)", opacity: 0 }, { transform: "rotate(90deg)", opacity: .9, offset: .4 }, { transform: "rotate(180deg)", opacity: .9 }],
        { duration: 1400, delay: 120, iterations: Infinity, easing: "linear" });
      pop(stage.querySelector(".cb-emblem__name"), "translateY(10px)", "translateY(0)", 380, 460, rm, "ease-out");
    } };
  }

  /*
   * play(scene, result, mountEl, opts)
   *   scene   – Ergebnis von decide()
   *   result  – Roh-Ergebnis (für Buttons/Scope)
   *   mountEl – Container (z. B. das <section>, das renderDone liefert)
   *   opts    – { reducedMotion?, sound?, haptics?, onPrimary?, onSecondary?,
   *              primaryLabel?, secondaryLabel? }
   */
  function play(scene, result, mountEl, opts) {
    opts = opts || {};
    if (!mountEl) return;
    var rm = opts.reducedMotion != null ? !!opts.reducedMotion : prefersReducedMotion();

    mountEl.innerHTML = "";
    var fx = elx("div", "cb-fx"); mountEl.appendChild(fx);

    var live = elx("div", "cb-sr");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("role", "status");
    live.textContent = scene.headline + ". " + scene.stats.right + " von " + scene.stats.total +
      " richtig, " + scene.stats.accuracy + " Prozent.";
    mountEl.appendChild(live);

    var wrap = elx("div", "cb-wrap");
    var hero = buildHero(scene);
    var h = elx("h2", "cb-title"); h.textContent = scene.headline;
    var sub = elx("p", "cb-sub"); sub.textContent = scene.sub;
    var stripHtml = statStrip(scene.stats);

    wrap.appendChild(hero.node);
    wrap.appendChild(h);
    wrap.appendChild(sub);
    var strip = elx("div"); strip.innerHTML = stripHtml; wrap.appendChild(strip.firstChild);

    var primary = elx("button", "cb-cta");
    primary.textContent = opts.primaryLabel || "Übersicht";
    primary.addEventListener("click", function () { if (opts.onPrimary) opts.onPrimary(); });
    wrap.appendChild(primary);

    if (opts.secondaryLabel) {
      var sec = elx("button", "cb-ghost");
      sec.textContent = opts.secondaryLabel;
      sec.addEventListener("click", function () { if (opts.onSecondary) opts.onSecondary(); });
      wrap.appendChild(sec);
    }
    // Optionaler dritter (Tertiär-)Button – manche Aufrufer (z. B. die Mini-Spiel-
    // Fertig-Screens) brauchen drei Aktionen (Nochmal / Andere / Übersicht).
    if (opts.tertiaryLabel) {
      var ter = elx("button", "cb-ghost");
      ter.textContent = opts.tertiaryLabel;
      ter.addEventListener("click", function () { if (opts.onTertiary) opts.onTertiary(); });
      wrap.appendChild(ter);
    }
    mountEl.appendChild(wrap);

    // Animationsablauf.
    pop(h, "translateY(10px)", "translateY(0)", 380, rm ? 0 : 260, rm, "ease-out");
    pop(sub, "translateY(10px)", "translateY(0)", 380, rm ? 0 : 340, rm, "ease-out");
    hero.run(fx, rm);
    animateStats(mountEl, scene.stats, rm);

    var delay = rm ? 0 : (scene.staging === "ring" ? 620 : 320);
    setTimeout(function () { burst(fx, scene.confetti, rm); sparkle(fx, scene.sparks, rm); }, delay);

    if (opts.sound) playSound(scene.sound);
    if (opts.haptics) haptic(scene.haptic);

    try { primary.focus({ preventScroll: true }); } catch (e) { try { primary.focus(); } catch (e2) {} }
  }

  // Bequemer Einstieg: entscheidet + spielt in einem Aufruf.
  function celebrate(result, mountEl, opts) {
    var scene = decide(result);
    play(scene, result, mountEl, opts);
    return scene;
  }

  window.SC = window.SC || {};
  window.SC.celebrate = {
    decide: decide,
    play: play,
    celebrate: celebrate,
    levelForXp: levelForXp,
    accuracyBand: accuracyBand,
    VIAJERO_LEVELS: VIAJERO_LEVELS,
    STREAK_MILESTONES: STREAK_MILESTONES,
    _pick: pick,
  };
})();
