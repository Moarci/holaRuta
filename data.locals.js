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
 *         (Konvention: /ð/→„d", /θ/→„z", betonte Silbe in GROSSBUCHSTABEN)
 * (kein de-Feld nötig – im Locals-Track ist die Frage immer Spanisch.)
 *
 * Vier Themen-Gruppen (group → Abschnitt auf der Startseite, siehe ui.js
 * CATEGORY_GROUPS): loc-hosp (Tourismus/Hostelería), loc-dia (Día a día),
 * loc-trab (Trabajo y negocios), loc-esc (Escuela y examen).
 */
(function () {
  "use strict";
  var SC = window.SC || (window.SC = {});

  // label = Basis/Rückfall, labelEs = Spanisch (UI der Lernenden), labelEn = Englisch.
  var CATEGORIES = [
    // --- Tourismus & Hostelería ---
    { id: "meseros",    label: "En el restaurante", labelEs: "En el restaurante", labelEn: "At the restaurant", icon: "🍽️", grad: ["#CB5A2B", "#E0743C"], group: "loc-hosp" },
    { id: "recepcion",  label: "En la recepción",   labelEs: "En la recepción",   labelEn: "At reception",      icon: "🛎️", grad: ["#1F7A8C", "#3E8388"], group: "loc-hosp" },
    { id: "guias",      label: "Tours y guías",     labelEs: "Tours y guías",     labelEn: "Tours & guides",    icon: "🧭", grad: ["#7D4A8E", "#9763A6"], group: "loc-hosp" },
    { id: "taxi-en",    label: "Taxi y transporte", labelEs: "Taxi y transporte", labelEn: "Taxi & transport",  icon: "🚕", grad: ["#B97C24", "#CE9438"], group: "loc-hosp" },
    { id: "ventas",     label: "Ventas y mercado",  labelEs: "Ventas y mercado",  labelEn: "Sales & market",    icon: "🛍️", grad: ["#3F7355", "#5A8E6E"], group: "loc-hosp" },
    // --- Día a día ---
    { id: "saludos-en", label: "Saludos y charla",  labelEs: "Saludos y charla",  labelEn: "Greetings & chat",  icon: "👋", grad: ["#C2502E", "#D4673F"], group: "loc-dia" },
    { id: "telefono",   label: "Por teléfono",      labelEs: "Por teléfono",      labelEn: "On the phone",       icon: "📞", grad: ["#2F6B70", "#3E8388"], group: "loc-dia" },
    { id: "direcciones",label: "Dar direcciones",   labelEs: "Dar direcciones",   labelEn: "Giving directions",  icon: "🗺️", grad: ["#7D4A8E", "#9763A6"], group: "loc-dia" },
    // --- Trabajo y negocios ---
    { id: "entrevista", label: "Entrevista de trabajo", labelEs: "Entrevista de trabajo", labelEn: "Job interview", icon: "💼", grad: ["#4C5FA8", "#2B7A78"], group: "loc-trab" },
    { id: "oficina",    label: "Oficina y correos", labelEs: "Oficina y correos", labelEn: "Office & emails",    icon: "🖥️", grad: ["#3E7CA8", "#5A9BC4"], group: "loc-trab" },
    // --- Escuela y examen ---
    { id: "gramatica-en", label: "Gramática básica", labelEs: "Gramática básica", labelEn: "Basic grammar",     icon: "📐", grad: ["#B5302A", "#CE463E"], group: "loc-esc" },
    { id: "examen",     label: "En clase",          labelEs: "En clase",          labelEn: "In class",           icon: "✏️", grad: ["#B97C24", "#3F7355"], group: "loc-esc" },
  ];

  // lvl: 1=Einsteiger, 2=Mittel.
  var CARDS = [
    // ===== Tourismus & Hostelería =====
    // --- meseros (Kellner:innen / Service) ---
    { id: "loc-mes01", cat: "meseros", lvl: 1, es: "¿Están listos para ordenar?", en: "Are you ready to order?", tip: "ar yu RE-di tu OR-der" },
    { id: "loc-mes02", cat: "meseros", lvl: 1, es: "¿Algo de tomar?", en: "Anything to drink?", tip: "E-ni-zing tu drink" },
    { id: "loc-mes03", cat: "meseros", lvl: 1, es: "¿Para comer aquí o para llevar?", en: "For here or to go?", tip: "for HIR or tu góu" },
    { id: "loc-mes04", cat: "meseros", lvl: 1, es: "Aquí tiene el menú.", en: "Here is the menu.", tip: "HIR is da MÉ-niu" },
    { id: "loc-mes05", cat: "meseros", lvl: 2, es: "¿Cómo desea su bistec?", en: "How would you like your steak?", tip: "jau wud yu laik yor STÉIK" },
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
    { id: "loc-gui04", cat: "guias", lvl: 2, es: "La ciudad fue fundada en 1533.", en: "The city was founded in 1533.", tip: "da SÍ-ti was FÁUN-ded in FIF-tin ZÉR-ti-zri" },
    { id: "loc-gui05", cat: "guias", lvl: 2, es: "Tenemos quince minutos para fotos.", en: "We have fifteen minutes for photos.", tip: "wi jav fif-TÍN MÍ-nits for FÓU-tos" },
    { id: "loc-gui06", cat: "guias", lvl: 2, es: "No se alejen del grupo.", en: "Please don't stray from the group.", tip: "plis dont strei from da grup" },
    { id: "loc-gui07", cat: "guias", lvl: 1, es: "Nos vemos en el bus a las tres.", en: "Let's meet at the bus at three.", tip: "lets mit at da bas at zri" },
    { id: "loc-gui08", cat: "guias", lvl: 1, es: "¿Tienen alguna pregunta?", en: "Do you have any questions?", tip: "du yu jav É-ni KUÉS-chons" },
    { id: "loc-gui09", cat: "guias", lvl: 2, es: "Cuiden sus pertenencias.", en: "Keep your belongings safe.", tip: "kip yor bi-LONG-ings séif" },
    { id: "loc-gui10", cat: "guias", lvl: 1, es: "Espero que disfruten la visita.", en: "I hope you enjoy the visit.", tip: "ai joup yu en-YÓI da VÍ-sit" },

    // --- taxi y transporte ---
    { id: "loc-tax01", cat: "taxi-en", lvl: 1, es: "¿A dónde lo llevo?", en: "Where to?", tip: "wér tu" },
    { id: "loc-tax02", cat: "taxi-en", lvl: 1, es: "Súbase, por favor.", en: "Hop in, please.", tip: "jop in plis" },
    { id: "loc-tax03", cat: "taxi-en", lvl: 2, es: "Son veinte mil pesos.", en: "It's twenty thousand pesos.", tip: "its TUÉN-ti ZÁU-sand PÉI-sos" },
    { id: "loc-tax04", cat: "taxi-en", lvl: 1, es: "¿Tiene afán?", en: "Are you in a hurry?", tip: "ar yu in a JÓ-rri" },
    { id: "loc-tax05", cat: "taxi-en", lvl: 2, es: "Llegamos en diez minutos.", en: "We'll be there in ten minutes.", tip: "wil bi der in ten MÍ-nits" },
    { id: "loc-tax06", cat: "taxi-en", lvl: 2, es: "¿Le abro el baúl?", en: "Shall I open the trunk?", tip: "shal ai ÓU-pen da tronk" },
    { id: "loc-tax07", cat: "taxi-en", lvl: 1, es: "No tengo cambio.", en: "I don't have change.", tip: "ai dont jav cheinch" },
    { id: "loc-tax08", cat: "taxi-en", lvl: 1, es: "Buen viaje.", en: "Have a good trip.", tip: "jav a gud trip" },

    // --- ventas y mercado (Verkäufer-Sicht) ---
    { id: "loc-ven01", cat: "ventas", lvl: 1, es: "¿En qué le puedo ayudar?", en: "How can I help you?", tip: "jau can ai jelp yu" },
    { id: "loc-ven02", cat: "ventas", lvl: 2, es: "Le hago un descuento.", en: "I'll give you a discount.", tip: "ail giv yu a DÍS-caunt" },
    { id: "loc-ven03", cat: "ventas", lvl: 1, es: "Es hecho a mano.", en: "It's handmade.", tip: "its JÁND-meid" },
    { id: "loc-ven04", cat: "ventas", lvl: 2, es: "¿Qué talla busca?", en: "What size are you looking for?", tip: "wat sais ar yu LÚ-king for" },
    { id: "loc-ven05", cat: "ventas", lvl: 1, es: "Solo efectivo, por favor.", en: "Cash only, please.", tip: "cash ÓUN-li plis" },
    { id: "loc-ven06", cat: "ventas", lvl: 2, es: "¿Se lo envuelvo?", en: "Shall I wrap it for you?", tip: "shal ai rap it for yu" },
    { id: "loc-ven07", cat: "ventas", lvl: 1, es: "Es el último que queda.", en: "It's the last one.", tip: "its da last uan" },
    { id: "loc-ven08", cat: "ventas", lvl: 1, es: "Vuelva pronto.", en: "Come back soon.", tip: "com bak sun" },

    // ===== Día a día =====
    // --- saludos y charla ---
    { id: "loc-sal01", cat: "saludos-en", lvl: 1, es: "¿Cómo estás?", en: "How are you?", tip: "jau ar yu" },
    { id: "loc-sal02", cat: "saludos-en", lvl: 1, es: "Mucho gusto.", en: "Nice to meet you.", tip: "nais tu mit yu" },
    { id: "loc-sal03", cat: "saludos-en", lvl: 1, es: "¿De dónde eres?", en: "Where are you from?", tip: "wer ar yu from" },
    { id: "loc-sal04", cat: "saludos-en", lvl: 2, es: "¿A qué te dedicas?", en: "What do you do?", tip: "wat du yu DU" },
    { id: "loc-sal05", cat: "saludos-en", lvl: 1, es: "Que tengas un buen día.", en: "Have a nice day.", tip: "jav a nais dei" },
    { id: "loc-sal06", cat: "saludos-en", lvl: 1, es: "Nos vemos luego.", en: "See you later.", tip: "si yu LÉI-ter" },
    { id: "loc-sal07", cat: "saludos-en", lvl: 2, es: "¿Puedes repetir, por favor?", en: "Can you repeat that, please?", tip: "can yu ri-PÍT dat plis" },
    { id: "loc-sal08", cat: "saludos-en", lvl: 1, es: "No entiendo.", en: "I don't understand.", tip: "ai dont an-der-STÁND" },

    // --- por teléfono ---
    { id: "loc-tel01", cat: "telefono", lvl: 2, es: "¿Quién habla?", en: "Who's calling?", tip: "jus KÓ-ling" },
    { id: "loc-tel02", cat: "telefono", lvl: 1, es: "Un momento, por favor.", en: "One moment, please.", tip: "uan MÓU-ment plis" },
    { id: "loc-tel03", cat: "telefono", lvl: 2, es: "¿Puedo dejar un mensaje?", en: "Can I leave a message?", tip: "can ai liv a MÉ-saj" },
    { id: "loc-tel04", cat: "telefono", lvl: 2, es: "Le devuelvo la llamada.", en: "I'll call you back.", tip: "ail col yu bak" },
    { id: "loc-tel05", cat: "telefono", lvl: 1, es: "¿Me escucha bien?", en: "Can you hear me okay?", tip: "can yu jir mi o-KÉI" },
    { id: "loc-tel06", cat: "telefono", lvl: 2, es: "Marcó el número equivocado.", en: "You have the wrong number.", tip: "yu jav da rong NÓM-ber" },
    { id: "loc-tel07", cat: "telefono", lvl: 2, es: "¿Con quién desea hablar?", en: "Who would you like to speak to?", tip: "ju wud yu laik tu SPIK tu" },
    { id: "loc-tel08", cat: "telefono", lvl: 1, es: "Gracias por llamar.", en: "Thanks for calling.", tip: "zenks for KÓ-ling" },

    // --- dar direcciones ---
    { id: "loc-dir01", cat: "direcciones", lvl: 1, es: "Siga derecho.", en: "Go straight ahead.", tip: "gou streit a-JÉD" },
    { id: "loc-dir02", cat: "direcciones", lvl: 1, es: "Gire a la izquierda.", en: "Turn left.", tip: "tern left" },
    { id: "loc-dir03", cat: "direcciones", lvl: 1, es: "Gire a la derecha.", en: "Turn right.", tip: "tern rait" },
    { id: "loc-dir04", cat: "direcciones", lvl: 2, es: "Está a dos cuadras.", en: "It's two blocks away.", tip: "its tu bloks a-WÉI" },
    { id: "loc-dir05", cat: "direcciones", lvl: 2, es: "Queda al lado del banco.", en: "It's next to the bank.", tip: "its nekst tu da bank" },
    { id: "loc-dir06", cat: "direcciones", lvl: 1, es: "¿Está lejos de aquí?", en: "Is it far from here?", tip: "is it FAR from jir" },
    { id: "loc-dir07", cat: "direcciones", lvl: 1, es: "Cruce la calle.", en: "Cross the street.", tip: "cros da strit" },
    { id: "loc-dir08", cat: "direcciones", lvl: 1, es: "Está en la esquina.", en: "It's on the corner.", tip: "its on da KÓR-ner" },

    // ===== Trabajo y negocios =====
    // --- entrevista de trabajo ---
    { id: "loc-ent01", cat: "entrevista", lvl: 2, es: "Tengo experiencia en servicio al cliente.", en: "I have experience in customer service.", tip: "ai jav eks-PÍ-riens in KÓS-to-mer SÉR-vis" },
    { id: "loc-ent02", cat: "entrevista", lvl: 1, es: "Hablo inglés básico.", en: "I speak basic English.", tip: "ai spik BÉI-sic ÍN-glish" },
    { id: "loc-ent03", cat: "entrevista", lvl: 2, es: "Soy puntual y responsable.", en: "I'm punctual and responsible.", tip: "aim PÓNK-chual and ris-PÓN-si-bol" },
    { id: "loc-ent04", cat: "entrevista", lvl: 1, es: "¿Cuál es el horario?", en: "What are the hours?", tip: "wat ar di ÁURS" },
    { id: "loc-ent05", cat: "entrevista", lvl: 1, es: "Puedo empezar de inmediato.", en: "I can start right away.", tip: "ai can start rait a-WÉI" },
    { id: "loc-ent06", cat: "entrevista", lvl: 2, es: "Trabajé dos años en un hotel.", en: "I worked at a hotel for two years.", tip: "ai werkt at a jou-TÉL for tu yirs" },
    { id: "loc-ent07", cat: "entrevista", lvl: 1, es: "Gracias por la oportunidad.", en: "Thank you for the opportunity.", tip: "zenk yu for di o-por-TIÚ-ni-ti" },
    { id: "loc-ent08", cat: "entrevista", lvl: 2, es: "¿Cuándo me darían respuesta?", en: "When will I hear back?", tip: "wen wil ai jir bak" },

    // --- oficina y correos ---
    { id: "loc-ofi01", cat: "oficina", lvl: 2, es: "Le envío el correo enseguida.", en: "I'll send you the email right away.", tip: "ail send yu di Í-meil rait a-WÉI" },
    { id: "loc-ofi02", cat: "oficina", lvl: 2, es: "Quedo atento a su respuesta.", en: "I look forward to your reply.", tip: "ai luk FÓR-ward tu yor ri-PLÁI" },
    { id: "loc-ofi03", cat: "oficina", lvl: 2, es: "¿Podemos agendar una reunión?", en: "Can we schedule a meeting?", tip: "can wi SKÉ-yul a MÍ-ting" },
    { id: "loc-ofi04", cat: "oficina", lvl: 2, es: "Adjunto el documento.", en: "I'm attaching the document.", tip: "aim a-TÁ-ching da DÓ-kiu-ment" },
    { id: "loc-ofi05", cat: "oficina", lvl: 2, es: "Disculpe la demora en responder.", en: "Sorry for the late reply.", tip: "SO-rri for da leit ri-PLÁI" },
    { id: "loc-ofi06", cat: "oficina", lvl: 1, es: "Estoy de acuerdo.", en: "I agree.", tip: "ai a-GRÍ" },
    { id: "loc-ofi07", cat: "oficina", lvl: 2, es: "¿Me puede explicar de nuevo?", en: "Could you explain that again?", tip: "cud yu eks-PLÉIN dat a-GUÉN" },
    { id: "loc-ofi08", cat: "oficina", lvl: 1, es: "Hablamos mañana.", en: "Let's talk tomorrow.", tip: "lets tok tu-MÓ-rrou" },

    // ===== Escuela y examen =====
    // --- gramática básica (verbo "to be" + preguntas + tiempo) ---
    { id: "loc-gra01", cat: "gramatica-en", lvl: 1, es: "Yo soy / estoy", en: "I am", tip: "ai am" },
    { id: "loc-gra02", cat: "gramatica-en", lvl: 1, es: "Tú eres / estás", en: "You are", tip: "yu ar" },
    { id: "loc-gra03", cat: "gramatica-en", lvl: 1, es: "Él es / está", en: "He is", tip: "ji is" },
    { id: "loc-gra04", cat: "gramatica-en", lvl: 1, es: "Nosotros somos / estamos", en: "We are", tip: "wi ar" },
    { id: "loc-gra05", cat: "gramatica-en", lvl: 1, es: "¿Qué…?", en: "What…?", tip: "wat" },
    { id: "loc-gra06", cat: "gramatica-en", lvl: 1, es: "¿Dónde…?", en: "Where…?", tip: "wer" },
    { id: "loc-gra07", cat: "gramatica-en", lvl: 2, es: "¿Cuándo…?", en: "When…?", tip: "wen" },
    { id: "loc-gra08", cat: "gramatica-en", lvl: 2, es: "¿Por qué…?", en: "Why…?", tip: "wai" },
    { id: "loc-gra09", cat: "gramatica-en", lvl: 1, es: "ayer (pasado)", en: "yesterday", tip: "YÉS-ter-dei" },
    { id: "loc-gra10", cat: "gramatica-en", lvl: 1, es: "mañana (futuro)", en: "tomorrow", tip: "tu-MÓ-rrou" },

    // --- en clase ---
    { id: "loc-exa01", cat: "examen", lvl: 1, es: "Levanta la mano.", en: "Raise your hand.", tip: "reis yor jand" },
    { id: "loc-exa02", cat: "examen", lvl: 1, es: "Lee en voz alta.", en: "Read out loud.", tip: "rid aut laud" },
    { id: "loc-exa03", cat: "examen", lvl: 2, es: "Entrega la tarea.", en: "Hand in your homework.", tip: "jand in yor JÓUM-werk" },
    { id: "loc-exa04", cat: "examen", lvl: 1, es: "¿Puedo ir al baño?", en: "May I go to the restroom?", tip: "mei ai gou tu da RÉST-rum" },
    { id: "loc-exa05", cat: "examen", lvl: 2, es: "No entendí la pregunta.", en: "I didn't understand the question.", tip: "ai DÍ-dent an-der-STÁND da KUÉS-chon" },
    { id: "loc-exa06", cat: "examen", lvl: 2, es: "¿Cómo se escribe?", en: "How do you spell it?", tip: "jau du yu SPEL it" },
    { id: "loc-exa07", cat: "examen", lvl: 1, es: "Repite, por favor.", en: "Say it again, please.", tip: "sei it a-GUÉN plis" },
    { id: "loc-exa08", cat: "examen", lvl: 1, es: "Ya terminé.", en: "I'm done.", tip: "aim don" },
  ];

  // Ein kuratiertes Schnellstart-Paket je Kategorie (analog data.js PRESETS).
  var PRESETS = CATEGORIES.map(function (c) {
    return {
      id: "locals-" + c.id,
      scope: c.id,
      pick: CARDS.filter(function (k) { return k.cat === c.id; }).map(function (k) { return k.id; }),
    };
  });

  // Öffentlich machen (für Tests / spätere Cluster) …
  SC.dataLocals = { CATEGORIES: CATEGORIES, CARDS: CARDS, PRESETS: PRESETS };

  // … und NUR im Locals-Track in den aktiven Korpus einhängen. data.js hat SC.data
  // bereits angelegt; idempotentes Anhängen (kein doppeltes Einfügen bei Re-Eval).
  try {
    var isLocals = SC.config && SC.config.track === "es-en";
    if (isLocals && SC.data && Array.isArray(SC.data.CARDS)) {
      var have = {};
      SC.data.CARDS.forEach(function (c) { have[c.id] = true; });
      if (!have["loc-mes01"]) {
        // Locals-Kategorien VORN einsortieren (eigene Abschnitte zuerst), Karten anhängen.
        SC.data.CATEGORIES = CATEGORIES.concat(SC.data.CATEGORIES);
        SC.data.CARDS = SC.data.CARDS.concat(CARDS);
        SC.data.PRESETS = (SC.data.PRESETS || []).concat(PRESETS);
      }
    }
  } catch (e) { /* ohne Config/Data: stiller Rückfall, App läuft wie gehabt */ }
})();
