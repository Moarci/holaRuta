/*
 * dialogos.js  (SC.dialogos) – Daten für die Gesprächs-Simulationen (Diálogos).
 * REINE DATEN, additiv – die Wörterbasis bleibt unangetastet.
 *
 * Idee: echte Reisesituationen Zug für Zug durchspielen. Die Gegenseite (npc)
 * wird angezeigt und – wenn der Browser TTS kann – vorgelesen; der Nutzer
 * antwortet je nach Zug per Multiple-Choice (kind:"mc") oder tippt eine
 * Schlüssel-Replik frei (kind:"type", großzügig per matcher.normalize geprüft).
 *
 * Struktur:
 *   DIALOGOS_SCENARIOS = Menü: { id, title, icon, lvl, intro }
 *   DIALOGOS           = die Dialoge: { id, cat(=scenario.id), title, lvl, turns[] }
 *     turn npc  : { who:"npc",  es, de }
 *     turn mc   : { who:"user", kind:"mc",   de, solEs, options:[{es, ok}] }
 *     turn type : { who:"user", kind:"type", de, solEs, accept:[…] }
 *       de    = Handlungsanweisung („(sag, dass du einchecken willst)")
 *       solEs = die Musterantwort (erscheint in der Verlaufsspur)
 *       accept= zusätzlich akzeptierte (normalisierte) Eingaben neben solEs
 */
(function () {
  "use strict";

  const DIALOGOS_SCENARIOS = [
    { id: "hotel",      title: "Hotel-Checkin",   icon: "🛎️", lvl: 1, intro: "An der Rezeption einchecken." },
    { id: "restaurante",title: "Im Restaurant",   icon: "🍽️", lvl: 1, intro: "Bestellen, fragen, zahlen." },
    { id: "bus",        title: "Busticket kaufen", icon: "🚌", lvl: 1, intro: "Am Schalter ein Ticket lösen." },
    { id: "taxi",       title: "Taxifahrt",       icon: "🚕", lvl: 1, intro: "Ziel nennen und Preis klären." },
    { id: "mercado",    title: "Auf dem Markt",   icon: "🛍️", lvl: 2, intro: "Fragen und freundlich feilschen." },
    { id: "farmacia",   title: "In der Apotheke", icon: "💊", lvl: 2, intro: "Beschwerden schildern, Hilfe holen." },
    { id: "hostel",     title: "Hostel-Smalltalk", icon: "🛏️", lvl: 2, intro: "Andere Reisende kennenlernen." },
    { id: "frontera",   title: "An der Grenze",   icon: "🛂", lvl: 2, intro: "Ein- und Ausreise-Fragen." },
    { id: "emergencia", title: "Notfall",         icon: "🆘", lvl: 2, intro: "Schnell um Hilfe bitten." },
    { id: "calle",      title: "Nach dem Weg fragen", icon: "🧭", lvl: 1, intro: "Sich auf der Straße orientieren." },
  ];

  const DIALOGOS = [
    {
      id: "hotel01", cat: "hotel", title: "An der Rezeption", lvl: 1,
      turns: [
        { who: "npc", es: "¡Buenas! ¿En qué le puedo ayudar?", de: "Hallo! Wie kann ich Ihnen helfen?" },
        { who: "user", kind: "mc", de: "(sag, dass du einchecken möchtest)", solEs: "Quisiera hacer el check-in, por favor.",
          options: [
            { es: "Quisiera hacer el check-in, por favor.", ok: true },
            { es: "La cuenta, por favor.", ok: false },
            { es: "¿Dónde está el baño?", ok: false },
          ] },
        { who: "npc", es: "Claro. ¿A nombre de quién está la reserva?", de: "Klar. Auf welchen Namen läuft die Reservierung?" },
        { who: "user", kind: "type", de: "(antworte: auf den Namen Marco)", solEs: "A nombre de Marco.",
          accept: ["a nombre de marco", "marco", "es marco", "me llamo marco"] },
        { who: "npc", es: "Perfecto. Aquí tiene su llave. La habitación está en el segundo piso.", de: "Perfekt. Hier ist Ihr Schlüssel. Das Zimmer ist im zweiten Stock." },
        { who: "user", kind: "mc", de: "(frag, um wie viel Uhr es Frühstück gibt)", solEs: "¿A qué hora es el desayuno?",
          options: [
            { es: "¿A qué hora es el desayuno?", ok: true },
            { es: "¿Cuánto cuesta el taxi?", ok: false },
            { es: "¿Tienen mesa para dos?", ok: false },
          ] },
        { who: "npc", es: "De siete a diez de la mañana. ¡Que descanse!", de: "Von sieben bis zehn Uhr morgens. Gute Erholung!" },
      ],
    },
    {
      id: "restaurante01", cat: "restaurante", title: "Bestellen & zahlen", lvl: 1,
      turns: [
        { who: "npc", es: "Buenas tardes. ¿Ya saben qué van a pedir?", de: "Guten Tag. Wissen Sie schon, was Sie bestellen möchten?" },
        { who: "user", kind: "mc", de: "(sag, dass du die Speisekarte möchtest)", solEs: "¿Me trae la carta, por favor?",
          options: [
            { es: "¿Me trae la carta, por favor?", ok: true },
            { es: "La cuenta, por favor.", ok: false },
            { es: "Estoy lleno, gracias.", ok: false },
          ] },
        { who: "npc", es: "Por supuesto. Aquí tiene. Hoy el plato del día es pollo con arroz.", de: "Natürlich. Hier bitte. Das Tagesgericht ist heute Hähnchen mit Reis." },
        { who: "user", kind: "type", de: "(bestelle das Tagesgericht und ein Wasser)", solEs: "Quiero el plato del día y un agua, por favor.",
          accept: ["quiero el plato del dia y un agua", "el plato del dia y un agua", "para mi el plato del dia y un agua"] },
        { who: "npc", es: "Excelente. ¿Algo más para tomar?", de: "Ausgezeichnet. Noch etwas zu trinken?" },
        { who: "user", kind: "mc", de: "(lehne höflich ab – nichts weiter)", solEs: "No, así está bien, gracias.",
          options: [
            { es: "No, así está bien, gracias.", ok: true },
            { es: "Sí, la cuenta por favor.", ok: false },
            { es: "No tengo hambre.", ok: false },
          ] },
        { who: "npc", es: "Perfecto, enseguida se lo traigo.", de: "Perfekt, ich bringe es Ihnen gleich." },
      ],
    },
    {
      id: "bus01", cat: "bus", title: "Am Busschalter", lvl: 1,
      turns: [
        { who: "npc", es: "¡Siguiente! ¿Para dónde va?", de: "Der Nächste! Wohin möchten Sie?" },
        { who: "user", kind: "type", de: "(sag, du willst ein Ticket nach Cusco)", solEs: "Quiero un boleto para Cusco.",
          accept: ["quiero un boleto para cusco", "un boleto para cusco", "para cusco", "un pasaje para cusco", "quiero un pasaje para cusco"] },
        { who: "npc", es: "¿Para hoy o para mañana?", de: "Für heute oder für morgen?" },
        { who: "user", kind: "mc", de: "(sag: für morgen früh)", solEs: "Para mañana en la mañana.",
          options: [
            { es: "Para mañana en la mañana.", ok: true },
            { es: "Para hoy en la noche.", ok: false },
            { es: "No sé, gracias.", ok: false },
          ] },
        { who: "npc", es: "Hay uno a las ocho. Son cuarenta soles.", de: "Es gibt einen um acht. Das macht vierzig Soles." },
        { who: "user", kind: "mc", de: "(frag, von welchem Bahnsteig er abfährt)", solEs: "¿De qué andén sale?",
          options: [
            { es: "¿De qué andén sale?", ok: true },
            { es: "¿Cuánto cuesta el hotel?", ok: false },
            { es: "¿Tiene wifi?", ok: false },
          ] },
        { who: "npc", es: "Del andén número cinco. ¡Buen viaje!", de: "Von Bahnsteig Nummer fünf. Gute Reise!" },
      ],
    },
    {
      id: "taxi01", cat: "taxi", title: "Ins Zentrum", lvl: 1,
      turns: [
        { who: "npc", es: "¿A dónde lo llevo?", de: "Wohin darf ich Sie fahren?" },
        { who: "user", kind: "type", de: "(sag, du willst zum Stadtzentrum)", solEs: "Al centro, por favor.",
          accept: ["al centro", "al centro por favor", "quiero ir al centro", "voy al centro"] },
        { who: "npc", es: "Claro. ¿Conoce la dirección exacta?", de: "Klar. Kennen Sie die genaue Adresse?" },
        { who: "user", kind: "mc", de: "(frag vorher, wie viel die Fahrt kostet)", solEs: "¿Cuánto cuesta hasta allá?",
          options: [
            { es: "¿Cuánto cuesta hasta allá?", ok: true },
            { es: "¿Puedo pagar mañana?", ok: false },
            { es: "¿Tiene cambio de cien?", ok: false },
          ] },
        { who: "npc", es: "Unos quince mil. ¿Le parece bien?", de: "So um die fünfzehntausend. Geht das in Ordnung?" },
        { who: "user", kind: "mc", de: "(stimm zu und bitte ihn loszufahren)", solEs: "Está bien, vamos.",
          options: [
            { es: "Está bien, vamos.", ok: true },
            { es: "No, gracias, camino.", ok: false },
            { es: "Es muy barato.", ok: false },
          ] },
        { who: "npc", es: "¡Listo! Póngase el cinturón, por favor.", de: "Alles klar! Schnallen Sie sich bitte an." },
      ],
    },
    {
      id: "mercado01", cat: "mercado", title: "Obst & Feilschen", lvl: 2,
      turns: [
        { who: "npc", es: "¡Pásele, casero! ¿Qué va a llevar?", de: "Kommen Sie ran, mein Lieber! Was darf's sein?" },
        { who: "user", kind: "mc", de: "(frag, wie viel das Kilo Mangos kostet)", solEs: "¿A cuánto está el kilo de mango?",
          options: [
            { es: "¿A cuánto está el kilo de mango?", ok: true },
            { es: "¿Dónde está la salida?", ok: false },
            { es: "¿Me regala una bolsa?", ok: false },
          ] },
        { who: "npc", es: "A cinco mil el kilo, bien dulces.", de: "Fünftausend das Kilo, schön süß." },
        { who: "user", kind: "type", de: "(feilsche freundlich: ob er es etwas billiger macht)", solEs: "¿Me lo deja más barato?",
          accept: ["me lo deja mas barato", "mas barato", "un poco mas barato", "me hace un descuento", "me da mas barato"] },
        { who: "npc", es: "Bueno… para usted, cuatro mil quinientos.", de: "Na gut … für Sie viertausendfünfhundert." },
        { who: "user", kind: "mc", de: "(nimm zwei Kilo)", solEs: "Listo, deme dos kilos.",
          options: [
            { es: "Listo, deme dos kilos.", ok: true },
            { es: "No, está muy caro.", ok: false },
            { es: "Solo estoy mirando.", ok: false },
          ] },
        { who: "npc", es: "¡Gracias, casero! Aquí tiene.", de: "Danke, mein Lieber! Hier bitte." },
      ],
    },
    {
      id: "farmacia01", cat: "farmacia", title: "Kopfschmerzen", lvl: 2,
      turns: [
        { who: "npc", es: "Buenos días, ¿en qué le ayudo?", de: "Guten Morgen, wie kann ich helfen?" },
        { who: "user", kind: "type", de: "(sag, du hast Kopfschmerzen)", solEs: "Me duele la cabeza.",
          accept: ["me duele la cabeza", "tengo dolor de cabeza", "me duele mucho la cabeza"] },
        { who: "npc", es: "¿Desde cuándo se siente así?", de: "Seit wann fühlen Sie sich so?" },
        { who: "user", kind: "mc", de: "(sag: seit heute Morgen)", solEs: "Desde esta mañana.",
          options: [
            { es: "Desde esta mañana.", ok: true },
            { es: "Desde hace un año.", ok: false },
            { es: "No tengo dinero.", ok: false },
          ] },
        { who: "npc", es: "Le puedo dar algo para el dolor. ¿Es alérgico a algo?", de: "Ich kann Ihnen etwas gegen die Schmerzen geben. Sind Sie gegen etwas allergisch?" },
        { who: "user", kind: "mc", de: "(sag, du bist gegen nichts allergisch)", solEs: "No, no soy alérgico a nada.",
          options: [
            { es: "No, no soy alérgico a nada.", ok: true },
            { es: "Sí, quiero dos.", ok: false },
            { es: "No hablo español.", ok: false },
          ] },
        { who: "npc", es: "Bien. Tome una pastilla cada ocho horas con comida.", de: "Gut. Nehmen Sie alle acht Stunden eine Tablette mit dem Essen." },
      ],
    },
    {
      id: "hostel01", cat: "hostel", title: "Im Gemeinschaftsraum", lvl: 2,
      turns: [
        { who: "npc", es: "¡Hola! ¿Recién llegas? ¿De dónde eres?", de: "Hi! Gerade angekommen? Woher kommst du?" },
        { who: "user", kind: "type", de: "(sag, du kommst aus Deutschland)", solEs: "Soy de Alemania.",
          accept: ["soy de alemania", "de alemania", "vengo de alemania", "yo soy de alemania"] },
        { who: "npc", es: "¡Qué bueno! ¿Y cuánto tiempo vas a quedarte?", de: "Wie schön! Und wie lange bleibst du?" },
        { who: "user", kind: "mc", de: "(sag: drei Nächte)", solEs: "Tres noches.",
          options: [
            { es: "Tres noches.", ok: true },
            { es: "Cuesta mucho.", ok: false },
            { es: "Estoy perdido.", ok: false },
          ] },
        { who: "npc", es: "Genial. Hoy varios vamos a un bar. ¿Te apuntas?", de: "Super. Heute gehen ein paar von uns in eine Bar. Bist du dabei?" },
        { who: "user", kind: "mc", de: "(sag begeistert zu)", solEs: "¡Claro, me apunto!",
          options: [
            { es: "¡Claro, me apunto!", ok: true },
            { es: "No, estoy lleno.", ok: false },
            { es: "¿Cuánto cuesta la cama?", ok: false },
          ] },
        { who: "npc", es: "¡Perfecto! Nos vemos a las ocho aquí.", de: "Perfekt! Wir sehen uns um acht hier." },
      ],
    },
    {
      id: "frontera01", cat: "frontera", title: "Einreise-Kontrolle", lvl: 2,
      turns: [
        { who: "npc", es: "Pasaporte, por favor. ¿Cuál es el motivo de su viaje?", de: "Reisepass, bitte. Was ist der Grund Ihrer Reise?" },
        { who: "user", kind: "mc", de: "(sag, du bist als Tourist hier)", solEs: "Soy turista, vengo de vacaciones.",
          options: [
            { es: "Soy turista, vengo de vacaciones.", ok: true },
            { es: "Vengo a trabajar aquí.", ok: false },
            { es: "No sé, gracias.", ok: false },
          ] },
        { who: "npc", es: "¿Cuántos días piensa quedarse?", de: "Wie viele Tage möchten Sie bleiben?" },
        { who: "user", kind: "type", de: "(sag: zwei Wochen)", solEs: "Dos semanas.",
          accept: ["dos semanas", "unas dos semanas", "catorce dias", "quince dias"] },
        { who: "npc", es: "¿Tiene dónde quedarse?", de: "Haben Sie eine Unterkunft?" },
        { who: "user", kind: "mc", de: "(sag, du hast ein Hostel reserviert)", solEs: "Sí, tengo una reserva en un hostal.",
          options: [
            { es: "Sí, tengo una reserva en un hostal.", ok: true },
            { es: "No, no tengo nada.", ok: false },
            { es: "Quiero un boleto de bus.", ok: false },
          ] },
        { who: "npc", es: "Muy bien. Bienvenido. Que disfrute su viaje.", de: "Sehr gut. Willkommen. Genießen Sie Ihre Reise." },
      ],
    },
    {
      id: "emergencia01", cat: "emergencia", title: "Hilfe rufen", lvl: 2,
      turns: [
        { who: "npc", es: "¿Está bien? ¿Qué pasó?", de: "Geht es Ihnen gut? Was ist passiert?" },
        { who: "user", kind: "type", de: "(bitte dringend um Hilfe)", solEs: "¡Necesito ayuda, por favor!",
          accept: ["necesito ayuda", "necesito ayuda por favor", "ayuda por favor", "ayudenme", "ayuda"] },
        { who: "npc", es: "Tranquilo. ¿Qué necesita?", de: "Ruhig. Was brauchen Sie?" },
        { who: "user", kind: "mc", de: "(sag, du brauchst einen Arzt)", solEs: "Necesito un médico.",
          options: [
            { es: "Necesito un médico.", ok: true },
            { es: "Necesito un taxi al aeropuerto.", ok: false },
            { es: "Quiero la cuenta.", ok: false },
          ] },
        { who: "npc", es: "Ya llamo a una ambulancia. ¿Le duele algo?", de: "Ich rufe sofort einen Krankenwagen. Tut Ihnen etwas weh?" },
        { who: "user", kind: "mc", de: "(sag, dein Bein tut sehr weh)", solEs: "Sí, me duele mucho la pierna.",
          options: [
            { es: "Sí, me duele mucho la pierna.", ok: true },
            { es: "No, estoy de vacaciones.", ok: false },
            { es: "Gracias, así está bien.", ok: false },
          ] },
        { who: "npc", es: "Quédese quieto, la ayuda viene en camino.", de: "Bleiben Sie ruhig liegen, Hilfe ist unterwegs." },
      ],
    },
    {
      id: "calle01", cat: "calle", title: "Wo ist die Bushaltestelle?", lvl: 1,
      turns: [
        { who: "npc", es: "¿Sí? ¿Necesita algo?", de: "Ja? Brauchen Sie etwas?" },
        { who: "user", kind: "mc", de: "(frag höflich, wo die Bushaltestelle ist)", solEs: "Disculpe, ¿dónde está el paradero?",
          options: [
            { es: "Disculpe, ¿dónde está el paradero?", ok: true },
            { es: "¿Qué hora es?", ok: false },
            { es: "¿Cuánto cuesta?", ok: false },
          ] },
        { who: "npc", es: "Siga derecho dos cuadras y doble a la derecha.", de: "Gehen Sie zwei Blocks geradeaus und biegen Sie rechts ab." },
        { who: "user", kind: "type", de: "(frag nach, ob es weit ist)", solEs: "¿Está lejos?",
          accept: ["esta lejos", "queda lejos", "es lejos", "esta muy lejos"] },
        { who: "npc", es: "No, está cerca. Unos cinco minutos a pie.", de: "Nein, es ist nah. Etwa fünf Minuten zu Fuß." },
        { who: "user", kind: "mc", de: "(bedanke dich)", solEs: "Muchas gracias, muy amable.",
          options: [
            { es: "Muchas gracias, muy amable.", ok: true },
            { es: "No entiendo nada.", ok: false },
            { es: "Otra vez, por favor.", ok: false },
          ] },
        { who: "npc", es: "De nada. ¡Que le vaya bien!", de: "Gern geschehen. Alles Gute!" },
      ],
    },
  ];

  window.SC = window.SC || {};
  window.SC.dialogos = { DIALOGOS_SCENARIOS, DIALOGOS };
})();
