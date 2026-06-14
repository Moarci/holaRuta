/*
 * salud.js  (SC.salud) – Modul "Salud y energía: gesund & fit unterwegs".
 * REINE DATEN, keine Logik (wie logistica.js / regatear.js / knigge.js). Lädt
 * vor app.js und hängt sich an window.SC. Wird von ui.renderSalud gerendert,
 * das dieselbe Sheet-Darstellung wie ui.renderLogistica nutzt (gleiches Schema).
 *
 * Idee: lange auf der Straße bleibt nur, wer halbwegs auf den Körper achtet.
 * Streetfood ist lecker und günstig, deckt aber selten Protein, Ballaststoffe
 * und Vitamine ab. Das Modul zeigt, wie man ausgewogen isst (z. B. Porridge mit
 * Proteinpulver zum Selbermachen, ganz ohne Küche), günstig und mit Geschmack
 * genug trinkt (Zero-Sirup, Elektrolytpulver), den Bauch in Ruhe lässt, sich vor
 * Sonne, Höhe und Mücken schützt und in Bewegung bleibt – plus die Sätze fürs
 * Einkaufen, Bestellen und die Apotheke. Durchgängig LatAm-Spanisch.
 *
 * Schemas (identisch zu logistica.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }] – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Essen, Trinken, Apotheke.
 *   CHECKLIST: [{ icon, item, why }] – „Gesund-unterwegs-Kit" (+ …En).
 *
 * Hinweis: Backpacker-Faustregeln, KEINE medizinische Beratung. Bei anhaltenden
 * Beschwerden, starker Höhenkrankheit oder hohem Fieber zählt ärztlicher Rat,
 * nicht die Reiseapotheke.
 */
(function () {
  "use strict";

  const INTRO =
    "Gesund und fit zu bleiben hält dich länger auf der Straße: ausgewogen essen " +
    "(nicht nur Streetfood), genug und günstig trinken, den Bauch in Ruhe lassen, " +
    "dich vor Sonne und Höhe schützen und in Bewegung bleiben. Erst die Tipps, " +
    "dann die Sätze fürs Einkaufen, Bestellen und die Apotheke.";

  const INTRO_EN =
    "Staying healthy and fit keeps you travelling longer: eat a balanced diet " +
    "(not just street food), drink enough and cheaply, look after your stomach, " +
    "protect yourself from sun and altitude, and keep moving. First the tips, then " +
    "the phrases for shopping, ordering and the pharmacy.";

  // ---------- Erklärung: gesund & fit unterwegs (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "🥗",
      title: "Ausgewogen essen – nicht nur Streetfood",
      titleEn: "Eat a balanced diet – not just street food",
      intro: "Streetfood ist lecker und günstig – aber dein Körper braucht auch Protein, Ballaststoffe und Vitamine. Hol dir gezielt das, was im Frittierten fehlt.",
      introEn: "Street food is tasty and cheap – but your body also needs protein, fibre and vitamins. Go out of your way for what the fried stuff is missing.",
      dos: [
        "Protein gezielt einbauen: Eier, Bohnen (frijoles), Hähnchen, Fisch, Linsen, Thunfisch aus der Dose.",
        "Obst & Gemüse frisch vom Markt – meist spottbillig und voller Vitamine.",
        "Ballaststoffe für die Verdauung: Haferflocken, Bohnen, Vollkorn, Obst mit Schale.",
        "Beim Streetfood auf gut Durchgebratenes und viel Andrang achten (frisch = sicherer).",
        "Abwechslung suchen: nicht jeden Tag dasselbe Frittierte.",
      ],
      dosEn: [
        "Build in protein on purpose: eggs, beans (frijoles), chicken, fish, lentils, tinned tuna.",
        "Fresh fruit & veg from the market – usually dirt cheap and full of vitamins.",
        "Fibre for digestion: oats, beans, wholegrains, fruit with the skin on.",
        "With street food, go for well-cooked stalls with plenty of custom (fresh = safer).",
        "Look for variety: not the same fried thing every day.",
      ],
      donts: [
        "Nicht tagelang nur Reis, Weißbrot und Frittiertes essen.",
        "Gemüse und Obst nicht komplett weglassen – sonst fehlen Vitamine und Ballaststoffe.",
        "Nicht am leeren, gerade aufgebauten Stand essen, wenn nebenan alles brummt.",
      ],
      dontsEn: [
        "Don't live on rice, white bread and fried food for days on end.",
        "Don't cut out veg and fruit altogether – you'll run short on vitamins and fibre.",
        "Don't eat at the empty, just-opened stall when the one next door is buzzing.",
      ],
    },
    {
      icon: "🥣",
      title: "Frühstück selbst machen (Porridge & Protein)",
      titleEn: "Make your own breakfast (porridge & protein)",
      intro: "Kauf dir im Supermarkt ein paar Zutaten und mach dir morgens Porridge mit Proteinpulver und Früchten. Dafür brauchst du keine ausgestattete Küche – Löffel und Tasse reichen. Spart oft auch Geld (nicht überall).",
      introEn: "Buy a few ingredients at the supermarket and make porridge with protein powder and fruit in the morning. You don't need a kitted-out kitchen – a spoon and a cup will do. It often saves money too (not everywhere).",
      dos: [
        "Basis: Haferflocken (avena) + heißes Wasser (Wasserkocher/Mikrowelle) – fertig in 2 Minuten.",
        "Proteinpulver unterrühren, dazu Banane/Obst, Erdnussbutter, Nüsse oder Samen.",
        "Kein heißes Wasser? Overnight Oats: Haferflocken über Nacht in Milch/Wasser quellen lassen.",
        "Proteinpulver, Haferflocken und Nüsse von zu Hause mitbringen oder vor Ort kaufen und im Locker lagern.",
        "Ein faltbarer Becher und ein Spork im Gepäck genügen als „Küche“.",
      ],
      dosEn: [
        "Base: oats (avena) + hot water (kettle/microwave) – ready in 2 minutes.",
        "Stir in protein powder, add banana/fruit, peanut butter, nuts or seeds.",
        "No hot water? Overnight oats: soak the oats in milk/water overnight.",
        "Bring protein powder, oats and nuts from home or buy them locally and keep them in your locker.",
        "A collapsible cup and a spork in your pack are all the „kitchen“ you need.",
      ],
      donts: [
        "Nicht täglich nur süßes Café-Frühstück (Gebäck + Saft) – wenig Protein, viel Zucker.",
        "Keine ganze Küchenausrüstung schleppen – minimal reicht völlig.",
        "Frische Milch nicht horten, wenn kein Kühlschrank da ist – H-Milch oder Pflanzendrink nehmen.",
      ],
      dontsEn: [
        "Don't just have a sweet café breakfast every day (pastry + juice) – little protein, lots of sugar.",
        "Don't lug a whole kitchen set around – minimal is plenty.",
        "Don't stockpile fresh milk with no fridge – go for UHT milk or a plant drink.",
      ],
    },
    {
      icon: "💧",
      title: "Genug trinken – günstig & mit Geschmack",
      titleEn: "Drink enough – cheap & with flavour",
      intro: "Bei Hitze und Höhe viel trinken. Günstiges (sicheres) Wasser aufpeppen statt teure Softdrinks: Zero-Sirup bringt Abwechslung, Elektrolytpulver gleicht das Schwitzen aus – beides spart Geld und schmeckt.",
      introEn: "Drink plenty in heat and at altitude. Jazz up cheap (safe) water instead of pricey soft drinks: Zero syrup adds variety, electrolyte powder makes up for sweating – both save money and taste good.",
      dos: [
        "Große, wiederbefüllbare Flasche dabei – nachfüllen statt ständig kaufen.",
        "Zero-/zuckerfreier Sirup oder Geschmackstropfen: günstiges Wasser, viel Abwechslung, du trinkst mehr.",
        "Elektrolytpulver/-tabletten (suero / sales) bei Hitze, Schwitzen oder nach Durchfall – gleicher Kosten- und Geschmacksvorteil wie Sirup.",
        "Wo Leitungswasser unsicher ist: abkochen, filtern, mit Tabletten/UV entkeimen oder Flaschenwasser.",
        "In Höhe und Hitze trinken, bevor der Durst kommt.",
      ],
      dosEn: [
        "Carry a big, refillable bottle – top it up instead of buying again and again.",
        "Zero/sugar-free syrup or flavour drops: cheap water, lots of variety, and you drink more.",
        "Electrolyte powder/tablets (suero / sales) in heat, when sweating or after diarrhoea – the same cost and taste win as syrup.",
        "Where tap water isn't safe: boil, filter, purify with tablets/UV, or buy bottled.",
        "At altitude and in heat, drink before the thirst kicks in.",
      ],
      donts: [
        "Nicht täglich teure Cola/Säfte kaufen – kostet Geld und steckt voll Zucker.",
        "Kein Leitungswasser und kein Eis aus unsicherer Quelle.",
        "Durst und dunklen Urin nicht ignorieren – das ist schon Flüssigkeitsmangel.",
      ],
      dontsEn: [
        "Don't buy pricey cola/juice every day – it costs money and is full of sugar.",
        "No tap water and no ice from an unsafe source.",
        "Don't ignore thirst and dark urine – that's dehydration already.",
      ],
    },
    {
      icon: "🦠",
      title: "Bauch & Verdauung",
      titleEn: "Stomach & digestion",
      intro: "Neues Essen, wenig Gemüse, lange Fahrten – der Bauch streikt schnell. Ballaststoffe helfen vielen für einen besseren Stuhlgang, Hygiene und Elektrolyte für den Rest.",
      introEn: "New food, little veg, long journeys – your stomach soon protests. Fibre helps many people to a better bowel movement, with hygiene and electrolytes for the rest.",
      dos: [
        "Ballaststoffe (Haferflocken, Obst, Bohnen) für eine geregelte Verdauung.",
        "Hände waschen oder Desinfektionsgel vor dem Essen; Obst schälen oder mit sicherem Wasser waschen.",
        "Bei Durchfall: viel trinken + Elektrolyte (suero) – Flüssigkeit ist wichtiger als „Stopfen“.",
        "Kleine Reiseapotheke: „algo para la diarrea“, Rehydratationssalze, ggf. Probiotika.",
        "Manzanilla- (Kamille) oder Ingwertee beruhigt den Magen.",
      ],
      dosEn: [
        "Fibre (oats, fruit, beans) for a regular digestion.",
        "Wash your hands or use sanitiser before eating; peel fruit or wash it with safe water.",
        "With diarrhoea: drink plenty + electrolytes (suero) – fluids matter more than „blocking it up“.",
        "A small first-aid kit: „algo para la diarrea“, rehydration salts, maybe probiotics.",
        "Manzanilla (chamomile) or ginger tea settles the stomach.",
      ],
      donts: [
        "Bei Durchfall nicht das Trinken vergessen – Austrocknung ist die eigentliche Gefahr.",
        "Rohes/ungewaschenes Gemüse und Eiswürfel aus unsicherem Wasser meiden.",
        "Nicht bei jedem Zwicken sofort Antibiotika – erst Flüssigkeit, Ruhe, leichte Kost.",
      ],
      dontsEn: [
        "With diarrhoea, don't forget to drink – dehydration is the real danger.",
        "Avoid raw/unwashed veg and ice cubes from unsafe water.",
        "Don't reach for antibiotics at every twinge – first fluids, rest and light food.",
      ],
    },
    {
      icon: "☀️",
      title: "Sonne, Höhe & Mücken",
      titleEn: "Sun, altitude & mosquitoes",
      intro: "Näher am Äquator und oft in Höhe unterschätzt man Sonne und dünne Luft leicht. Und Mücken übertragen mancherorts Dengue oder Malaria.",
      introEn: "Closer to the equator and often at altitude, it's easy to underestimate the sun and the thin air. And in some places mosquitoes carry dengue or malaria.",
      dos: [
        "Sonnencreme (protector solar) und Kopfbedeckung, auch bei Bewölkung und in der Höhe.",
        "In der Höhe (Cusco, La Paz) langsam akklimatisieren: viel Wasser, Coca-Tee, die ersten Tage ruhig.",
        "Mückenschutz (repelente) in Dengue-/Malariagebieten, lange Kleidung in der Dämmerung.",
        "Genug Schlaf: Ohrstöpsel und Schlafmaske im Dorm – das Immunsystem dankt es dir.",
      ],
      dosEn: [
        "Sunscreen (protector solar) and a hat, even when it's cloudy and at altitude.",
        "At altitude (Cusco, La Paz) acclimatise slowly: lots of water, coca tea, take the first days easy.",
        "Mosquito repellent (repelente) in dengue/malaria areas, long clothing at dusk.",
        "Enough sleep: earplugs and an eye mask in the dorm – your immune system will thank you.",
      ],
      donts: [
        "Höhenkrankheit (soroche) nicht überspielen – bei starken Symptomen wieder runter.",
        "Mittagssonne und Sonnenbrand nicht unterschätzen, gerade auf dem Wasser und in Höhe.",
        "Nicht jede Nacht durchfeiern – Schlafmangel macht anfällig für jeden Infekt.",
      ],
      dontsEn: [
        "Don't play down altitude sickness (soroche) – with strong symptoms, go back down.",
        "Don't underestimate the midday sun and sunburn, especially on the water and at altitude.",
        "Don't party through every night – lack of sleep leaves you open to every bug.",
      ],
    },
    {
      icon: "💪",
      title: "In Bewegung bleiben",
      titleEn: "Keep moving",
      intro: "Lange Busfahrten und gemütliche Hostels – schnell bewegt man sich kaum noch. Fit bleiben geht auch ohne Fitnessstudio.",
      introEn: "Long bus rides and comfy hostels – it's easy to stop moving altogether. Staying fit works without a gym, too.",
      dos: [
        "Die Stadt zu Fuß erkunden, Treppen statt Aufzug, Wanderungen und Schwimmen mitnehmen.",
        "Joggen gehen – aber bewusst wo und wann: früh oder abends gegen die Hitze, und nur in sicheren, belebten Gegenden (Parks, Strandpromenade, Fluss).",
        "Kurzes Eigengewichts-Workout (Kniebeugen, Liegestütze, Plank) – kein Equipment nötig.",
        "Manche Hostels bieten Yoga an oder haben einen kleinen Gym-Bereich – am Check-in oder Schwarzen Brett fragen.",
        "In größeren Städten im Gym einen Tagespass kaufen: meist günstig und ein gutes Erlebnis, weil dort die Locals trainieren.",
        "Nach Nachtbussen dehnen und den Körper kurz lockern.",
      ],
      dosEn: [
        "Explore the city on foot, take the stairs not the lift, fit in hikes and swimming.",
        "Go for a run – but mind where and when: early or in the evening against the heat, and only in safe, busy areas (parks, seafront, riverside).",
        "A short bodyweight workout (squats, push-ups, plank) – no equipment needed.",
        "Some hostels offer yoga or have a small gym area – ask at check-in or check the noticeboard.",
        "In bigger cities buy a day pass at a gym: usually cheap and a good experience, since the locals train there.",
        "After night buses, stretch and loosen up the body a little.",
      ],
      donts: [
        "Nicht bei Dunkelheit oder in unguten Gegenden joggen – lieber Tageslicht und belebte Strecken.",
        "In praller Mittagshitze keine harten Einheiten – früh oder spät laufen und genug trinken.",
        "Nicht den ganzen Tag im Hostel-Sofa versacken.",
        "Bewegung nicht komplett pausieren, nur weil gerade Urlaub ist.",
      ],
      dontsEn: [
        "Don't run in the dark or in dodgy areas – stick to daylight and busy routes.",
        "No hard sessions in the blazing midday heat – run early or late and drink enough.",
        "Don't sink into the hostel sofa all day.",
        "Don't put movement on hold entirely just because you're on holiday.",
      ],
    },
  ];

  // ---------- Wichtige Sätze, nach Thema gruppiert (es / de / en) ----------
  const PHRASES = [
    {
      id: "mercado",
      icon: "🛒",
      title: "Gesund einkaufen",
      titleEn: "Shopping healthily",
      items: [
        { es: "¿Dónde está la avena?", de: "Wo sind die Haferflocken?", en: "Where are the oats?" },
        { es: "¿Tienen fruta fresca?", de: "Haben Sie frisches Obst?", en: "Do you have fresh fruit?" },
        { es: "¿Tienen huevos?", de: "Haben Sie Eier?", en: "Do you have eggs?" },
        { es: "Quiero algo con proteína.", de: "Ich möchte etwas mit Protein.", en: "I'd like something with protein." },
        { es: "¿Venden frutos secos?", de: "Verkaufen Sie Nüsse?", en: "Do you sell nuts?" },
        { es: "¿Dónde hay agua en botella grande?", de: "Wo gibt es Wasser in großer Flasche?", en: "Where is there water in a big bottle?" },
        { es: "¿Tienen leche que no necesite frío?", de: "Haben Sie Milch, die keine Kühlung braucht? (H-Milch)", en: "Do you have milk that doesn't need refrigerating? (UHT)" },
        { es: "¿Esta agua es potable?", de: "Ist dieses Wasser trinkbar?", en: "Is this water drinkable?" },
      ],
    },
    {
      id: "pedir",
      icon: "🍽️",
      title: "Gesünder bestellen",
      titleEn: "Ordering more healthily",
      items: [
        { es: "¿Tiene algo vegetariano?", de: "Haben Sie etwas Vegetarisches?", en: "Do you have anything vegetarian?" },
        { es: "¿Me lo puede hacer a la plancha, no frito?", de: "Können Sie es mir gegrillt machen, nicht frittiert?", en: "Could you do it grilled for me, not fried?" },
        { es: "Con ensalada, por favor.", de: "Mit Salat, bitte.", en: "With salad, please." },
        { es: "Sin azúcar, por favor.", de: "Ohne Zucker, bitte.", en: "Without sugar, please." },
        { es: "¿Qué lleva este plato?", de: "Was ist in diesem Gericht?", en: "What's in this dish?" },
        { es: "Para llevar, por favor.", de: "Zum Mitnehmen, bitte.", en: "To take away, please." },
      ],
    },
    {
      id: "deporte",
      icon: "🏋️",
      title: "Yoga, Gym & Bewegung",
      titleEn: "Yoga, gym & moving",
      items: [
        { es: "¿Tienen clases de yoga aquí?", de: "Bietet ihr hier Yoga-Kurse an?", en: "Do you have yoga classes here?" },
        { es: "¿Hay un gimnasio cerca?", de: "Gibt es ein Fitnessstudio in der Nähe?", en: "Is there a gym nearby?" },
        { es: "¿Venden pase por un día?", de: "Verkauft ihr einen Tagespass?", en: "Do you sell a day pass?" },
        { es: "¿Cuánto cuesta la entrada por un día?", de: "Wie viel kostet der Tageseintritt?", en: "How much is entry for one day?" },
        { es: "¿Puedo entrenar hoy sin ser socio?", de: "Kann ich heute trainieren, ohne Mitglied zu sein?", en: "Can I train today without being a member?" },
      ],
    },
    {
      id: "farmacia",
      icon: "💊",
      title: "Apotheke & Bauch",
      titleEn: "Pharmacy & stomach",
      items: [
        { es: "Necesito sales de rehidratación / suero.", de: "Ich brauche Rehydratationssalze / Elektrolytlösung.", en: "I need rehydration salts / an electrolyte solution." },
        { es: "¿Tiene algo para la diarrea?", de: "Haben Sie etwas gegen Durchfall?", en: "Do you have anything for diarrhoea?" },
        { es: "¿Tiene protector solar?", de: "Haben Sie Sonnencreme?", en: "Do you have sunscreen?" },
        { es: "Necesito repelente de mosquitos.", de: "Ich brauche Mückenschutz.", en: "I need mosquito repellent." },
        { es: "¿Tiene algo para el mal de altura?", de: "Haben Sie etwas gegen Höhenkrankheit?", en: "Do you have anything for altitude sickness?" },
        { es: "Necesito algo para el dolor de estómago.", de: "Ich brauche etwas gegen Bauchschmerzen.", en: "I need something for a stomach ache." },
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund um Essen, Trinken & Apotheke ----------
  const GLOSSARY = [
    { es: "la avena", de: "die Haferflocken", en: "oats / porridge oats" },
    { es: "la proteína", de: "das Protein / Eiweiß", en: "protein" },
    { es: "la fibra", de: "die Ballaststoffe", en: "fibre" },
    { es: "los frutos secos", de: "die Nüsse (Trockenfrüchte)", en: "nuts / dried fruit" },
    { es: "los frijoles / los porotos", de: "die Bohnen", en: "beans" },
    { es: "a la plancha", de: "gegrillt (auf der Platte)", en: "grilled (on the griddle)" },
    { es: "frito/a", de: "frittiert / gebraten", en: "fried" },
    { es: "sin azúcar", de: "ohne Zucker", en: "without sugar / sugar-free" },
    { es: "el suero / las sales de rehidratación", de: "die Elektrolyt-/Rehydratationslösung", en: "electrolyte / rehydration salts" },
    { es: "el agua potable", de: "das Trinkwasser", en: "drinking water" },
    { es: "el protector solar", de: "die Sonnencreme", en: "sunscreen" },
    { es: "el repelente", de: "der Mückenschutz", en: "(insect) repellent" },
    { es: "el mal de altura / el soroche", de: "die Höhenkrankheit", en: "altitude sickness" },
    { es: "la manzanilla", de: "die Kamille / der Kamillentee", en: "chamomile (tea)" },
    { es: "el gimnasio", de: "das Fitnessstudio", en: "the gym" },
    { es: "el pase diario / la entrada por un día", de: "der Tagespass / Tageseintritt", en: "the day pass / day entry" },
  ];

  // ---------- „Gesund-unterwegs-Kit": kleine Packliste (Icon + Sache + Warum) ----------
  const CHECKLIST = [
    { icon: "🥣", item: "Haferflocken & Proteinpulver", itemEn: "Oats & protein powder", why: "Schnelles, sattmachendes Frühstück ganz ohne Küche – Porridge in 2 Minuten.", whyEn: "A quick, filling breakfast with no kitchen at all – porridge in 2 minutes." },
    { icon: "🧂", item: "Elektrolytpulver (suero)", itemEn: "Electrolyte powder (suero)", why: "Gleicht Schwitzen und Durchfall aus – günstiger und gesünder als Softdrinks.", whyEn: "Makes up for sweating and diarrhoea – cheaper and healthier than soft drinks." },
    { icon: "🫗", item: "Zero-Sirup / Geschmackstropfen", itemEn: "Zero syrup / flavour drops", why: "Günstiges Wasser mit Geschmack – mehr Abwechslung, du trinkst mehr.", whyEn: "Cheap water with flavour – more variety, and you drink more." },
    { icon: "💧", item: "Wiederbefüllbare Flasche (+ Filter)", itemEn: "Refillable bottle (+ filter)", why: "Nachfüllen statt kaufen; Filter oder Tabletten, wo das Wasser unsicher ist.", whyEn: "Refill instead of buying; a filter or tablets where the water isn't safe." },
    { icon: "🥄", item: "Spork & Faltbecher", itemEn: "Spork & collapsible cup", why: "Deine Mini-Küche fürs Hostel – mehr braucht Porridge nicht.", whyEn: "Your mini-kitchen for the hostel – porridge needs no more than this." },
    { icon: "💊", item: "Bauch-Set", itemEn: "Stomach kit", why: "„Algo para la diarrea“, Rehydratationssalze und ggf. Probiotika für den Notfall.", whyEn: "„Algo para la diarrea“, rehydration salts and maybe probiotics for emergencies." },
    { icon: "🧴", item: "Sonnencreme & Repelente", itemEn: "Sunscreen & repellent", why: "Schutz vor Sonne (auch in der Höhe) und vor Mücken in Dengue-/Malariagebieten.", whyEn: "Protection from the sun (also at altitude) and from mosquitoes in dengue/malaria areas." },
    { icon: "🥜", item: "Nüsse & Obst als Snack", itemEn: "Nuts & fruit as a snack", why: "Protein, Ballaststoffe und Vitamine für unterwegs statt Chips.", whyEn: "Protein, fibre and vitamins on the go instead of crisps." },
  ];

  window.SC = window.SC || {};
  window.SC.salud = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
