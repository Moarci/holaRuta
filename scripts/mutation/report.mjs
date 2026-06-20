/*
 * scripts/mutation/report.mjs — Gemeinsame Formatierung für das Mutationstesting,
 * im Stil von scripts/e2e-verify.mjs (Padding, Trennlinien, ✓/✗, deutsch).
 *
 * Liefert formatReport({ catalog, engine, threshold }) → { text, exitCode }.
 *   catalog: [{ label, file, line, status }]   status ∈ "killed" | "survived" | "error"
 *   engine:  [{ module, killed, survived, equivalent, discarded, survivors:[{file,line,op,from,to}] }]
 *
 * exitCode 1, wenn eine Katalog-Mutation überlebt/fehlerhaft ist ODER ein
 * Engine-Modul-Score unter der Schwelle liegt. Sonst 0.
 */
"use strict";

const HR = "=".repeat(60);
const pad = (s, n) => (String(s) + " ".repeat(n)).slice(0, n);
const pct = (k, s) => (k + s === 0 ? 100 : Math.round((k / (k + s)) * 1000) / 10);

export function formatReport({ catalog = null, engine = null, threshold = 0 }) {
  const out = [];
  const p = (s = "") => out.push(s);
  let exitCode = 0;

  p("\n  HolaRuta · Mutationstesting\n  " + HR);

  // ---------------------------- Katalog ----------------------------
  if (catalog) {
    p("\n  [Katalog · kuratierte Invarianten · 100 % müssen gefangen werden]");
    let bad = 0;
    for (const c of catalog) {
      const ok = c.status === "killed";
      if (!ok) bad++;
      const mark = ok ? "✓ CAUGHT  " : c.status === "error" ? "‼ FEHLER  " : "✗ SURVIVED";
      p(`  ${mark}  ${pad(c.label, 42)} ${c.file}${c.line ? ":" + c.line : ""}`);
      if (!ok && c.detail) p(`               → ${c.detail}`);
    }
    p(`  ${HR}`);
    p(`  Katalog: ${catalog.length - bad}/${catalog.length} gefangen` + (bad ? `  ·  ${bad} OFFEN (Gate ROT)` : "  ·  alle gefangen"));
    if (bad) exitCode = 1;
  }

  // ---------------------------- Engine -----------------------------
  if (engine) {
    p("\n  [Engine · automatische Operatoren · Mutation-Score]");
    let tKill = 0, tSurv = 0;
    for (const m of engine) {
      tKill += m.killed; tSurv += m.survived;
      const score = pct(m.killed, m.survived);
      const under = score < threshold;
      if (under) exitCode = 1;
      p(`  ${under ? "✗" : "✓"}  ${pad(m.module, 14)} Score ${pad(score + "%", 7)} ` +
        `(getötet ${m.killed}, überlebt ${m.survived}, äquiv ${m.equivalent}, verworfen ${m.discarded})`);
      for (const s of m.survivors.slice(0, 12)) {
        p(`        ↳ überlebt  ${s.file}:${s.line}  ${s.op}  ${s.from} → ${s.to}`);
      }
      if (m.survivors.length > 12) p(`        … und ${m.survivors.length - 12} weitere`);
    }
    const overall = pct(tKill, tSurv);
    p(`  ${HR}`);
    p(`  Gesamt-Mutation-Score: ${overall}%  (Schwelle ${threshold}%)` +
      (overall < threshold ? "  ·  UNTER SCHWELLE (Gate ROT)" : "  ·  ok"));
    if (overall < threshold) exitCode = 1;
  }

  p("\n  " + HR);
  p(exitCode ? "  Ergebnis: ROT — siehe oben." : "  Ergebnis: grün.");
  p("");
  return { text: out.join("\n"), exitCode };
}

export { pad, HR };
