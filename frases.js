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
      intro: "Bus, Taxi & Tickets – unterwegs von A nach B." },
    { id: "alojamiento", label: "En el hostal",    icon: "🛏️", lvl: 1,
      intro: "Einchecken, Zimmer, WLAN und Gepäck." },
    { id: "comida",      label: "Comida y bebida", icon: "🍽️", lvl: 1,
      intro: "Bestellen, empfehlen lassen und die Rechnung." },
    { id: "compras",     label: "Compras y dinero", icon: "🛒", lvl: 1,
      intro: "Einkaufen, handeln und bezahlen." },
    { id: "emergencia",  label: "Salud y emergencias", icon: "🆘", lvl: 2,
      intro: "Beim Arzt, in der Apotheke und im Notfall." },
    { id: "social",      label: "Conocer gente",   icon: "🗣️", lvl: 1,
      intro: "Smalltalk – Leute auf der Reise kennenlernen." },
    { id: "orientacion", label: "Orientarse",      icon: "🧭", lvl: 1,
      intro: "Nach dem Weg fragen und sich zurechtfinden." },
  ];

  const FRASES = [
    // ---------- En la ruta (Transport) ----------
    {
      id: "tr01", cat: "transporte", frameEs: "¿Cuánto cuesta ___?", targetDe: "Wie viel kostet das Ticket?",
      slot: { es: "el boleto", de: "das Ticket" },
      distractors: [
        { es: "la habitación", de: "das Zimmer" },
        { es: "la entrada", de: "der Eintritt" },
        { es: "el almuerzo", de: "das Mittagessen" },
      ],
    },
    {
      id: "tr02", cat: "transporte", frameEs: "¿A qué hora ___?", targetDe: "Um wie viel Uhr fährt der Bus ab?",
      slot: { es: "sale el bus", de: "fährt der Bus ab" },
      distractors: [
        { es: "abren", de: "öffnen sie" },
        { es: "cierran", de: "schließen sie" },
        { es: "llega el colectivo", de: "kommt der Bus an" },
      ],
    },
    {
      id: "tr03", cat: "transporte", frameEs: "Quiero un boleto para ___.", targetDe: "Ich möchte ein Ticket nach Bogotá.",
      slot: { es: "Bogotá", de: "nach Bogotá" },
      distractors: [
        { es: "el centro", de: "ins Zentrum" },
        { es: "la costa", de: "an die Küste" },
        { es: "mañana", de: "für morgen" },
      ],
    },
    {
      id: "tr04", cat: "transporte", frameEs: "¿Este bus va a ___?", targetDe: "Fährt dieser Bus ins Zentrum?",
      slot: { es: "el centro", de: "ins Zentrum" },
      distractors: [
        { es: "la playa", de: "zum Strand" },
        { es: "el aeropuerto", de: "zum Flughafen" },
        { es: "la frontera", de: "zur Grenze" },
      ],
    },
    {
      id: "tr05", cat: "transporte", frameEs: "Pare en ___, por favor.", targetDe: "Halten Sie an der Ecke, bitte.",
      slot: { es: "la esquina", de: "an der Ecke" },
      distractors: [
        { es: "el semáforo", de: "an der Ampel" },
        { es: "la próxima", de: "an der nächsten" },
        { es: "el mercado", de: "am Markt" },
      ],
    },
    {
      id: "tr06", cat: "transporte", frameEs: "¿Dónde puedo tomar ___?", targetDe: "Wo kann ich ein Taxi nehmen?",
      slot: { es: "un taxi", de: "ein Taxi" },
      distractors: [
        { es: "el metro", de: "die U-Bahn" },
        { es: "un colectivo", de: "einen Sammelbus" },
        { es: "el tren", de: "den Zug" },
      ],
    },
    {
      id: "tr07", cat: "transporte", frameEs: "El bus sale desde ___.", targetDe: "Der Bus fährt vom Busbahnhof ab.",
      slot: { es: "la terminal", de: "vom Busbahnhof" },
      distractors: [
        { es: "el andén", de: "vom Bahnsteig" },
        { es: "la parada", de: "von der Haltestelle" },
        { es: "el centro", de: "vom Zentrum" },
      ],
    },

    // ---------- En el hostal (Unterkunft) ----------
    {
      id: "al01", cat: "alojamiento", frameEs: "¿Tiene ___?", targetDe: "Haben Sie WLAN?",
      slot: { es: "wifi", de: "WLAN" },
      distractors: [
        { es: "cambio", de: "Wechselgeld" },
        { es: "una habitación", de: "ein Zimmer" },
        { es: "un mapa", de: "eine Karte" },
      ],
    },
    {
      id: "al02", cat: "alojamiento", frameEs: "Quisiera reservar ___.", targetDe: "Ich möchte ein Bett reservieren.",
      slot: { es: "una cama", de: "ein Bett" },
      distractors: [
        { es: "una habitación doble", de: "ein Doppelzimmer" },
        { es: "el desayuno", de: "das Frühstück" },
        { es: "una mesa", de: "einen Tisch" },
      ],
    },
    {
      id: "al03", cat: "alojamiento", frameEs: "¿El desayuno está ___?", targetDe: "Ist das Frühstück inklusive?",
      slot: { es: "incluido", de: "inklusive" },
      distractors: [
        { es: "listo", de: "fertig" },
        { es: "caliente", de: "warm" },
        { es: "afuera", de: "draußen" },
      ],
    },
    {
      id: "al04", cat: "alojamiento", frameEs: "¿A qué hora es ___?", targetDe: "Um wie viel Uhr ist der Checkout?",
      slot: { es: "la salida", de: "der Checkout" },
      distractors: [
        { es: "el desayuno", de: "das Frühstück" },
        { es: "la cena", de: "das Abendessen" },
        { es: "la limpieza", de: "die Reinigung" },
      ],
    },
    {
      id: "al05", cat: "alojamiento", frameEs: "¿Puedo dejar ___ aquí?", targetDe: "Kann ich meinen Rucksack hier lassen?",
      slot: { es: "mi mochila", de: "meinen Rucksack" },
      distractors: [
        { es: "la llave", de: "den Schlüssel" },
        { es: "la reserva", de: "die Reservierung" },
        { es: "el pasaporte", de: "den Pass" },
      ],
    },
    {
      id: "al06", cat: "alojamiento", frameEs: "La habitación tiene ___.", targetDe: "Das Zimmer hat ein eigenes Bad.",
      slot: { es: "baño privado", de: "ein eigenes Bad" },
      distractors: [
        { es: "aire acondicionado", de: "eine Klimaanlage" },
        { es: "vista al mar", de: "Meerblick" },
        { es: "agua caliente", de: "warmes Wasser" },
      ],
    },
    {
      id: "al07", cat: "alojamiento", frameEs: "¿Hay ___ en el hostal?", targetDe: "Gibt es Spinde im Hostel?",
      slot: { es: "casilleros", de: "Spinde" },
      distractors: [
        { es: "cocina", de: "eine Küche" },
        { es: "toallas", de: "Handtücher" },
        { es: "una piscina", de: "einen Pool" },
      ],
    },

    // ---------- Comida y bebida (Essen & Trinken) ----------
    {
      id: "co01", cat: "comida", frameEs: "Quiero ___, por favor.", targetDe: "Ich möchte die Rechnung, bitte.",
      slot: { es: "la cuenta", de: "die Rechnung" },
      distractors: [
        { es: "un café", de: "einen Kaffee" },
        { es: "el menú", de: "die Speisekarte" },
        { es: "una cerveza", de: "ein Bier" },
      ],
    },
    {
      id: "co02", cat: "comida", frameEs: "Para mí ___, por favor.", targetDe: "Für mich ein stilles Wasser, bitte.",
      slot: { es: "agua sin gas", de: "ein stilles Wasser" },
      distractors: [
        { es: "un jugo", de: "einen Saft" },
        { es: "una limonada", de: "eine Limonade" },
        { es: "un café con leche", de: "einen Milchkaffee" },
      ],
    },
    {
      id: "co03", cat: "comida", frameEs: "¿Qué me ___?", targetDe: "Was empfehlen Sie mir?",
      slot: { es: "recomienda", de: "empfehlen Sie" },
      distractors: [
        { es: "trae", de: "bringen Sie" },
        { es: "cobra", de: "berechnen Sie" },
        { es: "sirve", de: "servieren Sie" },
      ],
    },
    {
      id: "co04", cat: "comida", frameEs: "¿Esto lleva ___?", targetDe: "Ist da Fleisch drin?",
      slot: { es: "carne", de: "Fleisch" },
      distractors: [
        { es: "picante", de: "Schärfe" },
        { es: "gluten", de: "Gluten" },
        { es: "azúcar", de: "Zucker" },
      ],
    },
    {
      id: "co05", cat: "comida", frameEs: "Soy ___, ¿qué hay?", targetDe: "Ich bin Vegetarier, was gibt es?",
      slot: { es: "vegetariano", de: "Vegetarier" },
      distractors: [
        { es: "alérgico", de: "allergisch" },
        { es: "turista", de: "Tourist" },
        { es: "estudiante", de: "Student" },
      ],
    },
    {
      id: "co06", cat: "comida", frameEs: "La cuenta, ___.", targetDe: "Die Rechnung, getrennt bitte.",
      slot: { es: "separada", de: "getrennt" },
      distractors: [
        { es: "completa", de: "komplett" },
        { es: "en efectivo", de: "in bar" },
        { es: "con propina", de: "mit Trinkgeld" },
      ],
    },
    {
      id: "co07", cat: "comida", frameEs: "¿Me trae ___?", targetDe: "Bringen Sie mir die Speisekarte?",
      slot: { es: "el menú", de: "die Speisekarte" },
      distractors: [
        { es: "la sal", de: "das Salz" },
        { es: "un tenedor", de: "eine Gabel" },
        { es: "servilletas", de: "Servietten" },
      ],
    },

    // ---------- Compras y dinero (Einkaufen & Geld) ----------
    {
      id: "cp01", cat: "compras", frameEs: "Me gustaría ___.", targetDe: "Ich würde gern mit Karte bezahlen.",
      slot: { es: "pagar con tarjeta", de: "mit Karte bezahlen" },
      distractors: [
        { es: "reservar una cama", de: "ein Bett reservieren" },
        { es: "ver la habitación", de: "das Zimmer ansehen" },
        { es: "pedir la comida", de: "das Essen bestellen" },
      ],
    },
    {
      id: "cp02", cat: "compras", frameEs: "¿Me hace ___?", targetDe: "Geben Sie mir einen Rabatt?",
      slot: { es: "un descuento", de: "einen Rabatt" },
      distractors: [
        { es: "un favor", de: "einen Gefallen" },
        { es: "una pregunta", de: "eine Frage" },
        { es: "la cuenta", de: "die Rechnung" },
      ],
    },
    {
      id: "cp03", cat: "compras", frameEs: "Solo estoy ___.", targetDe: "Ich schaue nur.",
      slot: { es: "mirando", de: "am Schauen" },
      distractors: [
        { es: "pagando", de: "am Bezahlen" },
        { es: "comprando", de: "am Kaufen" },
        { es: "buscando", de: "am Suchen" },
      ],
    },
    {
      id: "cp04", cat: "compras", frameEs: "¿Tiene esto en ___?", targetDe: "Haben Sie das in einer anderen Größe?",
      slot: { es: "otra talla", de: "einer anderen Größe" },
      distractors: [
        { es: "otro color", de: "einer anderen Farbe" },
        { es: "oferta", de: "im Angebot" },
        { es: "efectivo", de: "bar" },
      ],
    },
    {
      id: "cp05", cat: "compras", frameEs: "¿Puedo pagar ___?", targetDe: "Kann ich in bar bezahlen?",
      slot: { es: "en efectivo", de: "in bar" },
      distractors: [
        { es: "con tarjeta", de: "mit Karte" },
        { es: "en dólares", de: "in Dollar" },
        { es: "después", de: "später" },
      ],
    },
    {
      id: "cp06", cat: "compras", frameEs: "¿Me da ___, por favor?", targetDe: "Geben Sie mir eine Tüte, bitte?",
      slot: { es: "una bolsa", de: "eine Tüte" },
      distractors: [
        { es: "el recibo", de: "den Kassenbon" },
        { es: "cambio", de: "Wechselgeld" },
        { es: "otra", de: "eine andere" },
      ],
    },
    {
      id: "cp07", cat: "compras", frameEs: "¿Dónde está ___?", targetDe: "Wo ist die Kasse?",
      slot: { es: "la caja", de: "die Kasse" },
      distractors: [
        { es: "la entrada", de: "der Eingang" },
        { es: "el probador", de: "die Umkleide" },
        { es: "la salida", de: "der Ausgang" },
      ],
    },

    // ---------- Salud y emergencias (Gesundheit & Notfall) ----------
    {
      id: "em01", cat: "emergencia", frameEs: "Necesito ___.", targetDe: "Ich brauche einen Arzt.",
      slot: { es: "un médico", de: "einen Arzt" },
      distractors: [
        { es: "un taxi", de: "ein Taxi" },
        { es: "agua", de: "Wasser" },
        { es: "el baño", de: "die Toilette" },
      ],
    },
    {
      id: "em02", cat: "emergencia", frameEs: "Me duele ___.", targetDe: "Mein Bauch tut weh.",
      slot: { es: "el estómago", de: "der Bauch" },
      distractors: [
        { es: "la cabeza", de: "der Kopf" },
        { es: "la garganta", de: "der Hals" },
        { es: "la espalda", de: "der Rücken" },
      ],
    },
    {
      id: "em03", cat: "emergencia", frameEs: "Soy alérgico a ___.", targetDe: "Ich bin allergisch gegen Penicillin.",
      slot: { es: "la penicilina", de: "Penicillin" },
      distractors: [
        { es: "los mariscos", de: "Meeresfrüchte" },
        { es: "el polen", de: "Pollen" },
        { es: "los gatos", de: "Katzen" },
      ],
    },
    {
      id: "em04", cat: "emergencia", frameEs: "Llame a ___, por favor.", targetDe: "Rufen Sie einen Krankenwagen, bitte.",
      slot: { es: "una ambulancia", de: "einen Krankenwagen" },
      distractors: [
        { es: "la policía", de: "die Polizei" },
        { es: "un médico", de: "einen Arzt" },
        { es: "mi hotel", de: "mein Hotel" },
      ],
    },
    {
      id: "em05", cat: "emergencia", frameEs: "Necesito ___ para el dolor.", targetDe: "Ich brauche ein Medikament gegen die Schmerzen.",
      slot: { es: "un medicamento", de: "ein Medikament" },
      distractors: [
        { es: "una receta", de: "ein Rezept" },
        { es: "una venda", de: "einen Verband" },
        { es: "descanso", de: "Ruhe" },
      ],
    },
    {
      id: "em06", cat: "emergencia", frameEs: "Perdí ___.", targetDe: "Ich habe meinen Pass verloren.",
      slot: { es: "mi pasaporte", de: "meinen Pass" },
      distractors: [
        { es: "mi celular", de: "mein Handy" },
        { es: "mi billetera", de: "meine Brieftasche" },
        { es: "el vuelo", de: "den Flug" },
      ],
    },
    {
      id: "em07", cat: "emergencia", frameEs: "¿Dónde hay ___?", targetDe: "Wo gibt es eine Apotheke?",
      slot: { es: "una farmacia", de: "eine Apotheke" },
      distractors: [
        { es: "un hospital", de: "ein Krankenhaus" },
        { es: "un policía", de: "einen Polizisten" },
        { es: "un baño", de: "eine Toilette" },
      ],
    },

    // ---------- Conocer gente (Smalltalk) ----------
    {
      id: "so01", cat: "social", frameEs: "¿Me puede ___?", targetDe: "Können Sie mir helfen?",
      slot: { es: "ayudar", de: "helfen" },
      distractors: [
        { es: "recomendar algo", de: "etwas empfehlen" },
        { es: "llamar un taxi", de: "ein Taxi rufen" },
        { es: "mostrar el camino", de: "den Weg zeigen" },
      ],
    },
    {
      id: "so02", cat: "social", frameEs: "¿De ___ eres?", targetDe: "Woher kommst du?",
      slot: { es: "dónde", de: "woher" },
      distractors: [
        { es: "quién", de: "wer" },
        { es: "qué", de: "was" },
        { es: "cuándo", de: "wann" },
      ],
    },
    {
      id: "so03", cat: "social", frameEs: "¿Cómo te ___?", targetDe: "Wie heißt du?",
      slot: { es: "llamas", de: "heißt du" },
      distractors: [
        { es: "sientes", de: "fühlst du dich" },
        { es: "va", de: "geht es dir" },
        { es: "gusta", de: "gefällt es dir" },
      ],
    },
    {
      id: "so04", cat: "social", frameEs: "Mucho ___.", targetDe: "Sehr erfreut.",
      slot: { es: "gusto", de: "erfreut" },
      distractors: [
        { es: "gracias", de: "Dank" },
        { es: "tiempo", de: "Zeit" },
        { es: "favor", de: "Gefallen" },
      ],
    },
    {
      id: "so05", cat: "social", frameEs: "¿Quieres ___ algo?", targetDe: "Willst du etwas trinken?",
      slot: { es: "tomar", de: "trinken" },
      distractors: [
        { es: "comer", de: "essen" },
        { es: "bailar", de: "tanzen" },
        { es: "preguntar", de: "fragen" },
      ],
    },
    {
      id: "so06", cat: "social", frameEs: "¿Me das tu ___?", targetDe: "Gibst du mir deine Nummer?",
      slot: { es: "número", de: "Nummer" },
      distractors: [
        { es: "nombre", de: "Namen" },
        { es: "Instagram", de: "Instagram" },
        { es: "dirección", de: "Adresse" },
      ],
    },
    {
      id: "so07", cat: "social", frameEs: "¿Vamos a ___?", targetDe: "Gehen wir tanzen?",
      slot: { es: "bailar", de: "tanzen" },
      distractors: [
        { es: "comer", de: "essen" },
        { es: "la playa", de: "zum Strand" },
        { es: "caminar", de: "spazieren" },
      ],
    },

    // ---------- Orientarse (Orientierung) ----------
    {
      id: "or01", cat: "orientacion", frameEs: "¿Dónde está ___?", targetDe: "Wo ist die Bushaltestelle?",
      slot: { es: "la parada", de: "die Haltestelle" },
      distractors: [
        { es: "el cajero", de: "der Geldautomat" },
        { es: "la salida", de: "der Ausgang" },
        { es: "el hostal", de: "das Hostel" },
      ],
    },
    {
      id: "or02", cat: "orientacion", frameEs: "¿Está ___ de aquí?", targetDe: "Ist es weit von hier?",
      slot: { es: "lejos", de: "weit" },
      distractors: [
        { es: "cerca", de: "nah" },
        { es: "abierto", de: "offen" },
        { es: "libre", de: "frei" },
      ],
    },
    {
      id: "or03", cat: "orientacion", frameEs: "Siga ___.", targetDe: "Gehen Sie geradeaus.",
      slot: { es: "derecho", de: "geradeaus" },
      distractors: [
        { es: "a la derecha", de: "nach rechts" },
        { es: "a la izquierda", de: "nach links" },
        { es: "atrás", de: "zurück" },
      ],
    },
    {
      id: "or04", cat: "orientacion", frameEs: "Doble a ___.", targetDe: "Biegen Sie nach links ab.",
      slot: { es: "la izquierda", de: "nach links" },
      distractors: [
        { es: "la derecha", de: "nach rechts" },
        { es: "el centro", de: "zum Zentrum" },
        { es: "la esquina", de: "zur Ecke" },
      ],
    },
    {
      id: "or05", cat: "orientacion", frameEs: "¿Cómo llego ___?", targetDe: "Wie komme ich zum Zentrum?",
      slot: { es: "al centro", de: "zum Zentrum" },
      distractors: [
        { es: "a la playa", de: "zum Strand" },
        { es: "al hostal", de: "zum Hostel" },
        { es: "al baño", de: "zur Toilette" },
      ],
    },
    {
      id: "or06", cat: "orientacion", frameEs: "Está a ___ minutos.", targetDe: "Es ist fünf Minuten entfernt.",
      slot: { es: "cinco", de: "fünf" },
      distractors: [
        { es: "diez", de: "zehn" },
        { es: "dos", de: "zwei" },
        { es: "veinte", de: "zwanzig" },
      ],
    },
    {
      id: "or07", cat: "orientacion", frameEs: "¿Me lo muestra en ___?", targetDe: "Zeigen Sie es mir auf der Karte?",
      slot: { es: "el mapa", de: "der Karte" },
      distractors: [
        { es: "el celular", de: "dem Handy" },
        { es: "el papel", de: "dem Papier" },
        { es: "la pantalla", de: "dem Bildschirm" },
      ],
    },
  ];

  window.SC = window.SC || {};
  window.SC.frases = { FRASES, FRASES_SETS };
})();
