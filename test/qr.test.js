/*
 * qr.test.js – Sichert den QR-Generator (qr.js, vendored qrcode-generator) ab:
 * gültiges, skalierbares SVG für Links, sichere Behandlung von leerem Input und
 * korrekte window.SC.qr-Registrierung. So fällt ein kaputtes Vendoring sofort auf.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
const qr = require(path.join(__dirname, "..", "qr.js"));

test("qr.svg: erzeugt ein skalierbares SVG für einen Link", () => {
  const out = qr.svg("https://holaruta.com/?task=HRT1.abc123");
  assert.ok(out.startsWith("<svg"), "kein <svg>-Wurzelelement");
  assert.ok(out.includes("viewBox"), "kein viewBox – also nicht skalierbar");
  assert.ok(out.includes("<path"), "keine QR-Module gezeichnet");
  assert.ok(out.trim().endsWith("</svg>"), "SVG nicht sauber geschlossen");
});

test("qr.svg: leerer oder fehlender Input wirft nicht (liefert String)", () => {
  assert.equal(typeof qr.svg(""), "string");
  assert.equal(typeof qr.svg(null), "string");
  assert.equal(typeof qr.svg(undefined), "string");
});

test("qr.svg: längere Links erzeugen ein größeres Modul-Raster (Auto-Version)", () => {
  const short = qr.svg("https://x.co/?t=A");
  const long = qr.svg("https://holaruta.com/?task=" + "Z".repeat(120));
  assert.ok(long.length > short.length, "längerer Inhalt sollte ein dichteres QR ergeben");
});

test("qr.js: registriert window.SC.qr.svg", () => {
  assert.ok(window.SC && window.SC.qr && typeof window.SC.qr.svg === "function", "window.SC.qr.svg fehlt");
});
