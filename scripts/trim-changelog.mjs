/*
 * trim-changelog.mjs – Einmaliger Helfer: lagert die VOLLE Änderungshistorie
 * nach docs/CHANGELOG.md aus und kürzt changelog.js auf die letzten N Einträge.
 *
 * Hintergrund: changelog.js wird in jeden Client geladen UND vom Service Worker
 * precacht. Die App rendert aber nie die ganze Historie – nur `since(seenVersion)`
 * (das „Was ist neu?"-Fenster). Ältere Einträge sind im Bundle totes Gewicht.
 * Die vollständige, zweisprachige Historie bleibt in docs/CHANGELOG.md erhalten.
 *
 * Aufruf:  node scripts/trim-changelog.mjs [N]   (Default N=25)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP = Number(process.argv[2]) || 25;

// changelog.js als Browser-IIFE laden, um an die geparsten entries zu kommen.
globalThis.window = globalThis.window || {};
await import(path.join(ROOT, "changelog.js"));
const { entries } = globalThis.window.SC.changelog;

// 1) Volle, zweisprachige Historie nach docs/CHANGELOG.md schreiben.
const md = [];
md.push("# Änderungshistorie (HolaRuta)");
md.push("");
md.push("Vollständiger Verlauf. Die App selbst zeigt im „Was ist neu?\"-Fenster nur");
md.push("die jüngsten Einträge (`changelog.js`); dieses Dokument ist das komplette Archiv.");
md.push("");
for (const e of entries) {
  md.push(`## v${e.version} — ${e.date}`);
  md.push("");
  md.push(`**${e.title}**`);
  md.push("");
  for (const it of e.items) md.push(`- ${it}`);
  md.push("");
  md.push("<details><summary>English</summary>");
  md.push("");
  md.push(`**${e.titleEn}**`);
  md.push("");
  for (const it of e.itemsEn) md.push(`- ${it}`);
  md.push("");
  md.push("</details>");
  md.push("");
}
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs", "CHANGELOG.md"), md.join("\n"));

// 2) changelog.js textuell auf die letzten KEEP Einträge kürzen.
const file = path.join(ROOT, "changelog.js");
const lines = fs.readFileSync(file, "utf8").split("\n");
const opens = [];
lines.forEach((l, i) => { if (l === "    {") opens.push(i); });
const closeIdx = lines.findIndex((l) => l === "  ];");
if (opens.length <= KEEP) {
  console.log(`changelog.js hat nur ${opens.length} Einträge (<= ${KEEP}) – nichts zu kürzen.`);
} else {
  const cutFrom = opens[KEEP];          // erste Zeile des (KEEP+1)-ten Eintrags
  const note = [
    "    // Ältere Einträge bewusst NICHT mehr im ausgelieferten Bundle (Payload):",
    "    // der vollständige, zweisprachige Verlauf steht in docs/CHANGELOG.md.",
    "    // Neu generieren via: node scripts/trim-changelog.mjs",
  ];
  const trimmed = lines.slice(0, cutFrom).concat(note, lines.slice(closeIdx));
  fs.writeFileSync(file, trimmed.join("\n"));
  console.log(`changelog.js: ${opens.length} -> ${KEEP} Einträge inline. Rest in docs/CHANGELOG.md.`);
}
