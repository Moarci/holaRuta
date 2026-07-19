/*
 * hello-abroad-pwa.test.js – Drift-Wächter für die HelloAbroad-Edition (DE-EN):
 * eigenes Manifest, Deep-Link-Shortcuts, Social-Vorschau (OG) und die
 * Installationsanleitung. Nutzt den in Node eingebauten Test-Runner – KEINE
 * Dependencies.  Aufruf:  node --test
 *
 * Analog zu shortcuts.test.js / sw-assets.test.js, aber für
 * manifest-hello-abroad.webmanifest (das die anderen Tests bewusst NICHT
 * abdecken – sie prüfen nur das Standard-Manifest).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const normalize = (p) => p.replace(/^\.\//, "");
const isLocal = (p) => !/^(https?:)?\/\//i.test(p) && !/^data:/i.test(p);

const manifest = JSON.parse(read("manifest-hello-abroad.webmanifest"));
const appjs = read("app.js");

function swAssets() {
  const m = read("service-worker.js").match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, "service-worker.js: ASSETS-Liste nicht gefunden");
  return new Set([...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => normalize(x[1])));
}
const assetSet = swAssets();

function hasOpener(slug) {
  const re = new RegExp('(^|[\\s{,])(?:"' + slug + '"|' + slug + ')\\s*:', "m");
  return re.test(appjs);
}
function targetOf(url) {
  const q = url.split("?")[1] || "";
  const params = new URLSearchParams(q);
  if (params.get("a")) return { kind: "a", slug: params.get("a") };
  if (params.get("m")) return { kind: "m", slug: params.get("m") };
  return null;
}
function locValue(map, lang) {
  if (!map || typeof map !== "object") return "";
  const v = map[lang];
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof v.value === "string") return v.value;
  return "";
}

test("HelloAbroad-Manifest: Kernfelder passen zur Edition (id/track/start_url)", () => {
  assert.equal(manifest.id, "hello-abroad", "manifest.id muss 'hello-abroad' sein");
  assert.equal(manifest.short_name, "HelloAbroad");
  assert.ok(/edition=hello-abroad/.test(manifest.start_url),
    `start_url muss edition=hello-abroad tragen, ist "${manifest.start_url}"`);
});

test("HelloAbroad-Manifest: jedes Icon existiert und steht im SW-Precache", () => {
  for (const ic of manifest.icons || []) {
    if (!isLocal(ic.src)) continue;
    const ref = normalize(ic.src);
    assert.ok(fs.existsSync(path.join(SRC, ref)), `Icon "${ref}" existiert nicht`);
    assert.ok(assetSet.has(ref), `Icon "${ref}" fehlt im SW-Precache (offline kaputt)`);
  }
});

test("HelloAbroad-Manifest: nicht-leere shortcuts-Liste", () => {
  assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0,
    "manifest.shortcuts fehlt oder ist leer");
});

test("HelloAbroad-Shortcuts: relativer url, öffenbares Ziel UND edition=hello-abroad", () => {
  for (const sc of manifest.shortcuts) {
    assert.ok(sc.name, `Shortcut ohne name: ${JSON.stringify(sc)}`);
    assert.ok(typeof sc.url === "string" && sc.url.startsWith("./"),
      `Shortcut "${sc.name}": url muss relativ ("./…") sein, ist "${sc.url}"`);
    // Kritisch: ohne edition=hello-abroad öffnet der Shortcut die Standard-App
    // (Spanisch) statt HelloAbroad – gleiche Origin, gleiche Karten-IDs.
    assert.ok(/[?&]edition=hello-abroad(?:&|$)/.test(sc.url),
      `Shortcut "${sc.name}": url "${sc.url}" trägt kein edition=hello-abroad → öffnet die falsche Edition`);
    const t = targetOf(sc.url);
    assert.ok(t, `Shortcut "${sc.name}": url "${sc.url}" hat kein ?a=/?m= Ziel`);
    assert.ok(hasOpener(t.slug),
      `Shortcut "${sc.name}": app.js kann "${t.slug}" nicht öffnen (Opener/Aktion fehlt)`);
  }
});

test("HelloAbroad-Shortcuts: für de und en lokalisiert; Icons existieren + im Precache", () => {
  for (const sc of manifest.shortcuts) {
    for (const lang of ["de", "en"]) {
      const hasName = !!locValue(sc.name_localized, lang);
      const hasDesc = !!locValue(sc.description_localized, lang);
      assert.ok(hasName || hasDesc, `Shortcut "${sc.name}": keine ${lang}-Lokalisierung`);
    }
    for (const ic of sc.icons || []) {
      if (!isLocal(ic.src)) continue;
      const ref = normalize(ic.src);
      assert.ok(fs.existsSync(path.join(SRC, ref)), `Shortcut-Icon "${ref}" existiert nicht`);
      assert.ok(assetSet.has(ref), `Shortcut-Icon "${ref}" fehlt im SW-Precache (offline kaputt)`);
    }
  }
});

// PNG-Maße aus dem IHDR lesen (Bytes 16–24, Big-Endian) – dependency-frei.
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

test("HelloAbroad-Manifest: jeder Screenshot existiert und passt zur deklarierten size", () => {
  const shots = manifest.screenshots || [];
  assert.ok(shots.length >= 3, `zu wenige Screenshots (${shots.length})`);
  for (const s of shots) {
    const ref = normalize(s.src);
    const file = path.join(SRC, ref);
    assert.ok(fs.existsSync(file), `Screenshot "${ref}" existiert nicht (scripts/hello-abroad-shots.mjs)`);
    const [dw, dh] = String(s.sizes || "").split("x").map(Number);
    const { w, h } = pngSize(file);
    assert.equal(`${w}x${h}`, `${dw}x${dh}`,
      `Screenshot "${ref}": echte Maße ${w}x${h} ≠ deklarierte sizes ${dw}x${dh}`);
  }
});

test("HelloAbroad: OG-Vorschaubilder existieren (1200×630 + 1080×1080)", () => {
  for (const f of ["og-image-hello-abroad.png", "og-image-square-hello-abroad.png"]) {
    assert.ok(fs.existsSync(path.join(SRC, f)), `${f} fehlt (tools/og-image.js rendern)`);
  }
});

test("HelloAbroad-Redirect: eigene OG-Vorschau + Canonical auf die Edition", () => {
  const html = read("hello-abroad/index.html");
  assert.ok(/property="og:image"[^>]*og-image-hello-abroad\.png/.test(html)
    || /og-image-hello-abroad\.png/.test(html),
    "hello-abroad/index.html referenziert das HelloAbroad-OG-Bild nicht");
  assert.ok(/rel="canonical"[^>]*edition=hello-abroad/.test(html),
    "hello-abroad/index.html: Canonical muss auf ?edition=hello-abroad zeigen");
  assert.ok(/property="og:title"[^>]*HelloAbroad/.test(html),
    "hello-abroad/index.html: og:title sollte HelloAbroad benennen");
});

test("HelloAbroad: Installationsanleitung + QR existieren und werden in dist/ kopiert", () => {
  for (const f of ["docs/anleitungen/hello-abroad.html", "docs/anleitungen/qr-hello-abroad.svg"]) {
    assert.ok(fs.existsSync(path.join(SRC, f)), `${f} fehlt`);
  }
  const build = read("build.js");
  for (const f of [
    "og-image-hello-abroad.png", "og-image-square-hello-abroad.png",
    "docs/anleitungen/hello-abroad.html", "docs/anleitungen/qr-hello-abroad.svg",
  ]) {
    assert.ok(build.includes(`"${f}"`), `build.js kopiert "${f}" nicht nach dist/`);
  }
  // Der Anleitungs-Index muss die neue Seite verlinken (sonst findet sie niemand).
  assert.ok(read("docs/anleitungen/index.html").includes("hello-abroad.html"),
    "docs/anleitungen/index.html verlinkt hello-abroad.html nicht");
});
