/*
 * frases.js  (SC.frases) – "Frases flexibles" (Satzbaukasten). REINE DATEN.
 * Lädt vor app.js, hängt sich an window.SC (wie data.js). Keine Logik, kein I/O.
 *
 * Idee: einen Satzrahmen mit Lücke ("Necesito ___") zeigen und den passenden
 * spanischen Baustein für eine vorgegebene deutsche Bedeutung wählen lassen –
 * produktives Satzbauen statt bloßem Übersetzen. Durchgängig LatAm-Spanisch.
 *
 * Themen (FRASES_SETS): jeder Rahmen gehört über `cat` zu genau einem Reise-Thema.
 * Die App lässt vorab ein Thema wählen (oder "Gemischt" über alle) – analog zu
 * den Definiciones-Listen. Themen sind reine Daten; die "Gemischt"-Kachel baut
 * der Controller virtuell aus allen Rahmen.
 *
 * Schema eines Themas (FRASES_SETS):
 *   { id, label (Spanisch), icon, lvl (Stufe 1–4), intro (deutsche Kurzanleitung) }
 *
 * Schema eines Rahmens (FRASES):
 *   { id, cat (Themen-Id), frameEs (mit "___"), targetDe (deutscher Zielsatz),
 *     slot:        { es, de }   – der korrekte Baustein,
 *     distractors: [{ es, de }] – plausible, aber falsche Bausteine (≥2) }
 */
(function () {
  "use strict";

  // ---------- Themen (Reise-Situationen) ----------
  const FRASES_SETS = [
    { id: "transporte",  label: "En la ruta",      icon: "🚌", lvl: 1,
      intro: "Bus, Taxi & Tickets – unterwegs von A nach B.",
      introEn: "Bus, taxi & tickets – getting from A to B." },
    { id: "alojamiento", label: "En el hostal",    icon: "🛏️", lvl: 1,
      intro: "Einchecken, Zimmer, WLAN und Gepäck.",
      introEn: "Checking in, rooms, WiFi and luggage." },
    { id: "comida",      label: "Comida y bebida", icon: "🍽️", lvl: 1,
      intro: "Bestellen, empfehlen lassen und die Rechnung.",
      introEn: "Ordering, getting recommendations and the bill." },
    { id: "compras",     label: "Compras y dinero", icon: "🛒", lvl: 1,
      intro: "Einkaufen, handeln und bezahlen.",
      introEn: "Shopping, haggling and paying." },
    { id: "emergencia",  label: "Salud y emergencias", icon: "🆘", lvl: 2,
      intro: "Beim Arzt, in der Apotheke und im Notfall.",
      introEn: "At the doctor's, at the pharmacy and in an emergency." },
    { id: "social",      label: "Conocer gente",   icon: "🗣️", lvl: 1,
      intro: "Smalltalk – Leute auf der Reise kennenlernen.",
      introEn: "Small talk – getting to know people while travelling." },
    { id: "orientacion", label: "Orientarse",      icon: "🧭", lvl: 1,
      intro: "Nach dem Weg fragen und sich zurechtfinden.",
      introEn: "Asking for directions and finding your way around." },
  ];

  const FRASES = [
    // ---------- En la ruta (Transport) ----------
    {
      id: "tr01", cat: "transporte", frameEs: "¿Cuánto cuesta ___?", targetDe: "Wie viel kostet das Ticket?", targetEn: "How much does the ticket cost?",
      slot: { es: "el boleto", de: "das Ticket", en: "the ticket" },
      distractors: [
        { es: "la habitación", de: "das Zimmer", en: "the room" },
        { es: "la entrada", de: "der Eintritt", en: "the entry ticket" },
        { es: "el almuerzo", de: "das Mittagessen", en: "lunch" },
      ],
    },
    {
      id: "tr02", cat: "transporte", frameEs: "¿A qué hora ___?", targetDe: "Um wie viel Uhr fährt der Bus ab?", targetEn: "What time does the bus leave?",
      slot: { es: "sale el bus", de: "fährt der Bus ab", en: "does the bus leave" },
      distractors: [
        { es: "abren", de: "öffnen sie", en: "do they open" },
        { es: "cierran", de: "schließen sie", en: "do they close" },
        { es: "llega el colectivo", de: "kommt der Bus an", en: "does the bus arrive" },
      ],
    },
    {
      id: "tr03", cat: "transporte", frameEs: "Quiero un boleto para ___.", targetDe: "Ich möchte ein Ticket nach Bogotá.", targetEn: "I'd like a ticket to Bogotá.",
      slot: { es: "Bogotá", de: "nach Bogotá", en: "to Bogotá" },
      distractors: [
        { es: "el centro", de: "ins Zentrum", en: "to the centre" },
        { es: "la costa", de: "an die Küste", en: "to the coast" },
        { es: "mañana", de: "für morgen", en: "for tomorrow" },
      ],
    },
    {
      id: "tr04", cat: "transporte", frameEs: "¿Este bus va ___?", targetDe: "Fährt dieser Bus ins Zentrum?", targetEn: "Does this bus go to the centre?",
      slot: { es: "al centro", de: "ins Zentrum", en: "to the centre" },
      distractors: [
        { es: "a la playa", de: "zum Strand", en: "to the beach" },
        { es: "al aeropuerto", de: "zum Flughafen", en: "to the airport" },
        { es: "a la frontera", de: "zur Grenze", en: "to the border" },
      ],
    },
    {
      id: "tr05", cat: "transporte", frameEs: "Pare en ___, por favor.", targetDe: "Halten Sie an der Ecke, bitte.", targetEn: "Stop at the corner, please.",
      slot: { es: "la esquina", de: "an der Ecke", en: "at the corner" },
      distractors: [
        { es: "el semáforo", de: "an der Ampel", en: "at the traffic lights" },
        { es: "la próxima", de: "an der nächsten", en: "at the next one" },
        { es: "el mercado", de: "am Markt", en: "at the market" },
      ],
    },
    {
      id: "tr06", cat: "transporte", frameEs: "¿Dónde puedo tomar ___?", targetDe: "Wo kann ich ein Taxi nehmen?", targetEn: "Where can I get a taxi?",
      slot: { es: "un taxi", de: "ein Taxi", en: "a taxi" },
      distractors: [
        { es: "el metro", de: "die U-Bahn", en: "the underground" },
        { es: "un colectivo", de: "einen Sammelbus", en: "a shared minibus" },
        { es: "el tren", de: "den Zug", en: "the train" },
      ],
    },
    {
      id: "tr07", cat: "transporte", frameEs: "El bus sale desde ___.", targetDe: "Der Bus fährt vom Busbahnhof ab.", targetEn: "The bus leaves from the bus station.",
      slot: { es: "la terminal", de: "vom Busbahnhof", en: "from the bus station" },
      distractors: [
        { es: "el andén", de: "vom Bahnsteig", en: "from the platform" },
        { es: "la parada", de: "von der Haltestelle", en: "from the bus stop" },
        { es: "el centro", de: "vom Zentrum", en: "from the centre" },
      ],
    },

    // ---------- En el hostal (Unterkunft) ----------
    {
      id: "al01", cat: "alojamiento", frameEs: "¿Tiene ___?", targetDe: "Haben Sie WLAN?", targetEn: "Do you have WiFi?",
      slot: { es: "wifi", de: "WLAN", en: "WiFi" },
      distractors: [
        { es: "cambio", de: "Wechselgeld", en: "change" },
        { es: "una habitación", de: "ein Zimmer", en: "a room" },
        { es: "un mapa", de: "eine Karte", en: "a map" },
      ],
    },
    {
      id: "al02", cat: "alojamiento", frameEs: "Quisiera reservar ___.", targetDe: "Ich möchte ein Bett reservieren.", targetEn: "I'd like to book a bed.",
      slot: { es: "una cama", de: "ein Bett", en: "a bed" },
      distractors: [
        { es: "una habitación doble", de: "ein Doppelzimmer", en: "a double room" },
        { es: "el desayuno", de: "das Frühstück", en: "breakfast" },
        { es: "una mesa", de: "einen Tisch", en: "a table" },
      ],
    },
    {
      id: "al03", cat: "alojamiento", frameEs: "¿El desayuno está ___?", targetDe: "Ist das Frühstück inklusive?", targetEn: "Is breakfast included?",
      slot: { es: "incluido", de: "inklusive", en: "included" },
      distractors: [
        { es: "listo", de: "fertig", en: "ready" },
        { es: "caliente", de: "warm", en: "hot" },
        { es: "afuera", de: "draußen", en: "outside" },
      ],
    },
    {
      id: "al04", cat: "alojamiento", frameEs: "¿A qué hora es ___?", targetDe: "Um wie viel Uhr ist der Checkout?", targetEn: "What time is checkout?",
      slot: { es: "la salida", de: "der Checkout", en: "checkout" },
      distractors: [
        { es: "el desayuno", de: "das Frühstück", en: "breakfast" },
        { es: "la cena", de: "das Abendessen", en: "dinner" },
        { es: "la limpieza", de: "die Reinigung", en: "the cleaning" },
      ],
    },
    {
      id: "al05", cat: "alojamiento", frameEs: "¿Puedo dejar ___ aquí?", targetDe: "Kann ich meinen Rucksack hier lassen?", targetEn: "Can I leave my backpack here?",
      slot: { es: "mi mochila", de: "meinen Rucksack", en: "my backpack" },
      distractors: [
        { es: "la llave", de: "den Schlüssel", en: "the key" },
        { es: "la reserva", de: "die Reservierung", en: "the booking" },
        { es: "el pasaporte", de: "den Pass", en: "the passport" },
      ],
    },
    {
      id: "al06", cat: "alojamiento", frameEs: "La habitación tiene ___.", targetDe: "Das Zimmer hat ein eigenes Bad.", targetEn: "The room has an en-suite bathroom.",
      slot: { es: "baño privado", de: "ein eigenes Bad", en: "an en-suite bathroom" },
      distractors: [
        { es: "aire acondicionado", de: "eine Klimaanlage", en: "air conditioning" },
        { es: "vista al mar", de: "Meerblick", en: "a sea view" },
        { es: "agua caliente", de: "warmes Wasser", en: "hot water" },
      ],
    },
    {
      id: "al07", cat: "alojamiento", frameEs: "¿Hay ___ en el hostal?", targetDe: "Gibt es Spinde im Hostel?", targetEn: "Are there lockers in the hostel?",
      slot: { es: "casilleros", de: "Spinde", en: "lockers" },
      distractors: [
        { es: "cocina", de: "eine Küche", en: "a kitchen" },
        { es: "toallas", de: "Handtücher", en: "towels" },
        { es: "una piscina", de: "einen Pool", en: "a pool" },
      ],
    },

    // ---------- Comida y bebida (Essen & Trinken) ----------
    {
      id: "co01", cat: "comida", frameEs: "Quiero ___, por favor.", targetDe: "Ich möchte die Rechnung, bitte.", targetEn: "I'd like the bill, please.",
      slot: { es: "la cuenta", de: "die Rechnung", en: "the bill" },
      distractors: [
        { es: "un café", de: "einen Kaffee", en: "a coffee" },
        { es: "el menú", de: "die Speisekarte", en: "the menu" },
        { es: "una cerveza", de: "ein Bier", en: "a beer" },
      ],
    },
    {
      id: "co02", cat: "comida", frameEs: "Para mí ___, por favor.", targetDe: "Für mich ein stilles Wasser, bitte.", targetEn: "For me a still water, please.",
      slot: { es: "agua sin gas", de: "ein stilles Wasser", en: "a still water" },
      distractors: [
        { es: "un jugo", de: "einen Saft", en: "a juice" },
        { es: "una limonada", de: "eine Limonade", en: "a lemonade" },
        { es: "un café con leche", de: "einen Milchkaffee", en: "a coffee with milk" },
      ],
    },
    {
      id: "co03", cat: "comida", frameEs: "¿Qué me ___?", targetDe: "Was empfehlen Sie mir?", targetEn: "What do you recommend?",
      slot: { es: "recomienda", de: "empfehlen Sie", en: "do you recommend" },
      distractors: [
        { es: "trae", de: "bringen Sie", en: "do you bring" },
        { es: "cobra", de: "berechnen Sie", en: "do you charge" },
        { es: "sirve", de: "servieren Sie", en: "do you serve" },
      ],
    },
    {
      id: "co04", cat: "comida", frameEs: "¿Esto lleva ___?", targetDe: "Ist da Fleisch drin?", targetEn: "Does this have meat in it?",
      slot: { es: "carne", de: "Fleisch", en: "meat" },
      distractors: [
        { es: "picante", de: "Schärfe", en: "spice" },
        { es: "gluten", de: "Gluten", en: "gluten" },
        { es: "azúcar", de: "Zucker", en: "sugar" },
      ],
    },
    {
      id: "co05", cat: "comida", frameEs: "Soy ___, ¿qué hay?", targetDe: "Ich bin Vegetarier, was gibt es?", targetEn: "I'm vegetarian, what is there?",
      slot: { es: "vegetariano", de: "Vegetarier", en: "vegetarian" },
      distractors: [
        { es: "alérgico", de: "allergisch", en: "allergic" },
        { es: "turista", de: "Tourist", en: "a tourist" },
        { es: "estudiante", de: "Student", en: "a student" },
      ],
    },
    {
      id: "co06", cat: "comida", frameEs: "La cuenta ___, por favor.", targetDe: "Die Rechnung getrennt, bitte.", targetEn: "Separate bills, please.",
      slot: { es: "separada", de: "getrennt", en: "separate" },
      distractors: [
        { es: "completa", de: "komplett", en: "all together" },
        { es: "en efectivo", de: "in bar", en: "in cash" },
        { es: "con propina", de: "mit Trinkgeld", en: "with a tip" },
      ],
    },
    {
      id: "co07", cat: "comida", frameEs: "¿Me trae ___?", targetDe: "Bringen Sie mir die Speisekarte?", targetEn: "Could you bring me the menu?",
      slot: { es: "el menú", de: "die Speisekarte", en: "the menu" },
      distractors: [
        { es: "la sal", de: "das Salz", en: "the salt" },
        { es: "un tenedor", de: "eine Gabel", en: "a fork" },
        { es: "servilletas", de: "Servietten", en: "napkins" },
      ],
    },

    // ---------- Compras y dinero (Einkaufen & Geld) ----------
    {
      id: "cp01", cat: "compras", frameEs: "Me gustaría ___.", targetDe: "Ich würde gern mit Karte bezahlen.", targetEn: "I'd like to pay by card.",
      slot: { es: "pagar con tarjeta", de: "mit Karte bezahlen", en: "to pay by card" },
      distractors: [
        { es: "reservar una cama", de: "ein Bett reservieren", en: "to book a bed" },
        { es: "ver la habitación", de: "das Zimmer ansehen", en: "to see the room" },
        { es: "pedir la comida", de: "das Essen bestellen", en: "to order the food" },
      ],
    },
    {
      id: "cp02", cat: "compras", frameEs: "¿Me hace ___?", targetDe: "Geben Sie mir einen Rabatt?", targetEn: "Could you give me a discount?",
      slot: { es: "un descuento", de: "einen Rabatt", en: "a discount" },
      distractors: [
        { es: "un favor", de: "einen Gefallen", en: "a favour" },
        { es: "una pregunta", de: "eine Frage", en: "a question" },
        { es: "la cuenta", de: "die Rechnung", en: "the bill" },
      ],
    },
    {
      id: "cp03", cat: "compras", frameEs: "Solo estoy ___.", targetDe: "Ich schaue nur.", targetEn: "I'm just looking.",
      slot: { es: "mirando", de: "am Schauen", en: "looking" },
      distractors: [
        { es: "pagando", de: "am Bezahlen", en: "paying" },
        { es: "comprando", de: "am Kaufen", en: "buying" },
        { es: "buscando", de: "am Suchen", en: "searching" },
      ],
    },
    {
      id: "cp04", cat: "compras", frameEs: "¿Tiene esto en ___?", targetDe: "Haben Sie das in einer anderen Größe?", targetEn: "Do you have this in another size?",
      slot: { es: "otra talla", de: "einer anderen Größe", en: "another size" },
      distractors: [
        { es: "otro color", de: "einer anderen Farbe", en: "another colour" },
        { es: "otro modelo", de: "einem anderen Modell", en: "another model" },
        { es: "oferta", de: "im Angebot", en: "on offer" },
      ],
    },
    {
      id: "cp05", cat: "compras", frameEs: "¿Puedo pagar ___?", targetDe: "Kann ich in bar bezahlen?", targetEn: "Can I pay in cash?",
      slot: { es: "en efectivo", de: "in bar", en: "in cash" },
      distractors: [
        { es: "con tarjeta", de: "mit Karte", en: "by card" },
        { es: "en dólares", de: "in Dollar", en: "in dollars" },
        { es: "después", de: "später", en: "later" },
      ],
    },
    {
      id: "cp06", cat: "compras", frameEs: "¿Me da ___, por favor?", targetDe: "Geben Sie mir eine Tüte, bitte?", targetEn: "Could you give me a bag, please?",
      slot: { es: "una bolsa", de: "eine Tüte", en: "a bag" },
      distractors: [
        { es: "el recibo", de: "den Kassenbon", en: "the receipt" },
        { es: "cambio", de: "Wechselgeld", en: "change" },
        { es: "otra", de: "eine andere", en: "another one" },
      ],
    },
    {
      id: "cp07", cat: "compras", frameEs: "¿Dónde está ___?", targetDe: "Wo ist die Kasse?", targetEn: "Where is the till?",
      slot: { es: "la caja", de: "die Kasse", en: "the till" },
      distractors: [
        { es: "la entrada", de: "der Eingang", en: "the entrance" },
        { es: "el probador", de: "die Umkleide", en: "the fitting room" },
        { es: "la salida", de: "der Ausgang", en: "the exit" },
      ],
    },

    // ---------- Salud y emergencias (Gesundheit & Notfall) ----------
    {
      id: "em01", cat: "emergencia", frameEs: "Necesito ___.", targetDe: "Ich brauche einen Arzt.", targetEn: "I need a doctor.",
      slot: { es: "un médico", de: "einen Arzt", en: "a doctor" },
      distractors: [
        { es: "un taxi", de: "ein Taxi", en: "a taxi" },
        { es: "agua", de: "Wasser", en: "water" },
        { es: "el baño", de: "die Toilette", en: "the toilet" },
      ],
    },
    {
      id: "em02", cat: "emergencia", frameEs: "Me duele ___.", targetDe: "Mein Bauch tut weh.", targetEn: "My stomach hurts.",
      slot: { es: "el estómago", de: "der Bauch", en: "stomach" },
      distractors: [
        { es: "la cabeza", de: "der Kopf", en: "head" },
        { es: "la garganta", de: "der Hals", en: "throat" },
        { es: "la espalda", de: "der Rücken", en: "back" },
      ],
    },
    {
      id: "em03", cat: "emergencia", frameEs: "Soy alérgico ___.", targetDe: "Ich bin allergisch gegen Penicillin.", targetEn: "I'm allergic to penicillin.",
      slot: { es: "a la penicilina", de: "gegen Penicillin", en: "to penicillin" },
      distractors: [
        { es: "a los mariscos", de: "gegen Meeresfrüchte", en: "to seafood" },
        { es: "al polen", de: "gegen Pollen", en: "to pollen" },
        { es: "a los gatos", de: "gegen Katzen", en: "to cats" },
      ],
    },
    {
      id: "em04", cat: "emergencia", frameEs: "Llame a ___, por favor.", targetDe: "Rufen Sie einen Krankenwagen, bitte.", targetEn: "Call an ambulance, please.",
      slot: { es: "una ambulancia", de: "einen Krankenwagen", en: "an ambulance" },
      distractors: [
        { es: "la policía", de: "die Polizei", en: "the police" },
        { es: "un médico", de: "einen Arzt", en: "a doctor" },
        { es: "mi hotel", de: "mein Hotel", en: "my hotel" },
      ],
    },
    {
      id: "em05", cat: "emergencia", frameEs: "Necesito ___ para el dolor.", targetDe: "Ich brauche ein Medikament gegen die Schmerzen.", targetEn: "I need some medicine for the pain.",
      slot: { es: "un medicamento", de: "ein Medikament", en: "some medicine" },
      distractors: [
        { es: "una receta", de: "ein Rezept", en: "a prescription" },
        { es: "una venda", de: "einen Verband", en: "a bandage" },
        { es: "descanso", de: "Ruhe", en: "rest" },
      ],
    },
    {
      id: "em06", cat: "emergencia", frameEs: "Perdí ___.", targetDe: "Ich habe meinen Pass verloren.", targetEn: "I've lost my passport.",
      slot: { es: "mi pasaporte", de: "meinen Pass", en: "my passport" },
      distractors: [
        { es: "mi celular", de: "mein Handy", en: "my phone" },
        { es: "mi billetera", de: "meine Brieftasche", en: "my wallet" },
        { es: "el vuelo", de: "den Flug", en: "my flight" },
      ],
    },
    {
      id: "em07", cat: "emergencia", frameEs: "¿Dónde hay ___?", targetDe: "Wo gibt es eine Apotheke?", targetEn: "Where is there a pharmacy?",
      slot: { es: "una farmacia", de: "eine Apotheke", en: "a pharmacy" },
      distractors: [
        { es: "un hospital", de: "ein Krankenhaus", en: "a hospital" },
        { es: "un policía", de: "einen Polizisten", en: "a police officer" },
        { es: "un baño", de: "eine Toilette", en: "a toilet" },
      ],
    },

    // ---------- Conocer gente (Smalltalk) ----------
    {
      id: "so01", cat: "social", frameEs: "¿Me puede ___?", targetDe: "Können Sie mir helfen?", targetEn: "Can you help me?",
      slot: { es: "ayudar", de: "helfen", en: "help" },
      distractors: [
        { es: "recomendar algo", de: "etwas empfehlen", en: "recommend something" },
        { es: "llamar un taxi", de: "ein Taxi rufen", en: "call a taxi" },
        { es: "mostrar el camino", de: "den Weg zeigen", en: "show the way" },
      ],
    },
    {
      id: "so02", cat: "social", frameEs: "¿De ___ eres?", targetDe: "Woher kommst du?", targetEn: "Where are you from?",
      slot: { es: "dónde", de: "woher", en: "where" },
      distractors: [
        { es: "quién", de: "wer", en: "who" },
        { es: "qué", de: "was", en: "what" },
        { es: "cuándo", de: "wann", en: "when" },
      ],
    },
    {
      id: "so03", cat: "social", frameEs: "¿Cómo te ___?", targetDe: "Wie heißt du?", targetEn: "What's your name?",
      slot: { es: "llamas", de: "heißt du", en: "are you called" },
      distractors: [
        { es: "sientes", de: "fühlst du dich", en: "do you feel" },
        { es: "va", de: "geht es dir", en: "are you doing" },
        { es: "gusta", de: "gefällt es dir", en: "do you like it" },
      ],
    },
    {
      id: "so04", cat: "social", frameEs: "Mucho ___.", targetDe: "Sehr erfreut.", targetEn: "Pleased to meet you.",
      slot: { es: "gusto", de: "erfreut", en: "pleased" },
      distractors: [
        { es: "tiempo", de: "Zeit", en: "time" },
        { es: "dinero", de: "Geld", en: "money" },
        { es: "calor", de: "Hitze", en: "heat" },
      ],
    },
    {
      id: "so05", cat: "social", frameEs: "¿Quieres ___ algo?", targetDe: "Willst du etwas trinken?", targetEn: "Do you want to drink something?",
      slot: { es: "tomar", de: "trinken", en: "drink" },
      distractors: [
        { es: "comer", de: "essen", en: "eat" },
        { es: "decir", de: "sagen", en: "say" },
        { es: "preguntar", de: "fragen", en: "ask" },
      ],
    },
    {
      id: "so06", cat: "social", frameEs: "¿Me das tu ___?", targetDe: "Gibst du mir deine Nummer?", targetEn: "Will you give me your number?",
      slot: { es: "número", de: "Nummer", en: "number" },
      distractors: [
        { es: "nombre", de: "Namen", en: "name" },
        { es: "Instagram", de: "Instagram", en: "Instagram" },
        { es: "dirección", de: "Adresse", en: "address" },
      ],
    },
    {
      id: "so07", cat: "social", frameEs: "¿Vamos a ___?", targetDe: "Gehen wir tanzen?", targetEn: "Shall we go dancing?",
      slot: { es: "bailar", de: "tanzen", en: "dance" },
      distractors: [
        { es: "comer", de: "essen", en: "eat" },
        { es: "la playa", de: "zum Strand", en: "to the beach" },
        { es: "caminar", de: "spazieren", en: "for a walk" },
      ],
    },

    // ---------- Orientarse (Orientierung) ----------
    {
      id: "or01", cat: "orientacion", frameEs: "¿Dónde está ___?", targetDe: "Wo ist die Bushaltestelle?", targetEn: "Where is the bus stop?",
      slot: { es: "la parada", de: "die Haltestelle", en: "the bus stop" },
      distractors: [
        { es: "el cajero", de: "der Geldautomat", en: "the cash machine" },
        { es: "la salida", de: "der Ausgang", en: "the exit" },
        { es: "el hostal", de: "das Hostel", en: "the hostel" },
      ],
    },
    {
      id: "or02", cat: "orientacion", frameEs: "¿Está ___ de aquí?", targetDe: "Ist es weit von hier?", targetEn: "Is it far from here?",
      slot: { es: "lejos", de: "weit", en: "far" },
      distractors: [
        { es: "cerca", de: "nah", en: "near" },
        { es: "a dos cuadras", de: "zwei Häuserblocks", en: "two blocks away" },
        { es: "a diez minutos", de: "zehn Minuten", en: "ten minutes away" },
      ],
    },
    {
      id: "or03", cat: "orientacion", frameEs: "Siga ___.", targetDe: "Gehen Sie geradeaus.", targetEn: "Carry straight on.",
      slot: { es: "derecho", de: "geradeaus", en: "straight on" },
      distractors: [
        { es: "a la derecha", de: "nach rechts", en: "to the right" },
        { es: "a la izquierda", de: "nach links", en: "to the left" },
        { es: "por aquí", de: "hier entlang", en: "this way" },
      ],
    },
    {
      id: "or04", cat: "orientacion", frameEs: "Doble ___.", targetDe: "Biegen Sie nach links ab.", targetEn: "Turn left.",
      slot: { es: "a la izquierda", de: "nach links", en: "left" },
      distractors: [
        { es: "a la derecha", de: "nach rechts", en: "right" },
        { es: "en la esquina", de: "an der Ecke", en: "at the corner" },
        { es: "al final de la calle", de: "am Ende der Straße", en: "at the end of the street" },
      ],
    },
    {
      id: "or05", cat: "orientacion", frameEs: "¿Cómo llego ___?", targetDe: "Wie komme ich zum Zentrum?", targetEn: "How do I get to the centre?",
      slot: { es: "al centro", de: "zum Zentrum", en: "to the centre" },
      distractors: [
        { es: "a la playa", de: "zum Strand", en: "to the beach" },
        { es: "al hostal", de: "zum Hostel", en: "to the hostel" },
        { es: "al baño", de: "zur Toilette", en: "to the toilet" },
      ],
    },
    {
      id: "or06", cat: "orientacion", frameEs: "Está a ___ minutos.", targetDe: "Es ist fünf Minuten entfernt.", targetEn: "It's five minutes away.",
      slot: { es: "cinco", de: "fünf", en: "five" },
      distractors: [
        { es: "diez", de: "zehn", en: "ten" },
        { es: "dos", de: "zwei", en: "two" },
        { es: "veinte", de: "zwanzig", en: "twenty" },
      ],
    },
    {
      id: "or07", cat: "orientacion", frameEs: "¿Me lo muestra en ___?", targetDe: "Zeigen Sie es mir auf der Karte?", targetEn: "Could you show me on the map?",
      slot: { es: "el mapa", de: "der Karte", en: "the map" },
      distractors: [
        { es: "el celular", de: "dem Handy", en: "the phone" },
        { es: "el papel", de: "dem Papier", en: "the paper" },
        { es: "la pantalla", de: "dem Bildschirm", en: "the screen" },
      ],
    },
  ];

  window.SC = window.SC || {};
  window.SC.frases = { FRASES, FRASES_SETS };
})();
