/*
 * data.js  (SC.data) – Modell: Kategorien + Stufen + Karten. REINE DATEN, keine Logik.
 *
 * Kategorie: { id, label, icon, grad:[from,to] }  – grad = Farbverlauf der Kachel
 * Stufe:     { id, label, short, color }           – Schwierigkeitsstufe (1–3)
 * Karte:     { id, cat, lvl, de, es, tip?, alt?, context? }
 *   cat = Kategorie-id
 *   lvl = Schwierigkeitsstufe: 1 = Einsteiger, 2 = Mittel, 3 = Fortgeschritten
 *   de  = Frage (Deutsch bzw. Ziffer)
 *   es  = Antwort (Anzeige). Mehrere gültige Antworten mit " / " trennen.
 *   tip = Aussprache-/Merkhinweis (optional)
 *   alt = explizite Liste akzeptierter Tipp-Antworten (optional, überschreibt es-Split)
 *   context = Reise-Kontext (optional): { sentenceEs, sentenceDe, situation, note }
 *             zeigt einen echten Reisesatz, die typische Situation und einen kurzen
 *             Reisetipp. Per "🧭 Kontext"-Button auf der Antwortseite aufklappbar.
 *             Inhaltsregel: immer ein echter, sprechbarer Satz – kein Lehrbuch-Spanisch.
 *
 * Neue Karten: einfach ans passende Array anhängen (lvl nicht vergessen).
 * Neue Kategorie: oben ergänzen. Filtern nach Stufe: über card.lvl.
 */
(function () {
  "use strict";

  // Akzentfarben in warmer "HolaRuta"-Erdton-Palette (Lateinamerika-Look).
  const CATEGORIES = [
    { id: "basics",  label: "Grundlagen", icon: "💬", grad: ["#C2502E", "#D4673F"] },
    { id: "zahlen",  label: "Zahlen",     icon: "🔢", grad: ["#B97C24", "#CE9438"] },
    { id: "essen",   label: "Essen",      icon: "🍽️", grad: ["#CB5A2B", "#E0743C"] },
    { id: "trinken", label: "Trinken",    icon: "🥤", grad: ["#2F6B70", "#3E8388"] },
    { id: "hotel",   label: "Hotel",      icon: "🏨", grad: ["#7D4A8E", "#9763A6"] },
    { id: "hostel",  label: "Hostel",     icon: "🛏️", grad: ["#C25A45", "#DB7A5E"] },
    { id: "social",  label: "Social",     icon: "🤝", grad: ["#8E4FA8", "#A96DBE"] },
    { id: "verkehr", label: "Verkehr",    icon: "🚌", grad: ["#3F7355", "#52906C"] },
    { id: "compras", label: "Einkaufen",  icon: "🛒", grad: ["#A86A2D", "#C2853F"] },
    { id: "dinero",  label: "Geld",       icon: "💵", grad: ["#5E7D3A", "#76954E"] },
    { id: "notfall", label: "Notfall",    icon: "🆘", grad: ["#B5302A", "#CE463E"] },
    { id: "zeit",    label: "Zeit",       icon: "📅", grad: ["#2E6E86", "#3E89A2"] },
    { id: "talk",    label: "Smalltalk",  icon: "🗣️", grad: ["#9B5BA0", "#B173B5"] },
    { id: "alltag",  label: "Alltag",     icon: "🏙️", grad: ["#8A6A52", "#A3846B"] },
    { id: "frases",  label: "Sätze",      icon: "🙋", grad: ["#A85A6E", "#C2748A"] },
    { id: "grenze",  label: "Behörden",   icon: "🛂", grad: ["#566B8A", "#6E86A3"] },
    { id: "reise",   label: "Busreise",   icon: "🚐", grad: ["#B5503F", "#CE6855"] },
  ];

  // Schwierigkeitsstufen – id entspricht card.lvl (warme Palette).
  const LEVELS = [
    { id: 1, label: "Einsteiger",      short: "A1", color: "#3F7355" },
    { id: 2, label: "Mittel",          short: "A2", color: "#B97C24" },
    { id: 3, label: "Fortgeschritten", short: "B1", color: "#B5302A" },
  ];

  const CARDS = [
    // ===================== GRUNDLAGEN =====================
    { id: "b01", cat: "basics", lvl: 1, de: "Hallo", es: "Hola", tip: "OH-la (H ist stumm)" },
    { id: "b02", cat: "basics", lvl: 1, de: "Guten Morgen", es: "Buenos días", tip: "BUE-nos DI-as" },
    { id: "b03", cat: "basics", lvl: 1, de: "Guten Tag / Nachmittag", es: "Buenas tardes", tip: "BUE-nas TAR-des" },
    { id: "b04", cat: "basics", lvl: 1, de: "Tschüss", es: "Adiós / Chau", tip: "'Chau' ist sehr verbreitet" },
    { id: "b05", cat: "basics", lvl: 1, de: "Bitte", es: "Por favor", tip: "por fa-WOR" },
    { id: "b06", cat: "basics", lvl: 1, de: "Danke", es: "Gracias", tip: "GRA-si-as" },
    { id: "b07", cat: "basics", lvl: 1, de: "Gern geschehen", es: "De nada", tip: "de NA-da" },
    { id: "b08", cat: "basics", lvl: 1, de: "Entschuldigung", es: "Disculpe", tip: "dis-KUL-pe" },
    { id: "b09", cat: "basics", lvl: 1, de: "Ja / Nein", es: "Sí / No", tip: "" },
    { id: "b10", cat: "basics", lvl: 2, de: "Ich verstehe nicht", es: "No entiendo", tip: "no en-ti-EN-do",
      context: { sentenceEs: "Perdón, no entiendo. ¿Puede repetir?", sentenceDe: "Entschuldigung, ich verstehe nicht. Können Sie das wiederholen?", situation: "Wenn jemand zu schnell oder undeutlich spricht.", note: "Bleib ruhig und ergänze direkt ¿Puede repetir? – das hilft fast immer weiter." } },
    { id: "b11", cat: "basics", lvl: 2, de: "Sprechen Sie Englisch?", es: "¿Habla inglés?", tip: "AB-la in-GLES" },
    { id: "b12", cat: "basics", lvl: 2, de: "Wie heißt du?", es: "¿Cómo te llamas?", tip: "KO-mo te YA-mas" },
    { id: "b13", cat: "basics", lvl: 2, de: "Ich heiße ...", es: "Me llamo ...", tip: "me YA-mo", alt: ["me llamo"] },
    { id: "b14", cat: "basics", lvl: 2, de: "Kannst du mir helfen?", es: "¿Me puedes ayudar?", tip: "me PUE-des a-yu-DAR" },
    { id: "b15", cat: "basics", lvl: 2, de: "Langsamer, bitte", es: "Más despacio, por favor", tip: "mas des-PA-si-o" },
    { id: "b16", cat: "basics", lvl: 1, de: "die Toilette", es: "el baño", tip: "el BA-nyo",
      context: { sentenceEs: "Disculpe, ¿dónde está el baño?", sentenceDe: "Entschuldigung, wo ist die Toilette?", situation: "In Restaurants, Hostels, Busbahnhöfen oder Cafés.", note: "In Lateinamerika sagt man meistens el baño, nicht wörtlich el inodoro." } },
    { id: "b17", cat: "basics", lvl: 1, de: "Hilfe!", es: "Ayuda / Socorro", tip: "a-YU-da",
      context: { sentenceEs: "Por favor, necesito ayuda.", sentenceDe: "Bitte, ich brauche Hilfe.", situation: "Wenn du dich unsicher fühlst oder Unterstützung brauchst.", note: "Kurz und klar. In ernsten Situationen kannst du ergänzen: Es urgente." } },
    { id: "b18", cat: "basics", lvl: 2, de: "Ich brauche einen Arzt", es: "Necesito un médico", tip: "ne-se-SI-to un ME-di-ko" },
    { id: "b19", cat: "basics", lvl: 3, de: "Rufen Sie die Polizei", es: "Llame a la policía", tip: "YA-me a la po-li-SI-a" },
    { id: "b20", cat: "basics", lvl: 2, de: "Ich habe mich verlaufen", es: "Estoy perdido/a", tip: "es-TOY per-DI-do", alt: ["estoy perdido", "estoy perdida"] },
    { id: "b21", cat: "basics", lvl: 1, de: "Apotheke", es: "la farmacia", tip: "la far-MA-si-a" },

    // ===================== ZAHLEN =====================
    { id: "z00", cat: "zahlen", lvl: 1, de: "0", es: "cero", tip: "SE-ro" },
    { id: "z01", cat: "zahlen", lvl: 1, de: "1", es: "uno", tip: "U-no" },
    { id: "z02", cat: "zahlen", lvl: 1, de: "2", es: "dos", tip: "" },
    { id: "z03", cat: "zahlen", lvl: 1, de: "3", es: "tres", tip: "" },
    { id: "z04", cat: "zahlen", lvl: 1, de: "4", es: "cuatro", tip: "KUA-tro" },
    { id: "z05", cat: "zahlen", lvl: 1, de: "5", es: "cinco", tip: "SIN-ko" },
    { id: "z06", cat: "zahlen", lvl: 1, de: "6", es: "seis", tip: "seis" },
    { id: "z07", cat: "zahlen", lvl: 1, de: "7", es: "siete", tip: "si-E-te" },
    { id: "z08", cat: "zahlen", lvl: 1, de: "8", es: "ocho", tip: "O-cho" },
    { id: "z09", cat: "zahlen", lvl: 1, de: "9", es: "nueve", tip: "NUE-we" },
    { id: "z10", cat: "zahlen", lvl: 1, de: "10", es: "diez", tip: "di-ES" },
    { id: "z11", cat: "zahlen", lvl: 1, de: "11", es: "once", tip: "ON-se" },
    { id: "z12", cat: "zahlen", lvl: 1, de: "12", es: "doce", tip: "DO-se" },
    { id: "z13", cat: "zahlen", lvl: 1, de: "13", es: "trece", tip: "TRE-se" },
    { id: "z14", cat: "zahlen", lvl: 1, de: "14", es: "catorce", tip: "ka-TOR-se" },
    { id: "z15", cat: "zahlen", lvl: 1, de: "15", es: "quince", tip: "KIN-se" },
    { id: "z16", cat: "zahlen", lvl: 2, de: "16", es: "dieciséis", tip: "die-si-SEIS", alt: ["dieciseis"] },
    { id: "z17", cat: "zahlen", lvl: 2, de: "17", es: "diecisiete", tip: "die-si-si-E-te" },
    { id: "z18", cat: "zahlen", lvl: 2, de: "18", es: "dieciocho", tip: "die-si-O-cho" },
    { id: "z19", cat: "zahlen", lvl: 2, de: "19", es: "diecinueve", tip: "die-si-NUE-we" },
    { id: "z20", cat: "zahlen", lvl: 1, de: "20", es: "veinte", tip: "WEIN-te" },
    { id: "z21", cat: "zahlen", lvl: 2, de: "21", es: "veintiuno", tip: "wein-ti-U-no (vor Nomen: veintiún)" },
    { id: "z22", cat: "zahlen", lvl: 2, de: "22", es: "veintidós", tip: "wein-ti-DOS", alt: ["veintidos"] },
    { id: "z23", cat: "zahlen", lvl: 2, de: "23", es: "veintitrés", tip: "wein-ti-TRES", alt: ["veintitres"] },
    { id: "z24", cat: "zahlen", lvl: 2, de: "24", es: "veinticuatro", tip: "wein-ti-KUA-tro" },
    { id: "z25", cat: "zahlen", lvl: 2, de: "25", es: "veinticinco", tip: "wein-ti-SIN-ko" },
    { id: "z26", cat: "zahlen", lvl: 2, de: "26", es: "veintiséis", tip: "wein-ti-SEIS", alt: ["veintiseis"] },
    { id: "z27", cat: "zahlen", lvl: 2, de: "27", es: "veintisiete", tip: "wein-ti-si-E-te" },
    { id: "z28", cat: "zahlen", lvl: 2, de: "28", es: "veintiocho", tip: "wein-ti-O-cho" },
    { id: "z29", cat: "zahlen", lvl: 2, de: "29", es: "veintinueve", tip: "wein-ti-NUE-we" },
    { id: "z30", cat: "zahlen", lvl: 1, de: "30", es: "treinta", tip: "TREIN-ta" },
    { id: "z31", cat: "zahlen", lvl: 2, de: "31", es: "treinta y uno", tip: "ab 31: Zehner + 'y' + Einer" },
    { id: "z32", cat: "zahlen", lvl: 2, de: "32", es: "treinta y dos", tip: "TREIN-ta i dos" },
    { id: "z40", cat: "zahlen", lvl: 1, de: "40", es: "cuarenta", tip: "kua-REN-ta" },
    { id: "z45", cat: "zahlen", lvl: 2, de: "45", es: "cuarenta y cinco", tip: "kua-REN-ta i SIN-ko" },
    { id: "z50", cat: "zahlen", lvl: 1, de: "50", es: "cincuenta", tip: "sin-KUEN-ta" },
    { id: "z58", cat: "zahlen", lvl: 2, de: "58", es: "cincuenta y ocho", tip: "sin-KUEN-ta i O-cho" },
    { id: "z60", cat: "zahlen", lvl: 1, de: "60", es: "sesenta", tip: "se-SEN-ta" },
    { id: "z67", cat: "zahlen", lvl: 2, de: "67", es: "sesenta y siete", tip: "se-SEN-ta i si-E-te" },
    { id: "z70", cat: "zahlen", lvl: 1, de: "70", es: "setenta", tip: "se-TEN-ta" },
    { id: "z76", cat: "zahlen", lvl: 2, de: "76", es: "setenta y seis", tip: "se-TEN-ta i seis" },
    { id: "z80", cat: "zahlen", lvl: 1, de: "80", es: "ochenta", tip: "o-CHEN-ta" },
    { id: "z89", cat: "zahlen", lvl: 2, de: "89", es: "ochenta y nueve", tip: "o-CHEN-ta i NUE-we" },
    { id: "z90", cat: "zahlen", lvl: 1, de: "90", es: "noventa", tip: "no-WEN-ta" },
    { id: "z99", cat: "zahlen", lvl: 2, de: "99", es: "noventa y nueve", tip: "no-WEN-ta i NUE-we" },

    // ----- Hunderter (gerade) -----
    { id: "z100", cat: "zahlen", lvl: 1, de: "100", es: "cien", tip: "si-EN (genau 100 = 'cien')" },
    { id: "z101", cat: "zahlen", lvl: 2, de: "101", es: "ciento uno", tip: "ab 101: 'ciento ...' statt 'cien'" },
    { id: "z110", cat: "zahlen", lvl: 2, de: "110", es: "ciento diez", tip: "SI-en-to di-ES" },
    { id: "z125", cat: "zahlen", lvl: 2, de: "125", es: "ciento veinticinco", tip: "SI-en-to wein-ti-SIN-ko" },
    { id: "z150", cat: "zahlen", lvl: 2, de: "150", es: "ciento cincuenta", tip: "SI-en-to sin-KUEN-ta" },
    { id: "z199", cat: "zahlen", lvl: 3, de: "199", es: "ciento noventa y nueve", tip: "Hunderter + Zehner + 'y' + Einer" },
    { id: "z200", cat: "zahlen", lvl: 2, de: "200", es: "doscientos", tip: "dos-si-EN-tos (vor Nomen: doscientos pesos)" },
    { id: "z250", cat: "zahlen", lvl: 3, de: "250", es: "doscientos cincuenta", tip: "dos-si-EN-tos sin-KUEN-ta" },
    { id: "z300", cat: "zahlen", lvl: 2, de: "300", es: "trescientos", tip: "tres-si-EN-tos" },
    { id: "z365", cat: "zahlen", lvl: 3, de: "365", es: "trescientos sesenta y cinco", tip: "wie Tage im Jahr" },
    { id: "z400", cat: "zahlen", lvl: 2, de: "400", es: "cuatrocientos", tip: "kua-tro-si-EN-tos" },
    { id: "z500", cat: "zahlen", lvl: 2, de: "500", es: "quinientos", tip: "ki-ni-EN-tos (unregelmäßig!)" },
    { id: "z600", cat: "zahlen", lvl: 2, de: "600", es: "seiscientos", tip: "seis-si-EN-tos" },
    { id: "z700", cat: "zahlen", lvl: 2, de: "700", es: "setecientos", tip: "se-te-si-EN-tos (unregelmäßig!)" },
    { id: "z800", cat: "zahlen", lvl: 2, de: "800", es: "ochocientos", tip: "o-cho-si-EN-tos" },
    { id: "z900", cat: "zahlen", lvl: 2, de: "900", es: "novecientos", tip: "no-we-si-EN-tos (unregelmäßig!)" },
    { id: "z999", cat: "zahlen", lvl: 3, de: "999", es: "novecientos noventa y nueve", tip: "no-we-si-EN-tos no-WEN-ta i NUE-we" },

    // ----- Tausender -----
    { id: "z1000", cat: "zahlen", lvl: 1, de: "1.000", es: "mil", tip: "mil (nie 'un mil'!)" },
    { id: "z1500", cat: "zahlen", lvl: 2, de: "1.500", es: "mil quinientos", tip: "mil ki-ni-EN-tos" },
    { id: "z2000", cat: "zahlen", lvl: 2, de: "2.000", es: "dos mil", tip: "dos mil (mil bleibt unverändert)" },
    { id: "z2025", cat: "zahlen", lvl: 3, de: "2025 (Jahr)", es: "dos mil veinticinco", tip: "Jahre: dos mil ..." },
    { id: "z3500", cat: "zahlen", lvl: 2, de: "3.500", es: "tres mil quinientos", tip: "tres mil ki-ni-EN-tos" },
    { id: "z5000", cat: "zahlen", lvl: 2, de: "5.000", es: "cinco mil", tip: "SIN-ko mil" },
    { id: "z10000", cat: "zahlen", lvl: 2, de: "10.000", es: "diez mil", tip: "di-ES mil" },
    { id: "z15000", cat: "zahlen", lvl: 2, de: "15.000", es: "quince mil", tip: "KIN-se mil" },
    { id: "z20000", cat: "zahlen", lvl: 2, de: "20.000", es: "veinte mil", tip: "WEIN-te mil" },
    { id: "z25000", cat: "zahlen", lvl: 3, de: "25.000", es: "veinticinco mil", tip: "wein-ti-SIN-ko mil" },
    { id: "z50000", cat: "zahlen", lvl: 2, de: "50.000", es: "cincuenta mil", tip: "sin-KUEN-ta mil" },
    { id: "z75000", cat: "zahlen", lvl: 3, de: "75.000", es: "setenta y cinco mil", tip: "se-TEN-ta i SIN-ko mil" },
    { id: "z85000", cat: "zahlen", lvl: 3, de: "85.500", es: "ochenta y cinco mil quinientos", tip: "Tausender + Hunderter" },
    { id: "z100000", cat: "zahlen", lvl: 2, de: "100.000", es: "cien mil", tip: "si-EN mil (nicht 'ciento mil')" },
    { id: "z120000", cat: "zahlen", lvl: 3, de: "120.000", es: "ciento veinte mil", tip: "ab 101.000: 'ciento ... mil'" },
    { id: "z150000", cat: "zahlen", lvl: 3, de: "150.000", es: "ciento cincuenta mil", tip: "SI-en-to sin-KUEN-ta mil" },
    { id: "z200000", cat: "zahlen", lvl: 3, de: "200.000", es: "doscientos mil", tip: "dos-si-EN-tos mil" },
    { id: "z350000", cat: "zahlen", lvl: 3, de: "350.000", es: "trescientos cincuenta mil", tip: "tres-si-EN-tos sin-KUEN-ta mil" },
    { id: "z500000", cat: "zahlen", lvl: 3, de: "500.000", es: "quinientos mil", tip: "ki-ni-EN-tos mil" },
    { id: "z850000", cat: "zahlen", lvl: 3, de: "850.000", es: "ochocientos cincuenta mil", tip: "o-cho-si-EN-tos sin-KUEN-ta mil" },

    // ----- Millionen -----
    { id: "z1000000", cat: "zahlen", lvl: 2, de: "1.000.000", es: "un millón", tip: "un mi-YON (mit 'un'!)" },
    { id: "z1200000", cat: "zahlen", lvl: 3, de: "1.200.000", es: "un millón doscientos mil", tip: "Millón + Rest" },
    { id: "z1500000", cat: "zahlen", lvl: 3, de: "1.500.000", es: "un millón quinientos mil", tip: "typische Monatsmiete COP" },
    { id: "z2000000", cat: "zahlen", lvl: 3, de: "2.000.000", es: "dos millones", tip: "dos mi-YO-nes (Plural: millones)" },
    { id: "z3500000", cat: "zahlen", lvl: 3, de: "3.500.000", es: "tres millones quinientos mil", tip: "tres mi-YO-nes ki-ni-EN-tos mil" },
    { id: "z5000000", cat: "zahlen", lvl: 3, de: "5.000.000", es: "cinco millones", tip: "SIN-ko mi-YO-nes" },

    // ----- Preise in kolumbianischen Pesos (COP) -----
    { id: "zp01", cat: "zahlen", lvl: 2, de: "$ 3.500 – ein Kaffee", es: "tres mil quinientos pesos", tip: "Tinto im Café" },
    { id: "zp02", cat: "zahlen", lvl: 2, de: "$ 12.000 – ein Bier", es: "doce mil pesos", tip: "una cerveza" },
    { id: "zp03", cat: "zahlen", lvl: 3, de: "$ 25.000 – ein Mittagessen", es: "veinticinco mil pesos", tip: "un almuerzo" },
    { id: "zp04", cat: "zahlen", lvl: 3, de: "$ 45.000 – Hostel-Nacht", es: "cuarenta y cinco mil pesos", tip: "una noche en el hostal" },
    { id: "zp05", cat: "zahlen", lvl: 3, de: "$ 120.000 – Bus-Ticket", es: "ciento veinte mil pesos", tip: "Fernbus, lange Strecke" },
    { id: "zp06", cat: "zahlen", lvl: 3, de: "$ 350.000 – Ausflug/Tour", es: "trescientos cincuenta mil pesos", tip: "un tour de un día" },
    { id: "zp07", cat: "zahlen", lvl: 3, de: "$ 1.500.000 – Monatsmiete", es: "un millón quinientos mil pesos", tip: "arriendo mensual" },

    // ----- Nützliche Zahl-Wörter -----
    { id: "znum", cat: "zahlen", lvl: 2, de: "die Nummer / Zahl", es: "el número", tip: "el NU-me-ro" },
    { id: "zmilord", cat: "zahlen", lvl: 3, de: "die Million", es: "el millón", tip: "Plural: los millones" },
    { id: "zmitad", cat: "zahlen", lvl: 2, de: "die Hälfte / halb", es: "la mitad / medio", tip: "la mi-TAD" },

    // ----- Ordinalzahlen (1. – 10.) -----
    { id: "zo01", cat: "zahlen", lvl: 2, de: "1. (erster/erste)", es: "primero", tip: "pri-ME-ro (vor m. Nomen: 'primer piso')" },
    { id: "zo02", cat: "zahlen", lvl: 2, de: "2. (zweiter)", es: "segundo", tip: "se-GUN-do" },
    { id: "zo03", cat: "zahlen", lvl: 2, de: "3. (dritter)", es: "tercero", tip: "ter-SE-ro (vor m. Nomen: 'tercer')" },
    { id: "zo04", cat: "zahlen", lvl: 2, de: "4. (vierter)", es: "cuarto", tip: "KUAR-to (auch: das Zimmer)" },
    { id: "zo05", cat: "zahlen", lvl: 2, de: "5. (fünfter)", es: "quinto", tip: "KIN-to" },
    { id: "zo06", cat: "zahlen", lvl: 3, de: "6. (sechster)", es: "sexto", tip: "SEKS-to" },
    { id: "zo07", cat: "zahlen", lvl: 3, de: "7. (siebter)", es: "séptimo", tip: "SEP-ti-mo", alt: ["septimo"] },
    { id: "zo08", cat: "zahlen", lvl: 3, de: "8. (achter)", es: "octavo", tip: "ok-TA-wo" },
    { id: "zo09", cat: "zahlen", lvl: 3, de: "9. (neunter)", es: "noveno", tip: "no-WE-no" },
    { id: "zo10", cat: "zahlen", lvl: 3, de: "10. (zehnter)", es: "décimo", tip: "DE-si-mo", alt: ["decimo"] },
    { id: "zo1f", cat: "zahlen", lvl: 3, de: "die Erste (weiblich)", es: "primera", tip: "Ordinalzahlen passen sich an: -o/-a" },
    { id: "zopiso", cat: "zahlen", lvl: 3, de: "im ersten Stock", es: "en el primer piso", tip: "'primero' → 'primer' vor m. Nomen" },

    // ===================== ESSEN =====================
    { id: "e01", cat: "essen", lvl: 1, de: "das Essen", es: "la comida", tip: "la ko-MI-da" },
    { id: "e02", cat: "essen", lvl: 2, de: "Ich habe Hunger", es: "Tengo hambre", tip: "TEN-go AM-bre" },
    { id: "e03", cat: "essen", lvl: 1, de: "die Speisekarte", es: "el menú / la carta", tip: "el me-NU" },
    { id: "e04", cat: "essen", lvl: 2, de: "Die Rechnung, bitte", es: "La cuenta, por favor", tip: "la KUEN-ta",
      context: { sentenceEs: "La cuenta, por favor.", sentenceDe: "Die Rechnung, bitte.", situation: "Im Restaurant, Café oder bei Streetfood mit Sitzbereich.", note: "Kurz, höflich und völlig ausreichend. Noch höflicher: ¿Me trae la cuenta, por favor?" } },
    { id: "e05", cat: "essen", lvl: 2, de: "Ich bin Vegetarier", es: "Soy vegetariano/a", tip: "soy we-che-ta-RI-a-no", alt: ["soy vegetariano", "soy vegetariana"] },
    { id: "e06", cat: "essen", lvl: 1, de: "ohne Fleisch", es: "sin carne", tip: "sin KAR-ne" },
    { id: "e07", cat: "essen", lvl: 1, de: "Brot", es: "pan", tip: "pan" },
    { id: "e08", cat: "essen", lvl: 1, de: "Hähnchen", es: "pollo", tip: "PO-yo" },
    { id: "e09", cat: "essen", lvl: 1, de: "Fisch", es: "pescado", tip: "pes-KA-do" },
    { id: "e10", cat: "essen", lvl: 1, de: "Obst", es: "fruta", tip: "FRU-ta" },
    { id: "e11", cat: "essen", lvl: 1, de: "scharf", es: "picante", tip: "pi-KAN-te" },
    { id: "e12", cat: "essen", lvl: 1, de: "Lecker!", es: "Qué rico", tip: "ke RI-ko" },
    { id: "e13", cat: "essen", lvl: 1, de: "das Frühstück", es: "el desayuno", tip: "de-sa-YU-no" },
    { id: "e14", cat: "essen", lvl: 1, de: "das Mittagessen", es: "el almuerzo", tip: "al-MUER-so" },
    { id: "e15", cat: "essen", lvl: 1, de: "das Abendessen", es: "la cena", tip: "la SE-na" },
    { id: "e16", cat: "essen", lvl: 3, de: "Was empfehlen Sie?", es: "¿Qué me recomienda?", tip: "re-ko-mi-EN-da" },
    { id: "e17", cat: "essen", lvl: 2, de: "Zum Mitnehmen", es: "Para llevar", tip: "PA-ra ye-WAR" },
    { id: "e18", cat: "essen", lvl: 2, de: "Ich habe eine Allergie", es: "Tengo una alergia", tip: "a-LER-chi-a" },
    { id: "e19", cat: "essen", lvl: 1, de: "Gemüse", es: "verduras", tip: "wer-DU-ras" },
    { id: "e20", cat: "essen", lvl: 1, de: "Reis", es: "arroz", tip: "a-RROS (rollendes R)" },
    { id: "e21", cat: "essen", lvl: 1, de: "Eier", es: "huevos", tip: "U-e-wos" },
    { id: "e22", cat: "essen", lvl: 1, de: "Käse", es: "queso", tip: "KE-so" },
    { id: "e23", cat: "essen", lvl: 1, de: "Salz / Pfeffer", es: "sal / pimienta", tip: "pi-mi-EN-ta" },
    { id: "e24", cat: "essen", lvl: 2, de: "das Tagesmenü", es: "el menú del día", tip: "me-NU del DI-a" },
    { id: "e25", cat: "essen", lvl: 1, de: "die Nachspeise", es: "el postre", tip: "el POS-tre" },
    { id: "e26", cat: "essen", lvl: 2, de: "Noch eins, bitte", es: "Otro/a, por favor", tip: "O-tro", alt: ["otro", "otra"] },
    { id: "e27", cat: "essen", lvl: 2, de: "Können wir bestellen?", es: "¿Podemos ordenar?", tip: "po-DE-mos or-de-NAR" },
    { id: "e28", cat: "essen", lvl: 2, de: "Für mich das Gleiche", es: "Para mí lo mismo", tip: "PA-ra mi lo MIS-mo" },
    { id: "e29", cat: "essen", lvl: 3, de: "Können Sie es weniger scharf machen?", es: "¿Lo puede hacer menos picante?", tip: "ME-nos pi-KAN-te" },
    { id: "e30", cat: "essen", lvl: 2, de: "ohne ... / mit extra ...", es: "sin ... / con extra ...", tip: "sin / kon EKS-tra" },
    { id: "e31", cat: "essen", lvl: 2, de: "Ist hier noch frei?", es: "¿Está libre?", tip: "es-TA LI-bre" },
    { id: "e32", cat: "essen", lvl: 3, de: "Können Sie es einpacken? (Reste)", es: "¿Me lo puede empacar para llevar?", tip: "em-pa-KAR" },
    { id: "e33", cat: "essen", lvl: 2, de: "Noch ein Bier, bitte", es: "Otra cerveza, por favor", tip: "O-tra ser-WE-sa" },
    { id: "e34", cat: "essen", lvl: 2, de: "Was ist das? (Gericht)", es: "¿Qué es esto?", tip: "ke es ES-to" },
    { id: "e35", cat: "essen", lvl: 2, de: "Das Essen war ausgezeichnet", es: "La comida estuvo excelente", tip: "es-TU-wo ek-se-LEN-te" },
    { id: "e36", cat: "essen", lvl: 2, de: "Alles war köstlich", es: "Todo estuvo delicioso", tip: "de-li-si-O-so" },
    { id: "e37", cat: "essen", lvl: 2, de: "Es hat mir sehr geschmeckt", es: "Me gustó mucho / Estuvo muy rico", tip: "me gus-TO MU-cho" },
    { id: "e38", cat: "essen", lvl: 3, de: "Ich bin satt, danke", es: "Estoy satisfecho/a, gracias", tip: "sa-tis-FE-cho", alt: ["estoy satisfecho", "estoy satisfecha"] },
    { id: "e39", cat: "essen", lvl: 3, de: "Mein Kompliment an den Koch", es: "Mis felicitaciones al chef", tip: "fe-li-si-ta-si-O-nes" },
    { id: "e40", cat: "essen", lvl: 3, de: "Das war das beste Gericht", es: "Fue el mejor plato", tip: "me-CHOR PLA-to" },

    // --- Austauschen & Anpassen ---
    { id: "e41", cat: "essen", lvl: 2, de: "Kann ich etwas austauschen?", es: "¿Puedo cambiar algo?", tip: "PUE-do kam-bi-AR AL-go" },
    { id: "e42", cat: "essen", lvl: 3, de: "Statt der Pommes lieber einen Salat?", es: "¿En vez de las papas fritas, una ensalada?", tip: "en wes de las PA-pas FRI-tas" },
    { id: "e43", cat: "essen", lvl: 2, de: "Kann ich die Pommes gegen Salat tauschen?", es: "¿Puedo cambiar las papas por ensalada?", tip: "kam-bi-AR ... por en-sa-LA-da" },
    { id: "e44", cat: "essen", lvl: 3, de: "Statt Reis lieber Bohnen, bitte", es: "En vez de arroz, frijoles, por favor", tip: "en wes de a-RROS, fri-CHO-les" },
    { id: "e45", cat: "essen", lvl: 2, de: "Geht das auch mit einer Beilage nach Wahl?", es: "¿Puede ser con un acompañamiento a elección?", tip: "a-kom-pa-nya-mi-EN-to a e-lek-si-ON" },
    { id: "e46", cat: "essen", lvl: 2, de: "Können Sie die Zwiebeln weglassen?", es: "¿Puede quitar la cebolla?", tip: "ki-TAR la se-BO-ya",
      context: { sentenceEs: "Para mí sin cebolla, por favor.", sentenceDe: "Für mich ohne Zwiebeln, bitte.", situation: "Beim Bestellen, wenn du eine Zutat vermeiden willst.", note: "Die Struktur sin ... ist extrem praktisch: sin carne, sin queso, sin picante." } },
    { id: "e47", cat: "essen", lvl: 2, de: "Ohne Koriander, bitte", es: "Sin cilantro, por favor", tip: "sin si-LAN-tro" },
    { id: "e48", cat: "essen", lvl: 2, de: "Dressing bitte separat", es: "El aderezo aparte, por favor", tip: "el a-de-RE-so a-PAR-te" },
    { id: "e49", cat: "essen", lvl: 3, de: "Kann ich das Hähnchen durch Gemüse ersetzen?", es: "¿Puedo reemplazar el pollo por verduras?", tip: "rre-em-pla-SAR el PO-yo" },

    // --- Getränke anpassen ---
    { id: "e50", cat: "essen", lvl: 2, de: "Gibt es die Cola auch als Zero?", es: "¿Tienen la Coca en versión Zero?", tip: "wer-si-ON SE-ro" },
    { id: "e51", cat: "essen", lvl: 2, de: "Statt Saft lieber ein Wasser?", es: "¿En vez de jugo, mejor un agua?", tip: "en wes de CHU-go" },
    { id: "e52", cat: "essen", lvl: 2, de: "Kann ich statt Limo ein stilles Wasser haben?", es: "¿Puedo cambiar la gaseosa por agua sin gas?", tip: "ga-se-O-sa por A-gua sin gas" },
    { id: "e53", cat: "essen", lvl: 2, de: "Ohne Zucker, bitte", es: "Sin azúcar, por favor", tip: "sin a-SU-kar" },
    { id: "e54", cat: "essen", lvl: 2, de: "Ist im Saft Zucker?", es: "¿El jugo lleva azúcar?", tip: "el CHU-go YE-wa a-SU-kar" },

    // --- Allergien & Verträglichkeit ---
    { id: "e55", cat: "essen", lvl: 3, de: "Worauf bin ich allergisch? – auf Nüsse", es: "Soy alérgico/a a las nueces", tip: "a-LER-chi-ko a las NUE-ses", alt: ["soy alergico a las nueces", "soy alergica a las nueces"] },
    { id: "e56", cat: "essen", lvl: 3, de: "Enthält das Gluten?", es: "¿Esto contiene gluten?", tip: "kon-ti-E-ne GLU-ten" },
    { id: "e57", cat: "essen", lvl: 3, de: "Ich vertrage keine Laktose", es: "No tolero la lactosa", tip: "no to-LE-ro la lak-TO-sa" },
    { id: "e58", cat: "essen", lvl: 3, de: "Ist da Erdnuss drin? Das ist wichtig", es: "¿Lleva maní? Es importante", tip: "YE-wa ma-NI" },

    // --- Zum Mitnehmen ---
    { id: "e59", cat: "essen", lvl: 2, de: "Kann ich das zum Mitnehmen bekommen?", es: "¿Me lo puede dar para llevar?", tip: "PA-ra ye-WAR" },
    { id: "e60", cat: "essen", lvl: 2, de: "Den Rest bitte einpacken", es: "El resto para llevar, por favor", tip: "el RRES-to PA-ra ye-WAR" },

    // ===================== TRINKEN =====================
    { id: "t01", cat: "trinken", lvl: 2, de: "Ich habe Durst", es: "Tengo sed", tip: "TEN-go sed" },
    { id: "t02", cat: "trinken", lvl: 1, de: "Wasser", es: "agua", tip: "A-gua" },
    { id: "t03", cat: "trinken", lvl: 2, de: "Ist das Wasser trinkbar?", es: "¿Es potable el agua?", tip: "po-TA-ble" },
    { id: "t04", cat: "trinken", lvl: 2, de: "eine Flasche Wasser", es: "una botella de agua", tip: "bo-TE-ya" },
    { id: "t05", cat: "trinken", lvl: 1, de: "Bier", es: "cerveza", tip: "ser-WE-sa" },
    { id: "t06", cat: "trinken", lvl: 1, de: "Wein", es: "vino", tip: "WI-no" },
    { id: "t07", cat: "trinken", lvl: 1, de: "Kaffee", es: "café", tip: "ka-FE" },
    { id: "t08", cat: "trinken", lvl: 1, de: "Saft", es: "jugo", tip: "CHU-go" },
    { id: "t09", cat: "trinken", lvl: 1, de: "Milch", es: "leche", tip: "LE-che" },
    { id: "t10", cat: "trinken", lvl: 1, de: "Prost!", es: "Salud", tip: "sa-LUD" },
    { id: "t11", cat: "trinken", lvl: 2, de: "Danke fürs Getränk", es: "Gracias por el trago", tip: "GRA-si-as por el TRA-go" },
    { id: "t12", cat: "trinken", lvl: 2, de: "Auf dich! / Auf uns!", es: "¡Por ti! / ¡Por nosotros!", tip: "por ti / por no-SO-tros" },
    { id: "t13", cat: "trinken", lvl: 3, de: "Das nächste lade ich ein", es: "La próxima invito yo", tip: "PROK-si-ma in-WI-to yo" },
    { id: "t14", cat: "trinken", lvl: 2, de: "Das schmeckt richtig gut", es: "Está buenísimo", tip: "es-TA bue-NI-si-mo" },

    // ===================== HOTEL =====================
    { id: "h01", cat: "hotel", lvl: 2, de: "Haben Sie ein Zimmer frei?", es: "¿Tiene una habitación?", tip: "a-bi-ta-si-ON" },
    { id: "h02", cat: "hotel", lvl: 2, de: "ein Doppelzimmer", es: "una habitación doble", tip: "DO-ble" },
    { id: "h03", cat: "hotel", lvl: 2, de: "für eine Nacht", es: "para una noche", tip: "PA-ra U-na NO-che" },
    { id: "h04", cat: "hotel", lvl: 1, de: "Gibt es WLAN?", es: "¿Hay wifi?", tip: "ai WI-fi" },
    { id: "h05", cat: "hotel", lvl: 1, de: "der Schlüssel", es: "la llave", tip: "la YA-we" },
    { id: "h06", cat: "hotel", lvl: 1, de: "die Dusche", es: "la ducha", tip: "la DU-cha" },
    { id: "h07", cat: "hotel", lvl: 1, de: "das Handtuch", es: "la toalla", tip: "la to-A-ya" },
    { id: "h08", cat: "hotel", lvl: 2, de: "die Klimaanlage", es: "el aire acondicionado", tip: "AI-re" },
    { id: "h09", cat: "hotel", lvl: 3, de: "Kann ich das Zimmer sehen?", es: "¿Puedo ver la habitación?", tip: "PUE-do wer" },
    { id: "h10", cat: "hotel", lvl: 3, de: "Um wie viel Uhr ist der Check-out?", es: "¿A qué hora es el check-out?", tip: "a ke O-ra" },
    { id: "h11", cat: "hotel", lvl: 3, de: "Kann ich das Zimmer wechseln?", es: "¿Puedo cambiar de habitación?", tip: "kam-bi-AR de a-bi-ta-si-ON" },
    { id: "h12", cat: "hotel", lvl: 2, de: "Es gibt kein warmes Wasser", es: "No hay agua caliente", tip: "no ai A-gua ka-li-EN-te" },
    { id: "h13", cat: "hotel", lvl: 2, de: "Etwas ist kaputt", es: "Algo está roto / dañado", tip: "RO-to / da-NYA-do" },
    { id: "h14", cat: "hotel", lvl: 2, de: "Die Klimaanlage geht nicht", es: "El aire no funciona", tip: "no fun-si-O-na" },
    { id: "h15", cat: "hotel", lvl: 2, de: "Das WLAN geht nicht", es: "El wifi no funciona", tip: "WI-fi no fun-si-O-na" },
    { id: "h16", cat: "hotel", lvl: 2, de: "Das Licht geht nicht", es: "La luz no funciona", tip: "la lus" },
    { id: "h17", cat: "hotel", lvl: 3, de: "Das Zimmer ist zu laut", es: "La habitación es muy ruidosa", tip: "rui-DO-sa" },
    { id: "h18", cat: "hotel", lvl: 3, de: "Können Sie es reparieren?", es: "¿Lo pueden arreglar?", tip: "a-rre-GLAR" },
    { id: "h19", cat: "hotel", lvl: 2, de: "Ich brauche noch ein Handtuch", es: "Necesito otra toalla", tip: "O-tra to-A-ya" },
    { id: "h20", cat: "hotel", lvl: 3, de: "Können Sie das Zimmer sauber machen?", es: "¿Pueden limpiar la habitación?", tip: "lim-pi-AR" },
    { id: "h21", cat: "hotel", lvl: 3, de: "Kann ich später auschecken?", es: "¿Puedo hacer el check-out más tarde?", tip: "mas TAR-de" },
    { id: "h22", cat: "hotel", lvl: 3, de: "Kann ich mein Gepäck hier lassen?", es: "¿Puedo dejar mi equipaje aquí?", tip: "e-ki-PA-che a-KI" },
    { id: "h23", cat: "hotel", lvl: 2, de: "Die Toilette ist verstopft", es: "El baño está tapado", tip: "ta-PA-do" },
    { id: "h24", cat: "hotel", lvl: 2, de: "Mir ist zu kalt / zu warm", es: "Tengo mucho frío / calor", tip: "FRI-o / ka-LOR" },

    // ===================== HOSTEL =====================
    { id: "hostel01", cat: "hostel", lvl: 1, de: "Ich habe eine Reservierung.", es: "Tengo una reserva.", tip: "TEN-go U-na re-SER-wa",
      context: { sentenceEs: "Hola, tengo una reserva para esta noche.", sentenceDe: "Hallo, ich habe eine Reservierung für heute Nacht.", situation: "Beim Check-in im Hostel, Hotel oder Guesthouse.", note: "Wenn nach dem Namen gefragt wird, sag: A nombre de Marcel." } },
    { id: "hostel02", cat: "hostel", lvl: 1, de: "Haben Sie noch ein Bett frei?", es: "¿Tiene una cama libre?", tip: "TI-e-ne U-na KA-ma LI-bre",
      context: { sentenceEs: "Hola, ¿tiene una cama libre para esta noche?", sentenceDe: "Hallo, haben Sie für heute Nacht noch ein Bett frei?", situation: "Wenn du spontan ein Hostel suchst oder verlängern möchtest.", note: "Alternativ kannst du fragen: ¿Hay una cama disponible?" } },
    { id: "hostel03", cat: "hostel", lvl: 1, de: "Ist Frühstück inklusive?", es: "¿El desayuno está incluido?", tip: "el de-sa-YU-no es-TA in-klu-I-do",
      context: { sentenceEs: "¿El desayuno está incluido en el precio?", sentenceDe: "Ist das Frühstück im Preis enthalten?", situation: "Beim Check-in oder bei der Buchung vor Ort.", note: "Wenn es nicht inklusive ist, frag einfach: ¿Cuánto cuesta?" } },
    { id: "hostel04", cat: "hostel", lvl: 1, de: "Wo ist mein Bett?", es: "¿Dónde está mi cama?", tip: "DON-de es-TA mi KA-ma",
      context: { sentenceEs: "Perdón, ¿dónde está mi cama?", sentenceDe: "Entschuldigung, wo ist mein Bett?", situation: "Im Dorm, wenn dir nur eine Bett- oder Zimmernummer genannt wurde.", note: "Oben oder unten? Man unterscheidet cama de arriba und cama de abajo." } },
    { id: "hostel05", cat: "hostel", lvl: 2, de: "Mein Schlüssel funktioniert nicht.", es: "Mi llave no funciona.", tip: "mi YA-we no fun-si-O-na",
      context: { sentenceEs: "Perdón, mi llave no funciona. ¿Me puede ayudar?", sentenceDe: "Entschuldigung, mein Schlüssel funktioniert nicht. Können Sie mir helfen?", situation: "An der Rezeption, wenn Karte, Schlüssel oder Türcode streiken.", note: "Für eine Schlüsselkarte sag tarjeta: Mi tarjeta no funciona." } },
    { id: "hostel06", cat: "hostel", lvl: 2, de: "Kann ich mein Gepäck hier lassen?", es: "¿Puedo dejar mi equipaje aquí?", tip: "PUE-do de-CHAR mi e-ki-PA-che a-KI",
      context: { sentenceEs: "¿Puedo dejar mi equipaje aquí hasta la tarde?", sentenceDe: "Kann ich mein Gepäck hier bis zum Nachmittag lassen?", situation: "Vor dem Check-in oder nach dem Check-out.", note: "Sehr praktisch am Reisetag. Für Rucksack sag mochila." } },
    { id: "hostel07", cat: "hostel", lvl: 2, de: "Gibt es ein Schließfach?", es: "¿Hay un locker?", tip: "ai un LO-ker",
      context: { sentenceEs: "¿Hay un locker para guardar mis cosas?", sentenceDe: "Gibt es ein Schließfach, um meine Sachen aufzubewahren?", situation: "Im Dorm, wenn du Wertsachen sicher verstauen willst.", note: "locker wird fast überall verstanden. Spanischer wäre casillero." } },
    { id: "hostel08", cat: "hostel", lvl: 2, de: "Mein Bett ist belegt.", es: "Mi cama está ocupada.", tip: "mi KA-ma es-TA o-ku-PA-da",
      context: { sentenceEs: "Perdón, mi cama está ocupada. Creo que hay un error.", sentenceDe: "Entschuldigung, mein Bett ist belegt. Ich glaube, es gibt einen Fehler.", situation: "Wenn jemand auf deinem zugewiesenen Bett liegt.", note: "Der Zusatz Creo que hay un error klingt ruhig, nicht aggressiv." } },
    { id: "hostel09", cat: "hostel", lvl: 2, de: "Gibt es eine Küche?", es: "¿Hay cocina?", tip: "ai ko-SI-na",
      context: { sentenceEs: "¿Hay cocina para los huéspedes?", sentenceDe: "Gibt es eine Küche für die Gäste?", situation: "Wenn du selbst kochen oder Essen lagern willst.", note: "Gäste heißt huéspedes – im Hostel reicht aber auch nur cocina." } },
    { id: "hostel10", cat: "hostel", lvl: 3, de: "Könnte ich das Zimmer wechseln?", es: "¿Podría cambiar de habitación?", tip: "po-DRI-a kam-bi-AR de a-bi-ta-si-ON",
      context: { sentenceEs: "Disculpe, ¿podría cambiar de habitación? Hay mucho ruido.", sentenceDe: "Entschuldigung, könnte ich das Zimmer wechseln? Es ist sehr laut.", situation: "Wenn dein Zimmer zu laut, zu heiß oder problematisch ist.", note: "Podría ist höflicher als puedo und passt gut an der Rezeption." } },

    // ===================== VERKEHR =====================
    { id: "v01", cat: "verkehr", lvl: 2, de: "Wo ist ...?", es: "¿Dónde está ...?", tip: "DON-de es-TA", alt: ["donde esta"] },
    { id: "v02", cat: "verkehr", lvl: 1, de: "links / rechts", es: "izquierda / derecha", tip: "is-ki-ER-da / de-RE-cha" },
    { id: "v03", cat: "verkehr", lvl: 1, de: "geradeaus", es: "todo recto / derecho", tip: "TO-do REK-to" },
    { id: "v04", cat: "verkehr", lvl: 2, de: "Wie komme ich nach ...?", es: "¿Cómo llego a ...?", tip: "KO-mo YE-go", alt: ["como llego a"] },
    { id: "v05", cat: "verkehr", lvl: 1, de: "der Bus", es: "el bus / el colectivo", tip: "'colectivo' in vielen Ländern",
      context: { sentenceEs: "Disculpe, ¿de dónde sale el bus a Cartagena?", sentenceDe: "Entschuldigung, von wo fährt der Bus nach Cartagena ab?", situation: "Am Busbahnhof, bei einer Agentur oder an einer Haltestelle.", note: "Je nach Land heißt der Bus auch colectivo, micro, buseta oder camión." } },
    { id: "v06", cat: "verkehr", lvl: 1, de: "das Taxi", es: "el taxi", tip: "el TAK-si" },
    { id: "v07", cat: "verkehr", lvl: 1, de: "das Ticket", es: "el boleto / el billete", tip: "bo-LE-to" },
    { id: "v08", cat: "verkehr", lvl: 1, de: "der Bahnhof", es: "la estación", tip: "la es-ta-si-ON" },
    { id: "v09", cat: "verkehr", lvl: 1, de: "der Flughafen", es: "el aeropuerto", tip: "a-e-ro-PUER-to" },
    { id: "v10", cat: "verkehr", lvl: 2, de: "Halten Sie hier, bitte", es: "Pare aquí, por favor", tip: "PA-re a-KI" },
    { id: "v11", cat: "verkehr", lvl: 2, de: "Wann fährt es ab?", es: "¿A qué hora sale?", tip: "a ke O-ra SA-le" },
    { id: "v12", cat: "verkehr", lvl: 2, de: "Wie viel kostet die Fahrt?", es: "¿Cuánto cuesta el viaje?", tip: "WI-a-che",
      context: { sentenceEs: "¿Cuánto cuesta el viaje al centro?", sentenceDe: "Wie viel kostet die Fahrt ins Zentrum?", situation: "Im Taxi oder colectivo, am besten vor dem Einsteigen.", note: "Vorher fragen schützt vor Überraschungen. Für ein Ticket sag boleto oder pasaje." } },
    { id: "v13", cat: "verkehr", lvl: 2, de: "Ist es weit?", es: "¿Está lejos?", tip: "es-TA LE-chos" },
    { id: "v14", cat: "verkehr", lvl: 1, de: "in der Nähe / nah", es: "cerca", tip: "SER-ka" },
    { id: "v15", cat: "verkehr", lvl: 3, de: "Wie weit ist es?", es: "¿Qué tan lejos está?", tip: "ke tan LE-chos" },
    { id: "v16", cat: "verkehr", lvl: 3, de: "Können Sie es auf der Karte zeigen?", es: "¿Me lo muestra en el mapa?", tip: "en el MA-pa" },
    { id: "v17", cat: "verkehr", lvl: 1, de: "die Tankstelle", es: "la gasolinera", tip: "ga-so-li-NE-ra" },
    { id: "v18", cat: "verkehr", lvl: 1, de: "das Benzin", es: "la gasolina / la bencina", tip: "'bencina' v.a. in Chile" },
    { id: "v19", cat: "verkehr", lvl: 2, de: "der Mietwagen", es: "el auto de alquiler", tip: "AU-to de al-ki-LER" },
    { id: "v20", cat: "verkehr", lvl: 2, de: "Wo steige ich aus?", es: "¿Dónde me bajo?", tip: "DON-de me BA-cho" },
    { id: "v21", cat: "verkehr", lvl: 2, de: "die nächste Haltestelle", es: "la próxima parada", tip: "PROK-si-ma pa-RA-da" },
    { id: "v22", cat: "verkehr", lvl: 3, de: "Bringen Sie mich zu dieser Adresse", es: "Lléveme a esta dirección", tip: "YE-we-me a ES-ta" },
    { id: "v23", cat: "verkehr", lvl: 2, de: "Wie lange dauert es?", es: "¿Cuánto demora? / ¿Cuánto tarda?", tip: "de-MO-ra / TAR-da" },
    { id: "v24", cat: "verkehr", lvl: 3, de: "Schalten Sie das Taxameter ein?", es: "¿Puede poner el taxímetro?", tip: "tak-SI-me-tro" },
    { id: "v25", cat: "verkehr", lvl: 3, de: "Können Sie hier kurz warten?", es: "¿Puede esperar aquí?", tip: "es-pe-RAR a-KI" },
    { id: "v26", cat: "verkehr", lvl: 2, de: "Ich steige hier aus", es: "Me bajo aquí", tip: "me BA-cho a-KI" },
    { id: "v27", cat: "verkehr", lvl: 2, de: "Bitte langsamer fahren", es: "Más despacio, por favor", tip: "mas des-PA-si-o" },

    // ===================== EINKAUFEN & SUPERMARKT =====================
    { id: "c01", cat: "compras", lvl: 2, de: "Wie viel kostet das?", es: "¿Cuánto cuesta? / ¿Cuánto vale?", tip: "KUAN-to KUES-ta" },
    { id: "c02", cat: "compras", lvl: 2, de: "Das ist zu teuer", es: "Es muy caro", tip: "muy KA-ro" },
    { id: "c03", cat: "compras", lvl: 1, de: "Haben Sie ...?", es: "¿Tiene ...?", tip: "ti-E-ne" },
    { id: "c04", cat: "compras", lvl: 2, de: "Ich schaue nur", es: "Solo estoy mirando", tip: "es-TOY mi-RAN-do" },
    { id: "c05", cat: "compras", lvl: 2, de: "Ich nehme das", es: "Me llevo esto", tip: "me YE-wo ES-to" },
    { id: "c06", cat: "compras", lvl: 1, de: "der Markt", es: "el mercado", tip: "mer-KA-do" },
    { id: "c07", cat: "compras", lvl: 1, de: "der Supermarkt", es: "el supermercado", tip: "su-per-mer-KA-do" },
    { id: "c08", cat: "compras", lvl: 2, de: "Eine Tüte, bitte", es: "Una bolsa, por favor", tip: "U-na BOL-sa" },
    { id: "c09", cat: "compras", lvl: 2, de: "Gibt es einen Rabatt?", es: "¿Hay descuento?", tip: "des-KUEN-to" },
    { id: "c10", cat: "compras", lvl: 1, de: "billiger", es: "más barato", tip: "mas ba-RA-to" },
    { id: "c11", cat: "compras", lvl: 3, de: "Kann ich es anprobieren?", es: "¿Me lo puedo probar?", tip: "PUE-do pro-WAR" },
    { id: "c12", cat: "compras", lvl: 1, de: "die Größe (Kleidung)", es: "la talla", tip: "la TA-ya" },
    { id: "c13", cat: "compras", lvl: 2, de: "Wo ist die Kasse?", es: "¿Dónde está la caja?", tip: "la KA-cha" },
    { id: "c14", cat: "compras", lvl: 1, de: "geöffnet / geschlossen", es: "abierto / cerrado", tip: "a-bi-ER-to / se-RRA-do" },
    { id: "c15", cat: "compras", lvl: 1, de: "ein Kilo", es: "un kilo", tip: "un KI-lo" },
    { id: "c16", cat: "compras", lvl: 1, de: "ein halbes Kilo", es: "medio kilo", tip: "ME-di-o KI-lo" },
    { id: "c17", cat: "compras", lvl: 1, de: "mehr / weniger", es: "más / menos", tip: "mas / ME-nos" },
    { id: "c18", cat: "compras", lvl: 2, de: "Das ist alles", es: "Eso es todo / Nada más", tip: "E-so es TO-do" },
    { id: "c19", cat: "compras", lvl: 3, de: "Haben Sie etwas Günstigeres?", es: "¿Tiene algo más barato?", tip: "AL-go mas ba-RA-to" },
    { id: "c20", cat: "compras", lvl: 2, de: "Geben Sie mir bitte ...", es: "Me da ..., por favor", tip: "me da" },
    { id: "c21", cat: "compras", lvl: 2, de: "Ich möchte dieses Kleid", es: "Quiero este vestido", tip: "ki-E-ro ES-te wes-TI-do" },
    { id: "c22", cat: "compras", lvl: 3, de: "Haben Sie es in einer anderen Größe?", es: "¿Lo tiene en otra talla?", tip: "en O-tra TA-ya" },
    { id: "c23", cat: "compras", lvl: 3, de: "Haben Sie es in einer anderen Farbe?", es: "¿Lo tiene en otro color?", tip: "en O-tro ko-LOR" },
    { id: "c24", cat: "compras", lvl: 3, de: "eine Nummer größer / kleiner", es: "una talla más grande / más chica", tip: "'chica' = kleiner (LatAm)" },
    { id: "c25", cat: "compras", lvl: 3, de: "Geht beim Preis noch was?", es: "¿Me lo deja más barato?", tip: "me lo DE-cha mas ba-RA-to" },
    { id: "c26", cat: "compras", lvl: 3, de: "Machen Sie mir einen Rabatt?", es: "¿Me hace un descuento?", tip: "me A-se un des-KUEN-to" },
    { id: "c27", cat: "compras", lvl: 2, de: "Zu teuer, danke", es: "Muy caro, gracias", tip: "muy KA-ro" },
    { id: "c28", cat: "compras", lvl: 2, de: "Ich nehme zwei davon", es: "Me llevo dos de esos", tip: "me YE-wo dos de E-sos" },
    { id: "c29", cat: "compras", lvl: 3, de: "Können Sie mir das zeigen?", es: "¿Me lo puede mostrar?", tip: "me lo PUE-de mos-TRAR" },
    { id: "c30", cat: "compras", lvl: 2, de: "Wo finde ich ...?", es: "¿Dónde encuentro ...?", tip: "en-KUEN-tro" },
    { id: "c31", cat: "compras", lvl: 3, de: "Darf ich probieren? (kosten)", es: "¿Puedo probar?", tip: "PUE-do pro-WAR" },
    { id: "c32", cat: "compras", lvl: 3, de: "Können Sie es einpacken?", es: "¿Me lo puede envolver?", tip: "en-wol-WER" },
    { id: "c33", cat: "compras", lvl: 2, de: "Es ist zum Verschenken", es: "Es para regalo", tip: "PA-ra re-GA-lo" },
    { id: "c34", cat: "compras", lvl: 1, de: "frisch / reif", es: "fresco / maduro", tip: "FRES-ko / ma-DU-ro" },

    // ===================== GELD & BEZAHLEN =====================
    { id: "d01", cat: "dinero", lvl: 2, de: "Wie kann ich bezahlen?", es: "¿Cómo puedo pagar?", tip: "KO-mo pa-GAR" },
    { id: "d02", cat: "dinero", lvl: 1, de: "mit Karte", es: "con tarjeta", tip: "kon tar-CHE-ta" },
    { id: "d03", cat: "dinero", lvl: 1, de: "bar / in bar", es: "en efectivo", tip: "e-fek-TI-wo" },
    { id: "d04", cat: "dinero", lvl: 2, de: "Akzeptieren Sie Karten?", es: "¿Aceptan tarjeta?", tip: "a-SEP-tan" },
    { id: "d05", cat: "dinero", lvl: 1, de: "der Geldautomat", es: "el cajero (automático)", tip: "ka-CHE-ro" },
    { id: "d06", cat: "dinero", lvl: 2, de: "das Wechselgeld", es: "el vuelto / el cambio", tip: "'vuelto' in LatAm üblich" },
    { id: "d07", cat: "dinero", lvl: 2, de: "Haben Sie es klein? (Münzen)", es: "¿Tiene sencillo?", tip: "sen-SI-yo" },
    { id: "d08", cat: "dinero", lvl: 1, de: "die Quittung", es: "el recibo / la boleta", tip: "re-SI-wo" },
    { id: "d09", cat: "dinero", lvl: 1, de: "das Geld", es: "el dinero / la plata", tip: "'plata' = umgangssprachl. Geld" },
    { id: "d10", cat: "dinero", lvl: 1, de: "kostenlos / gratis", es: "gratis", tip: "GRA-tis" },
    { id: "d11", cat: "dinero", lvl: 2, de: "Geld wechseln", es: "cambiar dinero", tip: "kam-bi-AR" },
    { id: "d12", cat: "dinero", lvl: 2, de: "die Wechselstube", es: "la casa de cambio", tip: "KA-sa de KAM-bio" },
    { id: "d13", cat: "dinero", lvl: 3, de: "Stimmt das so? (Wechselgeld)", es: "¿Está bien el vuelto?", tip: "es-TA bien" },

    // ===================== NOTFALL & GESUNDHEIT =====================
    { id: "n01", cat: "notfall", lvl: 2, de: "Es ist ein Notfall", es: "Es una emergencia", tip: "e-mer-CHEN-si-a" },
    { id: "n02", cat: "notfall", lvl: 2, de: "Ich fühle mich schlecht", es: "Me siento mal", tip: "me si-EN-to mal" },
    { id: "n03", cat: "notfall", lvl: 2, de: "Mir tut der Kopf weh", es: "Me duele la cabeza", tip: "DUE-le la ka-BE-sa" },
    { id: "n04", cat: "notfall", lvl: 2, de: "Mir tut der Bauch weh", es: "Me duele el estómago", tip: "es-TO-ma-go" },
    { id: "n05", cat: "notfall", lvl: 2, de: "Ich habe Fieber", es: "Tengo fiebre", tip: "fi-E-bre" },
    { id: "n06", cat: "notfall", lvl: 3, de: "Ich bin allergisch gegen ...", es: "Soy alérgico/a a ...", tip: "a-LER-chi-ko", alt: ["soy alergico", "soy alergica"] },
    { id: "n07", cat: "notfall", lvl: 1, de: "das Krankenhaus", es: "el hospital", tip: "os-pi-TAL" },
    { id: "n08", cat: "notfall", lvl: 3, de: "Rufen Sie einen Krankenwagen", es: "Llame a una ambulancia", tip: "am-bu-LAN-si-a" },
    { id: "n09", cat: "notfall", lvl: 2, de: "Ich brauche Medikamente", es: "Necesito medicamentos", tip: "me-di-ka-MEN-tos" },
    { id: "n10", cat: "notfall", lvl: 2, de: "Man hat mich bestohlen", es: "Me robaron", tip: "me ro-BA-ron" },
    { id: "n11", cat: "notfall", lvl: 2, de: "Ich habe mein ... verloren", es: "Perdí mi ...", tip: "per-DI mi",
      context: { sentenceEs: "Perdí mi celular. ¿Alguien lo encontró?", sentenceDe: "Ich habe mein Handy verloren. Hat es jemand gefunden?", situation: "Im Hostel, Bus, Restaurant oder nach einer Tour.", note: "In Lateinamerika ist celular das übliche Wort für Handy." } },
    { id: "n12", cat: "notfall", lvl: 1, de: "mein Reisepass", es: "mi pasaporte", tip: "pa-sa-POR-te" },
    { id: "n13", cat: "notfall", lvl: 1, de: "mein Handy", es: "mi celular", tip: "se-lu-LAR" },
    { id: "n14", cat: "notfall", lvl: 2, de: "Können Sie mir helfen?", es: "¿Puede ayudarme?", tip: "a-yu-DAR-me" },
    { id: "n15", cat: "notfall", lvl: 3, de: "Wo ist die nächste Apotheke?", es: "¿Dónde está la farmacia más cercana?", tip: "mas ser-KA-na",
      context: { sentenceEs: "Disculpe, ¿dónde está la farmacia más cercana?", sentenceDe: "Entschuldigung, wo ist die nächste Apotheke?", situation: "Wenn du Medikamente oder etwas gegen Bauchweh brauchst.", note: "Apotheken sind in LatAm oft auch ohne Rezept hilfreich. Nachts: farmacia de turno." } },

    // ===================== ZEIT & DATUM =====================
    { id: "ti01", cat: "zeit", lvl: 2, de: "Wie spät ist es?", es: "¿Qué hora es?", tip: "ke O-ra es" },
    { id: "ti02", cat: "zeit", lvl: 1, de: "Um wie viel Uhr?", es: "¿A qué hora?", tip: "a ke O-ra" },
    { id: "ti03", cat: "zeit", lvl: 1, de: "jetzt / später", es: "ahora / más tarde", tip: "a-O-ra / mas TAR-de" },
    { id: "ti04", cat: "zeit", lvl: 1, de: "heute", es: "hoy", tip: "oi" },
    { id: "ti05", cat: "zeit", lvl: 1, de: "morgen", es: "mañana", tip: "ma-NYA-na" },
    { id: "ti06", cat: "zeit", lvl: 1, de: "gestern", es: "ayer", tip: "a-YER" },
    { id: "ti07", cat: "zeit", lvl: 2, de: "am Morgen / am Abend", es: "en la mañana / en la noche", tip: "ma-NYA-na / NO-che" },
    { id: "ti08", cat: "zeit", lvl: 1, de: "der Tag / die Woche", es: "el día / la semana", tip: "DI-a / se-MA-na" },
    { id: "ti09", cat: "zeit", lvl: 1, de: "früh / spät", es: "temprano / tarde", tip: "tem-PRA-no / TAR-de" },
    { id: "ti10", cat: "zeit", lvl: 1, de: "Montag / Dienstag", es: "lunes / martes", tip: "LU-nes / MAR-tes" },
    { id: "ti11", cat: "zeit", lvl: 1, de: "Mittwoch / Donnerstag", es: "miércoles / jueves", tip: "mi-ER-ko-les / CHUE-wes" },
    { id: "ti12", cat: "zeit", lvl: 1, de: "Freitag / Samstag / Sonntag", es: "viernes / sábado / domingo", tip: "wi-ER-nes / SA-ba-do / do-MIN-go" },

    // ===================== SMALLTALK & KENNENLERNEN =====================
    { id: "s01", cat: "talk", lvl: 1, de: "Wie geht's?", es: "¿Cómo estás? / ¿Qué tal?", tip: "KO-mo es-TAS" },
    { id: "s02", cat: "talk", lvl: 1, de: "Gut, danke", es: "Bien, gracias", tip: "bien GRA-si-as" },
    { id: "s03", cat: "talk", lvl: 1, de: "Freut mich", es: "Mucho gusto", tip: "MU-cho GUS-to" },
    { id: "s04", cat: "talk", lvl: 2, de: "Woher kommst du?", es: "¿De dónde eres?", tip: "de DON-de E-res" },
    { id: "s05", cat: "talk", lvl: 2, de: "Ich komme aus Deutschland", es: "Soy de Alemania", tip: "a-le-MA-ni-a" },
    { id: "s06", cat: "talk", lvl: 2, de: "Ich bin im Urlaub", es: "Estoy de vacaciones", tip: "wa-ka-si-O-nes" },
    { id: "s07", cat: "talk", lvl: 3, de: "Ich bin auf der Durchreise", es: "Estoy de paso", tip: "es-TOY de PA-so" },
    { id: "s08", cat: "talk", lvl: 2, de: "Cool! / Super! (LatAm)", es: "¡Qué chévere! / ¡Bacán!", tip: "CHE-we-re / ba-KAN" },
    { id: "s09", cat: "talk", lvl: 1, de: "Kein Problem", es: "No hay problema", tip: "no ai pro-BLE-ma" },
    { id: "s10", cat: "talk", lvl: 1, de: "Genau / Klar", es: "Claro / Exacto", tip: "KLA-ro / ek-SAK-to" },
    { id: "s11", cat: "talk", lvl: 2, de: "Vielleicht", es: "Quizás / Tal vez", tip: "ki-SAS / tal wes" },
    { id: "s12", cat: "talk", lvl: 1, de: "Bis später", es: "Hasta luego", tip: "AS-ta LUE-go" },
    { id: "s13", cat: "talk", lvl: 1, de: "Bis morgen", es: "Hasta mañana", tip: "AS-ta ma-NYA-na" },
    { id: "s14", cat: "talk", lvl: 3, de: "Schönen Tag noch!", es: "¡Que tengas un buen día!", tip: "ke TEN-gas un buen DI-a" },
    { id: "s15", cat: "talk", lvl: 1, de: "Entschuldigung (Aufmerksamkeit)", es: "Disculpe / Permiso", tip: "'permiso' = darf ich vorbei" },
    { id: "s16", cat: "talk", lvl: 2, de: "Vielen Dank für alles", es: "Muchas gracias por todo", tip: "MU-chas GRA-si-as por TO-do" },
    { id: "s17", cat: "talk", lvl: 1, de: "Tausend Dank", es: "Mil gracias", tip: "mil GRA-si-as" },
    { id: "s18", cat: "talk", lvl: 3, de: "Das ist sehr nett von dir", es: "Muy amable de tu parte", tip: "muy a-MA-ble de tu PAR-te" },
    { id: "s19", cat: "talk", lvl: 2, de: "Danke für die Einladung", es: "Gracias por la invitación", tip: "in-wi-ta-si-ON" },
    { id: "s20", cat: "talk", lvl: 3, de: "Ich weiß das sehr zu schätzen", es: "Te lo agradezco mucho", tip: "a-gra-DES-ko MU-cho" },
    { id: "s21", cat: "talk", lvl: 2, de: "Es war mir ein Vergnügen", es: "Fue un placer", tip: "fue un pla-SER" },
    { id: "s22", cat: "talk", lvl: 2, de: "Ich bin sehr zufrieden", es: "Estoy muy contento/a", tip: "kon-TEN-to", alt: ["estoy muy contento", "estoy muy contenta"] },
    { id: "s23", cat: "talk", lvl: 2, de: "Alles war perfekt", es: "Todo estuvo perfecto", tip: "es-TU-wo per-FEK-to" },
    { id: "s24", cat: "talk", lvl: 3, de: "Das nächste Mal lade ich dich ein", es: "La próxima te invito yo", tip: "PROK-si-ma te in-WI-to yo" },

    // ===================== SOCIAL & ANSCHLUSS =====================
    { id: "social01", cat: "social", lvl: 1, de: "Woher kommst du?", es: "¿De dónde eres?", tip: "de DON-de E-res",
      context: { sentenceEs: "Hola, ¿de dónde eres?", sentenceDe: "Hey, woher kommst du?", situation: "Beim Frühstück, im Dorm, in einer Tourgruppe oder im Bus.", note: "Perfekter Einstieg. Danach passt: ¿Cuánto tiempo viajas?" } },
    { id: "social02", cat: "social", lvl: 1, de: "Reist du alleine?", es: "¿Viajas solo/a?", tip: "wi-A-chas SO-lo / SO-la", alt: ["viajas solo", "viajas sola"],
      context: { sentenceEs: "¿Viajas solo o con amigos?", sentenceDe: "Reist du alleine oder mit Freunden?", situation: "Beim Kennenlernen anderer Backpacker.", note: "Bei Männern solo, bei Frauen sola. Im Hostel eine ganz normale Frage." } },
    { id: "social03", cat: "social", lvl: 1, de: "Wie lange bist du hier?", es: "¿Cuánto tiempo estás aquí?", tip: "KUAN-to TIEM-po es-TAS a-KI",
      context: { sentenceEs: "¿Cuánto tiempo estás aquí en Cartagena?", sentenceDe: "Wie lange bist du hier in Cartagena?", situation: "Wenn du wissen willst, ob jemand länger bleibt oder bald weiterreist.", note: "Den Ort einfach austauschen: aquí en Bogotá, aquí en Lima, aquí en Medellín." } },
    { id: "social04", cat: "social", lvl: 1, de: "Wohin reist du danach?", es: "¿A dónde vas después?", tip: "a DON-de bas des-PUES",
      context: { sentenceEs: "¿A dónde vas después de Cartagena?", sentenceDe: "Wohin reist du nach Cartagena weiter?", situation: "Typischer Backpacker-Smalltalk über Reiserouten.", note: "Super, um Tipps zu bekommen oder gemeinsame Pläne zu entdecken." } },
    { id: "social05", cat: "social", lvl: 2, de: "Was machst du morgen?", es: "¿Qué haces mañana?", tip: "ke A-ses ma-NYA-na",
      context: { sentenceEs: "¿Qué haces mañana? Quiero ir a la playa.", sentenceDe: "Was machst du morgen? Ich möchte an den Strand gehen.", situation: "Wenn du gemeinsame Pläne anstoßen willst.", note: "Mach es direkt konkret. Nur ¿Qué haces mañana? kann leicht privat klingen." } },
    { id: "social06", cat: "social", lvl: 2, de: "Hast du Lust, etwas essen zu gehen?", es: "¿Quieres ir a comer algo?", tip: "KIE-res ir a ko-MER AL-go",
      context: { sentenceEs: "¿Quieres ir a comer algo más tarde?", sentenceDe: "Hast du Lust, später etwas essen zu gehen?", situation: "Im Hostel, nach einer Tour oder vor dem Abend.", note: "más tarde bedeutet später und macht die Einladung locker." } },
    { id: "social07", cat: "social", lvl: 2, de: "Sollen wir zusammen gehen?", es: "¿Vamos juntos?", tip: "BA-mos CHUN-tos",
      context: { sentenceEs: "¿Vamos juntos al centro?", sentenceDe: "Gehen wir zusammen ins Zentrum?", situation: "Wenn ihr dasselbe Ziel habt oder gemeinsam losziehen wollt.", note: "juntos für gemischte Gruppen oder Männer, juntas für nur Frauen." } },
    { id: "social08", cat: "social", lvl: 2, de: "Kommst du mit?", es: "¿Te unes?", tip: "te U-nes",
      context: { sentenceEs: "Vamos a tomar algo. ¿Te unes?", sentenceDe: "Wir gehen etwas trinken. Kommst du mit?", situation: "Um jemanden locker einzuladen.", note: "Klingt natürlicher als eine sehr formelle Einladung. Perfekt im Hostel." } },
    { id: "social09", cat: "social", lvl: 2, de: "Schreib mir auf WhatsApp.", es: "Escríbeme por WhatsApp.", tip: "es-KRI-be-me por WatsApp",
      context: { sentenceEs: "Escríbeme por WhatsApp y nos vemos más tarde.", sentenceDe: "Schreib mir auf WhatsApp, dann sehen wir uns später.", situation: "Wenn ihr euch später treffen oder Pläne abstimmen wollt.", note: "WhatsApp ist in Lateinamerika extrem verbreitet – fast jeder nutzt es." } },
    { id: "social10", cat: "social", lvl: 1, de: "War schön, dich kennenzulernen.", es: "Mucho gusto.", tip: "MU-cho GUS-to",
      context: { sentenceEs: "Mucho gusto. Nos vemos mañana.", sentenceDe: "Schön, dich kennenzulernen. Wir sehen uns morgen.", situation: "Nach einem ersten Gespräch im Hostel oder unterwegs.", note: "Mucho gusto passt beim Kennenlernen. Beim Abschied passt: Fue un gusto conocerte." } },

    // ===================== ALLTAG & LEBEN =====================
    { id: "a01", cat: "alltag", lvl: 3, de: "Wie sagt man ... auf Spanisch?", es: "¿Cómo se dice ... en español?", tip: "KO-mo se DI-se" },
    { id: "a02", cat: "alltag", lvl: 2, de: "Was bedeutet das?", es: "¿Qué significa?", tip: "sig-ni-FI-ka" },
    { id: "a03", cat: "alltag", lvl: 3, de: "Können Sie das aufschreiben?", es: "¿Me lo puede escribir?", tip: "es-kri-WIR" },
    { id: "a04", cat: "alltag", lvl: 2, de: "Ich lerne Spanisch", es: "Estoy aprendiendo español", tip: "a-pren-di-EN-do" },
    { id: "a05", cat: "alltag", lvl: 3, de: "Wie ist das WLAN-Passwort?", es: "¿Cuál es la contraseña del wifi?", tip: "kon-tra-SE-nya" },
    { id: "a06", cat: "alltag", lvl: 3, de: "Wo kann ich eine SIM-Karte kaufen?", es: "¿Dónde puedo comprar un chip?", tip: "'chip' = SIM in LatAm" },
    { id: "a07", cat: "alltag", lvl: 2, de: "Guthaben aufladen", es: "recargar (saldo)", tip: "re-kar-GAR" },
    { id: "a08", cat: "alltag", lvl: 2, de: "mobile Daten", es: "los datos móviles", tip: "DA-tos MO-wi-les" },
    { id: "a09", cat: "alltag", lvl: 1, de: "die Wäscherei", es: "la lavandería", tip: "la-wan-de-RI-a" },
    { id: "a10", cat: "alltag", lvl: 2, de: "Ich suche eine Wohnung", es: "Busco un departamento", tip: "de-par-ta-MEN-to" },
    { id: "a11", cat: "alltag", lvl: 1, de: "die Miete", es: "el alquiler / la renta", tip: "al-ki-LER" },
    { id: "a12", cat: "alltag", lvl: 1, de: "die Bank", es: "el banco", tip: "el BAN-ko" },
    { id: "a13", cat: "alltag", lvl: 1, de: "die Post", es: "el correo", tip: "ko-RRE-o" },
    { id: "a14", cat: "alltag", lvl: 1, de: "die Botschaft", es: "la embajada", tip: "em-ba-CHA-da" },
    { id: "a15", cat: "alltag", lvl: 3, de: "Wo kann ich Wasser kaufen?", es: "¿Dónde puedo comprar agua?", tip: "kom-PRAR A-gua" },

    // ===================== WÜNSCHE & SÄTZE (Alltag) =====================
    { id: "f01", cat: "frases", lvl: 2, de: "Ich möchte ...", es: "Quiero ... / Quisiera ...", tip: "'quisiera' ist höflicher" },
    { id: "f02", cat: "frases", lvl: 2, de: "Ich hätte gern ...", es: "Me gustaría ...", tip: "me gus-ta-RI-a" },
    { id: "f03", cat: "frases", lvl: 2, de: "Ich möchte das da", es: "Quiero ese / aquel", tip: "'aquel' = das weiter weg" },
    { id: "f04", cat: "frases", lvl: 2, de: "das da hinten", es: "ese de atrás", tip: "E-se de a-TRAS" },
    { id: "f05", cat: "frases", lvl: 2, de: "das da unten", es: "ese de abajo", tip: "de a-BA-cho" },
    { id: "f06", cat: "frases", lvl: 2, de: "das da oben", es: "ese de arriba", tip: "de a-RRI-ba" },
    { id: "f07", cat: "frases", lvl: 1, de: "dieses hier / das da", es: "este / ese", tip: "ES-te / E-se" },
    { id: "f08", cat: "frases", lvl: 2, de: "Noch eins, bitte", es: "Uno más, por favor", tip: "U-no mas" },
    { id: "f09", cat: "frases", lvl: 2, de: "Eins weniger", es: "Uno menos", tip: "U-no ME-nos" },
    { id: "f10", cat: "frases", lvl: 2, de: "ein bisschen mehr / weniger", es: "un poco más / menos", tip: "un PO-ko" },
    { id: "f11", cat: "frases", lvl: 2, de: "Nur ein bisschen", es: "Solo un poquito", tip: "po-KI-to" },
    { id: "f12", cat: "frases", lvl: 2, de: "Das reicht so, danke", es: "Así está bien, gracias", tip: "a-SI es-TA bien" },
    { id: "f13", cat: "frases", lvl: 2, de: "Genau so", es: "Así", tip: "a-SI" },
    { id: "f14", cat: "frases", lvl: 1, de: "Kann ich ...?", es: "¿Puedo ...?", tip: "PUE-do" },
    { id: "f15", cat: "frases", lvl: 1, de: "Können Sie ...?", es: "¿Puede ...?", tip: "PUE-de" },
    { id: "f16", cat: "frases", lvl: 1, de: "Ich brauche ...", es: "Necesito ...", tip: "ne-se-SI-to" },
    { id: "f17", cat: "frases", lvl: 1, de: "Gibt es ...?", es: "¿Hay ...?", tip: "ai" },
    { id: "f18", cat: "frases", lvl: 2, de: "Wo gibt es ...?", es: "¿Dónde hay ...?", tip: "DON-de ai" },
    { id: "f19", cat: "frases", lvl: 2, de: "Ich suche ...", es: "Estoy buscando ...", tip: "bus-KAN-do" },
    { id: "f20", cat: "frases", lvl: 2, de: "Was ist das?", es: "¿Qué es esto?", tip: "ke es ES-to" },
    { id: "f21", cat: "frases", lvl: 2, de: "Wie nennt man das?", es: "¿Cómo se llama esto?", tip: "se YA-ma ES-to" },
    { id: "f22", cat: "frases", lvl: 2, de: "Einen Moment, bitte", es: "Un momento, por favor", tip: "mo-MEN-to" },
    { id: "f23", cat: "frases", lvl: 2, de: "Darf ich mal vorbei?", es: "¿Me permite? / Con permiso", tip: "kon per-MI-so" },
    { id: "f24", cat: "frases", lvl: 2, de: "Entschuldigung, eine Frage", es: "Disculpe, una pregunta", tip: "U-na pre-GUN-ta" },
    { id: "f25", cat: "frases", lvl: 2, de: "Wie bitte? (nicht verstanden)", es: "¿Cómo? / ¿Mande?", tip: "'¿Mande?' v.a. in Mexiko" },
    { id: "f26", cat: "frases", lvl: 2, de: "Können Sie das wiederholen?", es: "¿Puede repetir?", tip: "re-pe-TIR" },
    { id: "f27", cat: "frases", lvl: 3, de: "Ich möchte nur schauen, danke", es: "Solo estoy mirando, gracias", tip: "mi-RAN-do" },
    { id: "f28", cat: "frases", lvl: 2, de: "Mehr / weniger, bitte", es: "Más / menos, por favor", tip: "mas / ME-nos" },
    { id: "f29", cat: "frases", lvl: 2, de: "Wie dieses hier", es: "Como este", tip: "KO-mo ES-te" },
    { id: "f30", cat: "frases", lvl: 1, de: "Ja, gerne / Nein, danke", es: "Sí, claro / No, gracias", tip: "si KLA-ro" },

    // ===================== BEHÖRDEN, GRENZE & GELDAUTOMAT =====================
    { id: "g01", cat: "grenze", lvl: 1, de: "der Reisepass", es: "el pasaporte", tip: "pa-sa-POR-te" },
    { id: "g02", cat: "grenze", lvl: 1, de: "das Visum", es: "la visa / el visado", tip: "la WI-sa" },
    { id: "g03", cat: "grenze", lvl: 1, de: "der Stempel (Einreise)", es: "el sello", tip: "el SE-yo" },
    { id: "g04", cat: "grenze", lvl: 1, de: "die Grenze", es: "la frontera", tip: "fron-TE-ra" },
    { id: "g05", cat: "grenze", lvl: 1, de: "der Zoll", es: "la aduana", tip: "a-DUA-na" },
    { id: "g06", cat: "grenze", lvl: 1, de: "Ich bin Tourist/in", es: "Soy turista", tip: "tu-RIS-ta" },
    { id: "g07", cat: "grenze", lvl: 2, de: "Hier ist mein Reisepass", es: "Aquí está mi pasaporte", tip: "a-KI es-TA" },
    { id: "g08", cat: "grenze", lvl: 3, de: "Ich bleibe ... Tage", es: "Me quedo ... días", tip: "me KE-do ... DI-as" },
    { id: "g09", cat: "grenze", lvl: 3, de: "Der Grund der Reise ist Tourismus", es: "El motivo del viaje es turismo", tip: "mo-TI-wo del WI-a-che" },
    { id: "g10", cat: "grenze", lvl: 3, de: "Wie lange darf ich bleiben?", es: "¿Cuánto tiempo puedo quedarme?", tip: "ke-DAR-me" },
    { id: "g11", cat: "grenze", lvl: 3, de: "Ich habe nichts zu verzollen", es: "No tengo nada que declarar", tip: "de-kla-RAR" },
    { id: "g12", cat: "grenze", lvl: 2, de: "Wo muss ich unterschreiben?", es: "¿Dónde firmo?", tip: "DON-de FIR-mo" },
    { id: "g13", cat: "grenze", lvl: 2, de: "das Formular", es: "el formulario", tip: "for-mu-LA-ri-o" },
    { id: "g14", cat: "grenze", lvl: 2, de: "Gibt es hier einen Geldautomaten?", es: "¿Hay un cajero por aquí?", tip: "ka-CHE-ro" },
    { id: "g15", cat: "grenze", lvl: 3, de: "Der Automat hat meine Karte einbehalten", es: "El cajero se tragó mi tarjeta", tip: "se tra-GO" },
    { id: "g16", cat: "grenze", lvl: 2, de: "Meine Karte funktioniert nicht", es: "Mi tarjeta no funciona", tip: "no fun-si-O-na" },
    { id: "g17", cat: "grenze", lvl: 3, de: "Der Automat gibt kein Geld aus", es: "El cajero no entrega efectivo", tip: "en-TRE-ga e-fek-TI-wo" },
    { id: "g18", cat: "grenze", lvl: 3, de: "Meine Karte wurde gesperrt", es: "Bloquearon mi tarjeta", tip: "blo-ke-A-ron" },
    { id: "g19", cat: "grenze", lvl: 3, de: "Ich muss meine Bank anrufen", es: "Tengo que llamar a mi banco", tip: "ya-MAR a mi BAN-ko" },
    { id: "g20", cat: "grenze", lvl: 3, de: "Wie hoch ist die Gebühr?", es: "¿Cuál es la comisión?", tip: "ko-mi-si-ON" },

    // ===================== BUSREISE & UNTERWEGS =====================
    { id: "r01", cat: "reise", lvl: 2, de: "ein Ticket nach ...", es: "un boleto a ...", tip: "bo-LE-to a" },
    { id: "r02", cat: "reise", lvl: 2, de: "einfach / hin und zurück", es: "solo ida / ida y vuelta", tip: "I-da i WUEL-ta" },
    { id: "r03", cat: "reise", lvl: 3, de: "Wann fährt der nächste Bus?", es: "¿A qué hora sale el próximo bus?", tip: "PROK-si-mo" },
    { id: "r04", cat: "reise", lvl: 2, de: "Ist das ein Direktbus?", es: "¿Es directo?", tip: "es di-REK-to" },
    { id: "r05", cat: "reise", lvl: 2, de: "der Nachtbus", es: "el bus nocturno", tip: "nok-TUR-no" },
    { id: "r06", cat: "reise", lvl: 3, de: "Hält der Bus in ...?", es: "¿Para el bus en ...?", tip: "PA-ra el bus en" },
    { id: "r07", cat: "reise", lvl: 2, de: "Wo ist mein Sitzplatz?", es: "¿Dónde está mi asiento?", tip: "a-si-EN-to" },
    { id: "r08", cat: "reise", lvl: 2, de: "Ist dieser Platz frei?", es: "¿Está libre este asiento?", tip: "LI-bre" },
    { id: "r09", cat: "reise", lvl: 2, de: "Wie lange dauert die Fahrt?", es: "¿Cuánto dura el viaje?", tip: "DU-ra el WI-a-che" },
    { id: "r10", cat: "reise", lvl: 3, de: "Wo gebe ich mein Gepäck auf?", es: "¿Dónde dejo mi equipaje?", tip: "DE-cho mi e-ki-PA-che" },
    { id: "r11", cat: "reise", lvl: 3, de: "Sagen Sie mir Bescheid, wenn wir da sind?", es: "¿Me avisa cuando lleguemos?", tip: "a-WI-sa ... ye-GE-mos" },
    { id: "r12", cat: "reise", lvl: 2, de: "der Busbahnhof", es: "el terminal / la terminal", tip: "ter-mi-NAL" },
    { id: "r13", cat: "reise", lvl: 2, de: "Gibt es eine Toilette im Bus?", es: "¿Hay baño en el bus?", tip: "ai BA-nyo" },
    { id: "r14", cat: "reise", lvl: 3, de: "Wie viele Stopps gibt es?", es: "¿Cuántas paradas hay?", tip: "pa-RA-das ai" },
    { id: "r15", cat: "reise", lvl: 3, de: "Hält er zum Essen an?", es: "¿Para para comer?", tip: "PA-ra ... ko-MER" },
    { id: "r16", cat: "reise", lvl: 2, de: "Können Sie mich mitnehmen? (Anhalter)", es: "¿Me puede llevar?", tip: "me PUE-de ye-WAR" },
    { id: "r17", cat: "reise", lvl: 2, de: "Bis wohin fahren Sie?", es: "¿Hasta dónde va?", tip: "AS-ta DON-de wa" },
    { id: "r18", cat: "reise", lvl: 1, de: "das Sammeltaxi / der Minibus", es: "la combi / el colectivo", tip: "KOM-bi / ko-lek-TI-wo" },
    { id: "r19", cat: "reise", lvl: 2, de: "Halten Sie an der Ecke", es: "Pare en la esquina", tip: "es-KI-na" },
    { id: "r20", cat: "reise", lvl: 3, de: "Ich habe meinen Bus verpasst", es: "Perdí mi bus", tip: "per-DI mi bus" },
  ];

  /*
   * ===== HOSTEL MODE (Anwenden zu zweit) =====
   * Reine Daten für den Zwei-Personen-Modus. Keine Persistenz – die Spiel-Session
   * ist transient. "Karten = lernen, Hostel Mode = sprechen".
   */

  // Battle-Szenen (Auswahl vor einer Runde). icon nur fürs UI.
  const BATTLE_SCENES = [
    { id: "checkin", label: "Check-in",          icon: "🛎️" },
    { id: "dorm",    label: "Dorm & Zimmer",     icon: "🛏️" },
    { id: "meet",    label: "Leute kennenlernen", icon: "🤝" },
    { id: "plan",    label: "Gemeinsam planen",  icon: "🗓️" },
    { id: "food",    label: "Essen & Trinken",   icon: "🍽️" },
    { id: "out",     label: "Unterwegs",         icon: "🧭" },
    { id: "problem", label: "Problem lösen",     icon: "🛠️" },
  ];

  // Battle-Aufgaben: Ansage auf Deutsch (promptDe), laut auf Spanisch antworten.
  // answerEs = Musterlösung (Anzeige), acceptable = weitere gültige Varianten (LatAm).
  // points = Maximalpunkte (Mitspieler bewertet manuell: 2/1/0). scene -> BATTLE_SCENES.
  const BATTLES = [
    // ----- Check-in -----
    { id: "hb01", mode: "battle", cat: "hostel", scene: "checkin", promptDe: "Frag, ob noch ein Bett frei ist.", answerEs: "¿Tiene una cama libre?", acceptable: ["tiene una cama libre", "hay una cama libre", "hay una cama disponible"], points: 2, hint: "Du brauchst: ¿Tiene...? oder ¿Hay...?" },
    { id: "hb02", mode: "battle", cat: "hostel", scene: "checkin", promptDe: "Sag, dass du eine Reservierung hast.", answerEs: "Tengo una reserva.", acceptable: ["tengo una reserva", "tengo una reservacion"], points: 2, hint: "Tengo una ..." },
    { id: "hb03", mode: "battle", cat: "hostel", scene: "checkin", promptDe: "Frag, ob das Frühstück inklusive ist.", answerEs: "¿El desayuno está incluido?", acceptable: ["el desayuno esta incluido", "esta incluido el desayuno", "incluye desayuno"], points: 2, hint: "desayuno = Frühstück" },
    { id: "hb04", mode: "battle", cat: "hostel", scene: "checkin", promptDe: "Frag nach dem WLAN-Passwort.", answerEs: "¿Cuál es la contraseña del wifi?", acceptable: ["cual es la contrasena del wifi", "cual es la clave del wifi"], points: 2, hint: "contraseña / clave = Passwort" },
    { id: "hb05", mode: "battle", cat: "hostel", scene: "checkin", promptDe: "Frag, um wie viel Uhr Check-out ist.", answerEs: "¿A qué hora es el check-out?", acceptable: ["a que hora es el check out", "a que hora es el checkout", "a que hora hay que salir"], points: 2, hint: "¿A qué hora...?" },

    // ----- Dorm & Zimmer -----
    { id: "hb06", mode: "battle", cat: "hostel", scene: "dorm", promptDe: "Frag, wo dein Bett ist.", answerEs: "¿Dónde está mi cama?", acceptable: ["donde esta mi cama"], points: 2, hint: "¿Dónde está...?" },
    { id: "hb07", mode: "battle", cat: "hostel", scene: "dorm", promptDe: "Sag, dass dein Bett belegt ist.", answerEs: "Mi cama está ocupada.", acceptable: ["mi cama esta ocupada", "hay alguien en mi cama"], points: 2, hint: "ocupada = belegt" },
    { id: "hb08", mode: "battle", cat: "hostel", scene: "dorm", promptDe: "Frag, ob es ein Schließfach gibt.", answerEs: "¿Hay un locker?", acceptable: ["hay un locker", "hay casilleros", "hay un casillero"], points: 2, hint: "locker / casillero" },
    { id: "hb09", mode: "battle", cat: "hostel", scene: "dorm", promptDe: "Sag, dass dein Schlüssel nicht funktioniert.", answerEs: "Mi llave no funciona.", acceptable: ["mi llave no funciona", "la llave no funciona", "la tarjeta no funciona"], points: 2, hint: "llave = Schlüssel" },
    { id: "hb10", mode: "battle", cat: "hostel", scene: "dorm", promptDe: "Bitte höflich, das Zimmer wechseln zu dürfen.", answerEs: "¿Podría cambiar de habitación?", acceptable: ["podria cambiar de habitacion", "puedo cambiar de habitacion", "puedo cambiar de cuarto"], points: 2, hint: "¿Podría...? ist höflicher" },

    // ----- Leute kennenlernen -----
    { id: "hb11", mode: "battle", cat: "social", scene: "meet", promptDe: "Frag jemanden, woher er/sie kommt.", answerEs: "¿De dónde eres?", acceptable: ["de donde eres", "de donde vienes"], points: 2, hint: "¿De dónde...?" },
    { id: "hb12", mode: "battle", cat: "social", scene: "meet", promptDe: "Frag, ob die Person alleine reist.", answerEs: "¿Viajas solo/a?", acceptable: ["viajas solo", "viajas sola", "viajas solo a", "estas viajando solo", "estas viajando sola"], points: 2, hint: "viajar = reisen" },
    { id: "hb13", mode: "battle", cat: "social", scene: "meet", promptDe: "Frag, wie lange die Person schon hier ist.", answerEs: "¿Cuánto tiempo estás aquí?", acceptable: ["cuanto tiempo estas aqui", "cuanto tiempo llevas aqui"], points: 2, hint: "¿Cuánto tiempo...?" },
    { id: "hb14", mode: "battle", cat: "social", scene: "meet", promptDe: "Sag, dass es schön war, kennenzulernen.", answerEs: "Mucho gusto.", acceptable: ["mucho gusto", "un placer", "encantado", "encantada"], points: 2, hint: "Mucho gusto" },

    // ----- Gemeinsam planen -----
    { id: "hb15", mode: "battle", cat: "social", scene: "plan", promptDe: "Frag, was die Person morgen macht.", answerEs: "¿Qué haces mañana?", acceptable: ["que haces manana", "que vas a hacer manana"], points: 2, hint: "¿Qué haces...?" },
    { id: "hb16", mode: "battle", cat: "social", scene: "plan", promptDe: "Frag, ob die Person Lust hat, etwas essen zu gehen.", answerEs: "¿Quieres ir a comer algo?", acceptable: ["quieres ir a comer algo", "quieres comer algo", "vamos a comer algo"], points: 2, hint: "¿Quieres...?" },
    { id: "hb17", mode: "battle", cat: "social", scene: "plan", promptDe: "Schlag vor, zusammen zu gehen.", answerEs: "¿Vamos juntos?", acceptable: ["vamos juntos", "vamos juntas", "podemos ir juntos"], points: 2, hint: "juntos = zusammen" },
    { id: "hb18", mode: "battle", cat: "social", scene: "plan", promptDe: "Bitte, dir auf WhatsApp zu schreiben.", answerEs: "Escríbeme por WhatsApp.", acceptable: ["escribeme por whatsapp", "mandame un mensaje por whatsapp", "pasame tu whatsapp"], points: 2, hint: "escríbeme = schreib mir" },

    // ----- Essen & Trinken -----
    { id: "hb19", mode: "battle", cat: "essen", scene: "food", promptDe: "Frag nach der Speisekarte.", answerEs: "¿Me trae la carta?", acceptable: ["me trae la carta", "la carta por favor", "me da el menu", "me trae el menu"], points: 2, hint: "carta / menú" },
    { id: "hb20", mode: "battle", cat: "essen", scene: "food", promptDe: "Frag, was die Person empfiehlt.", answerEs: "¿Qué me recomienda?", acceptable: ["que me recomienda", "que recomiendas", "que me recomiendas"], points: 2, hint: "recomendar = empfehlen" },
    { id: "hb21", mode: "battle", cat: "trinken", scene: "food", promptDe: "Bestell zwei Bier.", answerEs: "Dos cervezas, por favor.", acceptable: ["dos cervezas por favor", "dos cervezas", "queremos dos cervezas"], points: 2, hint: "cerveza = Bier" },
    { id: "hb22", mode: "battle", cat: "essen", scene: "food", promptDe: "Bitte um die Rechnung.", answerEs: "La cuenta, por favor.", acceptable: ["la cuenta por favor", "me trae la cuenta", "nos trae la cuenta"], points: 2, hint: "cuenta = Rechnung" },

    // ----- Unterwegs (vom Hostel aus) -----
    { id: "hb23", mode: "battle", cat: "verkehr", scene: "out", promptDe: "Frag, wo die nächste Bushaltestelle ist.", answerEs: "¿Dónde está la parada de bus?", acceptable: ["donde esta la parada de bus", "donde esta la parada del bus", "donde queda la parada"], points: 2, hint: "parada = Haltestelle" },
    { id: "hb24", mode: "battle", cat: "verkehr", scene: "out", promptDe: "Schlag vor, ein Taxi zu teilen.", answerEs: "¿Compartimos un taxi?", acceptable: ["compartimos un taxi", "vamos juntos en taxi", "tomamos un taxi juntos"], points: 2, hint: "compartir = teilen" },
    { id: "hb25", mode: "battle", cat: "verkehr", scene: "out", promptDe: "Frag, wie man zum Zentrum kommt.", answerEs: "¿Cómo llego al centro?", acceptable: ["como llego al centro", "como se va al centro", "como llegar al centro"], points: 2, hint: "¿Cómo llego...?" },
    { id: "hb26", mode: "battle", cat: "social", scene: "out", promptDe: "Frag eine Empfehlung, wohin man abends gehen kann.", answerEs: "¿Qué me recomiendas para la noche?", acceptable: ["que me recomiendas para la noche", "adonde puedo ir en la noche", "que hay para hacer en la noche"], points: 2, hint: "para la noche = für abends" },

    // ----- Problem lösen -----
    { id: "hb27", mode: "battle", cat: "notfall", scene: "problem", promptDe: "Sag, dass dein Handy gestohlen wurde.", answerEs: "Me robaron el celular.", acceptable: ["me robaron el celular", "me robaron mi celular", "me robaron el telefono"], points: 2, hint: "robar = stehlen" },
    { id: "hb28", mode: "battle", cat: "notfall", scene: "problem", promptDe: "Sag, dass du dich nicht gut fühlst.", answerEs: "Me siento mal.", acceptable: ["me siento mal", "no me siento bien"], points: 2, hint: "sentirse = sich fühlen" },
    { id: "hb29", mode: "battle", cat: "notfall", scene: "problem", promptDe: "Sag, dass du deinen Rucksack verloren hast.", answerEs: "Perdí mi mochila.", acceptable: ["perdi mi mochila", "perdi la mochila"], points: 2, hint: "perder = verlieren · mochila = Rucksack" },
    { id: "hb30", mode: "battle", cat: "basics", scene: "problem", promptDe: "Bitte jemanden um Hilfe.", answerEs: "¿Me puedes ayudar?", acceptable: ["me puedes ayudar", "me puede ayudar", "necesito ayuda", "ayudame por favor"], points: 2, hint: "ayudar = helfen" },
  ];

  // Rollenspiele: kurze Dialoge zum lauten Durchspielen zu zweit.
  const ROLEPLAYS = [
    {
      id: "hr01", mode: "roleplay", title: "Check-in im Hostel", category: "hostel", level: 1,
      roles: { a: "Reisender", b: "Rezeption" },
      situationDe: "Du kommst im Hostel an. Du hast eine Reservierung und möchtest einchecken.",
      goalA: "Sage, dass du eine Reservierung hast, nenne deinen Namen und frage nach WLAN.",
      goalB: "Frage nach dem Namen, bitte um den Pass und erkläre kurz Frühstück und WLAN.",
      dialogue: [
        { speaker: "A", de: "Hallo, ich habe eine Reservierung.", es: "Hola, tengo una reserva." },
        { speaker: "B", de: "Auf welchen Namen?", es: "¿A nombre de quién?" },
        { speaker: "A", de: "Auf den Namen Marcel.", es: "A nombre de Marcel." },
        { speaker: "B", de: "Kannst du mir deinen Pass zeigen?", es: "¿Me puedes mostrar tu pasaporte?" },
        { speaker: "A", de: "Ja, hier bitte.", es: "Sí, aquí tienes." },
        { speaker: "B", de: "Das WLAN-Passwort steht auf der Karte.", es: "La contraseña del wifi está en la tarjeta." },
      ],
      usefulPhrases: ["Tengo una reserva.", "¿A nombre de quién?", "¿Me puedes mostrar tu pasaporte?", "¿Cuál es la contraseña del wifi?"],
    },
    {
      id: "hr02", mode: "roleplay", title: "Bett ist belegt", category: "hostel", level: 2,
      roles: { a: "Reisender", b: "Rezeption" },
      situationDe: "Du gehst zu deinem Bett im Dorm – aber da liegt schon jemand anderes.",
      goalA: "Erkläre, dass dein Bett belegt ist, und frage nach einer Lösung.",
      goalB: "Entschuldige dich, prüfe die Buchung und biete ein anderes Bett an.",
      dialogue: [
        { speaker: "A", de: "Entschuldigung, mein Bett ist belegt.", es: "Disculpe, mi cama está ocupada." },
        { speaker: "B", de: "Welche Bettnummer hast du?", es: "¿Qué número de cama tienes?" },
        { speaker: "A", de: "Bett Nummer vier, unten.", es: "La cama número cuatro, abajo." },
        { speaker: "B", de: "Es tut mir leid, da gab es einen Fehler.", es: "Lo siento, hubo un error." },
        { speaker: "B", de: "Ich gebe dir das Bett gegenüber.", es: "Te doy la cama de enfrente." },
        { speaker: "A", de: "Super, vielen Dank.", es: "Perfecto, muchas gracias." },
      ],
      usefulPhrases: ["Mi cama está ocupada.", "¿Qué número de cama tienes?", "Hubo un error.", "Te doy otra cama."],
    },
    {
      id: "hr03", mode: "roleplay", title: "Schlüssel funktioniert nicht", category: "hostel", level: 2,
      roles: { a: "Reisender", b: "Rezeption" },
      situationDe: "Deine Schlüsselkarte öffnet die Tür zum Dorm nicht.",
      goalA: "Erkläre das Problem und bitte um Hilfe.",
      goalB: "Frage nach Zimmer/Karte und biete an, sie neu zu aktivieren.",
      dialogue: [
        { speaker: "A", de: "Meine Karte funktioniert nicht.", es: "Mi tarjeta no funciona." },
        { speaker: "B", de: "Welches Zimmer ist es?", es: "¿Qué habitación es?" },
        { speaker: "A", de: "Zimmer drei, das Dorm.", es: "La habitación tres, el dormitorio." },
        { speaker: "B", de: "Gib sie mir, ich aktiviere sie neu.", es: "Dámela, la activo de nuevo." },
        { speaker: "A", de: "Danke, jetzt geht sie.", es: "Gracias, ahora sí funciona." },
      ],
      usefulPhrases: ["Mi llave no funciona.", "¿Qué habitación es?", "La activo de nuevo.", "Ahora sí funciona."],
    },
    {
      id: "hr04", mode: "roleplay", title: "Neue Leute im Dorm kennenlernen", category: "social", level: 1,
      roles: { a: "Reisender", b: "Hostelgast" },
      situationDe: "Im Gemeinschaftsraum sitzt jemand, den du kennenlernen möchtest.",
      goalA: "Stell dich vor und frage, woher die Person kommt und wohin sie reist.",
      goalB: "Antworte freundlich und stell auch Gegenfragen.",
      dialogue: [
        { speaker: "A", de: "Hallo! Woher kommst du?", es: "¡Hola! ¿De dónde eres?" },
        { speaker: "B", de: "Ich komme aus Argentinien. Und du?", es: "Soy de Argentina. ¿Y tú?" },
        { speaker: "A", de: "Aus Deutschland. Reist du alleine?", es: "De Alemania. ¿Viajas solo?" },
        { speaker: "B", de: "Ja, seit zwei Monaten.", es: "Sí, desde hace dos meses." },
        { speaker: "A", de: "Cool! Wohin reist du danach?", es: "¡Qué chévere! ¿A dónde vas después?" },
        { speaker: "B", de: "Nach Peru. Willst du mit?", es: "A Perú. ¿Te unes?" },
      ],
      usefulPhrases: ["¿De dónde eres?", "¿Viajas solo/a?", "¿A dónde vas después?", "¿Te unes?"],
    },
    {
      id: "hr05", mode: "roleplay", title: "Gemeinsam essen gehen", category: "social", level: 2,
      roles: { a: "Reisender", b: "Hostelgast" },
      situationDe: "Du willst jemanden aus dem Hostel fragen, ob ihr zusammen essen geht.",
      goalA: "Frag, ob die Person Hunger hat, und schlag ein Lokal vor.",
      goalB: "Sag zu und frag nach den Details (wann, wo).",
      dialogue: [
        { speaker: "A", de: "Hast du Lust, etwas essen zu gehen?", es: "¿Quieres ir a comer algo?" },
        { speaker: "B", de: "Ja, gerne! Wohin?", es: "¡Sí, claro! ¿A dónde?" },
        { speaker: "A", de: "Es gibt einen guten Markt hier in der Nähe.", es: "Hay un buen mercado aquí cerca." },
        { speaker: "B", de: "Perfekt. Um wie viel Uhr?", es: "Perfecto. ¿A qué hora?" },
        { speaker: "A", de: "Um acht? Sollen wir zusammen gehen?", es: "¿A las ocho? ¿Vamos juntos?" },
        { speaker: "B", de: "Abgemacht, bis dann!", es: "Hecho, ¡nos vemos!" },
      ],
      usefulPhrases: ["¿Quieres ir a comer algo?", "¿A qué hora?", "¿Vamos juntos?", "Hecho, ¡nos vemos!"],
    },
    {
      id: "hr06", mode: "roleplay", title: "Taxi zum Busbahnhof teilen", category: "verkehr", level: 2,
      roles: { a: "Reisender", b: "Mitreisender" },
      situationDe: "Ihr müsst beide zum Busbahnhof – teilt euch ein Taxi.",
      goalA: "Schlag vor, ein Taxi zu teilen, und frag, wohin die Person muss.",
      goalB: "Stimm zu und kläre, wie ihr die Kosten teilt.",
      dialogue: [
        { speaker: "A", de: "Musst du auch zum Busbahnhof?", es: "¿Vas también a la terminal?" },
        { speaker: "B", de: "Ja, in einer Stunde.", es: "Sí, en una hora." },
        { speaker: "A", de: "Sollen wir uns ein Taxi teilen?", es: "¿Compartimos un taxi?" },
        { speaker: "B", de: "Gute Idee, das ist billiger.", es: "Buena idea, sale más barato." },
        { speaker: "A", de: "Wir teilen den Preis, okay?", es: "Dividimos el precio, ¿vale?" },
        { speaker: "B", de: "Klar, machen wir.", es: "Claro, hagámoslo." },
      ],
      usefulPhrases: ["¿Compartimos un taxi?", "¿Vas a la terminal?", "Sale más barato.", "Dividimos el precio."],
    },
    {
      id: "hr07", mode: "roleplay", title: "Wäsche waschen", category: "hostel", level: 2,
      roles: { a: "Reisender", b: "Rezeption" },
      situationDe: "Du brauchst saubere Kleidung und fragst nach der Waschmaschine.",
      goalA: "Frage, ob es eine Waschmaschine gibt und was es kostet.",
      goalB: "Erkläre Preis, Ort und wann die Wäsche fertig ist.",
      dialogue: [
        { speaker: "A", de: "Gibt es eine Waschmaschine?", es: "¿Hay lavadora?" },
        { speaker: "B", de: "Ja, im Erdgeschoss.", es: "Sí, en la planta baja." },
        { speaker: "A", de: "Wie viel kostet eine Ladung?", es: "¿Cuánto cuesta un lavado?" },
        { speaker: "B", de: "Hundert Pesos, mit Trocknen.", es: "Cien pesos, con secado." },
        { speaker: "A", de: "Wann ist sie fertig?", es: "¿Cuándo está lista?" },
        { speaker: "B", de: "In etwa zwei Stunden.", es: "En unas dos horas." },
      ],
      usefulPhrases: ["¿Hay lavadora?", "¿Cuánto cuesta un lavado?", "¿Cuándo está lista?", "con secado"],
    },
    {
      id: "hr08", mode: "roleplay", title: "Check-out und Gepäck lagern", category: "hostel", level: 2,
      roles: { a: "Reisender", b: "Rezeption" },
      situationDe: "Du checkst aus, dein Bus fährt aber erst am Abend. Du willst dein Gepäck lagern.",
      goalA: "Sag, dass du auscheckst, und frage, ob du dein Gepäck lassen kannst.",
      goalB: "Bestätige den Check-out und erkläre die Gepäckaufbewahrung.",
      dialogue: [
        { speaker: "A", de: "Ich möchte auschecken, bitte.", es: "Quiero hacer el check-out, por favor." },
        { speaker: "B", de: "Klar. War alles in Ordnung?", es: "Claro. ¿Todo bien?" },
        { speaker: "A", de: "Ja, alles super. Kann ich mein Gepäck hier lassen?", es: "Sí, todo perfecto. ¿Puedo dejar mi equipaje aquí?" },
        { speaker: "B", de: "Natürlich, bis wann?", es: "Por supuesto, ¿hasta qué hora?" },
        { speaker: "A", de: "Bis sechs Uhr abends.", es: "Hasta las seis de la tarde." },
        { speaker: "B", de: "Kein Problem, ich gebe dir eine Marke.", es: "Sin problema, te doy un ticket." },
      ],
      usefulPhrases: ["Quiero hacer el check-out.", "¿Puedo dejar mi equipaje aquí?", "¿Hasta qué hora?", "Te doy un ticket."],
    },
  ];

  // Real-Life Challenges: kleine Aufgaben für draußen, erscheinen als Bonus nach
  // einer Battle-Runde. Reine Daten – category/level passen zur App-Logik.
  const CHALLENGES = [
    { id: "challenge01", category: "social", level: 1, textDe: "Frag heute eine Person im Hostel, woher sie kommt.", phraseEs: "¿De dónde eres?" },
    { id: "challenge02", category: "hostel", level: 1, textDe: "Frag an der Rezeption nach dem WLAN-Passwort.", phraseEs: "¿Cuál es la contraseña del wifi?" },
    { id: "challenge03", category: "social", level: 2, textDe: "Lade jemanden ein, mit dir essen zu gehen.", phraseEs: "¿Quieres ir a comer algo?" },
    { id: "challenge04", category: "hostel", level: 1, textDe: "Frag, ob das Frühstück inklusive ist.", phraseEs: "¿El desayuno está incluido?" },
    { id: "challenge05", category: "social", level: 1, textDe: "Frag jemanden, wie lange er/sie schon unterwegs ist.", phraseEs: "¿Cuánto tiempo estás aquí?" },
    { id: "challenge06", category: "essen", level: 2, textDe: "Frag im Lokal nach einer Empfehlung.", phraseEs: "¿Qué me recomienda?" },
    { id: "challenge07", category: "verkehr", level: 2, textDe: "Frag jemanden, ob ihr euch ein Taxi teilt.", phraseEs: "¿Compartimos un taxi?" },
    { id: "challenge08", category: "social", level: 2, textDe: "Tausch mit jemandem die WhatsApp-Nummer.", phraseEs: "Escríbeme por WhatsApp." },
    { id: "challenge09", category: "hostel", level: 2, textDe: "Frag, ob du dein Gepäck lagern kannst.", phraseEs: "¿Puedo dejar mi equipaje aquí?" },
    { id: "challenge10", category: "social", level: 1, textDe: "Verabschiede dich von jemandem auf Spanisch.", phraseEs: "Mucho gusto, ¡nos vemos!" },
  ];

  // ===================== REISE-KONTEXT ANHÄNGEN =====================
  // Quelle der handgeschriebenen Kontexte ist contextdata.js (SC.contextData), in
  // kompakter Schreibweise { e, d, s, n } -> { sentenceEs, sentenceDe, situation, note }.
  // Reihenfolge: bereits inline gesetzter context bleibt > handgeschriebener Eintrag >
  // praktischer Auto-Kontext für reine Zahlen-Karten (Preis/Menge im Reisealltag).

  // Praktischer Kontext für reine Zahlen-Karten (id "z" + Ziffern). Statt eines
  // erfundenen Satzes pro Ziffer bekommen Zahlen die häufigste Reise-Verwendung:
  // den Preis hören und verstehen. Hinweise variieren nach Größenordnung.
  //
  // Spanische Grammatik korrekt halten (LatAm-Inhalte sind "heilig"):
  //   - genau 1: "Es un peso" (Singular, apokopiertes "un").
  //   - Zahlen auf "uno": vor dem Nomen "un" / "veintiún" (z. B. veintiún pesos).
  //   - "de pesos" NUR, wenn die Zahl auf millón/millones ENDET (un millón de pesos),
  //     nicht bei Tausender-Rest (un millón quinientos mil pesos – ohne "de").
  function numberContext(card) {
    const es = card.es;                                   // z.B. "cincuenta y siete"
    const deNum = String(card.de).replace(/\s*\(.*\)\s*/g, "").trim(); // "57", "1.000"
    const value = Number(deNum.replace(/[.\s]/g, "")) || 0;

    // "uno" am Wortende vor dem Nomen apokopieren: veintiuno -> veintiún (mit Akzent),
    // sonst -> un (treinta y uno -> treinta y un, ciento uno -> ciento un).
    const apocope = (n) => /veintiuno$/i.test(n) ? n.replace(/veintiuno$/i, "veintiún")
                                                 : n.replace(/uno$/i, "un");
    const endsInMillion = /mill(?:ó|o)n(?:es)?$/i.test(es);
    let amountEs, verbEs, pesoDe;
    if (value === 1) {
      amountEs = "un peso"; verbEs = "Es"; pesoDe = "Peso";   // genau 1: Singular
    } else if (endsInMillion) {
      amountEs = `${es} de pesos`; verbEs = "Son"; pesoDe = "Pesos";
    } else {
      amountEs = `${apocope(es)} pesos`; verbEs = "Son"; pesoDe = "Pesos";
    }

    // 0 ergibt keinen sinnvollen Preis -> echter Reise-Gebrauch von "cero".
    if (value === 0) {
      return {
        sentenceEs: "Me quedan cero pesos, necesito un cajero.",
        sentenceDe: "Mir bleiben null Pesos, ich brauche einen Geldautomaten.",
        situation: "Wenn dein Bargeld alle ist.",
        note: "cero = null; praktisch, um zu sagen, dass etwas leer oder aus ist.",
      };
    }

    let situation, note;
    if (value < 100) {
      situation = "Beim Bezahlen, bei Mengen, Personen oder einer Zimmernummer.";
      note = "Kleine Zahlen brauchst du ständig – für Anzahl, Personen oder die Hausnummer.";
    } else if (value < 10000) {
      situation = "Beim Bezahlen an der Kasse, im Markt oder im Taxi.";
      note = "In vielen Ländern (z. B. Kolumbien, Chile) sind selbst kleine Preise schnell vierstellig.";
    } else {
      situation = "Beim Bezahlen größerer Beträge: Hostel-Nacht, Tour oder am Geldautomaten.";
      note = "Große Beträge schnell zu erkennen, schützt dich beim Wechselgeld vor Fehlern.";
    }
    return {
      sentenceEs: `${verbEs} ${amountEs}.`,
      sentenceDe: `Das macht ${deNum} ${pesoDe}.`,
      situation,
      note,
    };
  }

  (function attachContext() {
    const map = (window.SC && window.SC.contextData) || {};
    const expand = (x) => ({ sentenceEs: x.e, sentenceDe: x.d, situation: x.s, note: x.n });
    CARDS.forEach((card) => {
      if (card.context) return;                       // inline gesetzter Kontext bleibt
      if (map[card.id]) { card.context = expand(map[card.id]); return; }
      if (/^z\d+$/.test(card.id)) card.context = numberContext(card);
    });
  })();

  window.SC = window.SC || {};
  window.SC.data = { CATEGORIES, LEVELS, CARDS, BATTLE_SCENES, BATTLES, ROLEPLAYS, CHALLENGES };
})();
