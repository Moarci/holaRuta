/*
 * regatear.js  (SC.regatear) – Modul "Regatear: gut verhandeln & feilschen".
 * REINE DATEN, keine Logik (wie knigge.js / frases.js). Lädt vor app.js und
 * hängt sich an window.SC. Wird vom Feature-Modul SC.regateo (features/regateo.js) gerendert.
 *
 * Idee: auf Märkten in Lateinamerika ist Feilschen (regatear) normal und
 * erwünscht – aber es folgt Spielregeln. Das Modul erklärt erst die Taktik
 * (TIPS), gibt dann ein kleines Glossar (GLOSSARY) und die wichtigsten Sätze
 * nach Phasen (PHRASES) plus den Mengen-/Einheiten-Wortschatz (UNITS), zeigt
 * regionale Unterschiede (REGIONAL) und lässt zum Schluss anhand von
 * Rollenspielen (ROLEPLAYS) üben. Durchgängig LatAm-Spanisch.
 *
 * Schemas:
 *   INTRO    : string – kurze deutsche Einleitung über der Seite.
 *   TIPS     : [{ icon, title, intro, dos:[…], donts:[…] }]  – aufklappbar.
 *   GLOSSARY : [{ es, de }]  – Schlüsselwörter rund ums Feilschen.
 *   PHRASES  : [{ id, icon, title, items:[{ es, de }] }]  – nach Phase gruppiert.
 *   UNITS    : [{ es, de, ejemplo }]  – Maß-/Mengeneinheiten am Marktstand.
 *   REGIONAL : [{ flag, country, note }]  – kurze Besonderheit pro Land/Region.
 *   ROLEPLAYS: [{ id, title, level, roleA, roleB, situationDe, goalA, goalB,
 *                dialogue:[{ speaker:'A'|'B', es, de }], usefulPhrases:[es…] }]
 *
 * Hinweis: Preise/Bräuche sind Backpacker-Faustregeln, keine festen Regeln –
 * Ton und Gepflogenheiten unterscheiden sich von Land zu Land und von Stand zu
 * Stand. Im Zweifel zählt: freundlich bleiben, lächeln, fair handeln.
 */
(function () {
  "use strict";

  const INTRO =
    "Auf Märkten und bei Straßenständen ist Feilschen (regatear) normal – aber " +
    "freundlich und mit Spielregeln. Erst die Taktik, dann die Wörter und die " +
    "wichtigsten Sätze, regionale Unterschiede und zum Schluss üben im Rollenspiel.";

  const INTRO_EN =
    "At markets and street stalls, haggling (regatear) is normal – but it's done " +
    "in a friendly way and by certain rules. First the tactics, then the words and " +
    "the key phrases, regional differences, and finally some role-play practice.";

  // ---------- Erklärung: wie man gut verhandelt (aufklappbar, Knigge-Stil) ----------
  const TIPS = [
    {
      icon: "🤝",
      title: "Die Grundhaltung",
      titleEn: "The basic attitude",
      intro: "Feilschen ist in Lateinamerika ein freundliches Spiel, kein Streit. Wer lächelt und höflich bleibt, bekommt den besseren Preis.",
      introEn: "In Latin America haggling is a friendly game, not an argument. If you smile and stay polite, you get the better price.",
      dos: [
        "Zuerst grüßen: „Buenos días“, ein kurzer Smalltalk öffnet jeden Stand.",
        "Mit Humor und Lächeln bleiben – Sympathie senkt den Preis mehr als Härte.",
        "Den Verkäufer freundlich ansprechen: „amigo/a“, „caballero“, „seño“, „jefe/a“ oder (in den Anden) „casero/a“.",
        "Realistisch bleiben: ein fairer Rabatt ist das Ziel, nicht der Ruin des Standes.",
      ],
      dosEn: [
        "Greet them first: „Buenos días“, a bit of small talk opens any stall.",
        "Keep your humour and a smile – being likeable lowers the price more than being tough.",
        "Address the seller warmly: „amigo/a“, „caballero“, „seño“, „jefe/a“ or (in the Andes) „casero/a“.",
        "Stay realistic: a fair discount is the goal, not ruining the stall.",
      ],
      donts: [
        "Nicht aggressiv oder von oben herab auftreten – das blockiert sofort.",
        "Die Ware nicht schlechtmachen, um den Preis zu drücken; lieber sachlich bleiben.",
        "Nicht in Geschäften mit festen Preisen (Supermarkt, Apotheke, Kette) feilschen – dort heißt es „precio fijo“ und ist unüblich.",
      ],
      dontsEn: [
        "Don't come across as aggressive or condescending – that shuts things down at once.",
        "Don't run down the goods to push the price; better to stay matter-of-fact.",
        "Don't haggle in shops with fixed prices (supermarket, pharmacy, chains) – there it's „precio fijo“ and not the done thing.",
      ],
    },
    {
      icon: "🎯",
      title: "Die Verhandlung führen",
      titleEn: "Running the negotiation",
      intro: "Der erste genannte Preis ist fast nie der letzte. Frag nach, biete weniger, triff dich in der Mitte.",
      introEn: "The first price quoted is almost never the final one. Ask, offer less, meet in the middle.",
      dos: [
        "Erst nach dem Preis fragen, bevor du Interesse zeigst: „¿A cuánto?“ / „¿A cómo?“",
        "Den ersten Preis nie sofort annehmen – freundlich stutzen: „Uy, está caro.“",
        "Ein Gegenangebot machen (Anker): biete etwa die Hälfte bis zwei Drittel.",
        "Nach dem tiefsten Preis fragen: „¿Cuánto es lo menos?“",
        "Bei Menge bündeln: „¿Y si llevo tres?“ – mehrere Stücke bringen Rabatt.",
        "Bar und passend zahlen anbieten: „En efectivo, ¿me lo deja en…?“",
      ],
      dosEn: [
        "Ask the price first, before you show interest: „¿A cuánto?“ / „¿A cómo?“",
        "Never take the first price straight away – pause politely: „Uy, está caro.“",
        "Make a counter-offer (an anchor): offer roughly half to two thirds.",
        "Ask for the lowest price: „¿Cuánto es lo menos?“",
        "Bundle by quantity: „¿Y si llevo tres?“ – several items bring a discount.",
        "Offer to pay in cash and with the right change: „En efectivo, ¿me lo deja en…?“",
      ],
      donts: [
        "Nicht das erste Gegenangebot als Endpreis sehen – es gibt ein Hin und Her.",
        "Nicht zu tief einsteigen, das wirkt respektlos; bleib im realistischen Rahmen.",
        "Den Preis nicht nennen, den DU zahlen willst, bevor er seinen genannt hat.",
      ],
      dontsEn: [
        "Don't treat the first counter-offer as the final price – there's a bit of back and forth.",
        "Don't start too low, it comes across as disrespectful; stay within a realistic range.",
        "Don't name the price YOU want to pay before they've named theirs.",
      ],
    },
    {
      icon: "🚶",
      title: "Der Abschluss (und das Weggehen)",
      titleEn: "Closing the deal (and walking away)",
      intro: "Weggehen ist die stärkste Taktik – oft kommt der bessere Preis erst dann. Und ein Nein ist auch okay.",
      introEn: "Walking away is the strongest tactic – often the better price only comes then. And a no is fine too.",
      dos: [
        "Wenn der Preis nicht stimmt, freundlich gehen: „Lo voy a pensar, gracias.“",
        "Oft ruft man dich zurück: „¡Espera, te lo dejo en…!“ – dann ist der Deal da.",
        "Beim Ja klar bestätigen: „Listo, me lo llevo.“ und passend bezahlen.",
        "In den Anden ruhig nach dem Extra fragen: „¿Me da la yapa?“ (eine kleine Dreingabe).",
        "Auch ohne Kauf nett bleiben: „Gracias, muy amable.“ – man sieht sich wieder.",
      ],
      dosEn: [
        "If the price isn't right, leave politely: „Lo voy a pensar, gracias.“",
        "They'll often call you back: „¡Espera, te lo dejo en…!“ – and then the deal is on.",
        "When it's a yes, confirm clearly: „Listo, me lo llevo.“ and pay with the right change.",
        "In the Andes, feel free to ask for the little extra: „¿Me da la yapa?“ (a small freebie).",
        "Stay friendly even without buying: „Gracias, muy amable.“ – you'll see each other again.",
      ],
      donts: [
        "Nicht handeln, wenn du gar nicht kaufen willst – das gilt als unfair.",
        "Nach dem Handschlag-Preis nicht nochmal nachverhandeln – Wort gilt.",
        "Nicht beleidigt sein, wenn der Verkäufer Nein sagt; dann ist es sein letzter Preis.",
      ],
      dontsEn: [
        "Don't haggle if you have no intention of buying – that's considered unfair.",
        "Don't renegotiate once you've shaken on a price – your word stands.",
        "Don't take it personally if the seller says no; that's their final price.",
      ],
    },
    {
      icon: "🚕",
      title: "Taxi, Tuk-Tuk & Touren",
      titleEn: "Taxis, tuk-tuks & tours",
      intro: "Wo kein Taxameter läuft, wird der Preis vorher ausgemacht – nie erst am Ziel. Das vermeidet den „Touristenpreis“.",
      introEn: "Where there's no meter running, agree the price beforehand – never at the destination. That avoids the „tourist price“.",
      dos: [
        "Den Fahrpreis VOR dem Einsteigen aushandeln: „¿Cuánto me cobra al centro?“",
        "Eine Referenz nennen: „El otro me dijo treinta.“ – das drückt den Preis.",
        "Passend und in lokaler Währung zahlen; vorher fragen: „¿Tiene cambio?“",
        "Bei Touren den Preis pro Person und, was inklusive ist, klären: „¿Qué incluye?“",
      ],
      dosEn: [
        "Agree the fare BEFORE getting in: „¿Cuánto me cobra al centro?“",
        "Quote a reference: „El otro me dijo treinta.“ – that brings the price down.",
        "Pay with the right change and in local currency; ask first: „¿Tiene cambio?“",
        "For tours, sort out the price per person and what's included: „¿Qué incluye?“",
      ],
      donts: [
        "Nicht ohne ausgemachten Preis einsteigen, wenn es kein Taxameter gibt.",
        "Nicht mit großem Schein zahlen wollen – „no tengo cambio“ kostet dich den Rest.",
        "Touren nicht blind beim ersten Anbieter buchen – zwei, drei Preise vergleichen.",
      ],
      dontsEn: [
        "Don't get in without an agreed price when there's no meter.",
        "Don't try to pay with a big note – „no tengo cambio“ costs you the rest.",
        "Don't book tours blindly with the first operator – compare two or three prices.",
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund ums Feilschen ----------
  const GLOSSARY = [
    { es: "regatear", de: "feilschen, handeln", en: "to haggle, to bargain" },
    { es: "el regateo", de: "das Feilschen", en: "the haggling" },
    { es: "el descuento", de: "der Rabatt", en: "the discount" },
    { es: "la rebaja", de: "die Preissenkung", en: "the price reduction" },
    { es: "la oferta", de: "das (Sonder-)Angebot", en: "the (special) offer" },
    { es: "la ganga", de: "das Schnäppchen", en: "the bargain" },
    { es: "el precio fijo", de: "der Festpreis (kein Handeln)", en: "the fixed price (no haggling)" },
    { es: "caro / barato", de: "teuer / billig", en: "expensive / cheap" },
    { es: "en efectivo", de: "in bar", en: "in cash" },
    { es: "el vuelto / el cambio", de: "das Wechselgeld", en: "the change" },
    { es: "la yapa / la ñapa", de: "kleine Gratis-Dreingabe (Anden / Karibik)", en: "small free extra thrown in (Andes / Caribbean)" },
    { es: "el/la casero/a", de: "Stammkunde / -verkäufer (Anrede der Vertrautheit)", en: "regular customer / trader (friendly form of address)" },
  ];

  // ---------- Wichtige Sätze, nach Phase gruppiert ----------
  const PHRASES = [
    {
      id: "preguntar",
      icon: "💬",
      title: "Nach dem Preis fragen",
      titleEn: "Asking the price",
      items: [
        { es: "¿Cuánto cuesta?", de: "Wie viel kostet das?", en: "How much does it cost?" },
        { es: "¿Cuánto vale?", de: "Was kostet es? (wörtl. „was ist es wert“)", en: "How much is it? (lit. „what is it worth“)" },
        { es: "¿Qué precio tiene?", de: "Welchen Preis hat es?", en: "What's the price of it?" },
        { es: "¿A cuánto la unidad?", de: "Wie viel das Stück?", en: "How much each?" },
        { es: "¿A cómo está el kilo?", de: "Wie teuer ist das Kilo gerade?", en: "How much is the kilo going for?" },
        { es: "¿Cuál es el precio por la libra?", de: "Wie ist der Preis pro Pfund?", en: "What's the price per pound?" },
        { es: "¿Cuánto por todo?", de: "Wie viel für alles zusammen?", en: "How much for everything together?" },
      ],
    },
    {
      id: "regatear",
      icon: "🤏",
      title: "Feilschen & verhandeln",
      titleEn: "Haggling & bargaining",
      items: [
        { es: "Uy, está un poco caro.", de: "Oh, das ist ein bisschen teuer.", en: "Ooh, that's a bit pricey." },
        { es: "¿Me hace un descuento?", de: "Geben Sie mir einen Rabatt?", en: "Could you give me a discount?" },
        { es: "¿En cuánto me lo deja?", de: "Für wie viel lassen Sie es mir?", en: "What price will you let me have it for?" },
        { es: "¿No me lo deja más barato?", de: "Geht es nicht günstiger?", en: "Couldn't you make it cheaper?" },
        { es: "¿Cuánto es lo menos?", de: "Was ist der tiefste Preis?", en: "What's the lowest price?" },
        { es: "¿Y si llevo dos?", de: "Und wenn ich zwei nehme?", en: "And if I take two?" },
        { es: "Si me lo deja en cien, me lo llevo ya.", de: "Wenn Sie es mir für hundert lassen, nehme ich es sofort.", en: "If you let me have it for a hundred, I'll take it right now." },
        { es: "Es lo que tengo, en efectivo.", de: "Das ist, was ich habe – in bar.", en: "That's what I've got – in cash." },
      ],
    },
    {
      id: "cerrar",
      icon: "✅",
      title: "Abschluss",
      titleEn: "Closing",
      items: [
        { es: "Listo, me lo llevo.", de: "Abgemacht, ich nehme es.", en: "Done, I'll take it." },
        { es: "Está bien, trato hecho.", de: "In Ordnung, abgemacht.", en: "All right, it's a deal." },
        { es: "Lo voy a pensar, gracias.", de: "Ich überlege es mir, danke. (höfliches Weggehen)", en: "I'll think about it, thanks. (a polite way to walk off)" },
        { es: "¿Me da la yapa?", de: "Geben Sie mir eine kleine Dreingabe? (Anden)", en: "Could you give me a little extra? (Andes)" },
        { es: "Gracias, muy amable.", de: "Danke, sehr nett.", en: "Thanks, very kind of you." },
      ],
    },
    {
      id: "pagar",
      icon: "💵",
      title: "Bezahlen & Wechselgeld",
      titleEn: "Paying & change",
      items: [
        { es: "¿Acepta tarjeta o solo efectivo?", de: "Nehmen Sie Karte oder nur bar?", en: "Do you take card or cash only?" },
        { es: "¿Cuánto es en total?", de: "Wie viel ist es insgesamt?", en: "How much is it altogether?" },
        { es: "¿Tiene cambio de cien?", de: "Haben Sie auf hundert raus?", en: "Have you got change for a hundred?" },
        { es: "¿Me da el vuelto, por favor?", de: "Geben Sie mir das Wechselgeld, bitte?", en: "Could you give me the change, please?" },
        { es: "¿Me da una bolsa, por favor?", de: "Geben Sie mir eine Tüte, bitte?", en: "Could you give me a bag, please?" },
      ],
    },
    {
      id: "buscar",
      icon: "🔎",
      title: "Finden & danach fragen",
      titleEn: "Finding & asking for things",
      items: [
        { es: "Amigo, ¿hay chancletas?", de: "Freund, gibt es Flip-Flops?", en: "Mate, do you have flip-flops?" },
        { es: "Amigo, ¿tienes chancletas?", de: "Freund, hast du Flip-Flops?", en: "Mate, have you got flip-flops?" },
        { es: "¿Dónde venden chancletas?", de: "Wo verkaufen sie Flip-Flops?", en: "Where do they sell flip-flops?" },
        { es: "¿Dónde consigo unas chancletas?", de: "Wo bekomme ich Flip-Flops her?", en: "Where can I get some flip-flops?" },
        { es: "¿Tiene otra talla / otro color?", de: "Haben Sie eine andere Größe / Farbe?", en: "Do you have another size / colour?" },
        { es: "¿Me lo puede mostrar?", de: "Können Sie es mir zeigen?", en: "Could you show it to me?" },
      ],
    },
  ];

  // ---------- Maß- & Mengeneinheiten (Wortschatz vom Marktstand) ----------
  const UNITS = [
    { es: "la unidad / la pieza", de: "das Stück (pieza eher in México)", en: "the item / each (pieza more in Mexico)", ejemplo: "¿A cuánto la unidad?" },
    { es: "la docena", de: "das Dutzend (12 Stück)", en: "the dozen (12)", ejemplo: "¿Cuánto cuesta la docena?" },
    { es: "la media docena", de: "das halbe Dutzend (6)", en: "the half dozen (6)", ejemplo: "Deme media docena." },
    { es: "el par", de: "das Paar (Schuhe, Socken)", en: "the pair (shoes, socks)", ejemplo: "¿A cuánto el par?" },
    { es: "la libra", de: "das Pfund (≈ 454 g)", en: "the pound (≈ 454 g)", ejemplo: "¿Cuánto vale la libra?" },
    { es: "el kilo", de: "das Kilo(gramm)", en: "the kilo(gram)", ejemplo: "Un kilo de tomates, por favor." },
    { es: "el medio kilo", de: "das halbe Kilo", en: "the half kilo", ejemplo: "Medio kilo de queso." },
    { es: "el cuarto", de: "das Viertel (≈ 250 g)", en: "the quarter (≈ 250 g)", ejemplo: "Un cuarto de jamón." },
    { es: "el litro", de: "der Liter (Flüssiges)", en: "the litre (liquids)", ejemplo: "Un litro de jugo." },
    { es: "el montón / la pila", de: "das Häufchen (Marktportion)", en: "the little pile (market portion)", ejemplo: "¿A cómo el montón?" },
    { es: "el atado / el manojo", de: "das Bündel (Kräuter, Gemüse)", en: "the bunch (herbs, veg)", ejemplo: "Un manojo de cilantro." },
    { es: "la bolsa", de: "die Tüte (als Menge)", en: "the bag (as a quantity)", ejemplo: "Una bolsa de naranjas." },
  ];

  // ---------- Regionale Unterschiede (kurz, eine Zeile je Land/Region) ----------
  const REGIONAL = [
    { flag: "🇲🇽", country: "México", note: "Auf Märkten und im „tianguis“ wird gehandelt, in Läden nicht. Typisch: „¿A cómo?“ und „¿Es lo menos?“.", noteEn: "At markets and the „tianguis“ you can haggle, but not in shops. Typical: „¿A cómo?“ and „¿Es lo menos?“." },
    { flag: "🇬🇹", country: "Guatemala", note: "Kunsthandwerksmärkte (Chichicastenango, Antigua) haben viel Spielraum – ruhig deutlich unter dem ersten Preis einsteigen.", noteEn: "Craft markets (Chichicastenango, Antigua) have a lot of room – feel free to start well below the first price." },
    { flag: "🇵🇪🇧🇴", country: "Perú & Bolivia", note: "Mit „casera/caserito“ ansprechen schafft Vertrauen; nach dem Kauf nach der „yapa“ (Dreingabe) fragen.", noteEn: "Addressing them as „casera/caserito“ builds trust; after buying, ask for the „yapa“ (the little extra)." },
    { flag: "🇨🇴", country: "Colombia", note: "Auf den „plazas de mercado“ wird gefeilscht: „¿Me hace una rebajita?“ – in Malls und Ketten nicht.", noteEn: "At the „plazas de mercado“ people haggle: „¿Me hace una rebajita?“ – but not in malls and chains." },
    { flag: "🇦🇷", country: "Argentina", note: "Wegen der Inflation ändern sich Preise schnell; auf „ferias“ geht „¿Me hacés un precio?“, sonst eher Festpreise.", noteEn: "Because of inflation, prices change fast; at „ferias“ you can try „¿Me hacés un precio?“, otherwise it's mostly fixed prices." },
    { flag: "🇨🇷", country: "Costa Rica", note: "Wenig Feilschen, Preise sind meist fix; auf der „feria del agricultor“ ist der Spielraum klein.", noteEn: "Little haggling, prices are mostly fixed; at the „feria del agricultor“ there's only a little room to negotiate." },
    { flag: "🇨🇺", country: "Cuba", note: "Auf Märkten und privat wird verhandelt – aber auf „Touristenpreise“ achten und am besten den lokalen Preis erfragen.", noteEn: "At markets and privately people negotiate – but watch out for „tourist prices“ and it's best to ask what the local price is." },
  ];

  // ---------- Rollenspiele zum Üben (Dialoge, wie data.ROLEPLAYS) ----------
  const ROLEPLAYS = [
    {
      id: "rg01",
      title: "Obst & Gemüse auf dem Markt",
      titleEn: "Fruit & veg at the market",
      level: 1,
      roleA: "Reisender",
      roleAEn: "Traveller",
      roleB: "Marktverkäuferin",
      roleBEn: "Market trader",
      situationDe: "Du stehst am Obst- und Gemüsestand und willst Tomaten und Orangen kaufen. Frag nach Preis und Menge, bevor du dich entscheidest.",
      situationEn: "You're at the fruit and veg stall and want to buy tomatoes and oranges. Ask about price and quantity before you decide.",
      goalA: "Grüße, frag nach dem Preis pro Kilo bzw. Stück, kauf eine Menge und lass dir eine Tüte geben.",
      goalAEn: "Say hello, ask the price per kilo or each, buy a quantity and get a bag.",
      goalB: "Begrüße freundlich, nenne die Preise, biete bei mehr Menge einen kleinen Rabatt und pack ein.",
      goalBEn: "Greet them warmly, state the prices, offer a small discount for a larger quantity and bag it up.",
      dialogue: [
        { speaker: "A", de: "Guten Morgen! Wie viel kostet das Kilo Tomaten?", en: "Good morning! How much is a kilo of tomatoes?", es: "¡Buenos días! ¿A cómo está el kilo de tomates?" },
        { speaker: "B", de: "Guten Morgen! Das Kilo kostet zwanzig.", en: "Good morning! The kilo is twenty.", es: "¡Buenos días! El kilo está a veinte." },
        { speaker: "A", de: "Und die Orangen, wie viel das Stück?", en: "And the oranges, how much each?", es: "¿Y las naranjas, a cuánto la unidad?" },
        { speaker: "B", de: "Drei pro Stück, oder das Dutzend für dreißig.", en: "Three each, or thirty for a dozen.", es: "A tres la unidad, o la docena a treinta." },
        { speaker: "A", de: "Gut. Geben Sie mir ein Kilo Tomaten und ein halbes Dutzend Orangen.", en: "Good. Give me a kilo of tomatoes and half a dozen oranges.", es: "Bien. Deme un kilo de tomates y media docena de naranjas." },
        { speaker: "B", de: "Sehr gern. Sonst noch etwas?", en: "With pleasure. Anything else?", es: "Con mucho gusto. ¿Algo más?" },
        { speaker: "A", de: "Und wenn ich das ganze Dutzend Orangen nehme?", en: "And if I take the whole dozen oranges?", es: "¿Y si llevo la docena completa de naranjas?" },
        { speaker: "B", de: "Dann lasse ich dir das Dutzend für fünfundzwanzig.", en: "Then I'll let you have the dozen for twenty-five.", es: "Entonces te dejo la docena en veinticinco." },
        { speaker: "A", de: "Abgemacht, ich nehme alles. Geben Sie mir eine Tüte, bitte?", en: "Done, I'll take it all. Could you give me a bag, please?", es: "Trato hecho, me lo llevo todo. ¿Me da una bolsa, por favor?" },
        { speaker: "B", de: "Hier bitte. Das macht insgesamt fünfundvierzig.", en: "Here you go. That's forty-five altogether.", es: "Aquí tienes. En total son cuarenta y cinco." },
        { speaker: "A", de: "Hier, in bar. Vielen Dank!", en: "Here, in cash. Thank you very much!", es: "Aquí está, en efectivo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, schönen Tag noch!", en: "Thank you, have a lovely day!", es: "Gracias a ti, ¡que tengas buen día!" },
      ],
      usefulPhrases: ["¿A cómo está el kilo?", "¿A cuánto la unidad?", "la docena / media docena", "¿Y si llevo la docena completa?", "¿Me da una bolsa?", "Trato hecho, me lo llevo todo."],
    },
    {
      id: "rg02",
      title: "Souvenir feilschen (chancletas)",
      titleEn: "Haggling for a souvenir (chancletas)",
      level: 2,
      roleA: "Reisender",
      roleAEn: "Traveller",
      roleB: "Standverkäufer",
      roleBEn: "Stallholder",
      situationDe: "Auf dem Kunsthandwerksmarkt suchst du Flip-Flops. Der erste Preis ist zu hoch – verhandle freundlich, notfalls geh ein Stück weg.",
      situationEn: "At the craft market you're after some flip-flops. The first price is too high – haggle nicely, and walk off a bit if you have to.",
      goalA: "Frag nach den Flip-Flops und dem Preis, finde ihn zu teuer, mach ein Gegenangebot und einige dich.",
      goalAEn: "Ask about the flip-flops and the price, find it too expensive, make a counter-offer and settle.",
      goalB: "Nenne einen Startpreis, wehr dich erst, gib dann etwas nach und mach den Deal.",
      goalBEn: "Name a starting price, hold out at first, then give a little and close the deal.",
      dialogue: [
        { speaker: "A", de: "Hallo, Freund! Hast du Flip-Flops?", en: "Hi, mate! Have you got flip-flops?", es: "¡Hola, amigo! ¿Tienes chancletas?" },
        { speaker: "B", de: "Klar! Diese hier sind sehr gut, achtzig das Paar.", en: "Sure! These are really good, eighty a pair.", es: "¡Claro! Estas son muy buenas, ochenta el par." },
        { speaker: "A", de: "Oh, das ist ein bisschen teuer. Geht es günstiger?", en: "Ooh, that's a bit pricey. Couldn't you make it cheaper?", es: "Uy, está un poco caro. ¿No me lo deja más barato?" },
        { speaker: "B", de: "Es ist gute Qualität, mein Freund. Sechzig?", en: "It's good quality, my friend. Sixty?", es: "Es buena calidad, amigo. ¿Sesenta?" },
        { speaker: "A", de: "Was ist der tiefste Preis, wenn ich bar zahle?", en: "What's the lowest price if I pay cash?", es: "¿Cuánto es lo menos, si pago en efectivo?" },
        { speaker: "B", de: "Wie viel willst du denn geben?", en: "So how much do you want to give?", es: "¿Cuánto quieres dar?" },
        { speaker: "A", de: "Ich gebe dir vierzig, das ist, was ich habe.", en: "I'll give you forty, that's what I've got.", es: "Te doy cuarenta, es lo que tengo." },
        { speaker: "B", de: "Nein, mein Freund, da verliere ich. Fünfzig.", en: "No, my friend, I'd lose out at that. Fifty.", es: "No, amigo, ahí pierdo. Cincuenta." },
        { speaker: "A", de: "Hmm… ich überlege es mir, danke.", en: "Hmm… I'll think about it, thanks.", es: "Mmm… lo voy a pensar, gracias." },
        { speaker: "B", de: "Warte, warte! Für fünfundvierzig sind wir uns einig.", en: "Wait, wait! Let's settle on forty-five.", es: "¡Espera, espera! En cuarenta y cinco nos arreglamos." },
        { speaker: "A", de: "Abgemacht, ich nehme sie. Vielen Dank!", en: "Done, I'll take them. Thank you very much!", es: "Trato hecho, me las llevo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, viel Spaß damit!", en: "Thank you, enjoy them!", es: "Gracias a ti, ¡que las disfrutes!" },
      ],
      usefulPhrases: ["¿Tienes chancletas?", "Está un poco caro.", "¿No me lo deja más barato?", "¿Cuánto es lo menos?", "Es lo que tengo.", "Lo voy a pensar, gracias.", "En cuarenta y cinco nos arreglamos."],
    },
    {
      id: "rg03",
      title: "Erst suchen, dann handeln",
      titleEn: "First search, then haggle",
      level: 2,
      roleA: "Reisender",
      roleAEn: "Traveller",
      roleB: "Verkäuferin",
      roleBEn: "Seller",
      situationDe: "Du suchst einen Sonnenhut, weißt aber nicht, wo es ihn gibt. Frag dich durch, finde den Stand und handle einen Mengenrabatt aus.",
      situationEn: "You're looking for a sun hat but don't know where to find one. Ask around, find the stall and haggle for a quantity discount.",
      goalA: "Frag, wo es Hüte gibt, lass dir zwei zeigen und handle einen Preis für beide zusammen aus.",
      goalAEn: "Ask where there are hats, get two shown to you and haggle a price for the two together.",
      goalB: "Zeig den Weg bzw. die Ware, nenne den Stückpreis und gib bei zwei Stück nach.",
      goalBEn: "Show the way or the goods, give the price per item and give a bit if they take two.",
      dialogue: [
        { speaker: "A", de: "Entschuldigung, wo bekomme ich einen Sonnenhut her?", en: "Excuse me, where can I get a sun hat?", es: "Disculpe, ¿dónde consigo un sombrero para el sol?" },
        { speaker: "B", de: "Hier bei mir, schau mal. Welche Farbe magst du?", en: "Right here with me, take a look. What colour would you like?", es: "Aquí conmigo, mira. ¿De qué color lo quieres?" },
        { speaker: "A", de: "Können Sie mir den beigen und den braunen zeigen?", en: "Could you show me the beige one and the brown one?", es: "¿Me puede mostrar el beige y el café?" },
        { speaker: "B", de: "Natürlich. Jeder kostet fünfzig.", en: "Of course. Each one is fifty.", es: "Por supuesto. Cada uno cuesta cincuenta." },
        { speaker: "A", de: "Und wenn ich beide nehme, was kosten sie zusammen?", en: "And if I take both, how much for the two together?", es: "¿Y si llevo los dos, cuánto por todo?" },
        { speaker: "B", de: "Für beide… lasse ich dir neunzig.", en: "For both… I'll let you have them for ninety.", es: "Por los dos… te los dejo en noventa." },
        { speaker: "A", de: "Geht es für achtzig, in bar?", en: "Could you do eighty, in cash?", es: "¿Me los deja en ochenta, en efectivo?" },
        { speaker: "B", de: "Na gut, weil du zwei nimmst: fünfundachtzig.", en: "All right, since you're taking two: eighty-five.", es: "Está bien, porque llevas dos: ochenta y cinco." },
        { speaker: "A", de: "Abgemacht, ich nehme beide. Geben Sie mir eine Tüte?", en: "Done, I'll take both. Could you give me a bag?", es: "Trato hecho, me llevo los dos. ¿Me da una bolsa?" },
        { speaker: "B", de: "Hier bitte. Danke für den Einkauf!", en: "Here you go. Thanks for your purchase!", es: "Aquí tienes. ¡Gracias por tu compra!" },
        { speaker: "A", de: "Danke Ihnen, sehr nett!", en: "Thank you, very kind!", es: "Gracias a usted, ¡muy amable!" },
      ],
      usefulPhrases: ["¿Dónde consigo…?", "¿Me puede mostrar…?", "¿Y si llevo los dos?", "¿Cuánto por todo?", "¿Me los deja en…?", "Trato hecho, me llevo los dos."],
    },
    {
      id: "rg04",
      title: "Taxipreis aushandeln",
      titleEn: "Negotiating a taxi fare",
      level: 2,
      roleA: "Reisender",
      roleAEn: "Traveller",
      roleB: "Taxifahrer",
      roleBEn: "Taxi driver",
      situationDe: "Am Busbahnhof gibt es kein Taxameter. Handle den Preis ins Zentrum aus, BEVOR du einsteigst, und kläre das Wechselgeld.",
      situationEn: "There's no meter at the bus station. Negotiate the fare to the centre BEFORE you get in, and sort out the change.",
      goalA: "Frag nach dem Preis ins Zentrum, finde ihn zu hoch, nenne eine Referenz, einige dich und kläre das Wechselgeld.",
      goalAEn: "Ask the price to the centre, find it too high, quote a reference, settle and sort out the change.",
      goalB: "Nenne einen Startpreis, begründe ihn, gib etwas nach und bestätige den Deal.",
      goalBEn: "Name a starting price, justify it, give a little and confirm the deal.",
      dialogue: [
        { speaker: "A", de: "Guten Tag, wie viel berechnen Sie mir ins Zentrum?", en: "Hello, how much do you charge to the centre?", es: "Buenas, ¿cuánto me cobra al centro?" },
        { speaker: "B", de: "Ins Zentrum berechne ich Ihnen fünfzig.", en: "To the centre I'll charge you fifty.", es: "Al centro le cobro cincuenta." },
        { speaker: "A", de: "Oh, das kommt mir teuer vor. Der andere sagte mir dreißig.", en: "Ooh, that seems expensive. The other one told me thirty.", es: "Uy, me parece caro. El otro me dijo treinta." },
        { speaker: "B", de: "Es ist weit und gerade ist viel Verkehr, mein Herr.", en: "It's a long way and there's a lot of traffic right now, sir.", es: "Es que está lejos y ahorita hay mucho tráfico, señor." },
        { speaker: "A", de: "Lassen Sie es mir für fünfunddreißig?", en: "Could you do it for thirty-five?", es: "¿Me lo deja en treinta y cinco?" },
        { speaker: "B", de: "Vierzig, und wir fahren sofort los.", en: "Forty, and we set off right now.", es: "Cuarenta, y salimos ya." },
        { speaker: "A", de: "In Ordnung, vierzig. Bringen Sie mich zu dieser Adresse?", en: "All right, forty. Could you take me to this address?", es: "Está bien, cuarenta. ¿Me lleva a esta dirección?" },
        { speaker: "B", de: "Klar, steigen Sie ein. Haben Sie die genaue Adresse?", en: "Sure, hop in. Do you have the exact address?", es: "Claro, suba. ¿Tiene la dirección exacta?" },
        { speaker: "A", de: "Ja, sie ist hier auf der Karte. Haben Sie auf hundert raus?", en: "Yes, it's here on the map. Have you got change for a hundred?", es: "Sí, está aquí en el mapa. ¿Tiene cambio de cien?" },
        { speaker: "B", de: "Ja, kein Problem. In zehn Minuten sind wir da.", en: "Yes, no problem. We'll be there in ten minutes.", es: "Sí, no hay problema. Llegamos en diez minutos." },
        { speaker: "A", de: "Perfekt, vielen Dank!", en: "Perfect, thank you very much!", es: "Perfecto, ¡muchas gracias!" },
      ],
      usefulPhrases: ["¿Cuánto me cobra al centro?", "Me parece caro.", "El otro me dijo treinta.", "¿Me lo deja en treinta y cinco?", "¿Me lleva a esta dirección?", "¿Tiene cambio de cien?"],
    },
  ];

  window.SC = window.SC || {};
  window.SC.regatear = { INTRO, INTRO_EN, TIPS, GLOSSARY, PHRASES, UNITS, REGIONAL, ROLEPLAYS };
})();
