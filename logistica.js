/*
 * logistica.js  (SC.logistica) – Modul "Logística de viaje: clever & sicher ankommen".
 * REINE DATEN, keine Logik (wie knigge.js / regatear.js / frases.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderLogistica gerendert.
 *
 * Idee: die praktischen Handgriffe rund um Ankommen & Unterwegssein, die kein
 * Sprachkurs lehrt, aber jeder Backpacker braucht – online kommen (SIM/eSIM),
 * an Bargeld kommen (wechseln & abheben), Geld/Wertsachen klug auf mehrere
 * Gepäckstücke aufteilen, das Gepäck per Tracker im Blick behalten und beim
 * Fliegen das Wichtigste ins Handgepäck packen, falls der große Rucksack nicht
 * (oder später) ankommt. Erst die Tipps (TOPICS), dann die Sätze, die du dafür
 * brauchst (PHRASES), ein kleines Glossar (GLOSSARY) und eine Packliste fürs
 * Handgepäck-Notfallset (CHECKLIST). Durchgängig LatAm-Spanisch.
 *
 * Schemas (spiegeln regatear.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string – kurze deutsche Einleitung über der Seite (+ INTRO_EN).
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }]  – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um SIM, Geld & Gepäck.
 *   CHECKLIST: [{ icon, item, why }]  – Handgepäck-Notfallset (+ …En).
 *
 * Hinweis: Es sind Backpacker-Faustregeln, keine festen Regeln – Anbieter,
 * Kurse, Gebühren und Airline-Vorgaben unterscheiden sich von Land zu Land und
 * ändern sich. Im Zweifel zählt: vorher prüfen, nichts an einem Ort bündeln,
 * freundlich nachfragen.
 */
(function () {
  "use strict";

  const INTRO =
    "Bevor es losgeht und gleich nach der Landung zählen ein paar praktische " +
    "Handgriffe: online kommen, an Bargeld kommen, Geld und Wertsachen klug auf " +
    "mehrere Gepäckstücke verteilen und das Gepäck im Blick behalten. Erst die " +
    "Tipps, dann die Sätze, die du dafür brauchst.";

  const INTRO_EN =
    "Before you set off and right after you land, a few practical moves make all " +
    "the difference: getting online, getting hold of cash, splitting money and " +
    "valuables sensibly across several bags, and keeping an eye on your luggage. " +
    "First the tips, then the phrases you need for them.";

  const INTRO_DEEN =
    "Bevor es losgeht und gleich nach der Landung zählen ein paar praktische " +
    "Handgriffe: online kommen, an Bargeld kommen, Geld und Wertsachen klug auf " +
    "mehrere Gepäckstücke verteilen und das Gepäck im Blick behalten. Erst die " +
    "Tipps, dann die englischen Sätze, die du dafür brauchst.";

  // ---------- Erklärung: die praktischen Handgriffe (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "lc:signal",
      title: "Online sein: SIM & eSIM",
      titleEn: "Getting online: SIM & eSIM",
      intro: "Eine lokale SIM (hier oft „chip“) ist meist viel billiger als Roaming. Am Flughafen ist es teurer – ein paar Schritte weiter im Laden oder im offiziellen Shop des Anbieters lohnt sich.",
      introEn: "A local SIM (often called „chip“ here) is usually far cheaper than roaming. At the airport it costs more – a few steps further into a shop or the provider's official store pays off.",
      introDeEn: "Eine lokale SIM ist meist viel billiger als Roaming – für längere Trips oft günstiger als eine reine Reise-eSIM. Am Flughafen ist es teurer; ein Shop in der Stadt oder der offizielle Laden des Anbieters (z. B. EE, Vodafone, Three) lohnt sich.",
      dos: [
        "Vorab prüfen, ob dein Handy entsperrt (desbloqueado) und SIM- bzw. eSIM-fähig ist.",
        "Anbieter mit guter Netzabdeckung wählen (z. B. Claro, Movistar, Tigo, Entel, WOM – je nach Land).",
        "Pass mitnehmen: zum Registrieren der SIM wird er oft verlangt.",
        "Das Datenpaket gleich aktivieren lassen und VOR dem Verlassen des Ladens testen (öffnet Maps/WhatsApp?).",
        "Eine eSIM (Airalo, Holafly o. Ä.) vorab kaufen, wenn du sofort bei der Landung online sein willst.",
        "Die PIN/PUK und die Nummer notieren – fürs Aufladen (recarga) und Entsperren.",
      ],
      dosDeEn: [
        "Vorab prüfen, ob dein Handy entsperrt (unlocked) und SIM- bzw. eSIM-fähig ist.",
        "Anbieter mit guter Netzabdeckung wählen (z. B. EE, Vodafone, Three in UK; AT&T, T-Mobile in den USA; Telstra in Australien).",
        "Ausweis/Pass griffbereit haben – beim Kauf mancherorts verlangt.",
        "Das Datenpaket gleich aktivieren lassen und VOR dem Verlassen des Ladens testen (öffnet Maps/WhatsApp?).",
        "Eine eSIM (Airalo, Holafly o. Ä.) vorab kaufen, wenn du sofort bei der Landung online sein willst.",
        "Die PIN/PUK und die Nummer notieren – fürs Aufladen (top-up) und Entsperren.",
      ],
      dosEn: [
        "Check beforehand that your phone is unlocked (desbloqueado) and SIM- or eSIM-capable.",
        "Pick a provider with good coverage (e.g. Claro, Movistar, Tigo, Entel, WOM – depending on the country).",
        "Bring your passport: it's often required to register the SIM.",
        "Have the data plan activated on the spot and test it BEFORE leaving the shop (does Maps/WhatsApp open?).",
        "Buy an eSIM (Airalo, Holafly etc.) in advance if you want to be online the moment you land.",
        "Note down the PIN/PUK and the number – for topping up (recarga) and unlocking.",
      ],
      donts: [
        "Nicht die teure SIM direkt am Airport-Schalter nehmen, wenn es im Ort günstiger geht.",
        "PIN/PUK der Karte nicht wegwerfen – heb sie auf.",
        "Nicht ohne Datentest gehen – sonst stehst du draußen ohne Netz da.",
      ],
      dontsEn: [
        "Don't grab the pricey SIM right at the airport counter if it's cheaper in town.",
        "Don't throw away the card's PIN/PUK – keep them.",
        "Don't leave without testing the data – otherwise you're outside with no signal.",
      ],
    },
    {
      icon: "lc:wallet",
      title: "Geld wechseln & abheben",
      titleEn: "Changing & withdrawing money",
      intro: "Bargeld ist in Lateinamerika oft König. Wechsle nur eine kleine Menge am Flughafen (schlechter Kurs) und hol den Rest am Geldautomaten (cajero) oder in einer seriösen Wechselstube (casa de cambio).",
      introEn: "Cash is often king in Latin America. Change only a small amount at the airport (poor rate) and get the rest from an ATM (cajero) or a reputable exchange office (casa de cambio).",
      introDeEn: "In UK, USA & Co. zahlst du fast alles mit Karte – aber etwas Bargeld (Pfund/Dollar) schadet nie. Wechsle nur eine kleine Menge am Flughafen (schlechter Kurs) und hol den Rest am Geldautomaten (ATM, in UK „cash machine“) oder in einer seriösen Wechselstube.",
      dos: [
        "Eine kleine Menge Landeswährung schon dabeihaben oder am Airport wechseln – fürs Taxi/den Bus.",
        "Am cajero den Betrag in Landeswährung abheben und „ohne Umrechnung“ (sin conversión) wählen – der Kurs deiner Bank ist besser.",
        "Auf Gebühren achten: manche Automaten nehmen comisión; lieber einen größeren Betrag auf einmal holen.",
        "Den Kurs vorher grob kennen (App) und in der casa de cambio nachrechnen.",
        "Scheine gleich prüfen und um kleinere Scheine bitten – große sind schwer loszuwerden.",
      ],
      dosDeEn: [
        "Etwas Landeswährung (Pfund/Dollar) schon dabeihaben oder am Airport wechseln – fürs Taxi/den Bus.",
        "Am Automaten in Landeswährung abheben und „ohne Umrechnung“ (without conversion) wählen – der Kurs deiner Bank ist besser.",
        "Auf Gebühren achten: manche Automaten nehmen eine Gebühr; lieber einen größeren Betrag auf einmal holen.",
        "Den Kurs vorher grob kennen (App) und in der Wechselstube nachrechnen.",
        "Scheine gleich prüfen und um kleinere Scheine bitten – große sind schwer loszuwerden.",
      ],
      dosEn: [
        "Have a little local currency on you already, or change some at the airport – for the taxi/bus.",
        "At the ATM, withdraw in local currency and choose „without conversion“ (sin conversión) – your own bank's rate is better.",
        "Watch the fees: some ATMs charge comisión; better to take out one larger amount at once.",
        "Know the rough rate beforehand (an app) and double-check it at the casa de cambio.",
        "Check the notes straight away and ask for smaller ones – big notes are hard to break.",
      ],
      donts: [
        "Nicht auf der Straße bei „cambistas“ mit Traumkursen wechseln – Falschgeld und Trickbetrug.",
        "Am Automaten nie „mit Umrechnung“ (con conversión / DCC) bestätigen – das ist teurer.",
        "Nicht den ganzen Bargeldbedarf auf einmal mit dir herumtragen.",
      ],
      dontsDeEn: [
        "Nicht bei dubiosen Straßenwechslern mit Traumkursen wechseln – Falschgeld und Trickbetrug.",
        "Am Automaten nie „mit Umrechnung“ (with conversion / DCC) bestätigen – das ist teurer.",
        "Nicht den ganzen Bargeldbedarf auf einmal mit dir herumtragen.",
      ],
      dontsEn: [
        "Don't change money in the street with „cambistas“ offering dream rates – fake notes and scams.",
        "Never confirm „with conversion“ (con conversión / DCC) at the ATM – it's more expensive.",
        "Don't carry all the cash you'll need around with you at once.",
      ],
    },
    {
      icon: "lc:lock",
      title: "Geld & Wertsachen aufteilen",
      titleEn: "Splitting up money & valuables",
      intro: "Nie alles an einem Ort. Verteile Bargeld, Karten und Kopien auf mehrere Gepäckstücke und Verstecke – wird eins geklaut oder geht verloren, bist du nicht blank.",
      introEn: "Never everything in one place. Spread cash, cards and copies across several bags and hiding spots – if one is stolen or lost, you're not left with nothing.",
      dos: [
        "Bargeld splitten: etwas am Körper (Geldgürtel/Brustbeutel), etwas im Tagesrucksack, eine Reserve tief im großen Rucksack.",
        "Eine Notreserve (Dollar/Euro) getrennt verstecken – z. B. in einer Socke, im Buch oder in der Handyhülle.",
        "Eine zweite Bankkarte getrennt von der ersten aufbewahren.",
        "Foto/Kopie von Pass & Karten offline und in der Cloud – plus die Sperr-Hotline der Bank notieren.",
        "Tagesbudget in die Hosentasche, den Rest sicher verstaut – so zückst du nie das ganze Bündel.",
      ],
      dosEn: [
        "Split your cash: some on you (money belt/neck pouch), some in the day pack, a reserve deep in the big backpack.",
        "Hide an emergency reserve (dollars/euros) separately – e.g. in a sock, a book or the phone case.",
        "Keep a second bank card apart from the first one.",
        "Photo/copy of passport & cards offline and in the cloud – plus note the bank's lost-card hotline.",
        "Day's budget in your trouser pocket, the rest stowed safely – so you never pull out the whole wad.",
      ],
      donts: [
        "Nicht Pass, alle Karten und das ganze Bargeld in einer Tasche bündeln.",
        "Wertsachen nicht sichtbar tragen (Schmuck, teures Handy, dicke Brieftasche).",
        "Die Notreserve nicht im selben Fach wie das Alltagsgeld lassen.",
      ],
      dontsEn: [
        "Don't bundle your passport, all your cards and all your cash in one bag.",
        "Don't wear valuables on show (jewellery, an expensive phone, a fat wallet).",
        "Don't keep the emergency reserve in the same pocket as your everyday money.",
      ],
    },
    {
      icon: "lc:map-pin",
      title: "Gepäck im Blick: Tracker",
      titleEn: "Keeping tabs on your luggage: a tracker",
      intro: "Ein Bluetooth-Tracker (AirTag, Samsung SmartTag, Tile o. Ä.) im großen Rucksack zeigt dir, wo dein Gepäck ist – Gold wert, wenn der Bus es woanders ablädt oder der Flieger es verliert.",
      introEn: "A Bluetooth tracker (AirTag, Samsung SmartTag, Tile etc.) in your big backpack shows you where your luggage is – worth its weight in gold if the bus drops it elsewhere or the plane loses it.",
      dos: [
        "Einen Tracker tief und versteckt ins aufgegebene Gepäck legen (nicht in Außentaschen).",
        "Vor der Reise koppeln und testen; Batterie frisch oder Akku geladen.",
        "Bei verlorenem Fluggepäck den Standort als Beleg fürs Personal nutzen („mi maleta está allí“).",
        "Einen zweiten kleinen Tracker in den Tagesrucksack oder ans Schlüsselbund.",
      ],
      dosDeEn: [
        "Einen Tracker tief und versteckt ins aufgegebene Gepäck legen (nicht in Außentaschen).",
        "Vor der Reise koppeln und testen; Batterie frisch oder Akku geladen.",
        "Bei verlorenem Fluggepäck den Standort als Beleg fürs Personal nutzen („my bag is right here“).",
        "Einen zweiten kleinen Tracker in den Tagesrucksack oder ans Schlüsselbund.",
      ],
      dosEn: [
        "Put a tracker deep and hidden in your checked luggage (not in outside pockets).",
        "Pair and test it before the trip; fresh battery or charged up.",
        "If your checked bag goes missing, use the location as proof for staff („mi maleta está allí“).",
        "A second small tracker in the day pack or on the keyring.",
      ],
      donts: [
        "Den Tracker nicht außen anbringen, wo er leicht entfernt wird.",
        "Dich nicht allein darauf verlassen – ein Tracker zeigt die Position, holt das Gepäck aber nicht zurück.",
        "Airline-Hinweise zur Knopfzelle beachten (Tracker sind in der Regel erlaubt, aber kurz prüfen).",
      ],
      dontsEn: [
        "Don't attach the tracker on the outside where it's easily removed.",
        "Don't rely on it alone – a tracker shows the position but won't bring the luggage back.",
        "Mind the airline's notes on the button battery (trackers are usually allowed, but check briefly).",
      ],
    },
    {
      icon: "lc:plane",
      title: "Beim Fliegen: das Wichtigste ins Handgepäck",
      titleEn: "When flying: the essentials in your carry-on",
      intro: "Aufgegebenes Gepäck kommt manchmal später – oder gar nicht. Pack das Wichtigste ins Handgepäck, damit du 1–2 Tage ohne den großen Rucksack überstehst. Die Packliste dazu steht unten.",
      introEn: "Checked luggage sometimes arrives late – or not at all. Pack the essentials in your carry-on so you can get through 1–2 days without the big backpack. The packing list is below.",
      dos: [
        "Wichtige (vor allem verschreibungspflichtige) Medikamente IMMER ins Handgepäck.",
        "Einen Satz Wechselwäsche, Mini-Hygiene und ein frisches Oberteil dabei.",
        "Pass, Karten, Bargeld und Kopien gehören nie in den aufgegebenen Rucksack.",
        "Powerbank, Ladekabel und Elektronik ins Handgepäck (Powerbank im Frachtraum verboten).",
        "Den Gepäckschein (talón/etiqueta) gut aufheben – ohne ihn keine Verlustmeldung.",
      ],
      dosDeEn: [
        "Wichtige (vor allem verschreibungspflichtige) Medikamente IMMER ins Handgepäck.",
        "Einen Satz Wechselwäsche, Mini-Hygiene und ein frisches Oberteil dabei.",
        "Pass, Karten, Bargeld und Kopien gehören nie in den aufgegebenen Rucksack.",
        "Powerbank, Ladekabel und Elektronik ins Handgepäck (Powerbank im Frachtraum verboten).",
        "Den Gepäckschein (baggage tag / claim tag) gut aufheben – ohne ihn keine Verlustmeldung.",
      ],
      dosEn: [
        "Important (especially prescription) medication ALWAYS in your carry-on.",
        "A change of underwear, mini toiletries and a fresh top with you.",
        "Passport, cards, cash and copies never go in the checked backpack.",
        "Power bank, charging cable and electronics in the carry-on (power banks are banned in the hold).",
        "Keep the baggage tag (talón/etiqueta) safe – without it there's no lost-luggage report.",
      ],
      donts: [
        "Keine Flüssigkeiten über 100 ml ins Handgepäck (Reisegrößen nehmen).",
        "Brille/Kontaktlinsen und Wertsachen nicht aufgeben.",
        "Den großen Rucksack nicht überladen – das Notfallset gehört zu dir, nicht in den Frachtraum.",
      ],
      dontsEn: [
        "No liquids over 100 ml in the carry-on (take travel sizes).",
        "Don't check in your glasses/contact lenses or valuables.",
        "Don't overload the big backpack – the emergency kit stays with you, not in the hold.",
      ],
    },
    {
      icon: "lc:calendar",
      title: "Vorausplanen: Hostels & Transport",
      titleEn: "Planning ahead: hostels & transport",
      intro: "In manchen Regionen und zu Stoßzeiten ist das Angebot knapp – oder die bekannten Top-Hostels sind schnell weg. Dann lohnt es sich, früher zu buchen statt auf gut Glück anzukommen.",
      introEn: "In some regions and at peak times beds are scarce – or the well-known top hostels sell out fast. Then it pays to book earlier rather than turning up and hoping for the best.",
      dos: [
        "In Hotspots und zur Hochsaison (Patagonien, Cusco/Machu Picchu, Inseln, Festivals) Betten und Touren Tage bis Wochen vorher sichern.",
        "Sehr beliebte oder bekannte Hostels früh buchen – die sind oft als Erste ausgebucht.",
        "Die erste Nacht nach einer langen Anreise immer vorab buchen (müde ankommen und erst suchen ist mies).",
        "Nachtbusse und Fähren mit begrenzten Plätzen rechtzeitig reservieren.",
      ],
      dosDeEn: [
        "In Hotspots und zur Hochsaison (z. B. schottische Highlands, Lake District, Nationalparks in den USA, Festivals) Betten und Touren Tage bis Wochen vorher sichern.",
        "Sehr beliebte oder bekannte Hostels früh buchen – die sind oft als Erste ausgebucht.",
        "Die erste Nacht nach einer langen Anreise immer vorab buchen (müde ankommen und erst suchen ist mies).",
        "Nachtbusse und Fähren mit begrenzten Plätzen rechtzeitig reservieren.",
      ],
      dosEn: [
        "In hotspots and high season (Patagonia, Cusco/Machu Picchu, islands, festivals) secure beds and tours days to weeks ahead.",
        "Book very popular or famous hostels early – they're often the first to sell out.",
        "Always book the first night after a long journey in advance (arriving tired and then hunting is miserable).",
        "Reserve night buses and ferries with limited seats in good time.",
      ],
      donts: [
        "Nicht überall vorbuchen – abseits der Hotspots flexibel bleiben spart Geld und Freiheit.",
        "Nicht ohne Plan mitten in der Hochsaison an einem Hotspot ankommen.",
        "Sich nicht nur auf Laufkundschaft verlassen, wenn ein Ort als „immer voll“ bekannt ist.",
      ],
      dontsEn: [
        "Don't pre-book everywhere – away from the hotspots, staying flexible saves money and freedom.",
        "Don't arrive at a hotspot in peak season with no plan.",
        "Don't rely on walk-ins alone when a place is known for being „always full“.",
      ],
    },
  ];

  // ---------- Wichtige Sätze, nach Thema gruppiert (es / de / en) ----------
  const PHRASES = [
    {
      id: "sim",
      icon: "lc:signal",
      title: "SIM-Karte & online sein",
      titleEn: "SIM card & getting online",
      items: [
        { es: "¿Dónde venden chips / tarjetas SIM?", de: "Wo verkaufen sie SIM-Karten?", en: "Where can I buy a SIM card?" },
        { es: "Quiero una SIM con datos, por favor.", de: "Ich möchte eine SIM mit Datenvolumen, bitte.", en: "I'd like a SIM with data, please." },
        { es: "¿Cuánto cuesta un plan con datos?", de: "Wie viel kostet ein Datentarif?", en: "How much is a data plan?" },
        { es: "¿Cuántos gigas trae?", de: "Wie viel Datenvolumen ist dabei?", en: "How much data does it include?" },
        { es: "¿Me la puede activar aquí?", de: "Können Sie sie mir hier aktivieren?", en: "Could you activate it for me here?" },
        { es: "¿Funciona en todo el país?", de: "Funktioniert sie im ganzen Land?", en: "Does it work all over the country?" },
        { es: "¿Necesita mi pasaporte para registrarla?", de: "Brauchen Sie meinen Pass, um sie zu registrieren?", en: "Do you need my passport to register it?" },
        { es: "¿Dónde puedo recargar saldo?", de: "Wo kann ich Guthaben aufladen?", en: "Where can I top up my credit?" },
      ],
    },
    {
      id: "dinero",
      icon: "lc:wallet",
      title: "Geld wechseln & abheben",
      titleEn: "Changing & withdrawing money",
      items: [
        { es: "¿Dónde hay un cajero automático?", de: "Wo gibt es einen Geldautomaten?", en: "Where can I find an ATM?" },
        { es: "¿Dónde puedo cambiar dólares / euros?", de: "Wo kann ich Dollar/Euro wechseln?", en: "Where can I change dollars/euros?" },
        { es: "¿A cómo está el cambio hoy?", de: "Wie ist der Wechselkurs heute?", en: "What's the exchange rate today?" },
        { es: "¿Cobran comisión?", de: "Berechnen Sie eine Gebühr?", en: "Do you charge a commission?" },
        { es: "Quiero sacar efectivo.", de: "Ich möchte Bargeld abheben.", en: "I'd like to withdraw cash." },
        { es: "En moneda local, por favor, sin conversión.", de: "In Landeswährung, bitte, ohne Umrechnung.", en: "In local currency, please, without conversion." },
        { es: "¿Me puede dar billetes más pequeños?", de: "Können Sie mir kleinere Scheine geben?", en: "Could you give me smaller notes?" },
        { es: "¿Aceptan tarjeta o solo efectivo?", de: "Nehmen Sie Karte oder nur bar?", en: "Do you take card or cash only?" },
      ],
    },
    {
      id: "equipaje",
      icon: "lc:plane",
      title: "Flughafen & verlorenes Gepäck",
      titleEn: "Airport & lost luggage",
      items: [
        { es: "Mi maleta no llegó.", de: "Mein Koffer ist nicht angekommen.", en: "My suitcase didn't arrive." },
        { es: "Facturé esta mochila y no apareció.", de: "Ich habe diesen Rucksack aufgegeben und er ist nicht aufgetaucht.", en: "I checked in this backpack and it didn't show up." },
        { es: "¿Dónde reporto el equipaje perdido?", de: "Wo melde ich verlorenes Gepäck?", en: "Where do I report lost luggage?" },
        { es: "Aquí está mi talón de equipaje.", de: "Hier ist mein Gepäckschein.", en: "Here's my baggage tag." },
        { es: "Tengo un localizador en la maleta; está aquí.", de: "Ich habe einen Tracker im Koffer; er ist hier.", en: "I have a tracker in my suitcase; it's here." },
        { es: "¿Me lo pueden enviar al hotel?", de: "Können Sie ihn mir zum Hotel schicken?", en: "Can you send it to my hotel?" },
        { es: "¿Cuándo llega el próximo vuelo con mi equipaje?", de: "Wann kommt der nächste Flug mit meinem Gepäck?", en: "When does the next flight with my luggage arrive?" },
        { es: "Necesito lo básico para esta noche.", de: "Ich brauche das Nötigste für heute Nacht.", en: "I need the basics for tonight." },
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund um SIM, Geld & Gepäck ----------
  const GLOSSARY = [
    { es: "el chip / la SIM", de: "die SIM-Karte (LatAm: „chip“)", en: "the SIM card (LatAm: „chip“)", deDeEn: "die SIM-Karte", enDeEn: "the SIM card" },
    { es: "la recarga", de: "das Aufladen (von Prepaid-Guthaben)", en: "the top-up (of prepaid credit)" },
    { es: "el saldo", de: "das (Prepaid-)Guthaben", en: "the (prepaid) credit/balance" },
    { es: "los datos / los gigas", de: "das mobile Datenvolumen", en: "the mobile data" },
    { es: "desbloqueado/a", de: "entsperrt (Handy ohne SIM-Lock)", en: "unlocked (phone, no SIM lock)" },
    { es: "el cajero (automático)", de: "der Geldautomat", en: "the ATM" },
    { es: "la casa de cambio", de: "die Wechselstube", en: "the exchange office" },
    { es: "el tipo de cambio", de: "der Wechselkurs", en: "the exchange rate" },
    { es: "la comisión", de: "die Gebühr", en: "the fee/commission" },
    { es: "en efectivo", de: "in bar", en: "in cash" },
    { es: "sacar / retirar plata", de: "Geld abheben", en: "to withdraw money" },
    { es: "el equipaje de mano", de: "das Handgepäck", en: "the carry-on / hand luggage" },
    { es: "el equipaje facturado", de: "das aufgegebene Gepäck", en: "the checked luggage" },
    { es: "el talón / la etiqueta", de: "der Gepäckschein / -anhänger", en: "the baggage tag" },
    { es: "el localizador", de: "der (Gepäck-)Tracker", en: "the (luggage) tracker" },
  ];

  // ---------- Handgepäck-Notfallset: Packliste (Icon + Sache + Warum) ----------
  const CHECKLIST = [
    { icon: "lc:pill", item: "Wichtige Medikamente", itemEn: "Important medication", why: "Verschreibungspflichtiges und die Reiseapotheke gehören IMMER ins Handgepäck, nie in den aufgegebenen Rucksack.", whyEn: "Prescription meds and your first-aid kit ALWAYS go in the carry-on, never in the checked backpack." },
    { icon: "lc:shirt", item: "Wechselwäsche & Socken", itemEn: "Spare underwear & socks", why: "Ein bis zwei Sätze, falls der große Rucksack einen Tag später kommt.", whyEn: "One or two sets in case the big backpack arrives a day late." },
    { icon: "lc:brush", item: "Mini-Hygiene", itemEn: "Mini toiletries", why: "Zahnbürste, kleine Zahnpasta, Deo – Reisegrößen unter 100 ml.", whyEn: "Toothbrush, small toothpaste, deodorant – travel sizes under 100 ml." },
    { icon: "lc:shirt", item: "Frisches Oberteil", itemEn: "A fresh top", why: "Ein T-Shirt und etwas Warmes für die Klimaanlage oder eine kühle Ankunft.", whyEn: "A T-shirt and something warm for the air conditioning or a chilly arrival." },
    { icon: "lc:glasses", item: "Brille / Kontaktlinsen", itemEn: "Glasses / contact lenses", why: "Ohne sie geht nichts – plus Linsenlösung im Reiseformat.", whyEn: "You can't manage without them – plus lens solution in travel size." },
    { icon: "lc:battery-full", item: "Powerbank & Ladekabel", itemEn: "Power bank & charging cable", why: "Die Powerbank MUSS ins Handgepäck (im Frachtraum verboten).", whyEn: "The power bank MUST go in the carry-on (banned in the hold)." },
    { icon: "lc:stamp", item: "Pass, Karten & Bargeld", itemEn: "Passport, cards & cash", why: "Dokumente, Geld und Kopien nie aufgeben – immer am Körper bzw. im Handgepäck.", whyEn: "Never check in documents, money and copies – keep them on you or in the carry-on." },
    { icon: "lc:camera", item: "Wertsachen & Elektronik", itemEn: "Valuables & electronics", why: "Kamera, Laptop, Ersatzakku – nichts davon in den Frachtraum.", whyEn: "Camera, laptop, spare battery – none of it in the hold." },
    { icon: "lc:ear", item: "Zwei Packungen Ohrstöpsel", itemEn: "Two packs of earplugs", why: "In LatAm oft schwer zu finden, im Dorm und im Nachtbus aber Gold wert – guter Schlaf gibt dir die Energie für den Tag.", whyEn: "Often hard to find in LatAm, but worth their weight in gold in the dorm and on the night bus – good sleep gives you the energy for the day.", whyDeEn: "Im Dorm und im Nachtbus Gold wert – guter Schlaf gibt dir die Energie für den Tag." },
  ];

  window.SC = window.SC || {};
  window.SC.logistica = { INTRO, INTRO_EN, INTRO_DEEN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
