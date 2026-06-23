"use strict";
/*
 * tools/audit-levels.js – Prüft die Schwierigkeits-Einstufung (lvl) der Lernkarten
 * auf zu NIEDRIG eingestufte Karten (z. B. ein B1-Satz, der als A1 markiert ist).
 *
 * Hintergrund: `lvl` (1 = A1, 2 = A2, 3 = B1) wird je Karte von Hand gepflegt
 * (data.js). Gerade in der „Ruta del día" landen so vereinzelt zu schwere Sätze
 * unter A1 – frustrierend für echte Einsteiger. Dieses Tool liest die `es`-Antwort
 * (das, was die Lernenden PRODUZIEREN müssen) und leitet aus klar erkennbaren
 * grammatischen Markern eine MINDEST-Stufe ab. Liegt die gepflegte Stufe darunter,
 * wird die Karte zur Prüfung gemeldet.
 *
 * Die Heuristik ist BEWUSST KONSERVATIV: nur eindeutige Marker zählen, damit echte
 * A1-Brocken (feste Höflichkeits-/Grußformeln, kurze Fragen) nicht hochwandern.
 * Sie ersetzt kein Sprachgefühl – sie zeigt Kandidaten fürs Review.
 *
 * Aufruf (Dev-Werkzeug, KEINE Runtime-Dependency der App):
 *   node tools/audit-levels.js            – Bericht (Markdown) auf stdout
 *   node tools/audit-levels.js --json     – maschinenlesbar (Liste der Mismatches)
 *   node tools/audit-levels.js --strict   – Exit-Code 1, wenn Mismatches gefunden
 *
 * Reine Lese-/Analyse-Logik, ändert keine Daten.
 */
const path = require("path");

globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "data.js"));
const data = globalThis.window.SC.data;

const LEVEL_SHORT = { 1: "A1", 2: "A2", 3: "B1" };

// Erste (Anzeige-)Variante der Antwort; mehrere Varianten sind mit " / " getrennt.
function primary(es) {
  return String(es || "").split("/")[0].trim();
}
function lower(es) {
  return primary(es).toLowerCase();
}

// Grammatische Wortzahl: Eigennamen (groß geschriebene Wörter außer am Satzanfang)
// zählen NICHT mit – „Viña del Mar" oder „Isla del Sol" blähen einen sonst simplen
// A1-Satz sonst künstlich auf und führen zu falschen Hochstufungen.
function gramWordCount(es) {
  const toks = primary(es).replace(/[¿?¡!.,;:()]/g, "").split(/\s+/).filter(Boolean);
  return toks.filter((t, i) => i === 0 || !/^[A-ZÁÉÍÓÚÑ]/.test(t)).length;
}

// Feste A1-Formeln, die zwar einen Konjunktiv enthalten, aber als Brocken gelernt
// werden (Gruß-/Wunschformeln). Sie dürfen NICHT als Subjuntivo hochgestuft werden.
const FORMULAIC_SUBJ = /\bque\s+(le|te|les)\s+vaya\s+bien\b|\bque\s+teng[ae]s?\s+(buen|buena|un|muy)\b|\bque\s+descanse|\bque\s+aproveche|\bque\s+est[eé]s?\s+(bien|muy)\b|\bbuen\s+provecho\b/;

// Echter Nebensatz-Subjuntivo: „que" + Konjunktivform (Relativ-/Finalsatz), z. B.
// „un cajero que funcione". Nur diese eng gefasste Form, damit Demonstrativa („este")
// und gleich lautende Substantive („el pase", „el cierre") nicht fälschlich treffen.
const QUE_SUBJ = /\bque\s+(funcione|funcionen|sirva|sirvan|tenga|tengan|haya|sea|sean|pueda|puedan|quede|queden|llegue|lleguen|cierre|abra|valga|incluya|quepa|d[eé]|d[eé]n|vaya|vayan|venga|salga|est[eé]n|recomiende|convenga)\b/;

// Imperfekt-/Konjunktiv II und Konditional-Bezug -> klar B1.
const PAST_SUBJ = /\b(fuera|fueras|fuese|hubiera|hubieras|hubiese|estuviera|estuvieras|pudiera|pudieras|tuviera|tuvieras|viniera|dijera|hiciera|diera|supiera)\b/;

// Höflichkeits-Konditional / „quisiera" -> A2 (eindeutige Formen).
const CONDITIONAL = /\b(podr[ií]a|podr[ií]as|podr[ií]amos|ser[ií]a|tendr[ií]a|gustar[ií]a|querr[ií]a|har[ií]a|deber[ií]a|habr[ií]a|estar[ií]a|quisiera|quisi[eé]ramos)\b/;

// Unterordnende Konjunktionen, die einen echten Nebensatz einleiten -> A2.
const SUBORDINATE = /\b(aunque|mientras|para que|antes de que|despu[eé]s de que|a menos que|hasta que|sin que|porque|ya que|en caso de que)\b/;

// Längster zusammenhängender Produktions-Satz gilt als A2-Signal: ab 10 grammatischen
// Wörtern ist die Satzplanung für echte Einsteiger zu anspruchsvoll.
const LONG_THRESHOLD = 10;

// Leitet die MINDEST-Stufe (1..3) aus der Sprachkomplexität der Antwort ab und
// liefert die ausschlaggebenden Gründe. Konservativ: im Zweifel niedrig.
function suggestMinLevel(card) {
  const es = lower(card.es);
  const reasons = [];
  let min = 1;

  if (PAST_SUBJ.test(es)) {
    reasons.push("Konjunktiv II / Imperfekt-Subjuntivo");
    min = Math.max(min, 3);
  }
  if (QUE_SUBJ.test(es) && !FORMULAIC_SUBJ.test(es)) {
    reasons.push("Subjuntivo im Nebensatz (que + Konjunktiv)");
    min = Math.max(min, 2);
  }
  if (CONDITIONAL.test(es)) {
    reasons.push("Konditional / höfliches „quisiera“");
    min = Math.max(min, 2);
  }
  if (SUBORDINATE.test(es)) {
    reasons.push("untergeordneter Nebensatz");
    min = Math.max(min, 2);
  }
  const w = gramWordCount(card.es);
  if (w >= LONG_THRESHOLD) {
    reasons.push(`langer Satz (${w} Wörter)`);
    min = Math.max(min, 2);
  }
  return { min, reasons };
}

// Alle Karten, deren gepflegte Stufe UNTER der vorgeschlagenen Mindeststufe liegt.
function findMismatches() {
  return (data.CARDS || [])
    .map((c) => {
      const { min, reasons } = suggestMinLevel(c);
      return { card: c, min, reasons };
    })
    .filter((x) => x.card.lvl < x.min)
    .sort((a, b) =>
      (b.min - b.card.lvl) - (a.min - a.card.lvl) ||
      String(a.card.cat).localeCompare(String(b.card.cat)) ||
      String(a.card.id).localeCompare(String(b.card.id)));
}

function report(mismatches) {
  const lines = [];
  lines.push("# Stufen-Audit (zu niedrig eingestufte Karten)");
  lines.push("");
  lines.push(`Geprüft: ${data.CARDS.length} Karten. Auffällig: **${mismatches.length}**.`);
  lines.push("");
  lines.push("Heuristik meldet Karten, deren `es`-Antwort grammatisch über der gepflegten");
  lines.push("Stufe liegt. Konservativ – bitte als Review-Kandidaten lesen, nicht als Urteil.");
  lines.push("");
  const byJump = mismatches.filter((m) => m.min - m.card.lvl >= 2);
  if (byJump.length) {
    lines.push(`> ⚠️ ${byJump.length} Karten ≥ 2 Stufen zu niedrig (zuerst prüfen).`);
    lines.push("");
  }
  lines.push("| id | cat | ist | → soll | Grund | Antwort (es) |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const m of mismatches) {
    const c = m.card;
    lines.push(
      `| \`${c.id}\` | ${c.cat} | ${LEVEL_SHORT[c.lvl]} | ${LEVEL_SHORT[m.min]} | ${m.reasons.join("; ")} | ${primary(c.es)} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const mismatches = findMismatches();
  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(
      mismatches.map((m) => ({
        id: m.card.id, cat: m.card.cat, lvl: m.card.lvl,
        suggest: m.min, reasons: m.reasons, es: primary(m.card.es),
      })), null, 2) + "\n");
  } else {
    process.stdout.write(report(mismatches) + "\n");
  }
  if (args.includes("--strict") && mismatches.length) process.exit(1);
}

if (require.main === module) main();

module.exports = { suggestMinLevel, findMismatches, gramWordCount };
