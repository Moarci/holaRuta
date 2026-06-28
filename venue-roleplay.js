/*
 * venue-roleplay.js  (SC.venueRoleplay) – Inhalt für das Zwei-Seiten-Venue-Rollenspiel.
 *
 * Idee (siehe WETTBEWERB-EN.md §4, P1): Im selben Venue (Hostel/Hotel) sitzt ein
 * GAST, der Spanisch übt, und ein MITARBEITER (Personal), der Englisch übt. Eine
 * Szene wird auf EINEM Gerät im Wechsel gespielt (Pass-and-play, offline, kein Konto):
 * jede:r produziert seine Zeile in der EIGENEN Lernsprache, die andere Seite hört zu.
 * Genau diese Zwei-Richtungs-Übung kann nur HolaRuta, weil beide Lern-Tracks in einer
 * Engine liegen – der einzige nicht kopierbare Wedge gegenüber ELSA/Voxy/Dexway.
 *
 * Reines additives Daten-Modul (keine Logik, keine DOM). Die Spiel-Logik lebt in
 * features/venue-roleplay-game.js (SC.venueRoleplayGame). Schema einer Szene:
 *   { id, icon, title:{es,en,de}, turns:[ turn… ] }
 * Schema eines Zuges (turn):
 *   role   : "guest" | "staff"     – wer ist gerade am Zug (zum Gerät durchreichen)
 *   target : "es" | "en"           – Sprache, die die aktive Person PRODUZIERT
 *                                    (guest übt es, staff übt en); steuert auch die TTS-Stimme
 *   say    : String                – die Musterzeile (= die richtige Option), für
 *                                    Verlaufsspur + Vorlesen
 *   instr  : { es, en, de }         – Anweisung in der MUTTERSPRACHE der aktiven Person
 *                                    (guest liest de/en je UI-Sprache; staff liest es)
 *   options: [ { t, ok } … ]        – 3 Auswahlmöglichkeiten in der target-Sprache,
 *                                    genau eine ok:true
 *
 * Inhalt agent-erstellt (Prototyp). Vor einem Schul-/Hotel-Einsatz gilt wie für die
 * 818 Locals-Karten das offene Muttersprachler-Sign-off (RISIKO R13 / WETTBEWERB-EN §3).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  var SCENES = [
    {
      id: "checkin",
      icon: "lc:bell",
      title: { es: "Check-in en recepción", en: "Hotel check-in", de: "Check-in an der Rezeption" },
      turns: [
        {
          role: "staff", target: "en", say: "Good evening! Welcome to the hotel.",
          instr: { es: "Saluda al huésped y dale la bienvenida.", en: "Greet the guest and welcome them.", de: "Begrüße den Gast und heiße ihn willkommen." },
          options: [
            { t: "Good evening! Welcome to the hotel.", ok: true },
            { t: "Sorry, we are full tonight.", ok: false },
            { t: "The bill, please.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Hola, buenas. Tengo una reserva.",
          instr: { es: "Saluda y di que tienes una reserva.", en: "Greet and say you have a reservation.", de: "Begrüße und sag, dass du eine Reservierung hast." },
          options: [
            { t: "Hola, buenas. Tengo una reserva.", ok: true },
            { t: "¿Dónde está la playa?", ok: false },
            { t: "La cuenta, por favor.", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "Of course. May I see your passport, please?",
          instr: { es: "Pide el pasaporte con cortesía.", en: "Ask politely to see their passport.", de: "Bitte höflich um den Reisepass." },
          options: [
            { t: "Of course. May I see your passport, please?", ok: true },
            { t: "Why are you so late?", ok: false },
            { t: "No passport, no room.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Aquí tiene. ¿El desayuno está incluido?",
          instr: { es: "Entrégalo y pregunta si el desayuno está incluido.", en: "Hand it over and ask whether breakfast is included.", de: "Gib ihn und frag, ob das Frühstück inklusive ist." },
          options: [
            { t: "Aquí tiene. ¿El desayuno está incluido?", ok: true },
            { t: "No tengo pasaporte.", ok: false },
            { t: "¿Puedo pagar mañana?", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "Yes, breakfast is from seven to ten. Your room is 204.",
          instr: { es: "Di que sí, de 7 a 10, y dale la habitación 204.", en: "Say yes, from 7 to 10, and give them room 204.", de: "Sag ja, von 7 bis 10, und gib Zimmer 204." },
          options: [
            { t: "Yes, breakfast is from seven to ten. Your room is 204.", ok: true },
            { t: "No, breakfast is not for guests.", ok: false },
            { t: "We have no rooms left.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Gracias. ¿Cuál es la clave del wifi?",
          instr: { es: "Da las gracias y pregunta la clave del wifi.", en: "Thank them and ask for the wifi password.", de: "Bedanke dich und frag nach dem WLAN-Passwort." },
          options: [
            { t: "Gracias. ¿Cuál es la clave del wifi?", ok: true },
            { t: "No me gusta la habitación.", ok: false },
            { t: "¿A qué hora cierra la playa?", ok: false },
          ],
        },
      ],
    },
    {
      id: "restaurant",
      icon: "lc:utensils",
      title: { es: "En el restaurante", en: "At the restaurant", de: "Im Restaurant" },
      turns: [
        {
          role: "staff", target: "en", say: "Hi there! Do you have a reservation?",
          instr: { es: "Saluda y pregunta si tienen reserva.", en: "Greet and ask whether they have a reservation.", de: "Begrüße und frag, ob sie eine Reservierung haben." },
          options: [
            { t: "Hi there! Do you have a reservation?", ok: true },
            { t: "We are closed, goodbye.", ok: false },
            { t: "Pay first, please.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Buenas, una mesa para dos, por favor.",
          instr: { es: "Pide una mesa para dos personas.", en: "Ask for a table for two.", de: "Bitte um einen Tisch für zwei." },
          options: [
            { t: "Buenas, una mesa para dos, por favor.", ok: true },
            { t: "La habitación 204, por favor.", ok: false },
            { t: "¿Dónde está el aeropuerto?", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "Sure. Would you like still or sparkling water?",
          instr: { es: "Ofrece agua: con o sin gas.", en: "Offer water: still or sparkling.", de: "Biete Wasser an: mit oder ohne Kohlensäure." },
          options: [
            { t: "Sure. Would you like still or sparkling water?", ok: true },
            { t: "We have no water today.", ok: false },
            { t: "The kitchen is closed.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Sin gas, por favor. ¿Qué nos recomienda?",
          instr: { es: "Pide agua sin gas y pregunta qué recomienda.", en: "Ask for still water and ask for a recommendation.", de: "Bitte um stilles Wasser und frag nach einer Empfehlung." },
          options: [
            { t: "Sin gas, por favor. ¿Qué nos recomienda?", ok: true },
            { t: "No quiero nada, gracias.", ok: false },
            { t: "¿Cuánto cuesta el taxi?", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "The grilled fish is excellent today.",
          instr: { es: "Recomienda el pescado a la parrilla.", en: "Recommend the grilled fish.", de: "Empfiehl den gegrillten Fisch." },
          options: [
            { t: "The grilled fish is excellent today.", ok: true },
            { t: "Everything here is bad.", ok: false },
            { t: "I don't work here.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "Perfecto, lo probamos. La cuenta luego, gracias.",
          instr: { es: "Di que lo prueban y pide la cuenta para luego.", en: "Say you'll try it and ask for the bill later.", de: "Sag, dass ihr ihn probiert, und bitte später um die Rechnung." },
          options: [
            { t: "Perfecto, lo probamos. La cuenta luego, gracias.", ok: true },
            { t: "No tengo reserva.", ok: false },
            { t: "¿El desayuno está incluido?", ok: false },
          ],
        },
      ],
    },
    {
      id: "directions",
      icon: "lc:map-pin",
      title: { es: "Indicaciones y consejos", en: "Directions & tips", de: "Wegbeschreibung & Tipps" },
      turns: [
        {
          role: "guest", target: "es", say: "Disculpe, ¿cómo llego al centro histórico?",
          instr: { es: "Pregunta con cortesía cómo llegar al centro histórico.", en: "Politely ask how to get to the old town.", de: "Frag höflich, wie man in die Altstadt kommt." },
          options: [
            { t: "Disculpe, ¿cómo llego al centro histórico?", ok: true },
            { t: "Una mesa para dos, por favor.", ok: false },
            { t: "Tengo una reserva.", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "Take a taxi; it's about ten minutes from here.",
          instr: { es: "Di que en taxi son unos diez minutos.", en: "Say it's about ten minutes by taxi.", de: "Sag, dass es mit dem Taxi etwa zehn Minuten sind." },
          options: [
            { t: "Take a taxi; it's about ten minutes from here.", ok: true },
            { t: "I have no idea, sorry.", ok: false },
            { t: "Breakfast is from seven to ten.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "¿Cuánto cuesta más o menos?",
          instr: { es: "Pregunta cuánto cuesta, más o menos.", en: "Ask roughly how much it costs.", de: "Frag, wie viel es ungefähr kostet." },
          options: [
            { t: "¿Cuánto cuesta más o menos?", ok: true },
            { t: "¿Cuál es la clave del wifi?", ok: false },
            { t: "Sin gas, por favor.", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "Around fifteen thousand pesos.",
          instr: { es: "Di que cuesta unos quince mil pesos.", en: "Say it's around fifteen thousand pesos.", de: "Sag, dass es etwa fünfzehntausend Pesos kostet." },
          options: [
            { t: "Around fifteen thousand pesos.", ok: true },
            { t: "It is completely free.", ok: false },
            { t: "We don't accept cards.", ok: false },
          ],
        },
        {
          role: "guest", target: "es", say: "¿Es seguro caminar de noche?",
          instr: { es: "Pregunta si es seguro caminar de noche.", en: "Ask whether it's safe to walk at night.", de: "Frag, ob es nachts sicher ist zu Fuß." },
          options: [
            { t: "¿Es seguro caminar de noche?", ok: true },
            { t: "¿El desayuno está incluido?", ok: false },
            { t: "Una mesa para dos.", ok: false },
          ],
        },
        {
          role: "staff", target: "en", say: "At night it's better to take a taxi.",
          instr: { es: "Recomienda tomar taxi de noche.", en: "Recommend taking a taxi at night.", de: "Empfiehl, nachts ein Taxi zu nehmen." },
          options: [
            { t: "At night it's better to take a taxi.", ok: true },
            { t: "Just run very fast.", ok: false },
            { t: "The pool closes at ten.", ok: false },
          ],
        },
      ],
    },
  ];

  window.SC.venueRoleplay = { SCENES: SCENES };
})();
