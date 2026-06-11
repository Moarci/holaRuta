/*
 * share.js  (SC.share) – Sharepic-Generator. Zeichnet ein teilbares Bild (PNG)
 * auf ein <canvas> und teilt es per Web Share API bzw. lädt es als Fallback
 * herunter. KENNT KEINEN ZUSTAND – bekommt fertige Anzeige-Daten.
 *
 * Zwei Motive (Umschalter):
 *   buildCard(payload, aspect)  – eine einzelne Vokabel (DE → ES + Aussprache)
 *   buildStats(payload, aspect) – der eigene Lernfortschritt (Kennzahlen)
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
  const TAGLINE = "Dein Reise-Spanisch für echte Situationen";
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

  // Marken-Fußzeile (auf farbigem Grund, weiß).
  function brandFooter(ctx, h) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = font("800", 46);
    ctx.fillText("🇪🇸 " + BRAND, W / 2, h - 96);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = font("500", 30);
    ctx.fillText(TAGLINE, W / 2, h - 52);
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
    ctx.fillText("DEUTSCH", cx, contentTop + 30);
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
    ctx.font = font("700", 40);
    ctx.fillText("MEIN FORTSCHRITT", cx, L.kicker);
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
    ctx.fillText("Trefferquote", cx, L.ringY + L.R - 6);
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
    ctx.fillText(`Gemeistert ${payload.mastered}  ·  Am Lernen ${payload.learning}  ·  Neu ${payload.neu}`, cx, barY + barH + 48);

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
    if (kind === "stats") {
      const r = (p.rate === null || p.rate === undefined) ? null : p.rate;
      const facts = [];
      if (r !== null) facts.push(`${r}% Trefferquote`);
      if (p.mastered) facts.push(`${p.mastered} Vokabeln gemeistert`);
      const tail = facts.length ? " – " + facts.join(", ") : "";
      return `📍 Mein Reise-Spanisch mit HolaRuta${tail}. Lernst du mit? 🌎`;
    }
    const es = String(p.es || "").trim();
    const de = String(p.de || "").trim();
    const head = es && de ? `„${es}" = ${de}` : (es || de || "eine neue Vokabel");
    const tip = String(p.tip || "").trim();
    let t = `📍 Spanisch für unterwegs: ${head}`;
    if (tip) t += `\n🗣️ Aussprache: ${tip}`;
    t += `\n\nGelernt mit HolaRuta – dein Reise-Spanisch für echte Situationen. 🌎`;
    return t;
  }

  // Baut das Bild und teilt es. Erst Web Share API (mit Datei), sonst Download.
  // Gibt zurück: 'shared' | 'downloaded' | 'cancelled' | 'error'.
  async function shareImage(kind, payload, aspect) {
    const fmt = aspect === "story" ? "story" : "square";
    let canvas;
    try {
      canvas = kind === "stats" ? buildStats(payload, fmt) : buildCard(payload, fmt);
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

    const base = kind === "stats" ? "holaruta-fortschritt" : "holaruta-vokabel";
    const filename = `${base}-${fmt}.png`;
    const title = kind === "stats" ? "Mein Reise-Spanisch-Fortschritt" : "Reise-Spanisch lernen";
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
  window.SC.share = { shareImage, buildCard, buildStats };
})();
