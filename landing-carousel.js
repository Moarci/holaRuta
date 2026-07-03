/*
 * landing-carousel.js – Beispielkarten-Karussell der B2B-Landing-Pages
 * (landing-schule/-hostel/-reiseanbieter.html). EINE geteilte Implementierung
 * statt dreier Inline-Kopien; die Seiten liefern Markup (#lpCar mit .lp-slide,
 * #lpPills mit .lp-herocard__pill) und i18n, hier wohnt nur das Verhalten:
 *
 *  – Szenario-Pills schalten die Karten um (Pendant zu den Punkten der
 *    B2C-Landing), Tippen dreht die Karte, 🔊 liest vor, 🧭 öffnet den
 *    Reise-Kontext (wie in der App).
 *  – Auto-Rotation NUR bis zur ersten bewussten Navigation (Pill/Wisch):
 *    die Pills sind Szenario-Tabs, eine explizite Wahl darf nicht 4 s
 *    später wegrotieren. Hover/Fokus (Karussell UND Pill-Zeile) pausiert.
 *  – Inaktive Slides sind inert und aus der Tab-Reihenfolge genommen –
 *    aria-hidden-Inhalte dürfen nicht fokussierbar sein (WCAG).
 *  – Nutzer-initiierte Kartenwechsel werden über eine aria-live-Region
 *    angekündigt; das Auto-Weiterblättern bewusst nicht (sonst spricht
 *    der Screenreader alle 4 Sekunden dazwischen).
 */
(function () {
  "use strict";

  function init() {
    var car = document.getElementById("lpCar");
    if (!car) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var slides = Array.prototype.slice.call(car.querySelectorAll(".lp-slide"));
    var flips = slides.map(function (s) { return s.querySelector(".flip"); });
    var pillRow = document.getElementById("lpPills");
    var pills = pillRow ? Array.prototype.slice.call(pillRow.querySelectorAll(".lp-herocard__pill")) : [];
    var idx = 0, timer = null, swiped = false, userNavigated = false;
    var AUTO = 4200;

    // Unsichtbare Live-Region hinter dem Karussell: kündigt NUTZER-initiierte
    // Kartenwechsel an (Kategorie + Frage-Seite der neuen Karte).
    var live = document.createElement("span");
    live.className = "lp-visually-hidden";
    live.setAttribute("aria-live", "polite");
    car.insertAdjacentElement("afterend", live);

    // Inaktive Slides komplett aus Fokus & Accessibility-Tree nehmen: `inert`
    // für moderne Browser, tabindex-Fallback (Flip-Karte + Eck-Buttons) für ältere.
    function setInactive(slide, off) {
      if ("inert" in slide) slide.inert = off;
      var f = slide.querySelector(".flip");
      if (f) f.setAttribute("tabindex", off ? "-1" : "0");
      var btns = slide.querySelectorAll(".cardbtn");
      for (var b = 0; b < btns.length; b++) btns[b].tabIndex = off ? -1 : 0;
    }

    function setActive(i, announce) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === idx;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
        setInactive(s, !on);
        if (!on) { // beim Wegblättern zurück auf die Vorderseite + Kontext schließen
          var f = flips[n];
          if (f) { f.classList.remove("is-flipped"); f.setAttribute("aria-pressed", "false"); }
          var cp = s.querySelector(".lp-ctxpanel");
          if (cp) cp.setAttribute("hidden", "");
          var cb = s.querySelector(".cardbtn--ctx");
          if (cb) { cb.classList.remove("is-open"); cb.setAttribute("aria-expanded", "false"); }
        }
      });
      pills.forEach(function (p, n) {
        p.setAttribute("aria-pressed", n === idx ? "true" : "false");
      });
      if (announce) {
        var front = slides[idx].querySelector(".face--front");
        var cat = front && front.querySelector(".face__cat");
        var word = front && front.querySelector(".face__word");
        live.textContent = (cat ? cat.textContent + ": " : "") + (word ? word.textContent : "");
      }
    }
    function next() { setActive(idx + 1); }

    function startAuto() { if (reduce || userNavigated) return; stopAuto(); timer = setInterval(next, AUTO); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    // Bewusste Navigation (Pill oder Wisch) beendet die Auto-Rotation dauerhaft.
    function userNav(i) { userNavigated = true; stopAuto(); setActive(i, true); }

    // Flip + Vorlesen + Reise-Kontext pro Karte
    flips.forEach(function (f) {
      if (!f) return;
      var slide = f.closest(".lp-slide");
      var ctxBtn = f.querySelector(".cardbtn--ctx");
      var panel = slide ? slide.querySelector(".lp-ctxpanel") : null;
      function closeCtx() {
        if (panel) panel.setAttribute("hidden", "");
        if (ctxBtn) { ctxBtn.classList.remove("is-open"); ctxBtn.setAttribute("aria-expanded", "false"); }
      }
      function flip() {
        var on = f.classList.toggle("is-flipped");
        f.setAttribute("aria-pressed", on ? "true" : "false");
        if (!on) closeCtx();                       // zurück auf Vorderseite -> Kontext zu
      }
      f.addEventListener("click", function (e) {
        if (swiped) return;                        // war ein Wisch, kein Tap
        if (e.target.closest(".cardbtn")) return;  // Eck-Button nicht als Flip werten
        flip();
      });
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
      });
      // 🧭 Reise-Kontext: blendet das App-Panel unter der Karte ein/aus (Pendant
      // zum 🔊; klappt auf, ohne die Karte umzudrehen). Wie in der App.
      if (ctxBtn && panel) ctxBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var willOpen = panel.hasAttribute("hidden");
        if (willOpen) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
        ctxBtn.classList.toggle("is-open", willOpen);
        ctxBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
      var spk = f.querySelector(".cardbtn--speak");
      if (spk) spk.addEventListener("click", function (e) {
        e.stopPropagation();
        try {
          if (!("speechSynthesis" in window)) return;
          var u = new window.SpeechSynthesisUtterance(spk.getAttribute("data-spk") || "");
          u.lang = "es-419"; u.rate = 0.95;
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
        } catch (err) {}
      });
    });

    // Pill-Navigation: Pills sind Szenario-Tabs – die Wahl bleibt stehen.
    pills.forEach(function (p, n) {
      p.addEventListener("click", function () { userNav(n); });
    });

    // Auto-Rotation pausieren bei Hover/Fokus – auf Karussell UND Pill-Zeile,
    // damit auch das Lesen der Pills nichts unterm Zeiger wegdreht.
    [car, pillRow].forEach(function (zone) {
      if (!zone) return;
      zone.addEventListener("pointerenter", stopAuto);
      zone.addEventListener("pointerleave", startAuto);
      zone.addEventListener("focusin", stopAuto);
      zone.addEventListener("focusout", startAuto);
    });

    // Wisch-Geste (Touch & Maus). pointerup hängt am window, damit ein Release
    // auch AUSSERHALB des Karussells erkannt wird. Ein erkannter Wisch setzt
    // `swiped` -> der nachfolgende Klick dreht die Karte NICHT um.
    var dragX = null, dragY = null;
    car.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".cardbtn")) return; // auf Buttons keinen Wisch starten
      dragX = e.clientX; dragY = e.clientY; swiped = false;
    });
    window.addEventListener("pointerup", function (e) {
      if (dragX === null) return;
      var dx = e.clientX - dragX, dy = e.clientY - dragY;
      dragX = dragY = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { // klar horizontal
        swiped = true;
        userNav(idx + (dx < 0 ? 1 : -1));
      }
    });
    car.addEventListener("pointercancel", function () { dragX = dragY = null; });

    setActive(0);
    startAuto();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
