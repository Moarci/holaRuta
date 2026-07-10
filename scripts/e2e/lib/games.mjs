/*
 * scripts/e2e/lib/games.mjs — Geteilte Helfer für die P2-Game-Mode-Suiten.
 *
 * Game-Runden sind app-seitig nicht-deterministisch (kein ?seed=-Hook). Wir
 * assertieren daher INVARIANT/strukturell: eine Runde lässt sich starten, der
 * Fortschritt (Zähler „n/total" bzw. „Frage n von m") schreitet voran, die Runde
 * endet ohne pageerror. Keine exakten Werte.
 */
import { by } from "./harness.mjs";

// Öffnet einen Game-Mode über den Entdecken-Tab und (optional) dessen Start-Button.
export async function openGame(page, base, { opener, start } = {}) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.click(by.tab("entdecken")).catch(() => {});
  await page.waitForTimeout(150);
  await page.click(by.action(opener));
  await page.waitForTimeout(300);
  if (start) {
    await page.waitForSelector(by.action(start), { timeout: 5000 });
    await page.click(by.action(start));
    await page.waitForTimeout(350);
  }
}

// Liest den ersten „n/total"- bzw. „n von total"-Fortschrittszähler aus dem App-Text.
export function readProgress(page) {
  return page.evaluate(() => {
    const t = (document.getElementById("app") || {}).innerText || "";
    const m = t.match(/(\d+)\s*(?:\/|von)\s*(\d+)/i);
    return m ? { n: Number(m[1]), total: Number(m[2]) } : null;
  });
}

// Erstes sichtbares UND aktives (nicht disabled) Element zu einer Selektor-Liste.
// MC-Spiele deaktivieren nach der Antwort die Optionen und zeigen einen „Weiter"-
// Button — deshalb NIE auf disabled Elemente klicken (das würde 30 s blockieren).
async function firstActionable(page, combined) {
  const els = await page.$$(combined);
  for (const el of els) {
    try {
      if ((await el.isVisible()) && (await el.isEnabled())) return el;
    } catch { /* detached */ }
  }
  return null;
}

/*
 * Spielt eine Runde, indem wiederholt die erste AKTIVE „Antwort/Weiter"-Aktion
 * geklickt wird (MC-/Next-Spiele). `actions` sollte Antwort- UND Folge-Aktionen
 * enthalten (z. B. ["quiz-answer","quiz-next"]). Verfolgt den Fortschrittszähler.
 * Kurzer Click-Timeout + eine Auto-Advance-Nachprüfung machen den Loop hang-sicher.
 * @returns { clicks, startN, maxN, total, progressed, reachedEnd }
 */
export async function playByAction(page, actions, { maxSteps = 40, settle = 130 } = {}) {
  const combined = (Array.isArray(actions) ? actions : [actions]).map((a) => by.action(a)).join(", ");
  const first = await readProgress(page);
  let startN = first ? first.n : 0;
  let total = first ? first.total : 0;
  let maxN = startN, clicks = 0, reachedEnd = false;

  for (let i = 0; i < maxSteps; i++) {
    let el = await firstActionable(page, combined);
    if (!el) {
      // Möglicher Auto-Advance (Feedback deaktiviert die Buttons kurz) → einmal nachfassen.
      await page.waitForTimeout(settle + 250);
      el = await firstActionable(page, combined);
      if (!el) { reachedEnd = true; break; }
    }
    await el.click({ timeout: 2000 }).catch(() => {});
    clicks++;
    await page.waitForTimeout(settle);
    const p = await readProgress(page);
    if (p) { if (p.n > maxN) maxN = p.n; if (p.total) total = p.total; }
  }
  return { clicks, startN, maxN, total, progressed: maxN > startN, reachedEnd };
}
