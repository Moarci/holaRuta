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
    { id: "bar-en",     label: "En el bar",         labelEs: "En el bar",         labelEn: "At the bar",        icon: "🍹", grad: ["#B5302A", "#E08A2C"], group: "loc-hosp" },
    { id: "playa-en",   label: "En la playa",       labelEs: "En la playa",       labelEn: "At the beach",      icon: "🏖️", grad: ["#1F7A8C", "#E0743C"], group: "loc-hosp" },
    { id: "quejas-en",  label: "Quejas y disculpas", labelEs: "Quejas y disculpas", labelEn: "Complaints & apologies", icon: "🙏", grad: ["#C25A45", "#B97C24"], group: "loc-hosp" },
    { id: "platos-en",  label: "Comida típica",     labelEs: "Comida típica",     labelEn: "Local food",        icon: "🍲", grad: ["#CB5A2B", "#76954E"], group: "loc-hosp" },
    // --- Día a día ---
    { id: "saludos-en", label: "Saludos y charla",  labelEs: "Saludos y charla",  labelEn: "Greetings & chat",  icon: "👋", grad: ["#C2502E", "#D4673F"], group: "loc-dia" },
    { id: "telefono",   label: "Por teléfono",      labelEs: "Por teléfono",      labelEn: "On the phone",       icon: "📞", grad: ["#2F6B70", "#3E8388"], group: "loc-dia" },
    { id: "direcciones",label: "Dar direcciones",   labelEs: "Dar direcciones",   labelEn: "Giving directions",  icon: "🗺️", grad: ["#7D4A8E", "#9763A6"], group: "loc-dia" },
    { id: "compras-en", label: "De compras",        labelEs: "De compras",        labelEn: "Shopping",          icon: "🛒", grad: ["#3F7355", "#B97C24"], group: "loc-dia" },
    { id: "salud-en",   label: "Salud y farmacia",  labelEs: "Salud y farmacia",  labelEn: "Health & pharmacy", icon: "💊", grad: ["#2F8E5B", "#76954E"], group: "loc-dia" },
    { id: "dinero-en",  label: "Banco y dinero",    labelEs: "Banco y dinero",    labelEn: "Bank & money",      icon: "💵", grad: ["#5E7D3A", "#2F6B70"], group: "loc-dia" },
    { id: "transporte-en", label: "Transporte público", labelEs: "Transporte público", labelEn: "Public transport", icon: "🚌", grad: ["#B97C24", "#2F6B70"], group: "loc-dia" },
    { id: "emergencias-en", label: "Emergencias y seguridad", labelEs: "Emergencias y seguridad", labelEn: "Emergencies & safety", icon: "🚨", grad: ["#B5302A", "#CE463E"], group: "loc-dia" },
    // --- Trabajo y negocios ---
    { id: "entrevista", label: "Entrevista de trabajo", labelEs: "Entrevista de trabajo", labelEn: "Job interview", icon: "💼", grad: ["#4C5FA8", "#2B7A78"], group: "loc-trab" },
    { id: "oficina",    label: "Oficina y correos", labelEs: "Oficina y correos", labelEn: "Office & emails",    icon: "🖥️", grad: ["#3E7CA8", "#5A9BC4"], group: "loc-trab" },
    { id: "cliente-en", label: "Atención al cliente", labelEs: "Atención al cliente", labelEn: "Customer service", icon: "🎧", grad: ["#7D4A8E", "#4C5FA8"], group: "loc-trab" },
    { id: "reunion-en", label: "En la reunión",     labelEs: "En la reunión",     labelEn: "In the meeting",    icon: "👥", grad: ["#4C5FA8", "#3E7CA8"], group: "loc-trab" },
    { id: "resenas-en", label: "Reseñas y redes",   labelEs: "Reseñas y redes",   labelEn: "Reviews & social",  icon: "📣", grad: ["#B97C24", "#3F7355"], group: "loc-trab" },
    // --- Escuela y examen ---
    { id: "gramatica-en", label: "Gramática básica", labelEs: "Gramática básica", labelEn: "Basic grammar",     icon: "📐", grad: ["#B5302A", "#CE463E"], group: "loc-esc" },
    { id: "examen",     label: "En clase",          labelEs: "En clase",          labelEn: "In class",           icon: "✏️", grad: ["#B97C24", "#3F7355"], group: "loc-esc" },
    { id: "numeros-en", label: "Números y fechas",  labelEs: "Números y fechas",  labelEn: "Numbers & dates",   icon: "🔢", grad: ["#B97C24", "#CE9438"], group: "loc-esc" },
    { id: "conectores-en", label: "Conectores útiles", labelEs: "Conectores útiles", labelEn: "Useful connectors", icon: "🔗", grad: ["#3F7355", "#4C5FA8"], group: "loc-esc" },
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
    { id: "loc-mes11", cat: "meseros", lvl: 1, es: "¿Mesa para cuántos?", en: "Table for how many?", tip: "TÉI-bol for jau MÉ-ni" },
    { id: "loc-mes12", cat: "meseros", lvl: 2, es: "El baño está al fondo.", en: "The restroom is in the back.", tip: "da RÉST-rum is in da BAK" },
    { id: "loc-mes13", cat: "meseros", lvl: 1, es: "¿Todo bien por aquí?", en: "Is everything okay here?", tip: "is É-vri-zing o-KÉI jir" },
    { id: "loc-mes14", cat: "meseros", lvl: 2, es: "¿Le caliento la comida?", en: "Shall I heat up your food?", tip: "shal ai JIT op yor FUD" },

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
    { id: "loc-rec11", cat: "recepcion", lvl: 2, es: "¿Necesita ayuda con el equipaje?", en: "Do you need help with your luggage?", tip: "du yu nid jelp wid yor LÓ-guich" },
    { id: "loc-rec12", cat: "recepcion", lvl: 1, es: "El registro es a las tres.", en: "Check-in is at three.", tip: "CHÉK-in is at zri" },
    { id: "loc-rec13", cat: "recepcion", lvl: 2, es: "¿Quiere que le pida un taxi?", en: "Would you like me to call a taxi?", tip: "wud yu laik mi tu COL a TÁK-si" },
    { id: "loc-rec14", cat: "recepcion", lvl: 1, es: "Su llave, por favor.", en: "Your key, please.", tip: "yor KI plis" },

    // --- guías (Tour-Guides) ---
    { id: "loc-gui01", cat: "guias", lvl: 1, es: "Bienvenidos al tour.", en: "Welcome to the tour.", tip: "WÉL-com tu da tur" },
    { id: "loc-gui02", cat: "guias", lvl: 1, es: "Síganme, por favor.", en: "Please follow me.", tip: "plis FÓ-lou mi" },
    { id: "loc-gui03", cat: "guias", lvl: 2, es: "Por aquí, cuidado con el escalón.", en: "This way, mind the step.", tip: "dis wéi, maind da step" },
    { id: "loc-gui04", cat: "guias", lvl: 2, es: "La ciudad fue fundada en 1533.", en: "The city was founded in 1533.", tip: "da SÍ-ti was FÁUN-ded in FIF-tin ZÉR-ti ZRI" },
    { id: "loc-gui05", cat: "guias", lvl: 2, es: "Tenemos quince minutos para fotos.", en: "We have fifteen minutes for photos.", tip: "wi jav fif-TÍN MÍ-nits for FÓU-tos" },
    { id: "loc-gui06", cat: "guias", lvl: 2, es: "No se alejen del grupo.", en: "Please don't stray from the group.", tip: "plis dont strei from da grup" },
    { id: "loc-gui07", cat: "guias", lvl: 1, es: "Nos vemos en el bus a las tres.", en: "Let's meet at the bus at three.", tip: "lets mit at da bas at zri" },
    { id: "loc-gui08", cat: "guias", lvl: 1, es: "¿Tienen alguna pregunta?", en: "Do you have any questions?", tip: "du yu jav É-ni KUÉS-chons" },
    { id: "loc-gui09", cat: "guias", lvl: 2, es: "Cuiden sus pertenencias.", en: "Keep your belongings safe.", tip: "kip yor bi-LONG-ings séif" },
    { id: "loc-gui10", cat: "guias", lvl: 1, es: "Espero que disfruten la visita.", en: "I hope you enjoy the visit.", tip: "ai joup yu en-YÓI da VÍ-sit" },
    { id: "loc-gui11", cat: "guias", lvl: 2, es: "A su izquierda verán la catedral.", en: "On your left you'll see the cathedral.", tip: "on yor LEFT yul si da ca-ZÍ-dral" },
    { id: "loc-gui12", cat: "guias", lvl: 1, es: "Tomen una foto aquí.", en: "Take a photo here.", tip: "TÉIK a FÓU-tou jir" },
    { id: "loc-gui13", cat: "guias", lvl: 2, es: "El recorrido dura dos horas.", en: "The tour lasts two hours.", tip: "da TUR lasts tu ÁURS" },
    { id: "loc-gui14", cat: "guias", lvl: 1, es: "¿Alguien necesita agua?", en: "Does anyone need water?", tip: "dos É-ni-uan nid WÓ-ter" },

    // --- taxi y transporte ---
    { id: "loc-tax01", cat: "taxi-en", lvl: 1, es: "¿A dónde lo llevo?", en: "Where to?", tip: "wér tu" },
    { id: "loc-tax02", cat: "taxi-en", lvl: 1, es: "Súbase, por favor.", en: "Hop in, please.", tip: "jop in plis" },
    { id: "loc-tax03", cat: "taxi-en", lvl: 2, es: "Son veinte mil pesos.", en: "It's twenty thousand pesos.", tip: "its TUÉN-ti ZÁU-sand PÉI-sos" },
    { id: "loc-tax04", cat: "taxi-en", lvl: 1, es: "¿Tiene afán?", en: "Are you in a hurry?", tip: "ar yu in a JÓ-rri" },
    { id: "loc-tax05", cat: "taxi-en", lvl: 2, es: "Llegamos en diez minutos.", en: "We'll be there in ten minutes.", tip: "wil bi der in ten MÍ-nits" },
    { id: "loc-tax06", cat: "taxi-en", lvl: 2, es: "¿Le abro el baúl?", en: "Shall I open the trunk?", tip: "shal ai ÓU-pen da tronk" },
    { id: "loc-tax07", cat: "taxi-en", lvl: 1, es: "No tengo cambio.", en: "I don't have change.", tip: "ai dont jav cheinch" },
    { id: "loc-tax08", cat: "taxi-en", lvl: 1, es: "Buen viaje.", en: "Have a good trip.", tip: "jav a gud trip" },
    { id: "loc-tax09", cat: "taxi-en", lvl: 2, es: "Hay mucho tráfico.", en: "There's a lot of traffic.", tip: "ders a LOT of TRÁ-fic" },
    { id: "loc-tax10", cat: "taxi-en", lvl: 1, es: "¿Le ayudo con las maletas?", en: "Can I help with your bags?", tip: "can ai JELP wid yor bags" },

    // --- ventas y mercado (Verkäufer-Sicht) ---
    { id: "loc-ven01", cat: "ventas", lvl: 1, es: "¿En qué le puedo ayudar?", en: "How can I help you?", tip: "jau can ai jelp yu" },
    { id: "loc-ven02", cat: "ventas", lvl: 2, es: "Le hago un descuento.", en: "I'll give you a discount.", tip: "ail giv yu a DÍS-caunt" },
    { id: "loc-ven03", cat: "ventas", lvl: 1, es: "Es hecho a mano.", en: "It's handmade.", tip: "its JÁND-meid" },
    { id: "loc-ven04", cat: "ventas", lvl: 2, es: "¿Qué talla busca?", en: "What size are you looking for?", tip: "wat sais ar yu LÚ-king for" },
    { id: "loc-ven05", cat: "ventas", lvl: 1, es: "Solo efectivo, por favor.", en: "Cash only, please.", tip: "cash ÓUN-li plis" },
    { id: "loc-ven06", cat: "ventas", lvl: 2, es: "¿Se lo envuelvo?", en: "Shall I wrap it for you?", tip: "shal ai rap it for yu" },
    { id: "loc-ven07", cat: "ventas", lvl: 1, es: "Es el último que queda.", en: "It's the last one.", tip: "its da last uan" },
    { id: "loc-ven08", cat: "ventas", lvl: 1, es: "Vuelva pronto.", en: "Come back soon.", tip: "com bak sun" },
    { id: "loc-ven09", cat: "ventas", lvl: 1, es: "¿Quiere probarlo?", en: "Would you like to try it?", tip: "wud yu laik tu TRÁI it" },
    { id: "loc-ven10", cat: "ventas", lvl: 2, es: "Tenemos más colores.", en: "We have more colors.", tip: "wi jav mor CÓ-lors" },

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
    { id: "loc-sal09", cat: "saludos-en", lvl: 1, es: "Buenos días.", en: "Good morning.", tip: "gud MÓR-ning" },
    { id: "loc-sal10", cat: "saludos-en", lvl: 1, es: "¿Qué tal tu día?", en: "How's your day?", tip: "jaus yor DÉI" },
    { id: "loc-sal11", cat: "saludos-en", lvl: 2, es: "Encantado de conocerte.", en: "Pleased to meet you.", tip: "PLISD tu mit yu" },
    { id: "loc-sal12", cat: "saludos-en", lvl: 1, es: "Cuídate.", en: "Take care.", tip: "TÉIK ker" },

    // --- por teléfono ---
    { id: "loc-tel01", cat: "telefono", lvl: 2, es: "¿Quién habla?", en: "Who's calling?", tip: "jus KÓ-ling" },
    { id: "loc-tel02", cat: "telefono", lvl: 1, es: "Un momento, por favor.", en: "One moment, please.", tip: "uan MÓU-ment plis" },
    { id: "loc-tel03", cat: "telefono", lvl: 2, es: "¿Puedo dejar un mensaje?", en: "Can I leave a message?", tip: "can ai liv a MÉ-saj" },
    { id: "loc-tel04", cat: "telefono", lvl: 2, es: "Le devuelvo la llamada.", en: "I'll call you back.", tip: "ail col yu bak" },
    { id: "loc-tel05", cat: "telefono", lvl: 1, es: "¿Me escucha bien?", en: "Can you hear me okay?", tip: "can yu jir mi o-KÉI" },
    { id: "loc-tel06", cat: "telefono", lvl: 2, es: "Marcó el número equivocado.", en: "You have the wrong number.", tip: "yu jav da rong NÓM-ber" },
    { id: "loc-tel07", cat: "telefono", lvl: 2, es: "¿Con quién desea hablar?", en: "Who would you like to speak to?", tip: "ju wud yu laik tu SPIK tu" },
    { id: "loc-tel08", cat: "telefono", lvl: 1, es: "Gracias por llamar.", en: "Thanks for calling.", tip: "zenks for KÓ-ling" },
    { id: "loc-tel09", cat: "telefono", lvl: 2, es: "¿Puede hablar más despacio?", en: "Could you speak more slowly?", tip: "cud yu SPIK mor SLÓU-li" },
    { id: "loc-tel10", cat: "telefono", lvl: 2, es: "Le paso con un compañero.", en: "I'll put you through to a colleague.", tip: "ail put yu ZRU tu a CÓ-lig" },

    // --- dar direcciones ---
    { id: "loc-dir01", cat: "direcciones", lvl: 1, es: "Siga derecho.", en: "Go straight ahead.", tip: "gou streit a-JÉD" },
    { id: "loc-dir02", cat: "direcciones", lvl: 1, es: "Gire a la izquierda.", en: "Turn left.", tip: "tern left" },
    { id: "loc-dir03", cat: "direcciones", lvl: 1, es: "Gire a la derecha.", en: "Turn right.", tip: "tern rait" },
    { id: "loc-dir04", cat: "direcciones", lvl: 2, es: "Está a dos cuadras.", en: "It's two blocks away.", tip: "its tu bloks a-WÉI" },
    { id: "loc-dir05", cat: "direcciones", lvl: 2, es: "Queda al lado del banco.", en: "It's next to the bank.", tip: "its nekst tu da bank" },
    { id: "loc-dir06", cat: "direcciones", lvl: 1, es: "¿Está lejos de aquí?", en: "Is it far from here?", tip: "is it FAR from jir" },
    { id: "loc-dir07", cat: "direcciones", lvl: 1, es: "Cruce la calle.", en: "Cross the street.", tip: "cros da strit" },
    { id: "loc-dir08", cat: "direcciones", lvl: 1, es: "Está en la esquina.", en: "It's on the corner.", tip: "its on da KÓR-ner" },
    { id: "loc-dir09", cat: "direcciones", lvl: 1, es: "Está cerca.", en: "It's nearby.", tip: "its NÍR-bai" },
    { id: "loc-dir10", cat: "direcciones", lvl: 2, es: "Tome el segundo giro.", en: "Take the second turn.", tip: "TÉIK da SÉ-cond tern" },

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
    { id: "loc-ent09", cat: "entrevista", lvl: 2, es: "Me gusta trabajar en equipo.", en: "I like working in a team.", tip: "ai laik WÉR-king in a TIM" },
    { id: "loc-ent10", cat: "entrevista", lvl: 1, es: "Aprendo rápido.", en: "I learn quickly.", tip: "ai LERN KUÍK-li" },
    { id: "loc-ent11", cat: "entrevista", lvl: 2, es: "Estoy disponible los fines de semana.", en: "I'm available on weekends.", tip: "aim a-VÉI-la-bol on WÍK-ends" },
    { id: "loc-ent12", cat: "entrevista", lvl: 1, es: "¿Cuándo empiezo?", en: "When do I start?", tip: "wen du ai START" },

    // --- oficina y correos ---
    { id: "loc-ofi01", cat: "oficina", lvl: 2, es: "Le envío el correo enseguida.", en: "I'll send you the email right away.", tip: "ail send yu di Í-meil rait a-WÉI" },
    { id: "loc-ofi02", cat: "oficina", lvl: 2, es: "Quedo atento a su respuesta.", en: "I look forward to your reply.", tip: "ai luk FÓR-ward tu yor ri-PLÁI" },
    { id: "loc-ofi03", cat: "oficina", lvl: 2, es: "¿Podemos agendar una reunión?", en: "Can we schedule a meeting?", tip: "can wi SKÉ-yul a MÍ-ting" },
    { id: "loc-ofi04", cat: "oficina", lvl: 2, es: "Adjunto el documento.", en: "I'm attaching the document.", tip: "aim a-TÁ-ching da DÓ-kiu-ment" },
    { id: "loc-ofi05", cat: "oficina", lvl: 2, es: "Disculpe la demora en responder.", en: "Sorry for the late reply.", tip: "SO-rri for da leit ri-PLÁI" },
    { id: "loc-ofi06", cat: "oficina", lvl: 1, es: "Estoy de acuerdo.", en: "I agree.", tip: "ai a-GRÍ" },
    { id: "loc-ofi07", cat: "oficina", lvl: 2, es: "¿Me puede explicar de nuevo?", en: "Could you explain that again?", tip: "cud yu eks-PLÉIN dat a-GUÉN" },
    { id: "loc-ofi08", cat: "oficina", lvl: 1, es: "Hablamos mañana.", en: "Let's talk tomorrow.", tip: "lets tok tu-MÓ-rrou" },
    { id: "loc-ofi09", cat: "oficina", lvl: 1, es: "¿Recibió mi correo?", en: "Did you get my email?", tip: "did yu get mai Í-meil" },
    { id: "loc-ofi10", cat: "oficina", lvl: 2, es: "Lo copio en el correo.", en: "I'll copy you on the email.", tip: "ail CÓ-pi yu on di Í-meil" },

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
    { id: "loc-gra11", cat: "gramatica-en", lvl: 1, es: "¿Cómo se dice…?", en: "How do you say…?", tip: "jau du yu SÉI" },
    { id: "loc-gra12", cat: "gramatica-en", lvl: 2, es: "¿Qué significa…?", en: "What does … mean?", tip: "wat dos … MIN" },

    // --- en clase ---
    { id: "loc-exa01", cat: "examen", lvl: 1, es: "Levanta la mano.", en: "Raise your hand.", tip: "reis yor jand" },
    { id: "loc-exa02", cat: "examen", lvl: 1, es: "Lee en voz alta.", en: "Read out loud.", tip: "rid aut laud" },
    { id: "loc-exa03", cat: "examen", lvl: 2, es: "Entrega la tarea.", en: "Hand in your homework.", tip: "jand in yor JÓUM-werk" },
    { id: "loc-exa04", cat: "examen", lvl: 1, es: "¿Puedo ir al baño?", en: "May I go to the restroom?", tip: "mei ai gou tu da RÉST-rum" },
    { id: "loc-exa05", cat: "examen", lvl: 2, es: "No entendí la pregunta.", en: "I didn't understand the question.", tip: "ai DÍ-dent an-der-STÁND da KUÉS-chon" },
    { id: "loc-exa06", cat: "examen", lvl: 2, es: "¿Cómo se escribe?", en: "How do you spell it?", tip: "jau du yu SPEL it" },
    { id: "loc-exa07", cat: "examen", lvl: 1, es: "Repite, por favor.", en: "Say it again, please.", tip: "sei it a-GUÉN plis" },
    { id: "loc-exa08", cat: "examen", lvl: 1, es: "Ya terminé.", en: "I'm done.", tip: "aim don" },
    { id: "loc-exa09", cat: "examen", lvl: 1, es: "No estoy seguro.", en: "I'm not sure.", tip: "aim not SHUR" },
    { id: "loc-exa10", cat: "examen", lvl: 1, es: "¿Me puede ayudar?", en: "Can you help me?", tip: "can yu JELP mi" },

    // --- bar (Bar / Café-Service) ---
    { id: "loc-bar01", cat: "bar-en", lvl: 1, es: "¿Qué le sirvo?", en: "What can I get you?", tip: "wat can ai GET yu" },
    { id: "loc-bar02", cat: "bar-en", lvl: 1, es: "¿Con hielo?", en: "With ice?", tip: "wid AIS" },
    { id: "loc-bar03", cat: "bar-en", lvl: 1, es: "¿Una o dos cervezas?", en: "One or two beers?", tip: "uan or tu BIRS" },
    { id: "loc-bar04", cat: "bar-en", lvl: 2, es: "La hora feliz es hasta las siete.", en: "Happy hour is until seven.", tip: "JÁ-pi áur is an-TIL SÉ-ven" },
    { id: "loc-bar05", cat: "bar-en", lvl: 2, es: "¿Quiere ver la carta de cócteles?", en: "Would you like the cocktail menu?", tip: "wud yu laik da KÓK-teil MÉ-niu" },
    { id: "loc-bar06", cat: "bar-en", lvl: 1, es: "¿Algo más?", en: "Anything else?", tip: "É-ni-zing els" },
    { id: "loc-bar07", cat: "bar-en", lvl: 2, es: "Son diez mil, por favor.", en: "That's ten thousand, please.", tip: "dats ten ZÁU-sand plis" },
    { id: "loc-bar08", cat: "bar-en", lvl: 1, es: "¡Salud!", en: "Cheers!", tip: "CHIRS" },
    { id: "loc-bar09", cat: "bar-en", lvl: 2, es: "La última ronda es a la una.", en: "Last call is at one.", tip: "last COL is at uan" },
    { id: "loc-bar10", cat: "bar-en", lvl: 1, es: "¿Agua con o sin gas?", en: "Still or sparkling water?", tip: "stil or SPÁR-kling WÓ-ter" },

    // ===== Día a día (Forts.) =====
    // --- de compras (Kundensicht) ---
    { id: "loc-com01", cat: "compras-en", lvl: 1, es: "¿Cuánto cuesta esto?", en: "How much is this?", tip: "jau MOCH is dis" },
    { id: "loc-com02", cat: "compras-en", lvl: 2, es: "¿Tienen una talla más grande?", en: "Do you have a bigger size?", tip: "du yu jav a BÍ-guer sais" },
    { id: "loc-com03", cat: "compras-en", lvl: 2, es: "Solo estoy mirando, gracias.", en: "I'm just looking, thanks.", tip: "aim yost LÚ-king zenks" },
    { id: "loc-com04", cat: "compras-en", lvl: 1, es: "¿Puedo probármelo?", en: "Can I try it on?", tip: "can ai TRÁI it on" },
    { id: "loc-com05", cat: "compras-en", lvl: 1, es: "¿Aceptan tarjeta?", en: "Do you take card?", tip: "du yu TÉIK card" },
    { id: "loc-com06", cat: "compras-en", lvl: 1, es: "¿Me da una bolsa, por favor?", en: "Can I have a bag, please?", tip: "can ai jav a BAG plis" },
    { id: "loc-com07", cat: "compras-en", lvl: 2, es: "¿Hay descuento?", en: "Is there a discount?", tip: "is der a DÍS-caunt" },
    { id: "loc-com08", cat: "compras-en", lvl: 1, es: "Me lo llevo.", en: "I'll take it.", tip: "ail TÉIK it" },
    { id: "loc-com09", cat: "compras-en", lvl: 2, es: "¿Dónde está el probador?", en: "Where's the fitting room?", tip: "wers da FÍ-ting rum" },
    { id: "loc-com10", cat: "compras-en", lvl: 1, es: "¿Tienen otro color?", en: "Do you have another color?", tip: "du yu jav a-NÓ-der CÓ-lor" },

    // --- salud y farmacia (eigene Gesundheit) ---
    { id: "loc-med01", cat: "salud-en", lvl: 1, es: "Me siento mal.", en: "I feel sick.", tip: "ai fil SIK" },
    { id: "loc-med02", cat: "salud-en", lvl: 1, es: "Me duele la cabeza.", en: "I have a headache.", tip: "ai jav a JÉD-eik" },
    { id: "loc-med03", cat: "salud-en", lvl: 2, es: "¿Tiene algo para la tos?", en: "Do you have something for a cough?", tip: "du yu jav SÓM-zing for a COF" },
    { id: "loc-med04", cat: "salud-en", lvl: 1, es: "Necesito un médico.", en: "I need a doctor.", tip: "ai nid a DÓK-tor" },
    { id: "loc-med05", cat: "salud-en", lvl: 2, es: "Soy alérgico a la penicilina.", en: "I'm allergic to penicillin.", tip: "aim a-LÉR-yic tu pe-ni-SÍ-lin" },
    { id: "loc-med06", cat: "salud-en", lvl: 1, es: "¿Dónde está la farmacia?", en: "Where is the pharmacy?", tip: "wer is da FÁR-ma-si" },
    { id: "loc-med07", cat: "salud-en", lvl: 2, es: "¿Cada cuánto lo tomo?", en: "How often do I take it?", tip: "jau Ó-fen du ai TÉIK it" },
    { id: "loc-med08", cat: "salud-en", lvl: 2, es: "Llame a una ambulancia.", en: "Call an ambulance.", tip: "COL an ÁM-biu-lans" },
    { id: "loc-med09", cat: "salud-en", lvl: 2, es: "Tome una pastilla cada ocho horas.", en: "Take one pill every eight hours.", tip: "TÉIK uan pil É-vri eit ÁURS" },
    { id: "loc-med10", cat: "salud-en", lvl: 2, es: "¿Necesita receta?", en: "Does it need a prescription?", tip: "dos it nid a pres-CRÍP-shon" },

    // --- banco y dinero ---
    { id: "loc-din01", cat: "dinero-en", lvl: 1, es: "¿Dónde hay un cajero?", en: "Where is an ATM?", tip: "wer is an ei-ti-ÉM" },
    { id: "loc-din02", cat: "dinero-en", lvl: 2, es: "¿Cobran comisión?", en: "Is there a fee?", tip: "is der a FI" },
    { id: "loc-din03", cat: "dinero-en", lvl: 2, es: "Quiero cambiar dólares.", en: "I want to exchange dollars.", tip: "ai want tu eks-CHÉINCH DÓ-lars" },
    { id: "loc-din04", cat: "dinero-en", lvl: 2, es: "¿Cuál es la tasa de cambio?", en: "What's the exchange rate?", tip: "wats di eks-CHÉINCH reit" },
    { id: "loc-din05", cat: "dinero-en", lvl: 1, es: "¿Puedo pagar en efectivo?", en: "Can I pay in cash?", tip: "can ai PÉI in cash" },
    { id: "loc-din06", cat: "dinero-en", lvl: 2, es: "La tarjeta fue rechazada.", en: "The card was declined.", tip: "da card was di-CLÁIND" },
    { id: "loc-din07", cat: "dinero-en", lvl: 1, es: "¿Me da un recibo?", en: "Can I have a receipt?", tip: "can ai jav a ri-SÍT" },
    { id: "loc-din08", cat: "dinero-en", lvl: 1, es: "Quédese con el cambio.", en: "Keep the change.", tip: "KIP da cheinch" },
    { id: "loc-din09", cat: "dinero-en", lvl: 2, es: "Necesito una factura.", en: "I need an invoice.", tip: "ai nid an ÍN-vois" },
    { id: "loc-din10", cat: "dinero-en", lvl: 1, es: "¿Puedo pagar con el teléfono?", en: "Can I pay with my phone?", tip: "can ai PÉI wid mai fóun" },

    // ===== Trabajo y negocios (Forts.) =====
    // --- atención al cliente ---
    { id: "loc-cli01", cat: "cliente-en", lvl: 1, es: "¿En qué puedo ayudarle?", en: "How may I help you?", tip: "jau mei ai JELP yu" },
    { id: "loc-cli02", cat: "cliente-en", lvl: 1, es: "Permítame revisar.", en: "Let me check.", tip: "LET mi CHEK" },
    { id: "loc-cli03", cat: "cliente-en", lvl: 2, es: "Lamento el inconveniente.", en: "I'm sorry for the inconvenience.", tip: "aim SO-rri for di in-con-VÍ-niens" },
    { id: "loc-cli04", cat: "cliente-en", lvl: 2, es: "¿Me da su número de pedido?", en: "Can I have your order number?", tip: "can ai jav yor OR-der NÓM-ber" },
    { id: "loc-cli05", cat: "cliente-en", lvl: 2, es: "Le envío la información.", en: "I'll send you the information.", tip: "ail send yu di in-for-MÉI-shon" },
    { id: "loc-cli06", cat: "cliente-en", lvl: 2, es: "¿Hay algo más en lo que pueda ayudar?", en: "Is there anything else I can help with?", tip: "is der É-ni-zing els ai can JELP wid" },
    { id: "loc-cli07", cat: "cliente-en", lvl: 1, es: "Gracias por su paciencia.", en: "Thank you for your patience.", tip: "zenk yu for yor PÉI-shens" },
    { id: "loc-cli08", cat: "cliente-en", lvl: 1, es: "Que tenga un buen día.", en: "Have a great day.", tip: "jav a GRÉIT dei" },
    { id: "loc-cli09", cat: "cliente-en", lvl: 2, es: "Voy a transferir su llamada.", en: "I'll transfer your call.", tip: "ail trans-FÉR yor COL" },
    { id: "loc-cli10", cat: "cliente-en", lvl: 2, es: "Su caso quedó resuelto.", en: "Your case has been resolved.", tip: "yor KÉIS jas bin ri-ZÓLVD" },

    // ===== Escuela y examen (Forts.) =====
    // --- números y fechas ---
    { id: "loc-num01", cat: "numeros-en", lvl: 1, es: "uno, dos, tres", en: "one, two, three", tip: "UAN, TU, ZRI" },
    { id: "loc-num02", cat: "numeros-en", lvl: 1, es: "diez", en: "ten", tip: "TEN" },
    { id: "loc-num03", cat: "numeros-en", lvl: 1, es: "veinte", en: "twenty", tip: "TUÉN-ti" },
    { id: "loc-num04", cat: "numeros-en", lvl: 2, es: "cien", en: "one hundred", tip: "uan JÓN-dred" },
    { id: "loc-num05", cat: "numeros-en", lvl: 2, es: "mil", en: "one thousand", tip: "uan ZÁU-sand" },
    { id: "loc-num06", cat: "numeros-en", lvl: 2, es: "el primero", en: "the first", tip: "da FERST" },
    { id: "loc-num07", cat: "numeros-en", lvl: 1, es: "lunes", en: "Monday", tip: "MÓN-dei" },
    { id: "loc-num08", cat: "numeros-en", lvl: 2, es: "¿Qué fecha es hoy?", en: "What's the date today?", tip: "wats da DÉIT tu-DÉI" },
    { id: "loc-num09", cat: "numeros-en", lvl: 2, es: "la mitad", en: "half", tip: "JAF" },
    { id: "loc-num10", cat: "numeros-en", lvl: 1, es: "¿Cuánto es en total?", en: "How much is it in total?", tip: "jau moch is it in TÓU-tal" },

    // --- En la playa (Strand-Service / Cartagena) ---
    { id: "loc-pla01", cat: "playa-en", lvl: 1, es: "¿Le rento una silla?", en: "Would you like to rent a chair?", tip: "wud yu laik tu RENT a CHER" },
    { id: "loc-pla02", cat: "playa-en", lvl: 1, es: "¿Quiere una sombrilla?", en: "Would you like an umbrella?", tip: "wud yu laik an om-BRÉ-la" },
    { id: "loc-pla03", cat: "playa-en", lvl: 2, es: "Cuidado con las olas.", en: "Watch out for the waves.", tip: "WACH aut for da WÉIVS" },
    { id: "loc-pla04", cat: "playa-en", lvl: 1, es: "El sol está fuerte hoy.", en: "The sun is strong today.", tip: "da SON is strong tu-DÉI" },
    { id: "loc-pla05", cat: "playa-en", lvl: 2, es: "¿Le ofrezco un masaje?", en: "Can I offer you a massage?", tip: "can ai Ó-fer yu a ma-SÁSH" },
    { id: "loc-pla06", cat: "playa-en", lvl: 1, es: "¿Un coco frío?", en: "A cold coconut?", tip: "a cold CÓU-co-not" },
    { id: "loc-pla07", cat: "playa-en", lvl: 2, es: "No deje sus cosas solas.", en: "Don't leave your things alone.", tip: "dont LIV yor zings a-LÓUN" },
    { id: "loc-pla08", cat: "playa-en", lvl: 1, es: "El bote sale en diez minutos.", en: "The boat leaves in ten minutes.", tip: "da BÓUT livs in ten MÍ-nits" },

    // --- Transporte público ---
    { id: "loc-tra01", cat: "transporte-en", lvl: 1, es: "¿Este bus va al centro?", en: "Does this bus go downtown?", tip: "dos dis BOS gou DÁUN-taun" },
    { id: "loc-tra02", cat: "transporte-en", lvl: 2, es: "¿Cuánto cuesta el pasaje?", en: "How much is the fare?", tip: "jau moch is da FER" },
    { id: "loc-tra03", cat: "transporte-en", lvl: 1, es: "¿Dónde me bajo?", en: "Where do I get off?", tip: "wer du ai get OF" },
    { id: "loc-tra04", cat: "transporte-en", lvl: 1, es: "La próxima parada, por favor.", en: "Next stop, please.", tip: "nekst STOP plis" },
    { id: "loc-tra05", cat: "transporte-en", lvl: 2, es: "¿A qué hora sale el próximo?", en: "What time is the next one?", tip: "wat taim is da nekst UAN" },
    { id: "loc-tra06", cat: "transporte-en", lvl: 1, es: "¿Tiene cambio?", en: "Do you have change?", tip: "du yu jav CHÉINCH" },
    { id: "loc-tra07", cat: "transporte-en", lvl: 1, es: "Voy al aeropuerto.", en: "I'm going to the airport.", tip: "aim GÓU-ing tu di ER-port" },
    { id: "loc-tra08", cat: "transporte-en", lvl: 2, es: "¿Está muy lejos a pie?", en: "Is it far on foot?", tip: "is it FAR on fut" },

    // --- En la reunión (Meetings) ---
    { id: "loc-reu01", cat: "reunion-en", lvl: 1, es: "Empecemos.", en: "Let's get started.", tip: "lets get STÁR-ted" },
    { id: "loc-reu02", cat: "reunion-en", lvl: 2, es: "¿Pueden ver mi pantalla?", en: "Can you see my screen?", tip: "can yu SI mai scrin" },
    { id: "loc-reu03", cat: "reunion-en", lvl: 2, es: "Disculpen, se cortó.", en: "Sorry, you cut out.", tip: "SO-rri, yu cot ÁUT" },
    { id: "loc-reu04", cat: "reunion-en", lvl: 2, es: "¿Pueden repetir eso?", en: "Could you repeat that?", tip: "cud yu ri-PÍT dat" },
    { id: "loc-reu05", cat: "reunion-en", lvl: 1, es: "Estoy de acuerdo con eso.", en: "I agree with that.", tip: "ai a-GRÍ wid dat" },
    { id: "loc-reu06", cat: "reunion-en", lvl: 2, es: "Lo dejamos para después.", en: "Let's leave it for later.", tip: "lets liv it for LÉI-ter" },
    { id: "loc-reu07", cat: "reunion-en", lvl: 1, es: "¿Alguna pregunta?", en: "Any questions?", tip: "É-ni KUÉS-chons" },
    { id: "loc-reu08", cat: "reunion-en", lvl: 1, es: "Gracias a todos.", en: "Thanks, everyone.", tip: "zenks É-vri-uan" },

    // --- Conectores útiles (Bindewörter) ---
    { id: "loc-con01", cat: "conectores-en", lvl: 1, es: "pero", en: "but", tip: "BOT" },
    { id: "loc-con02", cat: "conectores-en", lvl: 1, es: "porque", en: "because", tip: "bi-CÓS" },
    { id: "loc-con03", cat: "conectores-en", lvl: 1, es: "también", en: "also", tip: "ÓL-sou" },
    { id: "loc-con04", cat: "conectores-en", lvl: 2, es: "por ejemplo", en: "for example", tip: "for eg-ZÁM-pol" },
    { id: "loc-con05", cat: "conectores-en", lvl: 1, es: "entonces", en: "so", tip: "SÓU" },
    { id: "loc-con06", cat: "conectores-en", lvl: 2, es: "además", en: "besides", tip: "bi-SÁIDS" },
    { id: "loc-con07", cat: "conectores-en", lvl: 2, es: "sin embargo", en: "however", tip: "jau-É-ver" },
    { id: "loc-con08", cat: "conectores-en", lvl: 2, es: "al final", en: "in the end", tip: "in di END" },

    // --- Quejas y disculpas (Beschwerden souverän lösen) ---
    { id: "loc-que01", cat: "quejas-en", lvl: 1, es: "Lo siento mucho.", en: "I'm very sorry.", tip: "aim VÉ-ri SO-rri" },
    { id: "loc-que02", cat: "quejas-en", lvl: 2, es: "Voy a solucionarlo enseguida.", en: "I'll fix it right away.", tip: "ail FIKS it rait a-WÉI" },
    { id: "loc-que03", cat: "quejas-en", lvl: 2, es: "¿Cuál es el problema?", en: "What's the problem?", tip: "wats da PRÓ-blem" },
    { id: "loc-que04", cat: "quejas-en", lvl: 1, es: "Le traigo otro.", en: "I'll bring you another one.", tip: "ail bring yu a-NÓ-der uan" },
    { id: "loc-que05", cat: "quejas-en", lvl: 2, es: "No se le cobrará.", en: "There's no charge.", tip: "ders no CHARCH" },
    { id: "loc-que06", cat: "quejas-en", lvl: 2, es: "Permítame llamar al gerente.", en: "Let me call the manager.", tip: "let mi col da MÁ-ni-yer" },
    { id: "loc-que07", cat: "quejas-en", lvl: 1, es: "Gracias por avisarnos.", en: "Thanks for letting us know.", tip: "zenks for LÉ-ting os nóu" },
    { id: "loc-que08", cat: "quejas-en", lvl: 1, es: "¿Está mejor así?", en: "Is this better?", tip: "is dis BÉ-ter" },

    // --- Comida típica (Gerichte erklären, Cartagena) ---
    { id: "loc-pla-t01", cat: "platos-en", lvl: 1, es: "Es un plato típico de aquí.", en: "It's a local dish.", tip: "its a LÓU-cal dish" },
    { id: "loc-pla-t02", cat: "platos-en", lvl: 2, es: "Viene con arroz y pescado.", en: "It comes with rice and fish.", tip: "it coms wid RÁIS and fish" },
    { id: "loc-pla-t03", cat: "platos-en", lvl: 1, es: "Es un poco picante.", en: "It's a little spicy.", tip: "its a LÍ-tol SPÁI-si" },
    { id: "loc-pla-t04", cat: "platos-en", lvl: 2, es: "La arepa es de maíz.", en: "The arepa is made of corn.", tip: "di a-RÉ-pa is meid of CORN" },
    { id: "loc-pla-t05", cat: "platos-en", lvl: 2, es: "El ceviche lleva limón.", en: "The ceviche has lime.", tip: "da se-VÍ-che jas LÁIM" },
    { id: "loc-pla-t06", cat: "platos-en", lvl: 1, es: "¿Es vegetariano?", en: "Is it vegetarian?", tip: "is it ve-ye-TÉ-rian" },
    { id: "loc-pla-t07", cat: "platos-en", lvl: 1, es: "Se lo recomiendo.", en: "I recommend it.", tip: "ai re-co-MÉND it" },
    { id: "loc-pla-t08", cat: "platos-en", lvl: 1, es: "Buen provecho.", en: "Enjoy your meal.", tip: "en-YÓI yor MIL" },

    // --- Emergencias y seguridad (Touristen helfen / eigene Sicherheit) ---
    { id: "loc-eme01", cat: "emergencias-en", lvl: 1, es: "¿Está bien?", en: "Are you okay?", tip: "ar yu o-KÉI" },
    { id: "loc-eme02", cat: "emergencias-en", lvl: 1, es: "Llame a la policía.", en: "Call the police.", tip: "COL da po-LÍS" },
    { id: "loc-eme03", cat: "emergencias-en", lvl: 1, es: "Necesito ayuda.", en: "I need help.", tip: "ai nid JELP" },
    { id: "loc-eme04", cat: "emergencias-en", lvl: 2, es: "¿Llamo a una ambulancia?", en: "Should I call an ambulance?", tip: "shud ai col an ÁM-biu-lans" },
    { id: "loc-eme05", cat: "emergencias-en", lvl: 1, es: "Tenga cuidado.", en: "Be careful.", tip: "bi KER-ful" },
    { id: "loc-eme06", cat: "emergencias-en", lvl: 2, es: "Perdí mi pasaporte.", en: "I lost my passport.", tip: "ai lost mai PÁS-port" },
    { id: "loc-eme07", cat: "emergencias-en", lvl: 2, es: "Me robaron.", en: "I was robbed.", tip: "ai was ROBD" },
    { id: "loc-eme08", cat: "emergencias-en", lvl: 1, es: "Quédese tranquilo.", en: "Stay calm.", tip: "stei CAM" },

    // --- Reseñas y redes (Bewertungen & Social für Tourismusbetriebe) ---
    { id: "loc-res01", cat: "resenas-en", lvl: 2, es: "¿Nos deja una reseña?", en: "Could you leave us a review?", tip: "cud yu liv os a ri-VIÚ" },
    { id: "loc-res02", cat: "resenas-en", lvl: 1, es: "Síganos en Instagram.", en: "Follow us on Instagram.", tip: "FÓ-lou os on ÍN-sta-gram" },
    { id: "loc-res03", cat: "resenas-en", lvl: 2, es: "Etiquétenos en sus fotos.", en: "Tag us in your photos.", tip: "TAG os in yor FÓU-tos" },
    { id: "loc-res04", cat: "resenas-en", lvl: 1, es: "Gracias por su visita.", en: "Thanks for visiting.", tip: "zenks for VÍ-si-ting" },
    { id: "loc-res05", cat: "resenas-en", lvl: 2, es: "¿Le gustó el servicio?", en: "Did you enjoy the service?", tip: "did yu en-YÓI da SÉR-vis" },
    { id: "loc-res06", cat: "resenas-en", lvl: 2, es: "Compártalo con sus amigos.", en: "Share it with your friends.", tip: "SHER it wid yor frends" },
    { id: "loc-res07", cat: "resenas-en", lvl: 2, es: "Estamos en Google Maps.", en: "We're on Google Maps.", tip: "wir on GÚ-gol maps" },
    { id: "loc-res08", cat: "resenas-en", lvl: 1, es: "Vuelva cuando quiera.", en: "Come back anytime.", tip: "com bak É-ni-taim" },
  ];

  // Ein kuratiertes Schnellstart-Paket je Kategorie (analog data.js PRESETS).
  var PRESETS = CATEGORIES.map(function (c) {
    return {
      id: "locals-" + c.id,
      scope: c.id,
      pick: CARDS.filter(function (k) { return k.cat === c.id; }).map(function (k) { return k.id; }),
    };
  });

  // Kursplan „Semana 1–4" – ein strukturierter 4-Wochen-Lehrgang (analog data.js
  // PRETRIP, läuft über dieselbe Etappen-/Study-Engine). Jede Woche bündelt Karten
  // quer durch die Kategorien zu einem sinnvollen Lernpfad: vom Service-Basis bis zu
  // Reklamationen, Verkauf, Essen & Reseñas. scope "curso-en" (kein Reiseziel).
  var PLANS = [
    {
      scope: "curso-en",
      label: "Curso de inglés", labelEs: "Curso de inglés", labelEn: "English course",
      days: [
        { day: 1, titleDe: "Semana 1: Lo básico del servicio", titleEs: "Semana 1: Lo básico del servicio", titleEn: "Week 1: Service basics",
          cardIds: ["loc-sal01", "loc-sal02", "loc-sal05", "loc-mes01", "loc-mes02", "loc-mes04", "loc-rec01", "loc-rec08"] },
        { day: 2, titleDe: "Semana 2: Atender y orientar", titleEs: "Semana 2: Atender y orientar", titleEn: "Week 2: Assist & guide",
          cardIds: ["loc-rec02", "loc-rec06", "loc-dir01", "loc-dir02", "loc-dir03", "loc-tax01", "loc-tax03", "loc-gui02"] },
        { day: 3, titleDe: "Semana 3: Vender y resolver", titleEs: "Semana 3: Vender y resolver", titleEn: "Week 3: Sell & resolve",
          cardIds: ["loc-ven01", "loc-ven02", "loc-com05", "loc-din05", "loc-din07", "loc-que01", "loc-que02", "loc-que04"] },
        { day: 4, titleDe: "Semana 4: Más allá del servicio", titleEs: "Semana 4: Más allá del servicio", titleEn: "Week 4: Beyond service",
          cardIds: ["loc-pla-t01", "loc-pla-t03", "loc-pla01", "loc-pla02", "loc-res01", "loc-res02", "loc-eme01", "loc-eme03"] },
      ],
    },
  ];

  // Öffentlich machen (für Tests / spätere Cluster) …
  SC.dataLocals = { CATEGORIES: CATEGORIES, CARDS: CARDS, PRESETS: PRESETS, PLANS: PLANS };

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
        // Kursplan VORN: defaultPretripScope nimmt im Locals-Track PRETRIP()[0].
        SC.data.PRETRIP = PLANS.concat(SC.data.PRETRIP || []);
      }
    }
  } catch (e) { /* ohne Config/Data: stiller Rückfall, App läuft wie gehabt */ }
})();
