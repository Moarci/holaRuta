/*
 * speech.js  (SC.speech) – Sprachausgabe der spanischen Antwort.
 * Nutzt die im Browser eingebaute Web Speech API (SpeechSynthesis) – keine
 * Abhängigkeit, kein Server. Wählt nach Möglichkeit eine lateinamerikanische
 * Stimme. Wenn der Browser keine Sprachausgabe kann, passiert einfach nichts.
 */
(function () {
  "use strict";

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  function isSupported() {
    return !!synth;
  }

  // Beste passende Stimme suchen: bevorzugt LatAm-Spanisch, sonst irgendein Spanisch.
  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    const spanish = voices.filter((v) => /^es/i.test(v.lang));
    const latam = spanish.find((v) => /es[-_](419|MX|US|AR|CO|CL|PE|EC|BO|UY|PY|VE|GT|CR)/i.test(v.lang));
    return latam || spanish[0] || null;
  }

  // Spricht den Text. Bricht eine eventuell laufende Ausgabe vorher ab.
  // cancel() nur bei Bedarf: ein bedingungsloses cancel() direkt vor speak()
  // verschluckt auf iOS gelegentlich die erste Utterance.
  function speak(text) {
    if (!synth || !text) return;
    try {
      if (synth.speaking || synth.pending) synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      const voice = pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "es-ES"; // Fallback, falls (noch) keine Stimme geladen ist
      }
      u.rate = 0.95; // etwas langsamer – besser zum Nachsprechen
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
