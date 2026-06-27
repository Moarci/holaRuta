/*
 * data.locals.js – Lerninhalt für den LOCALS-Track (Spanisch lernt Englisch).
 * REINE DATEN. Lädt NACH data.js und hängt – NUR wenn der Locals-Track aktiv ist
 * (SC.config.track === "es-en") – arbeitsweltnahe Kategorien & Karten an
 * SC.data an. Im Reise-Track passiert nichts (graceful), die App bleibt identisch.
 *
 * Karten-Schema wie in data.js, Richtung gedreht:
 *   es  = Frage (Muttersprache der Lernenden, Spanisch)
 *   en  = zu lernende Antwort (Englisch)
 *   tip = Aussprachehilfe der ENGLISCHEN Antwort für Spanisch-Sprecher
 * (kein de-Feld nötig – im Locals-Track ist die Frage immer Spanisch.)
 *
 * PILOT: Cluster „Hospitality/Turismo" (Cartagena-nah). Weitere Cluster
 * (Alltag, Beruf, Schule/Prüfung) werden nach demselben Muster ergänzt.
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // Neue Themen-Kategorien (group "locals" → eigener Abschnitt auf der Startseite).
  var CATEGORIES = [
    { id: "meseros",   label: "En el restaurante", labelEn: "At the restaurant", icon: "🍽️", grad: ["#CB5A2B", "#E0743C"], group: "locals" },
    { id: "recepcion", label: "En la recepción",   labelEn: "At reception",      icon: "🛎️", grad: ["#1F7A8C", "#3E8388"], group: "locals" },
    { id: "guias",     label: "Tours y guías",     labelEn: "Tours & guides",    icon: "🧭", grad: ["#7D4A8E", "#9763A6"], group: "locals" },
  ];

  // Karten. lvl: 1=Einsteiger, 2=Mittel. tip = englische Aussprache (Spanisch-phonetisch).
  var CARDS = [
    // --- meseros (Kellner:innen / Service) ---
    { id: "loc-mes01", cat: "meseros", lvl: 1, es: "¿Están listos para ordenar?", en: "Are you ready to order?", tip: "ar yu RE-di tu OR-der" },
    { id: "loc-mes02", cat: "meseros", lvl: 1, es: "¿Algo de tomar?", en: "Anything to drink?", tip: "E-ni-zing tu drink" },
    { id: "loc-mes03", cat: "meseros", lvl: 1, es: "¿Para comer aquí o para llevar?", en: "For here or to go?", tip: "for HIR or tu góu" },
    { id: "loc-mes04", cat: "meseros", lvl: 1, es: "Aquí tiene el menú.", en: "Here is the menu.", tip: "HIR is da MÉ-niu" },
    { id: "loc-mes05", cat: "meseros", lvl: 2, es: "¿Cómo desea su bistec?", en: "How would you like your steak?", tip: "jau wud yu laik yor stéik" },
    { id: "loc-mes06", cat: "meseros", lvl: 2, es: "¿Tiene alguna alergia?", en: "Do you have any allergies?", tip: "du yu jav É-ni Á-ler-yis" },
    { id: "loc-mes07", cat: "meseros", lvl: 2, es: "El plato del día es pescado.", en: "Today's special is fish.", tip: "tu-DÉIS SPÉ-shal is fish" },
    { id: "loc-mes08", cat: "meseros", lvl: 1, es: "¿Desea algún postre?", en: "Would you like any dessert?", tip: "wud yu laik É-ni di-SÉRT" },
    { id: "loc-mes09", cat: "meseros", lvl: 1, es: "Enseguida le traigo la cuenta.", en: "I'll bring you the bill right away.", tip: "ail bring yu da bil rait a-WÉI" },
    { id: "loc-mes10", cat: "meseros", lvl: 1, es: "Disculpe la demora.", en: "Sorry for the wait.", tip: "SO-rri for da wéit" },

    // --- recepción (Rezeption / Hostal) ---
    { id: "loc-rec01", cat: "recepcion", lvl: 1, es: "Bienvenido, ¿tiene una reserva?", en: "Welcome, do you have a reservation?", tip: "WÉL-com, du yu jav a re-ser-VÉI-shon" },
    { id: "loc-rec02", cat: "recepcion", lvl: 1, es: "¿Me permite su pasaporte?", en: "May I see your passport?", tip: "mei ai si yor PÁS-port" },
    { id: "loc-rec03", cat: "recepcion", lvl: 1, es: "El desayuno es de siete a diez.", en: "Breakfast is from seven to ten.", tip: "BRÉK-fast is from SÉ-ven tu ten" },
    { id: "loc-rec04", cat: "recepcion", lvl: 2, es: "Su habitación está en el segundo piso.", en: "Your room is on the second floor.", tip: "yor rum is on da SÉ-cond flor" },
    { id: "loc-rec05", cat: "recepcion", lvl: 1, es: "El wifi es gratis.", en: "The wifi is free.", tip: "da WÁI-fai is fri" },
    { id: "loc-rec06", cat: "recepcion", lvl: 2, es: "¿A qué hora es la salida?", en: "What time is check-out?", tip: "wat taim is CHÉK-aut" },
    { id: "loc-rec07", cat: "recepcion", lvl: 1, es: "¿Necesita una toalla extra?", en: "Do you need an extra towel?", tip: "du yu nid an ÉKS-tra TÁU-el" },
    { id: "loc-rec08", cat: "recepcion", lvl: 1, es: "Con gusto le ayudo.", en: "I'm happy to help you.", tip: "aim JÁ-pi tu jelp yu" },
    { id: "loc-rec09", cat: "recepcion", lvl: 2, es: "Lo siento, estamos llenos.", en: "I'm sorry, we're fully booked.", tip: "aim SO-rri, wir FÚ-li bukt" },
    { id: "loc-rec10", cat: "recepcion", lvl: 2, es: "¿Qué tal su estadía?", en: "How was your stay?", tip: "jau was yor stéi" },

    // --- guías (Tour-Guides) ---
    { id: "loc-gui01", cat: "guias", lvl: 1, es: "Bienvenidos al tour.", en: "Welcome to the tour.", tip: "WÉL-com tu da tur" },
    { id: "loc-gui02", cat: "guias", lvl: 1, es: "Síganme, por favor.", en: "Please follow me.", tip: "plis FÓ-lou mi" },
    { id: "loc-gui03", cat: "guias", lvl: 2, es: "Por aquí, cuidado con el escalón.", en: "This way, mind the step.", tip: "dis wéi, maind da step" },
    { id: "loc-gui04", cat: "guias", lvl: 2, es: "La ciudad fue fundada en 1533.", en: "The city was founded in 1533.", tip: "da SÍ-ti was FÁUN-ded in FIF-tin ZÉR-ti zri" },
    { id: "loc-gui05", cat: "guias", lvl: 2, es: "Tenemos quince minutos para fotos.", en: "We have fifteen minutes for photos.", tip: "wi jav fif-TÍN MÍ-nits for FÓU-tos" },
    { id: "loc-gui06", cat: "guias", lvl: 2, es: "No se alejen del grupo.", en: "Please don't stray from the group.", tip: "plis dont strei from da grup" },
    { id: "loc-gui07", cat: "guias", lvl: 1, es: "Nos vemos en el bus a las tres.", en: "Let's meet at the bus at three.", tip: "lets mit at da bas at zri" },
    { id: "loc-gui08", cat: "guias", lvl: 1, es: "¿Tienen alguna pregunta?", en: "Do you have any questions?", tip: "du yu jav É-ni KUÉS-chons" },
    { id: "loc-gui09", cat: "guias", lvl: 2, es: "Cuiden sus pertenencias.", en: "Keep your belongings safe.", tip: "kip yor bi-LONG-ings séif" },
    { id: "loc-gui10", cat: "guias", lvl: 1, es: "Espero que disfruten la visita.", en: "I hope you enjoy the visit.", tip: "ai joup yu en-YÓI da VÍ-sit" },
  ];

  // Kuratiertes Schnellstart-Paket (analog data.js PRESETS). scope = Kategorie-Id.
  var PRESETS = [
    { id: "locals-meseros", scope: "meseros", pick: CARDS.filter(function (c) { return c.cat === "meseros"; }).map(function (c) { return c.id; }) },
    { id: "locals-recepcion", scope: "recepcion", pick: CARDS.filter(function (c) { return c.cat === "recepcion"; }).map(function (c) { return c.id; }) },
  ];

  // Öffentlich machen (für Tests / spätere Cluster), …
  SC.dataLocals = { CATEGORIES: CATEGORIES, CARDS: CARDS, PRESETS: PRESETS };

  // … und NUR im Locals-Track in den aktiven Korpus einhängen. data.js hat SC.data
  // bereits angelegt; wir hängen idempotent an (kein doppeltes Einfügen bei Re-Eval).
  try {
    var isLocals = SC.config && SC.config.track === "es-en";
    if (isLocals && SC.data && Array.isArray(SC.data.CARDS)) {
      var have = {};
      SC.data.CARDS.forEach(function (c) { have[c.id] = true; });
      if (!have["loc-mes01"]) {
        // Locals-Kategorien VORN einsortieren (eigener Abschnitt zuerst), Karten anhängen.
        SC.data.CATEGORIES = CATEGORIES.concat(SC.data.CATEGORIES);
        SC.data.CARDS = SC.data.CARDS.concat(CARDS);
        SC.data.PRESETS = (SC.data.PRESETS || []).concat(PRESETS);
      }
    }
  } catch (e) { /* ohne Config/Data: stiller Rückfall, App läuft wie gehabt */ }
})();
