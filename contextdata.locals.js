/*
 * contextdata.locals.js  (SC.contextDataLocals) – Arbeits-/Alltags-Kontext für die
 * LOCALS-Lernkarten (Track es-en: Spanisch-Sprecher lernen Englisch). REINE DATEN.
 * Pendant zu contextdata.js, nur in der GEDREHTEN Lernrichtung. Wird in context.js
 * (expandLocals) an die loc-* Karten gehängt – nur im Locals-Track (data.locals.js
 * hat die Karten dann in SC.data.CARDS eingehängt). Schlüssel = Karten-id.
 *
 * Kompakte Schreibweise pro Eintrag:
 *   e   = englischer Beispielsatz – echter, sprechbarer Satz aus dem Arbeitsalltag
 *         (Hostelería/Tourismus, Tag-für-Tag, Job). Die zu lernende Sprache.
 *   t   = spanische Übersetzung des Satzes (Verständnishilfe, LatAm-Spanisch)
 *   s   = situación (Spanisch) – konkrete Situation: wann sagt man das?
 *   sEn = situation (Englisch) – gleiche Aussage auf Englisch
 *   n   = consejo (Spanisch) – kurzer Tipp / Besonderheit / höflichere Variante
 *   nEn = tip (Englisch) – gleiche Aussage auf Englisch
 *
 * Inhaltsregeln: immer ein echter, natürlicher Satz, den Personal/Locals bei der
 * Arbeit sagt – nicht schulisch, nicht künstlich. Englisch korrekt und idiomatisch
 * (neutral-international, US/UK-neutral wo möglich). Lieber ein guter Satz als drei
 * mittlere. {name} wird zur Laufzeit ersetzt (selten nötig).
 */
(function () {
  "use strict";

  var C = {
    // ===================== En el restaurante (meseros) =====================
    "loc-mes01": { e: "Are you ready to order, or do you need a few more minutes?", t: "¿Están listos para ordenar, o necesitan unos minutos más?", s: "Cuando te acercas a una mesa para tomar el pedido.", sEn: "When you approach a table to take the order.", n: "Añadir \"a few more minutes\" suena más amable que solo \"ready to order?\".", nEn: "Adding \"a few more minutes\" sounds friendlier than just \"ready to order?\"." },
    "loc-mes02": { e: "Would you like anything to drink?", t: "¿Algo de tomar?", s: "Al empezar a atender la mesa, antes de la comida.", sEn: "When you start serving the table, before the food.", n: "\"Would you like…\" es más cortés que \"Do you want…\".", nEn: "\"Would you like…\" is more polite than \"Do you want…\"." },
  };

  var SC = window.SC || (window.SC = {});
  SC.contextDataLocals = C;
})();
