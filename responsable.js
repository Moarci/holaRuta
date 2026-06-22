/*
 * responsable.js  (SC.responsable) – Modul "Viaja responsable: leichter Fußabdruck".
 * REINE DATEN, keine Logik (wie salud.js / logistica.js / knigge.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderResponsable gerendert,
 * das dieselbe Sheet-Darstellung wie ui.renderSalud nutzt (gleiches Schema).
 *
 * Idee: Reisen hinterlässt Spuren – im besten Fall nur Fußabdrücke. Wer Müll
 * mitnimmt, lokale Betriebe stützt, Plastik vermeidet und Natur wie Kultur
 * respektiert, reist günstiger, näher dran und lässt Orte so zurück, wie er sie
 * gern vorfindet. Das Modul gibt die wichtigsten Gewohnheiten und die Sätze, um
 * sie unterwegs auch auf Spanisch umzusetzen (Mehrwegflasche auffüllen, ohne Tüte,
 * lokal kaufen, vor dem Foto fragen).
 *
 * Schemas (identisch zu salud.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }] – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Umwelt & lokal kaufen.
 *   CHECKLIST: [{ icon, item, why }] – „Wenig-Müll-Kit" (+ …En).
 */
(function () {
  "use strict";

  const INTRO =
    "Reisen hinterlässt Spuren – im besten Fall nur Fußabdrücke. Müll mitnehmen, " +
    "lokal kaufen, Plastik vermeiden und Natur wie Kultur respektieren: Das reist " +
    "günstiger, näher dran und lässt Orte so zurück, wie du sie gern vorfindest. " +
    "Erst die Gewohnheiten, dann die Sätze, um sie auch auf Spanisch umzusetzen.";

  const INTRO_EN =
    "Travel leaves traces – ideally just footprints. Take your rubbish, buy local, " +
    "avoid plastic and respect nature and culture: it's cheaper, more connected, and " +
    "leaves places the way you'd like to find them. First the habits, then the phrases " +
    "to put them into practice in Spanish.";

  // ---------- Erklärung: leichter Fußabdruck (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "♻️",
      title: "Keine Spuren hinterlassen",
      titleEn: "Leave no trace",
      intro: "Nimm mit, was du mitbringst. Gerade auf Wanderungen und an Stränden gibt es oft keine Mülleimer – also wandert der Müll zurück in den Rucksack.",
      introEn: "Take out what you bring in. On hikes and beaches there's often no bin – so your rubbish goes back into the backpack.",
      dos: [
        "Eine kleine Mülltüte dabeihaben und allen eigenen Müll mitnehmen.",
        "Auf markierten Wegen bleiben – Trampelpfade schaden der Vegetation.",
        "Zigarettenstummel, Obstschalen und Taschentücher gehören nicht in die Natur.",
        "Wenn du magst, beim Rausgehen ein paar fremde Stücke Müll mit aufsammeln.",
      ],
      dosEn: [
        "Carry a small rubbish bag and take out all your own waste.",
        "Stay on marked trails – shortcuts damage the vegetation.",
        "Cigarette butts, fruit peels and tissues don't belong in nature.",
        "If you like, pick up a few other pieces of litter on your way out.",
      ],
      donts: [
        "Müll nicht „nur dieses eine Mal“ liegen lassen oder vergraben.",
        "Nicht abseits der Wege abkürzen, auch nicht für das bessere Foto.",
        "Keine Steine, Muscheln oder Pflanzen als Souvenir mitnehmen.",
      ],
      dontsEn: [
        "Don't leave litter „just this once“ or bury it.",
        "Don't cut corners off the trail, not even for a better photo.",
        "Don't take stones, shells or plants as souvenirs.",
      ],
    },
    {
      icon: "🛍️",
      title: "Lokal kaufen & unterstützen",
      titleEn: "Buy & support local",
      intro: "Dein Geld wirkt am meisten, wenn es direkt bei den Menschen vor Ort landet: kleine Läden, Familienküchen, lokale Guides, handgemachtes Kunsthandwerk.",
      introEn: "Your money does the most good when it lands directly with local people: small shops, family kitchens, local guides, handmade crafts.",
      dos: [
        "In Familienrestaurants und an Marktständen essen statt in Ketten.",
        "Handgemachtes direkt bei den Kunsthandwerker:innen kaufen.",
        "Lokale Guides und kleine Touranbieter buchen.",
        "Fair zahlen – beim Feilschen den letzten Centavo nicht erzwingen.",
      ],
      dosEn: [
        "Eat in family restaurants and at market stalls instead of chains.",
        "Buy handmade goods directly from the artisans.",
        "Book local guides and small tour operators.",
        "Pay fairly – when haggling, don't squeeze out the last centavo.",
      ],
      donts: [
        "Nicht nur internationale Ketten ansteuern, wenn es lokale Optionen gibt.",
        "Kunsthandwerk nicht auf den letzten Peso herunterhandeln.",
        "Keine Produkte aus geschützten Tieren/Pflanzen kaufen (Muscheln, Felle, Korallen).",
      ],
      dontsEn: [
        "Don't head only for international chains when local options exist.",
        "Don't beat down handicrafts to the last peso.",
        "Don't buy products from protected animals/plants (shells, furs, corals).",
      ],
    },
    {
      icon: "💧",
      title: "Wasser & Plastik sparen",
      titleEn: "Save water & plastic",
      intro: "Einwegflaschen summieren sich schnell. Mit einer Mehrwegflasche und einem Filter/Tabletten kommst du fast überall an Trinkwasser – und sparst nebenbei Geld.",
      introEn: "Single-use bottles add up fast. With a reusable bottle and a filter/tablets you can get drinking water almost anywhere – and save money along the way.",
      dos: [
        "Mehrwegflasche auffüllen: viele Hostels und Cafés haben Wasserspender.",
        "Filter, Steripen oder Tabletten nutzen, wo Leitungswasser unsicher ist.",
        "Eigene Stofftasche dabeihaben und Plastiktüten ablehnen.",
        "Auf Strohhalm/Plastikbesteck verzichten: „sin pitillo, por favor“.",
      ],
      dosEn: [
        "Refill a reusable bottle: many hostels and cafés have water dispensers.",
        "Use a filter, Steripen or tablets where tap water isn't safe.",
        "Carry your own cloth bag and decline plastic bags.",
        "Skip the straw/plastic cutlery: „sin pitillo, por favor“.",
      ],
      donts: [
        "Nicht täglich neue Einwegflaschen kaufen, wenn Auffüllen geht.",
        "Plastiktüten nicht automatisch annehmen – meist brauchst du sie nicht.",
        "Wasser nicht verschwenden, gerade in trockenen Regionen.",
      ],
      dontsEn: [
        "Don't buy new single-use bottles daily when refilling is possible.",
        "Don't accept plastic bags automatically – usually you don't need them.",
        "Don't waste water, especially in dry regions.",
      ],
    },
    {
      icon: "🦜",
      title: "Natur, Tiere & Kultur respektieren",
      titleEn: "Respect nature, animals & culture",
      intro: "Wildtiere bleiben wild, Gemeinschaften bleiben Gastgeber. Abstand halten, vor Fotos fragen und sich an lokale Gepflogenheiten halten gehört zum guten Reisen dazu.",
      introEn: "Wildlife stays wild, communities stay hosts. Keep your distance, ask before photos and follow local customs – it's part of travelling well.",
      dos: [
        "Wildtiere aus der Distanz beobachten, nicht füttern oder anfassen.",
        "Vor Porträtfotos fragen: „¿Puedo tomar una foto?“",
        "In Dörfern und an heiligen Orten angemessen kleiden und leise sein.",
        "Angebote ablehnen, bei denen Tiere zur Schau gestellt werden.",
      ],
      dosEn: [
        "Watch wildlife from a distance, don't feed or touch it.",
        "Ask before taking portrait photos: „¿Puedo tomar una foto?“",
        "Dress appropriately and stay quiet in villages and sacred places.",
        "Decline offers that put animals on display.",
      ],
      donts: [
        "Keine Selfies mit gefangenen Wildtieren (Faultiere, Affen) – das fördert Tierleid.",
        "Menschen nicht ungefragt fotografieren.",
        "Keine heiligen Stätten betreten oder berühren, wo es nicht erlaubt ist.",
      ],
      dontsEn: [
        "No selfies with captive wild animals (sloths, monkeys) – it fuels animal suffering.",
        "Don't photograph people without asking.",
        "Don't enter or touch sacred sites where it isn't allowed.",
      ],
    },
  ];

  // ---------- Wichtige Sätze, nach Situation gruppiert ----------
  const PHRASES = [
    {
      id: "agua",
      icon: "💧",
      title: "Wasser & Plastik",
      titleEn: "Water & plastic",
      items: [
        { es: "¿Dónde puedo rellenar mi botella?", de: "Wo kann ich meine Flasche auffüllen?", en: "Where can I refill my bottle?" },
        { es: "¿Tienen agua para rellenar?", de: "Habt ihr Wasser zum Auffüllen?", en: "Do you have water for refills?" },
        { es: "Sin bolsa, gracias.", de: "Ohne Tüte, danke.", en: "No bag, thanks." },
        { es: "Sin pitillo, por favor.", de: "Ohne Strohhalm, bitte.", en: "No straw, please." },
        { es: "Traigo mi propia bolsa.", de: "Ich habe meine eigene Tasche dabei.", en: "I brought my own bag." },
      ],
    },
    {
      id: "local",
      icon: "🛍️",
      title: "Lokal kaufen",
      titleEn: "Buying local",
      items: [
        { es: "¿Esto es hecho a mano?", de: "Ist das handgemacht?", en: "Is this handmade?" },
        { es: "¿Es de aquí, de la zona?", de: "Ist das von hier aus der Region?", en: "Is it from here, local?" },
        { es: "¿Me recomienda un lugar local para comer?", de: "Können Sie mir ein lokales Lokal zum Essen empfehlen?", en: "Can you recommend a local place to eat?" },
        { es: "¿El guía es de la comunidad?", de: "Ist der Guide aus der Gemeinde?", en: "Is the guide from the community?" },
      ],
    },
    {
      id: "respeto",
      icon: "🙏",
      title: "Respekt & Fotos",
      titleEn: "Respect & photos",
      items: [
        { es: "¿Puedo tomar una foto?", de: "Darf ich ein Foto machen?", en: "May I take a photo?" },
        { es: "¿Le molesta si tomo una foto?", de: "Stört es Sie, wenn ich ein Foto mache?", en: "Do you mind if I take a photo?" },
        { es: "¿Dónde puedo botar la basura?", de: "Wo kann ich den Müll entsorgen?", en: "Where can I throw away the rubbish?" },
        { es: "¿Se puede reciclar aquí?", de: "Kann man hier recyceln?", en: "Can you recycle here?" },
      ],
    },
  ];

  // ---------- Schlüsselwörter (Umwelt & lokal) ----------
  const GLOSSARY = [
    { es: "la basura", de: "der Müll", en: "the rubbish" },
    { es: "reciclar", de: "recyceln", en: "to recycle" },
    { es: "la botella reutilizable", de: "die Mehrwegflasche", en: "the reusable bottle" },
    { es: "rellenar", de: "auffüllen", en: "to refill" },
    { es: "la bolsa de tela", de: "die Stofftasche", en: "the cloth bag" },
    { es: "el pitillo", de: "der Strohhalm (CO; popote in MX)", en: "the straw (CO; popote in MX)" },
    { es: "hecho a mano", de: "handgemacht", en: "handmade" },
    { es: "local", de: "lokal, von hier", en: "local, from here" },
    { es: "la comunidad", de: "die Gemeinde / Gemeinschaft", en: "the community" },
    { es: "el medio ambiente", de: "die Umwelt", en: "the environment" },
    { es: "la naturaleza", de: "die Natur", en: "nature" },
    { es: "el sendero", de: "der Wanderweg", en: "the trail" },
  ];

  // ---------- Wenig-Müll-Kit ----------
  const CHECKLIST = [
    {
      icon: "🍶",
      item: "Mehrwegflasche (am besten mit Filter)",
      itemEn: "Reusable bottle (ideally with a filter)",
      why: "Spart Geld und Berge von Einwegplastik; fast überall auffüllbar.",
      whyEn: "Saves money and piles of single-use plastic; refillable almost anywhere.",
    },
    {
      icon: "🛍️",
      item: "Faltbare Stofftasche",
      itemEn: "Foldable cloth bag",
      why: "Passt in jede Tasche und ersetzt Plastiktüten beim Einkauf.",
      whyEn: "Fits in any pocket and replaces plastic bags when shopping.",
    },
    {
      icon: "🗑️",
      item: "Kleine Mülltüte für unterwegs",
      itemEn: "Small rubbish bag for the trail",
      why: "Für Wanderungen und Strände ohne Mülleimer – alles kommt zurück.",
      whyEn: "For hikes and beaches without bins – everything comes back with you.",
    },
    {
      icon: "🧴",
      item: "Riff-/umweltfreundliche Sonnencreme & Seife",
      itemEn: "Reef-/eco-friendly sunscreen & soap",
      why: "Schont Korallen und Flüsse beim Baden – ohne aggressive Chemie.",
      whyEn: "Protects corals and rivers when you swim – without harsh chemicals.",
    },
    {
      icon: "🥢",
      item: "Eigenes Besteck / Becher (leicht)",
      itemEn: "Your own cutlery / cup (lightweight)",
      why: "Macht Einweg-Plastikbesteck und To-go-Becher überflüssig.",
      whyEn: "Makes single-use plastic cutlery and to-go cups unnecessary.",
    },
  ];

  window.SC = window.SC || {};
  window.SC.responsable = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
