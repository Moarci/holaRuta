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
  // Kanonische Web-Adresse für geteilte Links – ohne Hardcoding:
  //   1. Edition-Config (SC.config.appUrl) gewinnt, 2. sonst die aktuelle Adresse
  //   (origin + Ordnerpfad), 3. nur als letzter Fallback die HolaRuta-Pages-URL
  //   (greift v.a. beim Öffnen der Einzeldatei via file://). So stimmt der Link
  //   auch für Forks und Co-Branding-Editionen.
  const APP_URL_FALLBACK = "https://moarci.github.io/holaRuta/";
  function appUrl() {
    const cfg = window.SC && SC.config && SC.config.appUrl;
    if (cfg) return cfg;
    try {
      const loc = window.location;
      if (loc && /^https?:$/.test(loc.protocol)) {
        return loc.origin + loc.pathname.replace(/[^/]*$/, ""); // Ordner ohne Datei/Query/Hash
      }
    } catch (e) { /* kein location verfügbar */ }
    return APP_URL_FALLBACK;
  }
  function appUrlLabel() {
    return appUrl().replace(/^https?:\/\//, "").replace(/\/+$/, ""); // kurze, lesbare Anzeige
  }
  // Ziel-Adresse für den ANTIPPBAREN Begleittext-Link (nicht für die kurze Marken-
  // Anzeige in brandFooter): appUrl() + „edition"-Parameter, falls eine Co-Branding-
  // Edition aktiv ist – sonst würde ein geteilter Link z.B. HelloAbroad-Inhalte im
  // HolaRuta-Standard-Branding öffnen statt in der eigenen Edition. Gleiches Muster
  // wie taskShareLink() in app.js.
  function linkBaseUrl() {
    const base = appUrl();
    const edition = window.SC && SC.config && SC.config.edition;
    if (!edition) return base;
    return base + (base.indexOf("?") === -1 ? "?" : "&") + "edition=" + encodeURIComponent(edition);
  }
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
    // Marke + Flagge folgen dem aktiven Track/der Edition: HelloAbroad (de-en,
    // Reiseenglisch) zeigt die EIGENE Marke mit neutralem 🌍 – bewusst OHNE
    // HolaRuta-/Spanien-Bezug, wie die ganze Edition (siehe editions/registry.js).
    // Alle anderen Tracks bleiben unverändert „🇪🇸 HolaRuta".
    const trackId = (window.SC && SC.track && SC.track.id && SC.track.id()) || "de-es";
    const isHelloAbroad = trackId === "de-en";
    const brand = isHelloAbroad
      ? ((window.SC && SC.config && SC.config.brandName) || "HelloAbroad")
      : BRAND;
    const flag = isHelloAbroad ? "🌍" : "🇪🇸";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = font("800", 46);
    ctx.fillText(flag + " " + brand, cx, h - 96);

    // App-Adresse als Link gestaltet: 👉 + unterstrichener Text.
    const url = "👉  " + appUrlLabel();
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
    ctx.fillText((payload.nativeLabel || t("share.sideNative")).toUpperCase(), cx, contentTop + 30);
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
    ctx.fillText((payload.learnLabel || "ESPAÑOL").toUpperCase(), cx, dividerY + 56);
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
    // Label nach innen versetzt (um ringW+24), damit es nicht auf dem unteren
    // Ring-Bogen liegt (Strich spannt R±ringW/2) und lesbar bleibt.
    ctx.fillText(t("share.accuracy"), cx, L.ringY + L.R - L.ringW - 24);
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
    // Score-Caption nach innen versetzt (um ringW+24), damit sie nicht auf dem
    // unteren Ring-Bogen liegt (Strich spannt R±ringW/2) und lesbar bleibt.
    ctx.fillText(t("share.plScore", { score: Math.round(score) }), cx, L.ringY + L.R - L.ringW - 24);
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
    // Score-Caption nach innen versetzt (um ringW+24), damit sie nicht auf dem
    // unteren Ring-Bogen liegt (Strich spannt R±ringW/2) und lesbar bleibt.
    ctx.fillText(t("share.plScore", { score: Math.round(score) }), cx, L.ringY + L.R - L.ringW - 24);
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

  // ---------- Motiv 2c: Reise-Rang (XP / Viajero) ----------
  // Eigenes Sharepic für den XP-Rang: Ring (Füllung = Fortschritt zum nächsten
  // Rang), in der Mitte der XP-Stand, darüber der Rang-Name. Zwei Kacheln zeigen
  // den nächsten Rang und die noch fehlenden XP. „Camino"-Farben (Grün→Türkis),
  // klar von Ruta-Check/Nivel-Test/Stempel unterscheidbar.
  // payload: { userName, rankName, xp, nextName, xpToNext, pct, rankN }
  function buildRank(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    bgGradient(ctx, "#3F7355", "#2E6E86", h);
    const cx = W / 2;
    const isStory = aspect === "story";

    const L = isStory
      ? { kicker: 360, cap: 470, ringY: 900, R: 250, ringW: 40, xpPx: 168, capPx: 44, ringCapPx: 40, tilesY: 1330, tileH: 210, tileNum: 76, tileLbl: 32 }
      : { kicker: 150, cap: 232, ringY: 470, R: 168, ringW: 32, xpPx: 116, capPx: 34, ringCapPx: 30, tilesY: 760, tileH: 176, tileNum: 62, tileLbl: 28 };

    // Kopf
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawFittedLine(ctx, payload.userName ? t("share.myRankName", { name: payload.userName }) : t("share.myRank"), cx, L.kicker, W - PAD * 2, 40, "700");
    // Rang-Name als prominente Beschriftung über dem Ring (🧭 …), passt sich an.
    ctx.fillStyle = "#ffffff";
    drawFittedLine(ctx, "🧭 " + String(payload.rankName || "–"), cx, L.cap, W - PAD * 2, L.capPx + 16, "800");

    // Ring (Füllung = Fortschritt zum nächsten Rang), XP groß in der Mitte.
    const pct = Math.max(0, Math.min(100, payload.pct == null ? 0 : payload.pct));
    ctx.lineWidth = L.ringW;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, L.ringY, L.R, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    // drawFittedLine statt fillText: sehr hohe XP-Stände (5–6-stellig, XP wächst
    // unbegrenzt) schrumpfen in den Ring statt herauszulaufen.
    drawFittedLine(ctx, String(payload.xp == null ? 0 : payload.xp), cx, L.ringY - 10, L.R * 2 - 64, L.xpPx, "800");
    ctx.font = font("700", L.ringCapPx);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    // Caption innerhalb des Rings unter der XP-Zahl – mit Abstand zum unteren
    // Ring-Bogen (Strich liegt bei R±ringW/2), damit „XP" nicht auf der Linie klebt.
    ctx.fillText(t("share.rankXpCap"), cx, L.ringY + L.R - L.ringW - 24);
    ctx.textBaseline = "alphabetic";

    // Zwei Kennzahl-Kacheln: nächster Rang & noch fehlende XP (bzw. „erreicht").
    const tiles = payload.nextName
      ? [
          { num: payload.nextName, lbl: t("share.rankNextCap") },
          { num: "+" + (payload.xpToNext == null ? 0 : payload.xpToNext), lbl: t("share.rankToGo") },
        ]
      : [
          { num: "🏆", lbl: t("share.rankReached") },
          { num: pct + "%", lbl: t("share.rankProgress") },
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
      drawFittedLine(ctx, tile.lbl, x + tw / 2, L.tilesY + L.tileH - 30, tw - 28, L.tileLbl, "600");
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

  // Mischt zwei Hex-Farben (0..1) – für die pastellenen Chip-Hintergründe
  // (Akzentfarbe stark aufgehellt), damit jedes Modul seine Farbidentität auch
  // in den Listen-/Grid-Zeilen behält statt neutralem Grau.
  function mix(hexA, hexB, t) {
    const pa = parseInt(hexA.slice(1), 16), pb = parseInt(hexB.slice(1), 16);
    const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
    const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), b = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${b})`;
  }

  // Verlauf + weiche Kreis-„Blobs" für Tiefe – nur für das Modul-/Tipps-Motiv
  // (buildTips), damit es sich von der reinen Zweifarb-Fläche der anderen
  // Motive abhebt und weniger flach/„militärisch" wirkt.
  function bgScene(ctx, accent, h) {
    bgGradient(ctx, accent[0], accent[1], h);
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(W * 0.92, h * 0.06, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-W * 0.08, h * 0.32, 200, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "#000000";
    ctx.beginPath(); ctx.arc(W * 0.85, h * 0.98, 320, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Kurze, gleichartige Zeilen (z.B. "🇨🇴 Kolumbien · COP") als 2-spaltiges
  // Chip-Grid statt einer langen Liste – füllt die Breite und wirkt weniger
  // wie ein Einstellungsmenü. plan() misst/skaliert, draw() zeichnet.
  function planGrid(ctx, lines, innerW, isStory, availableH) {
    const cols = 2, gap = 20;
    const cw = (innerW - gap) / cols;
    const rows = Math.ceil(lines.length / cols);
    const basePx = isStory ? 30 : 27;
    const baseRowH = isStory ? 96 : 84;
    const naturalH = rows * baseRowH;
    let scale = naturalH > 0 ? availableH / naturalH : 1;
    scale = Math.max(0.66, Math.min(1.35, scale));
    const rowH = baseRowH * scale;
    const px = Math.max(20, Math.round(basePx * Math.min(scale, 1.12)));
    return { cols, gap, cw, rows, rowH, px, totalH: rows * rowH };
  }

  function drawGrid(ctx, lines, innerX, iy, isStory, plan, accent) {
    const { cols, gap, cw, rowH, px } = plan;
    const chipH = rowH - (isStory ? 22 : 18);
    lines.forEach((l, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const rx = innerX + col * (cw + gap);
      const ry = iy + row * rowH;
      ctx.fillStyle = mix(accent[0], "#ffffff", 0.92);
      roundRect(ctx, rx, ry, cw, chipH, 22);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const markPx = px * 1.3;
      ctx.font = font("700", markPx);
      const mark = (l.mark && l.mark.slice(0, 3) === "lc:") ? "•" : (l.mark || "•");
      ctx.fillStyle = INK;
      const padX = 24;
      ctx.fillText(mark, rx + padX, ry + chipH / 2);
      const markW = ctx.measureText(mark).width;
      ctx.font = font("700", px);
      drawFittedLine(ctx, String(l.text || ""), rx + padX + markW + 14, ry + chipH / 2 + 1, cw - padX - markW - 34, px, "700");
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // Längere Sätze (DOs/DON'Ts/Tipps) als volle Chip-Zeilen. Skaliert Schrift &
  // Abstände in den verfügbaren Platz; passt selbst dann noch nicht ALLES
  // hinein (viele lange Sätze auf "square"), wird der Rest über eine
  // "+N mehr"-Zeile angezeigt statt Inhalte kommentarlos abzuschneiden.
  function planList(ctx, lines, innerW, isStory, availableH) {
    const basePx = isStory ? 31 : 28;
    const padX = 22, padY = isStory ? 26 : 17, gap = isStory ? 22 : 14;
    const markW = isStory ? 66 : 56;
    const textW = innerW - padX * 2 - markW;
    ctx.font = font("600", basePx);
    const rows = lines.map((l) => {
      const wl = wrap(ctx, l.text || "", textW);
      return { wl, h: wl.length * basePx * 1.32 + padY * 2 };
    });
    const naturalH = rows.reduce((s, r) => s + r.h, 0) + gap * Math.max(0, rows.length - 1);
    let scale = naturalH > 0 ? availableH / naturalH : 1;
    scale = Math.max(0.72, Math.min(1.2, scale));
    const px = Math.max(22, Math.round(basePx * Math.min(scale, 1.08)));
    ctx.font = font("600", px);
    const finalRows = lines.map((l) => {
      const wl = wrap(ctx, l.text || "", textW);
      return { wl, h: wl.length * px * 1.34 + padY * 2 };
    });
    const finalGap = gap * scale;
    const moreH = px * 1.3 + padY * 1.6; // reservierte Höhe für die "+N mehr"-Zeile
    let shown = finalRows.length;
    let totalH = finalRows.reduce((s, r) => s + r.h, 0) + finalGap * Math.max(0, finalRows.length - 1);
    while (shown > 1 && totalH + (shown < finalRows.length ? moreH + finalGap : 0) > availableH) {
      shown--;
      totalH = finalRows.slice(0, shown).reduce((s, r) => s + r.h, 0) + finalGap * Math.max(0, shown - 1);
    }
    const truncated = shown < finalRows.length;
    if (truncated) totalH += moreH + finalGap;
    return { rows: finalRows, px, padX, padY, markW, gap: finalGap, totalH, shown, hiddenCount: finalRows.length - shown, moreH };
  }

  function drawList(ctx, lines, innerX, iy, innerW, plan, accent) {
    const { rows, px, padX, padY, markW, gap, shown, hiddenCount, moreH } = plan;
    let y = iy;
    lines.slice(0, shown).forEach((l, i) => {
      const r = rows[i];
      ctx.fillStyle = mix(accent[0], "#ffffff", 0.94);
      roundRect(ctx, innerX, y, innerW, r.h, 24);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = font("700", px * 1.05);
      ctx.fillStyle = INK;
      ctx.fillText((l.mark && l.mark.slice(0, 3) === "lc:") ? "•" : (l.mark || "•"), innerX + padX, y + padY + px);
      ctx.font = font("600", px);
      let ty = y + padY + px;
      r.wl.forEach((ln) => { ctx.fillText(ln, innerX + padX + markW, ty); ty += px * 1.34; });
      y += r.h + gap;
    });
    if (hiddenCount > 0) {
      ctx.fillStyle = mix(accent[0], "#ffffff", 0.88);
      roundRect(ctx, innerX, y, innerW, moreH, 24);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font("700", px);
      ctx.fillStyle = accent[0];
      ctx.fillText(t("share.tipsMore", { n: hiddenCount }), innerX + innerW / 2, y + moreH / 2 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  }

  // ---------- Motiv 5: Reise-Tipps (DOs & DON'Ts einer Entdecken-Kategorie) ----------
  // payload: { kicker, icon, title, intro, lines:[{mark,text}], accent:[from,to] }
  // Wird von Knigge, Regatear, Logística und Salud genutzt – ein Thema mit seinen
  // „Mach das"/„Vermeide das"-Punkten als teilbares Bild. Dient außerdem (kind
  // "module") als generische Modul-Einladung: Icon · Titel · Kurz-Intro · ein paar
  // Highlight-Zeilen (Marker frei wählbar, z.B. Vokabel-Beispiele oder Themen).
  //
  // Layout: Icon-Medaillon → Kicker-Pille → Titel → weißes Panel, das IMMER
  // bis knapp über die Marken-Fußzeile reicht (kein Leerraum zwischen Panel
  // und Fußzeile). Innerhalb des Panels füllen sich kurze, gleichartige Zeilen
  // als 2-spaltiges Chip-Grid, längere Sätze als volle Chip-Zeilen – beides
  // skaliert in den verfügbaren Platz (siehe planGrid/planList oben), statt
  // wie zuvor eine feste Panel-Höhe mit oft leerem Boden zu zeichnen.
  function buildTips(payload, aspect) {
    const h = heightFor(aspect);
    const c = newCanvas(h);
    const ctx = c.getContext("2d");
    const accent = payload.accent && payload.accent.length === 2 ? payload.accent : ["#3F6B8E", "#6B4FA8"];
    const cx = W / 2;
    const isStory = aspect === "story";
    bgScene(ctx, accent, h);

    const topY = isStory ? 130 : 84;

    // Icon-Medaillon: großer, klar erkennbarer Anker statt eines kleinen
    // Emojis neben dem Kicker-Text.
    const medR = isStory ? 108 : 80;
    const medY = topY + medR;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, medY, medR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font("700", medR * 1.15);
    ctx.fillText(payload.icon || "🧭", cx, medY + medR * 0.06);
    ctx.textBaseline = "alphabetic";

    // Kicker als dunkle Glas-Pille (dunkles Overlay statt hellem) – bleibt auf
    // JEDER Akzentfarbe lesbar, auch auf hellen Verläufen (Gelb/Orange).
    let y = medY + medR + (isStory ? 56 : 38);
    ctx.font = font("700", isStory ? 32 : 28);
    const kickerTxt = String(payload.kicker || "").toUpperCase();
    const kw = ctx.measureText(kickerTxt).width + 56;
    const kh = isStory ? 58 : 50;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    roundRect(ctx, cx - kw / 2, y, kw, kh, kh / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(kickerTxt, cx, y + kh / 2 + 1);
    ctx.textBaseline = "alphabetic";
    y += kh + (isStory ? 40 : 26);

    // Titel des Themas
    const titleBottom = fitText(ctx, payload.title || "", cx, y, W - PAD * 2 - 40, {
      px: isStory ? 78 : 58, min: 36, weight: "800", color: "#ffffff", maxLines: 2,
    });
    y = titleBottom + (isStory ? 56 : 36);

    const panelY = y;
    const pw = W - PAD * 2;
    const innerX = PAD + 52;
    const innerW = pw - 104;
    const footerReserve = isStory ? 210 : 168;
    const panelMaxBottom = h - footerReserve;
    const minPanelH = isStory ? 480 : 360;

    // Grid eignet sich für kurze, gleichartige Einträge (Länder, Vokabelpaare,
    // Themen-Titel). Ein einzelner etwas längerer Ausreißer soll die ganze
    // Liste aber nicht in den (platzhungrigeren) Listenmodus zwingen – daher
    // ein Anteils- statt eines strikten "alle"-Kriteriums.
    const lines = payload.lines || [];
    const shortCount = lines.filter((l) => String(l.text || "").length <= 34).length;
    const useGrid = lines.length >= 4 && shortCount >= Math.ceil(lines.length * 0.8);

    const introPx = isStory ? 32 : 29;
    ctx.font = font("600", introPx);
    const introLines = payload.intro ? wrap(ctx, payload.intro, innerW) : [];
    const introH = introLines.length ? introLines.length * introPx * 1.4 + (isStory ? 40 : 34) : 0;
    const topPad = isStory ? 48 : 40, bottomPad = isStory ? 44 : 36;
    const availableForRows = (panelMaxBottom - panelY) - topPad - bottomPad - introH;

    const plan = useGrid
      ? planGrid(ctx, lines, innerW, isStory, availableForRows)
      : planList(ctx, lines, innerW, isStory, availableForRows);

    const contentH = introH + plan.totalH;
    const panelH = Math.max(minPanelH, Math.min(panelMaxBottom - panelY, contentH + topPad + bottomPad));

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, PAD, panelY, pw, panelH, 48);
    ctx.fill();
    ctx.restore();

    let iy = panelY + topPad;
    const bottom = panelY + panelH - bottomPad + 16;

    if (payload.intro) {
      iy = drawWrapped(ctx, payload.intro, innerX, iy, innerW, {
        px: introPx, weight: "600", color: MUTE, lineHeight: 1.4, maxBottom: bottom,
      }) + (isStory ? 40 : 34);
    }

    if (useGrid) drawGrid(ctx, lines, innerX, iy, isStory, plan, accent);
    else drawList(ctx, lines, innerX, iy, innerW, plan, accent);

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
    const base = linkBaseUrl();
    const url = p.moduleSlug
      ? base + (base.indexOf("?") === -1 ? "?" : "&") + "m=" + encodeURIComponent(p.moduleSlug)
      : base;
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
    if (kind === "rank") {
      let out = t("share.captionRankHead", { rank: String(p.rankName || "–"), xp: (p.xp == null ? 0 : p.xp) });
      out += `\n\n${t("share.captionRank")}`;
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
      const intro = String(p.intro || "").trim();
      let out = t("share.captionModuleHead", { title: title || BRAND });
      if (intro) out += `\n${intro}`;
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
             : kind === "rank" ? buildRank(payload, fmt)
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
               : kind === "rank" ? "holaruta-rang"
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
                : kind === "rank" ? "Mein HolaRuta-Reise-Rang"
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
  window.SC.share = { shareImage, buildCard, buildStats, buildPlacement, buildAssessment, buildRank, buildBadge, buildHistoria, buildHistOverview, buildTips };
})();
