/*
 * share.js  (SC.share) – Sharepic-Generator. Zeichnet ein teilbares Bild (PNG)
 * auf ein <canvas> und teilt es per Web Share API bzw. lädt es als Fallback
 * herunter. KENNT KEINEN ZUSTAND – bekommt fertige Anzeige-Daten.
 *
 * Drei Motive (Umschalter):
 *   buildCard(payload, aspect)  – eine einzelne Vokabel (DE → ES + Aussprache)
 *   buildStats(payload, aspect) – der eigene Lernfortschritt (Kennzahlen)
 *   buildBadge(payload, aspect) – ein freigeschalteter Ruta-Pass-Stempel (Badge)
 *
 * Zwei Formate (aspect):
 *   "square" – 1080×1080 (Insta-Feed/WhatsApp)
 *   "story"  – 1080×1920 (Insta-/WhatsApp-Status, 9:16)
 *
 * Öffentliche Funktion:
 *   shareImage(kind, payload, aspect) – baut das Bild und teilt/lädt es. async.
 */
(function () {
  "use strict";

  const W = 1080;             // Breite (beide Formate sind 1080 breit)
  const PAD = 88;             // Außenrand
  const BRAND = "HolaRuta";
  const APP_URL = "https://moarci.github.io/holaRuta/"; // klickbarer Link im Begleittext
  const APP_URL_LABEL = "moarci.github.io/holaRuta";    // kurze, lesbare Anzeige im Bild
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
  const INK = "#0f172a";      // dunkler Text
  const MUTE = "#64748b";     // gedämpfter Text

  function heightFor(aspect) {
    return aspect === "story" ? 1920 : 1080;
  }

  // ---------- kleine Zeichen-Helfer ----------
  function font(weight, px) {
    return `${weight} ${px}px ${FONT}`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // Bricht Text auf maximale Breite um -> Array von Zeilen.
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  // Mehrzeiligen, zentrierten Text zeichnen. Verkleinert die Schrift, bis er
  // sowohl in die Breite (maxW) ALS AUCH in die Höhe (maxH) passt – so kann der
  // Text nie über sein Budget hinauslaufen und nachfolgende Elemente überlappen.
  // Gibt die untere Y-Kante zurück (für Folgeelemente).
  function fitText(ctx, text, cx, top, maxW, opts) {
    const o = opts || {};
    let px = o.px || 64;
    const min = o.min || 28;
    const weight = o.weight || "700";
    const lh = o.lineHeight || 1.18;
    const maxLines = o.maxLines || 4;
    const maxH = o.maxH || Infinity;
    let lines = wrap(ctx, text, maxW);
    while (px > min) {
      ctx.font = font(weight, px);
      lines = wrap(ctx, text, maxW);
      const blockH = px + (lines.length - 1) * px * lh; // Höhe des Textblocks
      if (lines.length <= maxLines && blockH <= maxH) break;
      px -= 4;
    }
    if (px < min) px = min;
    ctx.font = font(weight, px);
    lines = wrap(ctx, text, maxW);
    ctx.fillStyle = o.color || INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const step = px * lh;
    let y = top + px; // erste Grundlinie
    lines.forEach((ln) => {
      ctx.fillText(ln, cx, y);
      y += step;
    });
    return y - step + px * (lh - 1); // ungefähre Unterkante
  }

  // Eine zentrierte Zeile zeichnen und die Schrift bei Bedarf schrumpfen, bis sie
  // in maxW passt. Für personalisierte Kicker („FORTSCHRITT VON …"), deren Name
  // bis zu 40 Zeichen lang sein darf und sonst über den Bildrand liefe.
  function drawFittedLine(ctx, text, cx, y, maxW, basePx, weight) {
    let px = basePx;
    ctx.font = font(weight, px);
    while (px > 22 && ctx.measureText(text).width > maxW) {
      px -= 2;
      ctx.font = font(weight, px);
    }
    ctx.fillText(text, cx, y);
  }

  function bgGradient(ctx, from, to, h) {
    const g = ctx.createLinearGradient(0, 0, W, h);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, h);
    // dezenter Lichtschein oben links für etwas Tiefe
    const glow = ctx.createRadialGradient(W * 0.28, h * 0.18, 0, W * 0.28, h * 0.18, h * 0.7);
    glow.addColorStop(0, "rgba(255,255,255,0.18)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, h);
  }

  // Marken-Fußzeile (auf farbigem Grund, weiß). Zwei Zeilen: Marke und die
  // App-Adresse in Link-Optik (Pfeil + unterstrichen) – als Hinweis, wohin man
  // geht. Im PNG selbst ist nichts klickbar; der echte anklickbare Link steht im
  // Begleittext (siehe shareText) und erscheint z.B. unter dem geteilten Bild.
  // (Gleicher Platzbedarf wie zuvor zwei Zeilen, daher keine Kollision mit der
  // Stats-Legende bzw. Badge-Pille im Quadrat-Format.)
  function brandFooter(ctx, h) {
    const cx = W / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = font("800", 46);
    ctx.fillText("🇪🇸 " + BRAND, cx, h - 96);

    // App-Adresse als Link gestaltet: 👉 + unterstrichener Text.
    const url = "👉  " + APP_URL_LABEL;
    ctx.font = font("700", 32);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const urlY = h - 48;
    ctx.fillText(url, cx, urlY);
    const uw = ctx.measureText(url).width;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - uw / 2, urlY + 8);
    ctx.lineTo(cx + uw / 2, urlY + 8);
    ctx.stroke();
  }

  function newCanvas(h) {
    const c = document.createElement("canvas");
    c.width = W; c.height = h;
    return c;
  }

  // ---------- Motiv 1: einzelne Vokabel ----------
  // payload: { de, es, tip, catLabel, catIcon, accent:[from,to], levelLabel? }
  function buildCard(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    const accent = payload.accent && payload.accent.length === 2 ? payload.accent : ["#6366f1", "#22d3ee"];
    const cx = W / 2;

    bgGradient(ctx, accent[0], accent[1], h);

    // Mittiges weißes Karten-Panel; Höhe je Format, vertikal zentriert.
    const isStory = aspect === "story";
    const panelH = isStory ? 920 : 640;
    const panelY = Math.round((h - panelH) / 2);
    const px = PAD, pw = W - PAD * 2;
    const innerW = pw - 112;

    // Kopf über dem Panel: Bereich (+ Stufe)
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = font("700", 40);
    const head = `${payload.catIcon || "📚"}  ${(payload.catLabel || "").toUpperCase()}`;
    ctx.fillText(head, cx, panelY - 96);
    if (payload.levelLabel) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = font("600", 28);
      ctx.fillText(payload.levelLabel, cx, panelY - 50);
    }

    // Panel
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, px, panelY, pw, panelH, 56);
    ctx.fill();
    ctx.restore();

    // Inhaltsbereich mit Innenrand. Feste Zonen verhindern Überlappungen:
    //   [ DEUTSCH-Label + Frage ] · Trenner · [ ESPAÑOL-Label + Antwort + Tipp ]
    const contentTop = panelY + 56;
    const contentBottom = panelY + panelH - 56;
    const contentH = contentBottom - contentTop;
    const dividerY = Math.round(contentTop + contentH * 0.42);
    const gap = 24;
    const tipH = payload.tip ? (isStory ? 120 : 96) : 0;

    // Deutsch (Frage) – obere Zone, begrenzt durch den Trenner.
    ctx.fillStyle = MUTE;
    ctx.textAlign = "center";
    ctx.font = font("600", 30);
    ctx.fillText(t("share.sideNative"), cx, contentTop + 30);
    const deTop = contentTop + 50;
    fitText(ctx, payload.de, cx, deTop, innerW, {
      px: 58, min: 32, weight: "600", color: INK, maxLines: 2,
      maxH: dividerY - gap - deTop,
    });

    // Trenner – feste Position in der Panel-Mitte.
    ctx.strokeStyle = "rgba(15,23,42,0.10)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 70, dividerY);
    ctx.lineTo(cx + 70, dividerY);
    ctx.stroke();

    // Spanisch (Antwort) – hervorgehoben; Höhe so begrenzt, dass darunter
    // immer Platz für den Aussprache-Tipp bleibt (kein Überlappen mehr).
    ctx.fillStyle = accent[0];
    ctx.font = font("600", 30);
    ctx.fillText("ESPAÑOL", cx, dividerY + 56);
    const esTop = dividerY + 76;
    const esBottom = fitText(ctx, payload.es, cx, esTop, innerW, {
      px: 88, min: 38, weight: "800", color: accent[0], maxLines: 2,
      maxH: contentBottom - tipH - gap - esTop,
    });

    // Aussprache-Tipp – dicht unter der Antwort, aber innerhalb des Panels.
    if (payload.tip) {
      const tipTop = Math.min(esBottom + gap, contentBottom - tipH);
      fitText(ctx, "🗣️ " + payload.tip, cx, tipTop, innerW, {
        px: 34, min: 24, weight: "500", color: MUTE, maxLines: 2,
        maxH: contentBottom - tipTop,
      });
    }

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv 2: Lernfortschritt ----------
  // payload: { rate, mastered, seenCards, total, hard, learning, neu, firstTry }
  function buildStats(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    bgGradient(ctx, "#6366f1", "#22d3ee", h);
    const cx = W / 2;

    // Layout je Format (vertikal gestreckt für Story).
    const L = aspect === "story"
      ? { kicker: 360, title: 446, ringY: 780, R: 168, ringW: 36, numPx: 116, ringLbl: 36,
          tilesY: 1120, tileH: 200, tileNum: 70, tileLbl: 30, barGap: 70 }
      : { kicker: 150, title: 232, ringY: 430, R: 132, ringW: 30, numPx: 96, ringLbl: 32,
          tilesY: 642, tileH: 168, tileNum: 60, tileLbl: 28, barGap: 56 };

    // Titel
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawFittedLine(ctx, payload.userName ? t("share.myProgressName", { name: payload.userName }) : t("share.myProgress"), cx, L.kicker, W - PAD * 2, 40, "700");
    ctx.font = font("800", 66);
    ctx.fillText("¡Estoy aprendiendo!", cx, L.title);

    // Großer Trefferquote-Ring
    const rate = payload.rate === null || payload.rate === undefined ? 0 : payload.rate;
    ctx.lineWidth = L.ringW;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * rate) / 100);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = font("800", L.numPx);
    ctx.textBaseline = "middle";
    ctx.fillText(payload.rate === null || payload.rate === undefined ? "–" : rate + "%", cx, L.ringY - 6);
    ctx.font = font("600", L.ringLbl);
    ctx.fillText(t("share.accuracy"), cx, L.ringY + L.R - 6);
    ctx.textBaseline = "alphabetic";

    // drei Kennzahl-Kacheln
    const tiles = [
      { num: `${payload.mastered}`, lbl: "Gemeistert" },
      { num: `${payload.seenCards}/${payload.total}`, lbl: "Gelernt" },
      { num: `${payload.hard}`, lbl: "Schwierig" },
    ];
    const gap = 28;
    const tw = (W - PAD * 2 - gap * 2) / 3;
    tiles.forEach((t, i) => {
      const x = PAD + i * (tw + gap);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, x, L.tilesY, tw, L.tileH, 32);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = font("800", L.tileNum);
      ctx.fillText(t.num, x + tw / 2, L.tilesY + L.tileH * 0.55);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = font("600", L.tileLbl);
      ctx.fillText(t.lbl, x + tw / 2, L.tilesY + L.tileH - 30);
    });

    // Verteilungs-Balken (Gemeistert / Am Lernen / Neu)
    const total = payload.total || 1;
    const barY = L.tilesY + L.tileH + L.barGap, barH = 34, barW = W - PAD * 2;
    const segs = [
      { n: payload.mastered, col: "#34d399" },
      { n: payload.learning, col: "#fbbf24" },
      { n: payload.neu, col: "rgba(255,255,255,0.45)" },
    ];
    ctx.save();
    roundRect(ctx, PAD, barY, barW, barH, barH / 2);
    ctx.clip();
    let xCur = PAD;
    segs.forEach((s) => {
      const w = (Math.max(0, s.n) / total) * barW;
      ctx.fillStyle = s.col;
      ctx.fillRect(xCur, barY, w + 0.5, barH);
      xCur += w;
    });
    ctx.restore();

    // Legende unter dem Balken
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = font("600", 28);
    ctx.fillText(t("share.statsLine", { mastered: payload.mastered, learning: payload.learning, neu: payload.neu }), cx, barY + barH + 48);

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv: Ruta-Check-Ergebnis (Einstufung) ----------
  // Das eigene Startlevel als teilbares Bild: großer Niveau-Ring (Füllung = Score),
  // darunter Trefferquote und Tempo. Warmer Ruta-Check-Look (Teal→Terracotta).
  // payload: { userName, level, scorePct, accuracyPct, tempoLabel }
  function buildPlacement(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    bgGradient(ctx, "#2E6E86", "#C2502E", h);
    const cx = W / 2;
    const isStory = aspect === "story";

    const L = isStory
      ? { kicker: 360, cap: 470, ringY: 900, R: 250, ringW: 40, levelPx: 168, capPx: 44, tilesY: 1330, tileH: 210, tileNum: 76, tileLbl: 32 }
      : { kicker: 150, cap: 232, ringY: 470, R: 168, ringW: 32, levelPx: 116, capPx: 34, tilesY: 760, tileH: 176, tileNum: 62, tileLbl: 28 };

    // Kopf
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawFittedLine(ctx, payload.userName ? t("share.myPlacementName", { name: payload.userName }) : t("share.myPlacement"), cx, L.kicker, W - PAD * 2, 40, "700");
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = font("600", L.capPx);
    ctx.fillText(t("share.plLevelCap"), cx, L.cap);

    // Niveau-Ring (Füllung = Score), Startlevel groß in der Mitte.
    const score = Math.max(0, Math.min(100, payload.scorePct || 0));
    ctx.lineWidth = L.ringW;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score) / 100);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.font = font("800", L.levelPx);
    ctx.fillText(String(payload.level || "–"), cx, L.ringY - 10);
    ctx.font = font("700", L.capPx);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(t("share.plScore", { score: Math.round(score) }), cx, L.ringY + L.R - 8);
    ctx.textBaseline = "alphabetic";

    // Zwei Kennzahl-Kacheln: Trefferquote & Tempo.
    const tiles = [
      { num: (payload.accuracyPct == null ? "–" : payload.accuracyPct + "%"), lbl: t("share.accuracy") },
      { num: payload.tempoLabel || "–", lbl: t("share.plTempo") },
    ];
    const gap = 28;
    const tw = (W - PAD * 2 - gap) / 2;
    tiles.forEach((tile, i) => {
      const x = PAD + i * (tw + gap);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, x, L.tilesY, tw, L.tileH, 32);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = font("800", L.tileNum);
      drawFittedLine(ctx, String(tile.num), x + tw / 2, L.tilesY + L.tileH * 0.55, tw - 36, L.tileNum, "800");
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = font("600", L.tileLbl);
      ctx.fillText(tile.lbl, x + tw / 2, L.tilesY + L.tileH - 30);
    });

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv 2b: HolaRuta Nivel-Test (eigenes Sharepic) ----------
  // Wie der Ruta-Check-Ring, aber eigene Farben (Blau→Türkis), Niveau bis C1
  // und eine Varianten-Zeile (Standard/Extremo). payload: { userName, level,
  // variantLabel, scorePct, accuracyPct, tempoLabel }.
  function buildAssessment(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    bgGradient(ctx, "#3F5BA8", "#2E6E86", h);
    const cx = W / 2;
    const isStory = aspect === "story";

    const L = isStory
      ? { kicker: 360, cap: 470, ringY: 900, R: 250, ringW: 40, levelPx: 168, capPx: 44, tilesY: 1330, tileH: 210, tileNum: 76, tileLbl: 32 }
      : { kicker: 150, cap: 232, ringY: 470, R: 168, ringW: 32, levelPx: 116, capPx: 34, tilesY: 760, tileH: 176, tileNum: 62, tileLbl: 28 };

    // Kopf
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawFittedLine(ctx, payload.userName ? t("share.myAssessmentName", { name: payload.userName }) : t("share.myAssessment"), cx, L.kicker, W - PAD * 2, 40, "700");
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = font("600", L.capPx);
    // Niveau-Beschriftung + Variante (z. B. „Mein Niveau · Extremo“).
    const capText = payload.variantLabel ? `${t("share.asLevelCap")} · ${payload.variantLabel}` : t("share.asLevelCap");
    ctx.fillText(capText, cx, L.cap);

    // Niveau-Ring (Füllung = Score), Niveau groß in der Mitte.
    const score = Math.max(0, Math.min(100, payload.scorePct || 0));
    ctx.lineWidth = L.ringW;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score) / 100);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.font = font("800", L.levelPx);
    ctx.fillText(String(payload.level || "–"), cx, L.ringY - 10);
    ctx.font = font("700", L.capPx);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(t("share.plScore", { score: Math.round(score) }), cx, L.ringY + L.R - 8);
    ctx.textBaseline = "alphabetic";

    // Zwei Kennzahl-Kacheln: Trefferquote & Tempo.
    const tiles = [
      { num: (payload.accuracyPct == null ? "–" : payload.accuracyPct + "%"), lbl: t("share.accuracy") },
      { num: payload.tempoLabel || "–", lbl: t("share.plTempo") },
    ];
    const gap = 28;
    const tw = (W - PAD * 2 - gap) / 2;
    tiles.forEach((tile, i) => {
      const x = PAD + i * (tw + gap);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, x, L.tilesY, tw, L.tileH, 32);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = font("800", L.tileNum);
      drawFittedLine(ctx, String(tile.num), x + tw / 2, L.tilesY + L.tileH * 0.55, tw - 36, L.tileNum, "800");
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = font("600", L.tileLbl);
      ctx.fillText(tile.lbl, x + tw / 2, L.tilesY + L.tileH - 30);
    });

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv 3: Ruta-Pass-Stempel (Badge) ----------
  // Ein freigeschalteter Stempel als „Reisestempel im Pass": warmes Medaillon
  // mit dem Badge-Emoji, Name, Freischalt-Text und Sammelstand.
  // payload: { icon, name, text, groupLabel, groupIcon, unlocked, total, accent? }
  function buildBadge(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    // Warmer „Pass-Stempel"-Look (Terrakotta→Ocker), passend zum Ruta-Pass.
    const accent = payload.accent && payload.accent.length === 2 ? payload.accent : ["#C2502E", "#E9A23B"];
    const cx = W / 2;
    const isStory = aspect === "story";

    bgGradient(ctx, accent[0], accent[1], h);

    // Layout je Format (vertikal gestreckt für Story).
    const L = isStory
      ? { kicker: 360, group: 412, medY: 820, R: 250, iconPx: 230, namePx: 88, nameMaxH: 230, textPx: 42, pillPx: 34, pillH: 78 }
      : { kicker: 150, group: 198, medY: 432, R: 176, iconPx: 162, namePx: 66, nameMaxH: 168, textPx: 34, pillPx: 28, pillH: 64 };

    // Kopf: Ruta-Pass + Badge-Gruppe.
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawFittedLine(ctx, payload.userName ? t("share.myPassName", { name: payload.userName }) : t("share.myPass"), cx, L.kicker, W - PAD * 2, 40, "700");
    if (payload.groupLabel) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = font("600", 30);
      ctx.fillText(`${payload.groupIcon || ""}  ${payload.groupLabel}`.trim(), cx, L.group);
    }

    // Stempel-Medaillon: weißer Kreis mit gestricheltem Innenring (Pass-Optik).
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, L.medY, L.R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = accent[0];
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 16]);
    ctx.beginPath();
    ctx.arc(cx, L.medY, L.R - 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Badge-Emoji zentriert im Medaillon.
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font("700", L.iconPx);
    ctx.fillText(payload.icon || "🎖️", cx, L.medY + 6);
    ctx.textBaseline = "alphabetic";

    // Sammelstand-Pille (fester Platz knapp über der Fußzeile).
    const pillBottom = h - (isStory ? 230 : 150);
    const pillTop = pillBottom - L.pillH;
    if (payload.total) {
      ctx.font = font("700", L.pillPx);
      const ptxt = t("share.stampsCollected", { unlocked: payload.unlocked, total: payload.total });
      const pw = Math.min(W - PAD * 2, ctx.measureText(ptxt).width + 64);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      roundRect(ctx, cx - pw / 2, pillTop, pw, L.pillH, L.pillH / 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.textBaseline = "middle";
      ctx.fillText(ptxt, cx, pillTop + L.pillH / 2 + 1);
      ctx.textBaseline = "alphabetic";
    }

    // Name + Freischalt-Text zwischen Medaillon und Pille (Höhe gedeckelt, damit
    // nichts überläuft – egal wie lang Name/Text sind).
    const blockTop = L.medY + L.R + (isStory ? 64 : 44);
    const blockBottom = pillTop - (isStory ? 44 : 26);
    const nameBottom = fitText(ctx, payload.name || "", cx, blockTop, W - PAD * 2, {
      px: L.namePx, min: 40, weight: "800", color: "#ffffff", maxLines: 2,
      maxH: Math.min(L.nameMaxH, blockBottom - blockTop),
    });
    if (payload.text) {
      const textTop = nameBottom + (isStory ? 28 : 20);
      fitText(ctx, payload.text, cx, textTop, W - PAD * 2 - 40, {
        px: L.textPx, min: 26, weight: "500", color: "rgba(255,255,255,0.9)", maxLines: 3,
        maxH: Math.max(0, blockBottom - textTop),
      });
    }

    brandFooter(ctx, h);
    return c;
  }

  // Zeichnet einen umgebrochenen Text links-bündig, geklammert auf maxBottom
  // (letzte Zeile bekommt „…"). Liefert die ungefähre Unterkante zurück.
  function drawWrapped(ctx, text, x, top, maxW, opts) {
    const o = opts || {};
    const px = o.px || 32, lh = o.lineHeight || 1.4;
    ctx.font = font(o.weight || "500", px);
    ctx.fillStyle = o.color || INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const all = wrap(ctx, text, maxW);
    const maxBottom = o.maxBottom || Infinity;
    const step = px * lh;
    const shown = [];
    let y = top + px;
    for (let i = 0; i < all.length; i++) {
      if (y > maxBottom) {
        if (shown.length) shown[shown.length - 1] = shown[shown.length - 1].replace(/\s+\S*$/, "") + " …";
        break;
      }
      shown.push(all[i]);
      y += step;
    }
    let yy = top + px;
    shown.forEach((ln) => { ctx.fillText(ln, x, yy); yy += step; });
    return yy - step + px * (lh - 1);
  }

  // ---------- Motiv 4: Geschichts-Lesetext + Wörterliste ----------
  // payload: { title, levelCode, levelWord, esText, words:[{es,de}] }
  function buildHistoria(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    const accent = ["#8E5A2E", "#5A3A24"];
    const cx = W / 2;
    const isStory = aspect === "story";
    bgGradient(ctx, accent[0], accent[1], h);

    const pw = W - PAD * 2;

    // Kicker
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = font("700", 32);
    ctx.fillText("📜  HISTORIA DE SUDAMÉRICA", cx, isStory ? 140 : 104);

    // Titel der Epoche
    const titleTop = isStory ? 168 : 130;
    const titleBottom = fitText(ctx, payload.title || "", cx, titleTop, pw - 40, {
      px: 60, min: 36, weight: "800", color: "#ffffff", maxLines: 3,
    });

    // Schwierigkeits-Pille (Selbst-Einstufung)
    let y = titleBottom + 34;
    if (payload.levelCode) {
      const pill = payload.levelWord ? `${payload.levelCode}  ·  ${payload.levelWord}` : payload.levelCode;
      ctx.font = font("700", 30);
      const plw = ctx.measureText(pill).width + 60;
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, cx - plw / 2, y, plw, 58, 29);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pill, cx, y + 30);
      ctx.textBaseline = "alphabetic";
      y += 58;
    }
    y += 40;

    // Weißes Panel bis über die Marken-Fußzeile
    const panelY = y;
    const panelH = h - 175 - panelY;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, PAD, panelY, pw, panelH, 48);
    ctx.fill();
    ctx.restore();

    const innerX = PAD + 56;
    const innerW = pw - 112;
    let iy = panelY + 54;

    // Label + spanischer Lesetext
    ctx.textAlign = "left";
    ctx.fillStyle = accent[0];
    ctx.font = font("800", 26);
    ctx.fillText("LEE EN ESPAÑOL", innerX, iy + 20);
    iy += 56;

    const words = (payload.words || []).slice(0, isStory ? 9 : 5);
    const vocabH = 60 + words.length * 54;
    const textMaxBottom = panelY + panelH - vocabH - 56;
    drawWrapped(ctx, payload.esText || "", innerX, iy, innerW, {
      px: isStory ? 34 : 31, weight: "500", color: INK, lineHeight: 1.42, maxBottom: textMaxBottom,
    });

    // Trenner + Wörterliste
    let vy = panelY + panelH - vocabH - 8;
    ctx.strokeStyle = "rgba(15,23,42,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(innerX, vy);
    ctx.lineTo(innerX + innerW, vy);
    ctx.stroke();
    vy += 46;

    ctx.fillStyle = accent[0];
    ctx.font = font("800", 26);
    ctx.textAlign = "left";
    ctx.fillText("📒  VOCABULARIO", innerX, vy);
    vy += 46;

    words.forEach((w) => {
      ctx.textAlign = "left";
      ctx.font = font("800", 30);
      ctx.fillStyle = accent[0];
      const esW = String(w.es || "");
      ctx.fillText(esW, innerX, vy);
      const offset = ctx.measureText(esW + "   ").width;
      ctx.font = font("500", 27);
      ctx.fillStyle = MUTE;
      let de = String(w.de || "");
      let trimmed = false;
      while (ctx.measureText(de).width > innerW - offset && de.length > 5) { de = de.slice(0, -2); trimmed = true; }
      ctx.fillText(trimmed ? de + "…" : de, innerX + offset, vy);
      vy += 54;
    });

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv 6: Historia-Modul-Übersicht (ganzes Modul teilen) ----------
  // Stellt nicht einen einzelnen Text dar, sondern das KOMPLETTE Modul „Historia
  // de Sudamérica" als Einladung: Modulname, Einleitung und ein Zeitstrahl-Teaser
  // mit den Epochen (Symbol · Zeitraum · Titel).
  // payload: { kicker, title, intro, timelineLabel, eras:[{icon,period,title}] }
  function buildHistOverview(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    const accent = ["#8E5A2E", "#5A3A24"];
    const cx = W / 2;
    const isStory = aspect === "story";
    bgGradient(ctx, accent[0], accent[1], h);

    const pw = W - PAD * 2;

    // Kicker (kleiner Hinweis über dem Titel)
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = font("700", 32);
    ctx.fillText(`📜  ${String(payload.kicker || "").toUpperCase()}`, cx, isStory ? 140 : 104);

    // Großer Modul-Titel
    const titleTop = isStory ? 172 : 132;
    const titleBottom = fitText(ctx, payload.title || "Historia de Sudamérica", cx, titleTop, pw - 20, {
      px: 76, min: 44, weight: "800", color: "#ffffff", maxLines: 2,
    });
    let y = titleBottom + 44;

    // Weißes Panel bis über die Marken-Fußzeile
    const panelY = y;
    const panelH = h - 175 - panelY;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, PAD, panelY, pw, panelH, 48);
    ctx.fill();
    ctx.restore();

    const innerX = PAD + 56;
    const innerW = pw - 112;
    let iy = panelY + 54;
    const bottom = panelY + panelH - 40;

    // Einleitung (gedämpft)
    if (payload.intro) {
      iy = drawWrapped(ctx, payload.intro, innerX, iy, innerW, {
        px: isStory ? 31 : 29, weight: "600", color: MUTE, lineHeight: 1.4,
        maxBottom: panelY + (isStory ? 540 : 340),
      }) + 44;
    }

    // Zeitstrahl-Teaser: die Epochen als Liste (Symbol · Zeitraum · Titel).
    ctx.fillStyle = accent[0];
    ctx.font = font("800", 26);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`🕰️  ${String(payload.timelineLabel || "").toUpperCase()}`, innerX, iy);
    iy += 52;

    const eras = payload.eras || [];
    const rowH = isStory ? 98 : 86;
    for (let i = 0; i < eras.length; i++) {
      const e = eras[i] || {};
      if (iy + rowH > bottom) break;
      // Symbol-Punkt
      ctx.font = font("700", 40);
      ctx.fillStyle = accent[0];
      ctx.textAlign = "left";
      ctx.fillText(e.icon || "•", innerX, iy + 40);
      const tx = innerX + 64;
      // Zeitraum (klein, gedämpft)
      ctx.font = font("700", 24);
      ctx.fillStyle = MUTE;
      ctx.fillText(String(e.period || ""), tx, iy + 26);
      // Titel der Epoche (gekürzt, falls zu breit)
      ctx.font = font("800", 30);
      ctx.fillStyle = INK;
      let title = String(e.title || "");
      let trimmed = false;
      while (ctx.measureText(title).width > innerW - 64 && title.length > 6) { title = title.slice(0, -2); trimmed = true; }
      ctx.fillText(trimmed ? title + "…" : title, tx, iy + 62);
      iy += rowH;
    }

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Motiv 5: Reise-Tipps (DOs & DON'Ts einer Entdecken-Kategorie) ----------
  // payload: { kicker, icon, title, intro, lines:[{mark,text}], accent:[from,to] }
  // Wird von Knigge, Regatear, Logística und Salud genutzt – ein Thema mit seinen
  // „Mach das"/„Vermeide das"-Punkten als teilbares Bild. Dient außerdem (kind
  // "module") als generische Modul-Einladung: Icon · Titel · Kurz-Intro · ein paar
  // Highlight-Zeilen (Marker frei wählbar, z.B. Vokabel-Beispiele oder Themen).
  function buildTips(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    const accent = payload.accent && payload.accent.length === 2 ? payload.accent : ["#3F6B8E", "#6B4FA8"];
    const cx = W / 2;
    const isStory = aspect === "story";
    bgGradient(ctx, accent[0], accent[1], h);

    const pw = W - PAD * 2;

    // Kicker (Kategorie)
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = font("700", 32);
    ctx.fillText(`${payload.icon || "🧭"}  ${String(payload.kicker || "").toUpperCase()}`, cx, isStory ? 140 : 104);

    // Titel des Themas
    const titleTop = isStory ? 168 : 130;
    const titleBottom = fitText(ctx, payload.title || "", cx, titleTop, pw - 40, {
      px: 58, min: 34, weight: "800", color: "#ffffff", maxLines: 3,
    });
    let y = titleBottom + 50;

    // Weißes Panel bis über die Marken-Fußzeile
    const panelY = y;
    const panelH = h - 175 - panelY;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, PAD, panelY, pw, panelH, 48);
    ctx.fill();
    ctx.restore();

    const innerX = PAD + 56;
    const innerW = pw - 112;
    let iy = panelY + 54;
    const bottom = panelY + panelH - 44;

    // Kurze Einleitung (optional, gedämpft)
    if (payload.intro) {
      iy = drawWrapped(ctx, payload.intro, innerX, iy, innerW, {
        px: isStory ? 30 : 28, weight: "600", color: MUTE, lineHeight: 1.34,
        maxBottom: panelY + (isStory ? 360 : 240),
      }) + 40;
    }

    // Liste der DOs & DON'Ts. Marker (✅/🚫) links, Text mit hängendem Einzug.
    const px = isStory ? 31 : 29;
    const markW = 54;
    const lineGap = 24;
    const lines = payload.lines || [];
    let truncated = false;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i] || {};
      if (iy + px > bottom) { truncated = i < lines.length; break; }
      ctx.font = font("700", px);
      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(ln.mark || "•", innerX, iy + px);
      const endY = drawWrapped(ctx, ln.text || "", innerX + markW, iy, innerW - markW, {
        px, weight: "500", color: INK, lineHeight: 1.34, maxBottom: bottom,
      });
      iy = endY + lineGap;
      if (iy > bottom && i < lines.length - 1) { truncated = true; break; }
    }
    if (truncated) {
      ctx.font = font("800", 30);
      ctx.fillStyle = MUTE;
      ctx.textAlign = "center";
      ctx.fillText("…", cx, Math.min(iy + px * 0.5, bottom + 24));
    }

    brandFooter(ctx, h);
    return c;
  }

  // ---------- Canvas -> Blob ----------
  function toBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas.toBlob) {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob lieferte null"))), "image/png");
      } else {
        try {
          const data = canvas.toDataURL("image/png").split(",")[1];
          const bin = atob(data);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: "image/png" }));
        } catch (e) { reject(e); }
      }
    });
  }

  // PNG herunterladen (Fallback / Desktop).
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // Begleittext zum geteilten Bild (erscheint z.B. als Bildunterschrift in
  // WhatsApp/Telegram). Bei einer Vokabel wird die Karte selbst zitiert.
  function shareText(kind, payload) {
    const p = payload || {};
    // Echter, anklickbarer Link – Messenger (WhatsApp/Telegram/…) verlinken die
    // nackte URL im Begleittext automatisch. Trägt das Sharepic eine Modul-Kennung
    // (moduleSlug), zeigt der Link per ?m=<modul> direkt in dieses Modul: Wer den
    // Link antippt, landet nicht auf der Startseite, sondern im empfohlenen Modul.
    const url = p.moduleSlug
      ? APP_URL + (APP_URL.indexOf("?") === -1 ? "?" : "&") + "m=" + encodeURIComponent(p.moduleSlug)
      : APP_URL;
    const link = `\n\n${t("share.captionJoin")} ${url}`;
    if (kind === "stats") {
      const r = (p.rate === null || p.rate === undefined) ? null : p.rate;
      const facts = [];
      if (r !== null) facts.push(t("share.factAccuracy", { r }));
      if (p.mastered) facts.push(t("share.factMastered", { n: p.mastered }));
      const tail = facts.length ? " – " + facts.join(", ") : "";
      return t("share.captionStats", { tail }) + link;
    }
    if (kind === "badge") {
      const name = String(p.name || "").trim();
      const txt = String(p.text || "").trim();
      let out = t("share.captionBadgeHead", { name: name || t("share.defaultStamp") });
      if (txt) out += `\n${txt}`;
      out += `\n\n${t("share.captionCollected")}`;
      return out + link;
    }
    if (kind === "placement") {
      let out = t("share.captionPlacementHead", { level: String(p.level || "–") });
      out += `\n\n${t("share.captionPlacement")}`;
      return out + link;
    }
    if (kind === "assessment") {
      let out = t("share.captionAssessmentHead", { level: String(p.level || "–") });
      out += `\n\n${t("share.captionAssessment")}`;
      return out + link;
    }
    if (kind === "histtext") {
      const title = String(p.title || "").trim();
      let out = t("share.captionHistoriaHead", { title: title || "Historia de Sudamérica" });
      if (p.levelCode) out += `\n${t("share.captionHistoriaLevel", { level: p.levelCode })}`;
      out += `\n\n${t("share.captionHistoria")}`;
      return out + link;
    }
    if (kind === "histmodule") {
      let out = t("share.captionHistModuleHead");
      out += `\n\n${t("share.captionHistModule")}`;
      return out + link;
    }
    if (kind === "tips") {
      const title = String(p.title || "").trim();
      const cat = String(p.kicker || "").trim();
      let out = t("share.captionTipsHead", { title: title || cat || BRAND });
      if (cat && title) out += `\n${cat}`;
      out += `\n\n${t("share.captionTips")}`;
      return out + link;
    }
    if (kind === "module") {
      const title = String(p.title || "").trim();
      let out = t("share.captionModuleHead", { title: title || BRAND });
      out += `\n\n${t("share.captionModule")}`;
      return out + link;
    }
    const es = String(p.es || "").trim();
    const de = String(p.de || "").trim();
    const head = es && de ? `„${es}" = ${de}` : (es || de || t("share.defaultVocab"));
    const tip = String(p.tip || "").trim();
    let out = t("share.captionVocabHead", { head });
    if (tip) out += `\n${t("share.captionPron", { tip })}`;
    out += `\n\n${t("share.captionLearned")}`;
    return out + link;
  }

  // Baut das Bild und teilt es. Erst Web Share API (mit Datei), sonst Download.
  // Gibt zurück: 'shared' | 'downloaded' | 'cancelled' | 'error'.
  async function shareImage(kind, payload, aspect) {
    const fmt = aspect === "story" ? "story" : "square";
    let canvas;
    try {
      canvas = kind === "stats" ? buildStats(payload, fmt)
             : kind === "placement" ? buildPlacement(payload, fmt)
             : kind === "assessment" ? buildAssessment(payload, fmt)
             : kind === "badge" ? buildBadge(payload, fmt)
             : kind === "histtext" ? buildHistoria(payload, fmt)
             : kind === "histmodule" ? buildHistOverview(payload, fmt)
             : kind === "tips" ? buildTips(payload, fmt)
             : kind === "module" ? buildTips(payload, fmt)
             : buildCard(payload, fmt);
    } catch (e) {
      console.warn("Sharepic konnte nicht gezeichnet werden", e);
      return "error";
    }

    let blob;
    try {
      blob = await toBlob(canvas);
    } catch (e) {
      console.warn("Sharepic-Export fehlgeschlagen", e);
      return "error";
    }

    const base = kind === "stats" ? "holaruta-fortschritt"
               : kind === "placement" ? "holaruta-ruta-check"
               : kind === "assessment" ? "holaruta-nivel-test"
               : kind === "badge" ? "holaruta-stempel"
               : kind === "histtext" ? "holaruta-historia"
               : kind === "histmodule" ? "holaruta-historia-modul"
               : kind === "tips" ? "holaruta-tipps"
               : kind === "module" ? "holaruta-modul"
               : "holaruta-vokabel";
    const filename = `${base}-${fmt}.png`;
    const title = kind === "stats" ? "Mein Reise-Spanisch-Fortschritt"
                : kind === "placement" ? "Mein HolaRuta-Check-Ergebnis"
                : kind === "assessment" ? "Mein HolaRuta-Nivel-Test-Ergebnis"
                : kind === "badge" ? "Mein Ruta-Pass-Stempel"
                : kind === "histtext" ? "Historia de Sudamérica"
                : kind === "histmodule" ? "Historia de Sudamérica"
                : kind === "tips" ? ((payload && payload.title) || "HolaRuta")
                : kind === "module" ? ((payload && payload.title) || "HolaRuta")
                : "Reise-Spanisch lernen";
    const text = shareText(kind, payload); // Begleittext (z.B. unter dem WhatsApp-Bild)

    // Web Share API mit Datei (Handy: Insta/WhatsApp etc.)
    try {
      if (navigator.canShare && typeof File === "function") {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text });
          return "shared";
        }
      }
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled"; // Nutzer hat abgebrochen
      // sonst: auf Download zurückfallen
    }

    try {
      download(blob, filename);
      return "downloaded";
    } catch (e) {
      console.warn("Sharepic-Download fehlgeschlagen", e);
      return "error";
    }
  }

  window.SC = window.SC || {};
  window.SC.share = { shareImage, buildCard, buildStats, buildPlacement, buildAssessment, buildBadge, buildHistoria, buildHistOverview, buildTips };
})();
