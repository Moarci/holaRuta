/*
 * boot.js – die drei kleinen Boot-Schritte, die früher als Inline-Skripte in
 * index.html lagen. Ausgelagert, damit die CSP der Multi-File-Auslieferung
 * script-src 'self' (OHNE 'unsafe-inline') erzwingen kann; der Single-File-
 * Build bettet diese Datei wieder inline ein und patcht die CSP (build.js).
 *
 * Läuft bewusst parser-blockend im <head> VOR styles.css (kein defer):
 * das Theme muss vor dem ersten Paint stehen, sonst blitzt die App im
 * Dunkeln hell auf. Die Abschnitte 2+3 registrieren hier nur load-Listener;
 * #boot existiert beim Ausführen im <head> noch NICHT – darum werden alle
 * Element-Lookups erst INNERHALB der Handler aufgelöst.
 *
 * Bewusst app-unabhängig (kein window.SC): selbst wenn app.js wirft, blendet
 * der Splash beim load-Event verlässlich weg und blockiert nie die App.
 */

/* 1) Theme so früh wie möglich setzen (verhindert Hell-Aufblitzen, wenn man im
 *    Hostel-Bett im Dunkeln öffnet). Gemerkte Wahl schlägt die System-Vorliebe.
 *    Der OS-PWA-Splash wird aus dem Manifest-background_color gemalt – und Android
 *    friert genau eine Farbe beim Installieren ein (keine Media-Query, kein Wechsel
 *    zur Laufzeit). Darum ist background_color in BEIDEN Manifesten das dunkle
 *    Marken-Braun (#241510): blendet nie, im Hellmodus bewusster Marken-Splash.
 *    Im Dark Mode hängen wir trotzdem auf das dunkle Manifest um – das verfeinert
 *    nur noch die theme_color (Toolbar/Statusleiste) der installierten App. */
(function () {
  window.__bootStart = Date.now(); // Startzeit für den In-App-Splash (Mindestdauer)
  try {
    var s = JSON.parse(localStorage.getItem("spanischcard.settings.v1") || "{}");
    var t = (s && (s.theme === "dark" || s.theme === "light")) ? s.theme
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0E0907" : "#241510");
    // Edition-Erkennung VOR config.js unmöglich (boot.js läuft zuerst, DOM-frei) -
    // liest darum direkt denselben ?edition=-Query-Param wie editions/registry.js.
    var isHelloAbroad = /(?:^|[?&])edition=hello-abroad(?:&|$)/.test(location.search);
    var man = document.querySelector('link[rel="manifest"]');
    if (man) man.setAttribute("href", isHelloAbroad ? "manifest-hello-abroad.webmanifest" : (t === "dark" ? "manifest-dark.webmanifest" : "manifest.webmanifest"));
    // apple-touch-icon ist NICHT Teil des Manifests (iOS liest es separat aus
    // index.html) - ohne diesen zweiten Swap würde "Zum Home-Bildschirm" auf
    // iOS weiterhin das HolaRuta-Icon zeigen.
    var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon && isHelloAbroad) appleIcon.setAttribute("href", "icon-180-hello-abroad.png");
  } catch (e) { /* localStorage gesperrt o.ä. – App startet hell */ }
})();

/* 2) Schrumpf-Animation erst beim load-Event loslassen – NICHT schon beim Parsen.
 *    Hintergrund: als installierte PWA zeigt das System zuerst seinen eigenen
 *    Start-Bildschirm und übergibt erst beim ersten Paint an die echte Seite.
 *    Würde die Animation (wie früher) schon ein paar Frames nach den Skripten
 *    starten, liefe sie noch WÄHREND dieser Übergabe – und weil CSS-Animationen
 *    nach Wanduhr-Zeit laufen, wäre das Logo beim ersten sichtbaren Frame längst
 *    fast klein. Genau das „Springen". load feuert erst NACH dem ersten Paint,
 *    also wenn der Nutzer den großen Start-Frame (scale 2.8) wirklich sieht;
 *    die zwei requestAnimationFrame stellen sicher, dass dieser große Frame
 *    präsentiert ist, bevor das Schrumpfen losgeht. __bootStart wird hier
 *    gesetzt, damit die Mindest-Anzeigedauer ab diesem sichtbaren Start zählt. */
(function () {
  var started = false;
  function go() {
    if (started) return; // load + Fallback-Timeout dürfen sich nicht doppeln
    started = true;
    var boot = document.getElementById("boot");
    if (!boot) return;
    window.__bootStart = Date.now();
    if (window.requestAnimationFrame) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { boot.classList.add("is-ready"); });
      });
    } else { boot.classList.add("is-ready"); }
  }
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
  // Notnagel: hängt eine Ressource, soll das Logo trotzdem schrumpfen statt
  // groß einzufrieren. 3 s liegt klar nach dem normalen load, stört also nie.
  setTimeout(go, 3000);
})();

/* 3) Start-Splash wegblenden, sobald die App steht – aber mind. ~1,9 s zeigen,
 *    damit Schrumpfen/Aufstieg/Regenbogen-Wisch fertig landen und kurz stehen,
 *    statt abgeschnitten wegzublitzen (__bootStart wird in Abschnitt 1 gesetzt). */
(function () {
  // Mindest-Anzeigedauer: muss die GESAMTE Boot-Animation abdecken, sonst
  // blendet der Splash weg, bevor man etwas sieht. Die Spuren enden (relativ
  // zum is-ready-Start) bei: Schrumpfen 1,15 s · Name-Aufstieg 0,78 + 0,55 =
  // 1,33 s · Regenbogen-Wisch 0,92 + 0,8 = 1,72 s. Bei 800 ms (alter Wert)
  // startete der Wisch nie und der Name blitzte nur kurz auf – die Animation
  // wirkte „kaputt". 1900 ms lässt alle drei landen + kurz stehen. Bei
  // prefers-reduced-motion sofort weg (0 ms) – keine erzwungene Wartezeit.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MIN = reduce ? 0 : 1900;
  var start = window.__bootStart || Date.now();
  function done() {
    var boot = document.getElementById("boot");
    if (boot) boot.classList.add("is-done");
  }
  function hide() {
    var wait = Math.max(0, MIN - (Date.now() - start));
    setTimeout(function () {
      var boot = document.getElementById("boot");
      if (!boot) return;
      boot.classList.add("is-hiding");
      boot.addEventListener("transitionend", done, { once: true });
      setTimeout(done, 700); // Fallback, falls transitionend ausbleibt
    }, wait);
  }
  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide, { once: true });
})();
