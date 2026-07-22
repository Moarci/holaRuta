/*
 * gen-editions.js – erzeugt Edition-gebrandete Hostel-QR-Sticker aus einer Vorlage.
 *
 * Nutzt den repo-eigenen QR-Generator (../../qr.js → SC.qr.svg) für echte, scanbare
 * Codes und die Akzentfarben/Namen aus ../../editions/registry.js (Quelle der Wahrheit).
 * Ausgabe: hostel-qr-<edition>.svg. Neu ausführen mit:  node docs/sticker/gen-editions.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { svg } = require(path.join(__dirname, "..", "..", "qr.js"));

const BASE = "https://holaruta.com/";

// Hostel-/Reise-taugliche Co-Branding-Editionen. accent/brandInk gespiegelt aus
// editions/registry.js; `tint` ist ein aufgehellter Partner-Ton für den Verlauf;
// `label` = Chip-Text; `tagline` = kurzer, edition-spezifischer Zweitzeiler.
const EDITIONS = [
  { id: "hostel",   brandInk: "#B5681C", accent: "#E08A2C", tint: "#F0B45E", label: "HOSTEL",   tagline: "Für deinen Aufenthalt" },
  { id: "ecos",     brandInk: "#155C69", accent: "#1F7A8C", tint: "#4FA9BA", label: "ECOS · CARTAGENA", tagline: "Español para tu viaje" },
  { id: "weroad",   brandInk: "#D33A2C", accent: "#FB5A47", tint: "#FF8A72", label: "WEROAD",   tagline: "Spanish for the road" },
  { id: "medellin", brandInk: "#1F6B44", accent: "#2F8E5B", tint: "#5FB985", label: "MEDELLÍN", tagline: "Paisa-Spanisch to go" },
];

// QR als eingebettete <g>: weißer Rahmen + skalierter Pfad in Markenfarbe-Ink.
// Ruhezone = 4 Module (weiß), wie von der QR-Spezifikation empfohlen; das Modul
// wird so berechnet, dass Code + 4 Module Rand exakt in den Rahmen passen.
function qrGroup(url, frameX, frameY, frameSize, color) {
  const out = svg(url, { cellSize: 1, margin: 0, ecc: "M" });
  const n = parseInt(out.match(/viewBox="0 0 (\d+)/)[1], 10);
  const d = out.match(/<path d="([^"]+)"/)[1];
  const module = frameSize / (n + 8); // 4 Module Ruhezone auf jeder Seite
  const quiet = module * 4;
  const scale = module.toFixed(5);
  return (
    `<rect x="${frameX}" y="${frameY}" width="${frameSize}" height="${frameSize}" rx="22" fill="#FFFFFF" stroke="#2D1B12" stroke-opacity="0.12" stroke-width="2"/>` +
    `<g transform="translate(${(frameX + quiet).toFixed(3)},${(frameY + quiet).toFixed(3)}) scale(${scale})">` +
    `<path d="${d}" fill="${color}"/></g>`
  );
}

function sticker(e) {
  const url = BASE + "?edition=" + e.id;
  const qr = qrGroup(url, 210, 300, 280, e.brandInk);
  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  HolaRuta Sticker · Hostel · Edition „${e.label}"
  Automatisch erzeugt von docs/sticker/gen-editions.js – nicht von Hand editieren.
  QR → ${url}  ·  Akzent aus editions/registry.js
  Druckgröße: 70 × 70 mm · Vinyl matt · abgerundetes Quadrat.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="70mm" height="70mm" viewBox="0 0 700 700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${e.accent}"/>
      <stop offset="1" stop-color="${e.tint}"/>
    </linearGradient>
    <clipPath id="card"><rect x="8" y="8" width="684" height="684" rx="48"/></clipPath>
    <style>
      @font-face{font-family:'Bricolage Grotesque';src:url('../../fonts/bricolage-grotesque-600-800-latin.woff2') format('woff2');font-weight:600 800;}
      @font-face{font-family:'Instrument Sans';src:url('../../fonts/instrument-sans-400-700-latin.woff2') format('woff2');font-weight:400 700;}
    </style>
  </defs>
  <rect x="8" y="8" width="684" height="684" rx="48" fill="#FFFDF6" stroke="#2D1B12" stroke-opacity="0.14" stroke-width="3"/>
  <rect x="8" y="8" width="684" height="26" fill="url(#g)" clip-path="url(#card)"/>
  <g transform="translate(56,64) scale(0.125)">
    <rect width="512" height="512" rx="116" fill="url(#g)"/>
    <path d="M256 86 C326 86 382 142 382 212 C382 296 296 360 256 446 C216 360 130 296 130 212 C130 142 186 86 256 86 Z" fill="#FBF3E4"/>
    <text x="256" y="252" font-family="Bricolage Grotesque, Segoe UI, Arial, sans-serif" font-size="118" font-weight="800" fill="${e.accent}" text-anchor="middle">¿?</text>
  </g>
  <text x="136" y="108" font-family="Bricolage Grotesque, Segoe UI, Arial, sans-serif" font-size="50" font-weight="800" letter-spacing="-1"><tspan fill="#2D1B12">Hola</tspan><tspan fill="${e.accent}">Ruta</tspan></text>
  <rect x="138" y="122" width="${28 + e.label.length * 13}" height="34" rx="17" fill="${e.accent}" fill-opacity="0.14"/>
  <text x="${138 + (28 + e.label.length * 13) / 2}" y="145" font-family="Instrument Sans, Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="${e.brandInk}" text-anchor="middle" letter-spacing="1">${e.label}</text>
  <text x="56" y="228" font-family="Bricolage Grotesque, Segoe UI, Arial, sans-serif" font-size="58" font-weight="800" fill="#2D1B12" letter-spacing="-1">Survival Spanish</text>
  <text x="56" y="286" font-family="Bricolage Grotesque, Segoe UI, Arial, sans-serif" font-size="58" font-weight="800" fill="${e.accent}" letter-spacing="-1">for your trip.</text>
  ${qr}
  <text x="350" y="612" font-family="Instrument Sans, Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#6E5848" text-anchor="middle">holaruta.com · ${e.tagline}</text>
  <rect x="96" y="628" width="508" height="50" rx="25" fill="#3F7355" fill-opacity="0.12"/>
  <path d="M128 653 l8 9 l14 -20" fill="none" stroke="#3F7355" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="162" y="662" font-family="Instrument Sans, Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#3F7355">Offline · ohne Konto · kostenlos</text>
</svg>
`;
}

for (const e of EDITIONS) {
  const file = path.join(__dirname, `hostel-qr-${e.id}.svg`);
  fs.writeFileSync(file, sticker(e));
  console.log("wrote", path.relative(process.cwd(), file));
}
