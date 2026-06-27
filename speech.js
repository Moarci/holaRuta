/*
 * speech.js  (SC.speech) – Sprachausgabe der gelernten Antwort.
 * Nutzt die im Browser eingebaute Web Speech API (SpeechSynthesis) – keine
 * Abhängigkeit, kein Server. Die Stimme richtet sich nach dem aktiven Lern-Track
 * (SC.track.ttsLocale): Reise = lateinamerikanisches Spanisch, Locals = Englisch.
 * Wenn der Browser keine Sprachausgabe kann, passiert einfach nichts.
 */
(function () {
  "use strict";

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  function isSupported() {
    return !!synth;
  }

  // Ziel-Locale der Lernsprache aus dem Track. Graceful, falls SC.track (config.js)
  // nicht geladen ist: das bisherige Verhalten (LatAm-Spanisch) bleibt.
  function targetLocale() {
    const tr = (typeof window !== "undefined") && window.SC && window.SC.track;
    return (tr && typeof tr.ttsLocale === "function" && tr.ttsLocale()) || "es-419";
  }

  // Beste passende Stimme suchen: bevorzugt die Track-Locale (z. B. en-US/es-419),
  // sonst eine Stimme derselben Sprachfamilie, sonst null. Für Spanisch wird wie
  // bisher eine LatAm-Variante bevorzugt; für Englisch eine beliebige en-Stimme.
  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    const locale = targetLocale();
    const base = locale.slice(0, 2).toLowerCase(); // "es" | "en"
    const family = voices.filter((v) => v.lang && v.lang.slice(0, 2).toLowerCase() === base);
    if (!family.length) return null;
    if (base === "es") {
      const latam = family.find((v) => /es[-_](419|MX|US|AR|CO|CL|PE|EC|BO|UY|PY|VE|GT|CR)/i.test(v.lang));
      return latam || family[0];
    }
    // Englisch: exakte Locale (en-US) bevorzugen, sonst irgendeine en-Stimme.
    const exact = family.find((v) => v.lang.replace("_", "-").toLowerCase() === locale.toLowerCase());
    return exact || family[0];
  }

  // Tempo (rate) auf einen vom Browser akzeptierten Bereich begrenzen. Ohne
  // Angabe bleibt 0.95 (etwas langsamer – besser zum Nachsprechen). Werte
  // außerhalb 0.5..1.5 sind unzuverlässig/unverständlich -> gedeckelt.
  const DEFAULT_RATE = 0.95;
  function clampRate(rate) {
    if (typeof rate !== "number" || !isFinite(rate)) return DEFAULT_RATE;
    return Math.max(0.5, Math.min(1.5, rate));
  }

  // Spricht den Text. Bricht eine eventuell laufende Ausgabe vorher ab.
  // cancel() nur bei Bedarf: ein bedingungsloses cancel() direkt vor speak()
  // verschluckt auf iOS gelegentlich die erste Utterance.
  // rate (optional): Sprechgeschwindigkeit; fehlt sie, gilt DEFAULT_RATE.
  function speak(text, rate) {
    if (!synth || !text) return;
    try {
      if (synth.speaking || synth.pending) synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      const voice = pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = targetLocale(); // Fallback (Track-Locale), falls (noch) keine Stimme geladen ist
      }
      u.rate = clampRate(rate);
      synth.speak(u);
    } catch (err) {
      console.warn("speech: Ausgabe fehlgeschlagen", err);
    }
  }

  // Manche Browser laden Stimmen asynchron – einmal antriggern.
  if (synth && typeof synth.getVoices === "function") {
    synth.getVoices();
    if ("onvoiceschanged" in synth) {
      synth.onvoiceschanged = () => { /* Liste ist jetzt verfügbar */ };
    }
  }

  window.SC = window.SC || {};
  window.SC.speech = { speak, isSupported, pickVoice };
})();
