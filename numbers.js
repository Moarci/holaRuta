/*
 * numbers.js  (SC.numbers) – Zahlen ↔ spanische Zahlwörter und Preis-Generator.
 * REINE FUNKTIONEN, keine Abhängigkeiten (wie matcher/srs). Lädt vor context.js
 * (das die Wort-/Währungslogik mitbenutzt) und vor app.js/ui.js.
 *
 * Warum eigenes Modul: Der Preis-Hörtrainer („Precios al oído") soll nicht mehr
 * nur die Handvoll fest in data.js gepflegten Zahlen-Karten abspielen (Deckel bei
 * 5.000.000), sondern BELIEBIGE, realistische Beträge erzeugen – inkl. der großen
 * Zahlen, die im Alltag in Kolumbien, Chile oder Argentinien völlig normal sind.
 *
 * Spanische Grammatik ist „heilig" (LatAm-Inhalte): Akzente, Apokope (uno→un,
 * veintiuno→veintiún vor Nomen/„mil"/„millón"), Unregelmäßigkeiten (quinientos,
 * setecientos, novecientos), „cien" (genau 100/100.000) vs. „ciento …", „mil"
 * (nie „un mil") und die „de"-Regel bei vollen Millionen (un millón DE pesos).
 *
 * Locals-Track (Englisch lernen): dieselbe Engine spricht Beträge auf ENGLISCH
 * (toWordsEn/amountEn, US-Stil ohne „and", Bindestrich 21–99). makeItem/buildRound
 * nehmen dafür einen optionalen lang-Parameter ("en"); alle spanischen Defaults
 * bleiben byte-identisch – context.js und der Reise-Track sind unberührt.
 */
(function () {
  "use strict";

  // 0–29 ausgeschrieben (16–29 sind im Spanischen ein Wort, mit Akzenten).
  const UNITS = [
    "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
    "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
    "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
  ];
  const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  // Hunderter inkl. der Unregelmäßigen (quinientos/setecientos/novecientos).
  const HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos",
    "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  // 0–99: ab 31 „Zehner y Einer", darunter aus der Tabelle.
  function below100(n) {
    if (n < 30) return UNITS[n];
    const t = Math.floor(n / 10), u = n % 10;
    return u ? TENS[t] + " y " + UNITS[u] : TENS[t];
  }

  // 0–999: genau 100 = „cien", sonst „ciento …"; leerer String bei 0.
  function below1000(n) {
    if (n === 0) return "";
    if (n === 100) return "cien";
    if (n < 100) return below100(n);
    const h = Math.floor(n / 100), r = n % 100;
    return r ? HUNDREDS[h] + " " + below100(r) : HUNDREDS[h];
  }

  // Apokope am Wortende vor einem Nomen oder „mil"/„millón":
  // veintiuno → veintiún, …uno → …un (z. B. treinta y uno → treinta y un).
  function apocope(words) {
    if (/veintiuno$/.test(words)) return words.replace(/veintiuno$/, "veintiún");
    if (/\buno$/.test(words)) return words.replace(/uno$/, "un");
    return words;
  }

  // Ganzzahl 0 … 999.999.999 als spanisches Zahlwort (natürliche Lesart).
  // Vor „mil"/„millones" wird „uno" korrekt apokopiert (veintiún mil, treinta y
  // un millones); der letzte Hunderter-Block bleibt als reine Zahl „…uno".
  function toWords(n) {
    // Definierte Domäne 0 … 999.999.999. Größere Werte werden geklemmt, damit nie
    // „undefined millones" entsteht (der millones-Block ginge sonst über below1000 hinaus).
    n = Math.min(Math.floor(Math.abs(Number(n) || 0)), 999999999);
    if (n === 0) return "cero";
    const parts = [];
    const millones = Math.floor(n / 1e6);
    const miles = Math.floor((n % 1e6) / 1000);
    const resto = n % 1000;
    if (millones === 1) parts.push("un millón");
    else if (millones > 1) parts.push(apocope(below1000(millones)) + " millones");
    if (miles === 1) parts.push("mil");                       // nie „un mil"
    else if (miles > 1) parts.push(apocope(below1000(miles)) + " mil");
    if (resto) parts.push(below1000(resto));
    return parts.join(" ");
  }

  // Betrag als gesprochene Preisangabe inkl. Währungs-Nomen, grammatisch sauber:
  //  - genau 1   → „un <Singular>"  (un peso / un sol / un colón)
  //  - Apokope vor dem Nomen        (veintiún pesos, treinta y un pesos, ciento un …)
  //  - „de"-Regel: NUR bei vollen Millionen → „un millón de pesos",
  //    „dos millones de pesos"; mit Tausender-Rest OHNE „de".
  // cur = { one, many } (Singular-/Pluralform des Währungsworts).
  function amount(n, cur) {
    cur = cur || { one: "peso", many: "pesos" };
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 1) return "un " + cur.one;
    const wholeMillions = n >= 1e6 && n % 1e6 === 0;
    const words = apocope(toWords(n));
    return wholeMillions ? words + " de " + cur.many : words + " " + cur.many;
  }

  // Ziffern mit „.“-Tausendertrennung (kolumbianisch/deutsch): 1250000 → „1.250.000".
  function format(n) {
    return String(Math.floor(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // ---------- Englische Zahlwörter (Locals-Track) ----------
  // US-Stil wie TTS und Alltag: kein „and" („one hundred twenty-three"),
  // Bindestrich bei 21–99 („twenty-three"). Deutlich einfacher als Spanisch:
  // keine Apokope, kein Genus, keine „de"-Regel.
  const UNITS_EN = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const TENS_EN = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function below100En(n) {
    if (n < 20) return UNITS_EN[n];
    const t = Math.floor(n / 10), u = n % 10;
    return u ? TENS_EN[t] + "-" + UNITS_EN[u] : TENS_EN[t];
  }

  function below1000En(n) {
    if (n === 0) return "";
    if (n < 100) return below100En(n);
    const h = Math.floor(n / 100), r = n % 100;
    return r ? UNITS_EN[h] + " hundred " + below100En(r) : UNITS_EN[h] + " hundred";
  }

  // Ganzzahl 0 … 999.999.999 als englisches Zahlwort (gleiche Domäne wie toWords).
  function toWordsEn(n) {
    n = Math.min(Math.floor(Math.abs(Number(n) || 0)), 999999999);
    if (n === 0) return "zero";
    const parts = [];
    const millions = Math.floor(n / 1e6);
    const thousands = Math.floor((n % 1e6) / 1000);
    const rest = n % 1000;
    if (millions) parts.push(below1000En(millions) + " million");
    if (thousands) parts.push(below1000En(thousands) + " thousand");
    if (rest) parts.push(below1000En(rest));
    return parts.join(" ");
  }

  // Betrag als gesprochene ENGLISCHE Preisangabe: „one dollar" / „twenty-three
  // thousand pesos". cur = { oneEn, manyEn } (englisches Währungswort; die
  // LatAm-Währungen bleiben als Lehnwörter: pesos, soles, colones …).
  function amountEn(n, cur) {
    cur = cur || { oneEn: "peso", manyEn: "pesos" };
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 1) return "one " + (cur.oneEn || cur.one);
    return toWordsEn(n) + " " + (cur.manyEn || cur.many);
  }

  // ---------- Währungen & Schwierigkeitsstufen ----------
  // Pro Land/Währung drei Stufen mit realistischen Spannen { min, max, step }.
  // „fine" (optional) ist ein feinerer Schritt, der auf höheren Stufen krummere,
  // schwerer zu hörende Beträge erzeugt. Alle Währungswörter sind maskulin
  // (un/veintiún passt), Beträge sind ganzzahlig (keine Centavos im Reisealltag).
  const CURRENCIES = {
    CO: {
      key: "CO", flag: "🇨🇴", name: "Kolumbien", nameEn: "Colombia", code: "COP", symbol: "$",
      one: "peso", many: "pesos", oneEn: "peso", manyEn: "pesos", nameEs: "Colombia",
      note: "Hier wird alles schnell sechs- bis siebenstellig – das Königsland der großen Zahlen.",
      noteEn: "Everything goes six or seven digits fast here – the homeland of big numbers.",
      noteEs: "Aquí todo llega rápido a seis o siete cifras: el país de los números grandes.",
      levels: [
        { min: 500, max: 20000, step: 500 },
        { min: 10000, max: 200000, step: 1000, fine: 500 },
        { min: 100000, max: 5000000, step: 10000, fine: 1000 },
      ],
    },
    CL: {
      key: "CL", flag: "🇨🇱", name: "Chile", nameEn: "Chile", code: "CLP", symbol: "$",
      one: "peso", many: "pesos", oneEn: "peso", manyEn: "pesos", nameEs: "Chile",
      note: "Chilenische Pesos kennen keine Centavos – dafür viele Nullen.",
      noteEn: "Chilean pesos have no centavos – but plenty of zeros.",
      noteEs: "El peso chileno no tiene centavos, pero sí muchos ceros.",
      levels: [
        { min: 300, max: 15000, step: 100 },
        { min: 5000, max: 150000, step: 1000, fine: 500 },
        { min: 100000, max: 8000000, step: 10000, fine: 1000 },
      ],
    },
    AR: {
      key: "AR", flag: "🇦🇷", name: "Argentinien", nameEn: "Argentina", code: "ARS", symbol: "$",
      one: "peso", many: "pesos", oneEn: "peso", manyEn: "pesos", nameEs: "Argentina",
      note: "Durch die Inflation sind selbst Kleinigkeiten vier- bis fünfstellig.",
      noteEn: "Thanks to inflation, even small things run to four or five digits.",
      noteEs: "Por la inflación, hasta lo pequeño llega a cuatro o cinco cifras.",
      levels: [
        { min: 500, max: 20000, step: 100 },
        { min: 10000, max: 300000, step: 1000, fine: 500 },
        { min: 100000, max: 9000000, step: 10000, fine: 1000 },
      ],
    },
    CR: {
      key: "CR", flag: "🇨🇷", name: "Costa Rica", nameEn: "Costa Rica", code: "CRC", symbol: "₡",
      one: "colón", many: "colones", oneEn: "colón", manyEn: "colones", nameEs: "Costa Rica",
      note: "Colones gehen schnell in die Hunderttausende und Millionen.",
      noteEn: "Colones quickly run into the hundreds of thousands and millions.",
      noteEs: "Los colones llegan rápido a los cientos de miles y millones.",
      levels: [
        { min: 100, max: 5000, step: 100 },
        { min: 1000, max: 50000, step: 500, fine: 100 },
        { min: 25000, max: 2000000, step: 1000, fine: 500 },
      ],
    },
    MX: {
      key: "MX", flag: "🇲🇽", name: "Mexiko", nameEn: "Mexico", code: "MXN", symbol: "$",
      one: "peso", many: "pesos", oneEn: "peso", manyEn: "pesos", nameEs: "México",
      note: "Kleinere Zahlen als in Kolumbien – gut zum Einsteigen.",
      noteEn: "Smaller numbers than in Colombia – a good place to start.",
      noteEs: "Números más pequeños que en Colombia: ideal para empezar.",
      levels: [
        { min: 5, max: 200, step: 5 },
        { min: 50, max: 2000, step: 10, fine: 5 },
        { min: 500, max: 50000, step: 100, fine: 50 },
      ],
    },
    PE: {
      key: "PE", flag: "🇵🇪", name: "Peru", nameEn: "Peru", code: "PEN", symbol: "S/",
      one: "sol", many: "soles", oneEn: "sol", manyEn: "soles", nameEs: "Perú",
      note: "Soles sind „stark“ – die Beträge bleiben angenehm überschaubar.",
      noteEn: "Soles are „strong“ – the amounts stay pleasantly manageable.",
      noteEs: "El sol es «fuerte»: los montos se mantienen manejables.",
      levels: [
        { min: 2, max: 100, step: 1 },
        { min: 20, max: 500, step: 5 },
        { min: 100, max: 9000, step: 10, fine: 5 },
      ],
    },
    GT: {
      key: "GT", flag: "🇬🇹", name: "Guatemala", nameEn: "Guatemala", code: "GTQ", symbol: "Q",
      one: "quetzal", many: "quetzales", oneEn: "quetzal", manyEn: "quetzales", nameEs: "Guatemala",
      note: "Quetzales – kleine bis mittlere Beträge, mit eigener Pluralform.",
      noteEn: "Quetzales – small to mid-sized amounts, with their own plural form.",
      noteEs: "Quetzales: montos pequeños y medianos, con plural propio.",
      levels: [
        { min: 5, max: 150, step: 5 },
        { min: 50, max: 1500, step: 10 },
        { min: 300, max: 40000, step: 100, fine: 50 },
      ],
    },
    // US-Dollar: NUR in der Locals-Liste (CURRENCY_ORDER_EN) – Trinkgeld, Touren,
    // Preise für Gäste. Kleine Beträge, dafür krumme Schritte auf höheren Stufen.
    US: {
      key: "US", flag: "🇺🇸", name: "USA", nameEn: "United States", nameEs: "Estados Unidos", code: "USD", symbol: "$",
      one: "dólar", many: "dólares", oneEn: "dollar", manyEn: "dollars",
      note: "Dollarbeträge bleiben klein – Trinkgeld, Touren, Preise für Gäste.",
      noteEn: "Dollar amounts stay small – tips, tours, prices for guests.",
      noteEs: "Los montos en dólares son pequeños: propinas, tours y precios para huéspedes.",
      levels: [
        { min: 1, max: 100, step: 1 },
        { min: 20, max: 2000, step: 5, fine: 1 },
        { min: 500, max: 100000, step: 100, fine: 25 },
      ],
    },
  };

  // Anzeige-Reihenfolge: Kolumbien zuerst (das „große Zahlen"-Aushängeschild).
  const CURRENCY_ORDER = ["CO", "CL", "AR", "CR", "MX", "PE", "GT"];
  // Locals-Track (Englisch): Dollar zuerst, dann die Arbeitswährungen vor Ort –
  // der Reise-Track nutzt weiter CURRENCY_ORDER und sieht USD nie.
  const CURRENCY_ORDER_EN = ["US", "CO", "MX", "CR", "PE", "CL", "AR", "GT"];

  // Drei generische Schwierigkeitsstufen (währungsunabhängig benannt).
  // labelEs/hintEs für die spanische UI des Locals-Tracks (natKey bevorzugt …Es).
  const LEVELS = [
    { id: 1, short: "Fácil", label: "Kleine Beträge", labelEn: "Small amounts", labelEs: "Montos pequeños", hint: "Snacks, Kaffee, Kleinkram", hintEn: "Snacks, coffee, odds and ends", hintEs: "Snacks, café, cositas" },
    { id: 2, short: "Medio", label: "Alltag", labelEn: "Everyday", labelEs: "Día a día", hint: "Essen, Hostel, kurze Fahrten", hintEn: "Food, hostel, short rides", hintEs: "Comida, hostal, trayectos cortos" },
    { id: 3, short: "Difícil", label: "Große Beträge", labelEn: "Big amounts", labelEs: "Montos grandes", hint: "Fernbus, Tour, Miete – die dicken Zahlen", hintEn: "Long-distance bus, tour, rent – the big numbers", hintEs: "Bus, tour, arriendo: los números gordos" },
  ];

  function currency(key) {
    return CURRENCIES[key] || CURRENCIES.CO;
  }

  // lang "en" → Locals-Reihenfolge inkl. USD; Default bleibt die Reise-Liste.
  function currencyList(lang) {
    return (lang === "en" ? CURRENCY_ORDER_EN : CURRENCY_ORDER).map((k) => CURRENCIES[k]);
  }

  // Stufen-Spanne einer Währung (1-basiert, geklemmt) – für Generator & Anzeige.
  function tierFor(cur, level) {
    const c = typeof cur === "string" ? currency(cur) : cur;
    const idx = Math.max(0, Math.min(c.levels.length - 1, (Number(level) || 1) - 1));
    return c.levels[idx];
  }

  // Optionaler rng (Default Math.random) → reproduzierbare Runden (Arbeitsheft
  // seedet pro Ziel, damit Nachdrucke identisch sind).
  function randInt(a, b, rng) {
    return a + Math.floor((rng || Math.random)() * (b - a + 1));
  }

  // Ein Preis-Objekt für einen konkreten Betrag: { value, digits, es, … }.
  // lang "en" → `es`/`words` tragen die ENGLISCHE Wortform (das Feld `es` ist
  // historisch die „gesprochene Wortform" und bleibt für Renderer/TTS stabil).
  function makeItem(value, cur, lang) {
    const c = typeof cur === "string" ? currency(cur) : cur;
    const en = lang === "en";
    return {
      value,
      digits: format(value),
      es: en ? amountEn(value, c) : amount(value, c),
      words: en ? toWordsEn(value) : toWords(value),
      code: c.code,
      symbol: c.symbol,
      flag: c.flag,
      currencyKey: c.key,
    };
  }

  // Zufälliger, realistischer Betrag für (Währung, Stufe). Auf höheren Stufen mit
  // 50 % Wahrscheinlichkeit ein feinerer Schritt -> krummere, schwerere Zahlen.
  function randomPrice(curKey, level, rng, lang) {
    const c = currency(curKey);
    const tier = tierFor(c, level);
    let step = tier.step;
    if ((Number(level) || 1) >= 3 && tier.fine && (rng || Math.random)() < 0.5) step = tier.fine;
    const lo = Math.ceil(tier.min / step), hi = Math.floor(tier.max / step);
    const value = randInt(lo, Math.max(lo, hi), rng) * step;
    return makeItem(value, c, lang);
  }

  // Eine ganze Runde distinkter Beträge (keine direkte Wiederholung, möglichst
  // keine Dubletten). count = Anzahl Aufgaben.
  function buildRound(curKey, level, count, rng, lang) {
    const n = Math.max(1, Number(count) || 10);
    const out = [];
    const seen = new Set();
    let guard = 0;
    while (out.length < n && guard < n * 40) {
      guard += 1;
      const item = randomPrice(curKey, level, rng, lang);
      if (seen.has(item.value)) continue;
      seen.add(item.value);
      out.push(item);
    }
    // Falls die Spanne zu klein für lauter distinkte Werte ist: mit Wiederholungen auffüllen.
    while (out.length < n) out.push(randomPrice(curKey, level, rng, lang));
    return out;
  }

  window.SC = window.SC || {};
  window.SC.numbers = {
    toWords, amount, format, apocope,
    toWordsEn, amountEn,
    currency, currencyList, tierFor,
    randomPrice, buildRound, makeItem,
    CURRENCIES, CURRENCY_ORDER, CURRENCY_ORDER_EN, LEVELS,
  };
})();
