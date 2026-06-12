/*
 * knigge.js  (SC.knigge) – Modell für "Reise-Knigge: Verhalten unterwegs".
 * REINE DATEN, keine Logik (wie countries.js / frases.js). Wird von
 * ui.renderKnigge gerendert; der Controller (app.js) wählt per Dropdown ein
 * Land aus (geteilt mit der Länderkunde über state.countryId).
 *
 * TOPICS:  allgemeine DOs & Don'ts, die überall gelten (vier Themenblöcke).
 *   { id, icon, title, intro, dos:[…], donts:[…] }
 *   id  = Schlüssel, über den die landesspezifischen Akzente zugeordnet werden.
 *
 * ACCENTS: kurze, konkrete Besonderheit pro Land und Thema (1 Satz je Thema).
 *   { <countryId>: { hostel, bus, grupo, cultura } }  – Felder optional.
 *   countryId muss exakt der id aus countries.js LIST entsprechen.
 *
 * Hinweis: Inhalte sind Backpacker-Erfahrungswerte/Faustregeln – keine
 * verbindlichen Vorschriften. Im Zweifel zählt die Hausordnung vor Ort.
 */
(function () {
  "use strict";

  const TOPICS = [
    {
      id: "hostel",
      icon: "🛏️",
      title: "Hostel & Dorm",
      intro: "Im Schlafsaal teilst du den Raum mit Fremden – Rücksicht ist die halbe Miete.",
      dos: [
        "Nachtruhe ab ca. 22–23 Uhr: leise reden, kein grelles Deckenlicht – nutze die Handy-Taschenlampe.",
        "Wenn du früh los musst, packe deinen Rucksack schon am Vorabend, nicht im dunklen Dorm.",
        "Kopfhörer für Musik/Videos benutzen und das Handy auf lautlos stellen.",
        "Bring ein eigenes Schloss mit und schließ Wertsachen ins Locker (locker / casillero).",
        "Gemeinschaftsküche: sofort abspülen, Geschirr wegräumen, eigenes Essen im Kühlschrank beschriften.",
        "Stell dich kurz vor, wenn du ankommst – ein „Hola, soy nuevo aquí“ bricht das Eis.",
      ],
      donts: [
        "Kein Deckenlicht anschalten, wenn andere schlafen.",
        "Nachts nicht in Plastiktüten rascheln und keine Telefonate im Dorm führen.",
        "Fremde Betten, Handtücher oder Steckdosen-Plätze nicht einfach belegen – auch nicht zum Sitzen.",
        "Nasse oder stark riechende Kleidung nicht im Schlafsaal trocknen.",
        "Den Wecker nicht zigmal auf Schlummern stellen – einmal klingeln, aufstehen.",
      ],
    },
    {
      id: "bus",
      icon: "🚌",
      title: "Bus & Transport",
      intro: "Nachtbusse sparen eine Übernachtung – mit etwas Umsicht reist du sicher und entspannt.",
      dos: [
        "Wertsachen (Pass, Geld, Handy) immer am Körper tragen, nie im Gepäckfach oder über dem Sitz.",
        "Im Nachtbus Jacke, Schal oder Schlafsack-Inlett dabeihaben – die Klimaanlage läuft oft eiskalt.",
        "Ticket und Gepäckschein gut aufheben und die Endhaltestelle vorher kennen.",
        "Den Sitz nur sachte zurücklehnen und beim Aussteigen prüfen, ob das richtige Gepäck mitkommt.",
        "Bei kurzen Stopps fragen: „¿Cuánto tiempo paramos?“ – damit du den Bus nicht verpasst.",
      ],
      donts: [
        "Die Tasche nicht offen am Gang oder lose unter dem Sitz liegen lassen.",
        "Keine laute Musik ohne Kopfhörer; nicht den Sitznachbarn mit Gepäck oder Beinen zustellen.",
        "Wechselgeld und Tarif nicht blind vertrauen – vorab nach dem Fahrpreis fragen.",
        "Nachts nicht mit sichtbarem Handy/Laptop hantieren, vor allem nah an der Tür.",
      ],
    },
    {
      id: "grupo",
      icon: "👋",
      title: "Gruppen & Leute",
      intro: "Reisende sind offen – ein ehrliches „Hola“ öffnet fast überall Türen.",
      dos: [
        "Trau dich, anzusprechen: „¿De dónde eres?“ oder „¿Viajas solo/a?“ – Smalltalk ist normal und erwünscht.",
        "Frag, ob du mitkommen darfst: „¿Te unes?“ / „¿Vamos juntos?“ – statt dich einfach anzuhängen.",
        "Gemeinsame Pläne früh absprechen und Kosten fair & transparent teilen.",
        "Bei Gruppenaktivitäten Treffpunkt und Uhrzeit klar vereinbaren – und pünktlich sein.",
        "Kontakte sichern: „Escríbeme por WhatsApp“ – so bleibt man unterwegs in Verbindung.",
      ],
      donts: [
        "Sich niemandem aufdrängen, der sichtbar Ruhe oder Zeit für sich will.",
        "Keine versteckten Kosten – die Rechnung sauber und nachvollziehbar splitten.",
        "Niemanden zum Trinken, Feiern oder zu Ausgaben drängen.",
        "Nicht ständig nur in der eigenen Sprachblase bleiben – ein paar Brocken Spanisch öffnen mehr.",
      ],
    },
    {
      id: "cultura",
      icon: "🤝",
      title: "Kultur & Etikette",
      intro: "Kleine Gesten – Begrüßung, Trinkgeld, Pünktlichkeit – zeigen Respekt und werden gemerkt.",
      dos: [
        "Freundlich grüßen: „Buenos días / buenas tardes“ beim Betreten von Läden, Bussen oder Lokalen.",
        "„Por favor“ und „gracias“ großzügig benutzen – Höflichkeit zählt viel in Lateinamerika.",
        "Trinkgeld ~10 % im Restaurant geben, sofern nicht schon „servicio“ auf der Rechnung steht.",
        "Beim Feilschen freundlich und mit Humor bleiben – ein Lächeln bringt mehr als Härte.",
        "Lokale Gepflogenheiten beobachten und mitmachen, statt sie zu bewerten.",
        "Toilettenpapier in den Mülleimer (papelera) neben der Toilette werfen – in weiten Teilen Lateinamerikas sind die Rohre zu eng fürs WC (Schild: „No arrojar papeles ni toallas sanitarias“).",
      ],
      donts: [
        "Nicht mit der Tür ins Haus fallen – erst grüßen, dann fragen oder bestellen.",
        "Menschen, Häuser oder Märkte nicht ungefragt fotografieren.",
        "Heikle Themen (Politik, Drogen, Vergleiche mit den USA) zurückhaltend behandeln.",
        "Nicht überall hart verhandeln – in Geschäften mit festen Preisen ist Feilschen unüblich.",
        "Papier nicht ins WC werfen, wenn ein Eimer danebensteht – das verstopft die Leitungen sofort.",
      ],
    },
  ];

  // Landesspezifische Akzente – knapp gehalten, eine Zeile je Thema.
  const ACCENTS = {
    mexico: {
      hostel: "In Touristenorten (Tulum, Oaxaca, CDMX) sind Dorms voll – früh reservieren und beim Check-in nach den horas de silencio fragen.",
      bus: "Fernbusse (ADO, ETN) sind komfortabel und sicher; für Überland lieber diese als billige Minibusse, vor allem nachts.",
      grupo: "Locker im Ton: Mexikaner sagen gern „¿Qué onda?“ – mit „¡Órale!“ zeigst du, dass du dabei bist.",
      cultura: "Propina von 10–15 % ist im Restaurant Standard; Tacos am Stand zahlt man bar und passend.",
    },
    guatemala: {
      hostel: "In Antigua und am Lago Atitlán sind Hostels Backpacker-Treffpunkte – Wertsachen trotzdem immer ins Locker.",
      bus: "Die bunten „chicken buses“ (camionetas) sind günstig und ein Erlebnis, aber voll und nachts zu meiden; für lange Strecken Shuttle nehmen.",
      grupo: "Viele organisieren gemeinsam den Acatenango-Vulkan – frag im Hostel, da findet sich schnell eine Gruppe.",
      cultura: "In den Maya-Dörfern Menschen und Trachten nie ohne Erlaubnis fotografieren.",
    },
    honduras: {
      hostel: "Auf den Bay Islands (Utila, Roatán) drehen sich Hostels ums Tauchen – Ausrüstung sicher verstauen.",
      bus: "Für Strecken auf dem Festland Direktbusse (z. B. Hedman Alas) nehmen; nach Einbruch der Dunkelheit nicht überland fahren.",
      grupo: "Tauchkurse verbinden – über die offene Divemaster-Crew lernt man schnell Leute kennen.",
      cultura: "Sicherheit ernst nehmen: abends Taxi statt Fußweg, Wertsachen unsichtbar tragen.",
    },
    elsalvador: {
      hostel: "Surf-Hostels an der Küste (El Tunco, El Zonte) sind entspannt – Boards und Nasszeug draußen, nicht im Dorm.",
      bus: "Lokale Busse sind günstig, aber langsam; für längere Strecken Shuttle oder Sammeltaxi bevorzugen.",
      grupo: "In „Bitcoin Beach“ trifft sich eine internationale Szene – ideal, um beim Surfen Anschluss zu finden.",
      cultura: "Salvadorianer sind herzlich; ein einfaches „¡Buena onda!“ kommt gut an.",
    },
    nicaragua: {
      hostel: "In Granada und León sind Hostels mit Hängematten-Höfen die Norm – schön zum Leutetreffen, Wertsachen trotzdem wegschließen.",
      bus: "Auch hier fahren ausrangierte US-Schulbusse als günstige „chicken buses“; für Komfort und Sicherheit Shuttles nutzen.",
      grupo: "Vulkan-Boarding am Cerro Negro bucht man meist als Gruppe übers Hostel.",
      cultura: "Geduld bei „ahorita“ – Zeitangaben sind oft dehnbar, plane Puffer ein.",
    },
    costarica: {
      hostel: "Hostels sind sauber, aber teurer als in Nachbarländern; viele liegen am Strand – Sand draußen lassen.",
      bus: "Öffentliche Busse sind günstig und zuverlässig; Touristen-Shuttles sparen Zeit zwischen den Hotspots.",
      grupo: "„Pura vida“ ist Lebensgefühl und Floskel zugleich – damit knüpfst du sofort Kontakt.",
      cultura: "Ticos sind sehr umweltbewusst – Müll trennen und Natur/Tiere nie füttern oder anfassen.",
    },
    panama: {
      hostel: "In Panama City und Bocas del Toro sind Dorms oft klimatisiert – nachts wird's kühl, Decke dabeihaben.",
      bus: "In der Hauptstadt mit dem Metrobus (Tarjeta nötig); zu den San-Blas-Inseln per 4x4 + Boot über Veranstalter.",
      grupo: "Bocas ist Partyinsel – Bootstouren und Inselhüpfen organisiert man leicht in der Gruppe.",
      cultura: "US-Dollar ist offizielle Währung; Trinkgeld 10 % üblich, Wechselgeld passend bereithalten.",
    },
    cuba: {
      hostel: "Statt Hostels übernachtet man in „casas particulares“ (Privatzimmer) – respektiere, dass es ein Familienhaus ist.",
      bus: "Víazul-Busse verbinden Touristenstädte (im Voraus buchen); zwischendurch teilt man sich „colectivos“ (Sammeltaxis).",
      grupo: "Andere Reisende trifft man in der casa beim Frühstück – WLAN gibt's nur an öffentlichen Plätzen mit Karte.",
      cultura: "Zwei Währungswelten und knappe Waren: kleine Gastgeschenke (Stifte, Seife) werden geschätzt, Politik lieber meiden.",
    },
    "republica-dominicana": {
      hostel: "Außerhalb der All-inclusive-Zonen (Las Terrenas, Cabarete) gibt es entspannte Surf-/Backpacker-Hostels.",
      bus: "Komfortbusse (Caribe Tours, Metro) für Fernstrecken; lokal fahren „guaguas“ (Minibusse) – voll, aber günstig.",
      grupo: "Beim Kitesurfen in Cabarete findet man schnell Anschluss an die internationale Szene.",
      cultura: "Merengue und Bachata gehören dazu – eine Einladung zum Tanzen ist gut gemeint, ein Nein wird akzeptiert.",
    },
    "puerto-rico": {
      hostel: "In San Juan (Old San Juan, Condado) gibt es nur wenige echte Hostels – früh buchen, sie sind beliebt.",
      bus: "Öffentlicher Nahverkehr ist dünn; viele nutzen Mietwagen oder Apps wie Uber, vor allem außerhalb San Juans.",
      grupo: "Strände und der El-Yunque-Regenwald lassen sich gut als Gruppe per Mietwagen teilen (Kosten splitten).",
      cultura: "Englisch ist verbreitet, US-Dollar gilt; Trinkgeld 15–20 % wie in den USA erwartet.",
    },
    colombia: {
      hostel: "Cartagena, Medellín und die Zona Cafetera haben top Hostels; in Großstädten abends Wertsachen unsichtbar tragen.",
      bus: "Fernbusse sind gut, aber Strecken lang und kurvig – Reisetabletten helfen; Nachtbus spart eine Übernachtung.",
      grupo: "„No dar papaya“ heißt: keine Gelegenheit bieten – aber Kolumbianer sind extrem herzlich und hilfsbereit.",
      cultura: "Anrede oft förmlich mit „usted“, selbst unter Freunden; Trinkgeld („la propina“) wird meist erfragt.",
    },
    venezuela: {
      hostel: "Touristische Infrastruktur ist begrenzt; auf der Isla Margarita und in Mérida gibt es Posadas (Pensionen).",
      bus: "Überlandreisen gut planen und aktuelle Sicherheitslage prüfen – nachts möglichst nicht fahren.",
      grupo: "Reise möglichst nicht allein und schließ dich erfahrenen Gruppen/Guides an.",
      cultura: "Bargeld/Devisen-Situation ist komplex – vorab informieren und nur Nötiges sichtbar tragen.",
    },
    ecuador: {
      hostel: "Quito (Altstadt) und Baños haben gute Hostels; auf 2.800 m Höhe ist es nachts kalt – warme Decke nutzen.",
      bus: "Busnetz ist dicht und günstig; auf Taschen achten und Gepäck im Auge behalten, besonders an Terminals.",
      grupo: "Für den Quilotoa-Loop oder Dschungeltouren finden sich leicht Gruppen übers Hostel.",
      cultura: "In den Anden indigene Gemeinschaften respektvoll behandeln – fürs Fotografieren um Erlaubnis fragen; Toilettenpapier gehört fast überall in die papelera, nicht ins WC.",
    },
    peru: {
      hostel: "In Cusco (3.400 m) erst akklimatisieren – die erste Nacht ruhig angehen, viel Wasser, Coca-Tee hilft.",
      bus: "Cruz del Sur & Co. bieten sichere, bequeme Fernbusse mit Sitzkontrolle – für lange Strecken klar empfehlenswert.",
      grupo: "Den Salkantay-/Inca-Trek bucht man oft als Gruppe; Trekkingpartner findet man im Hostel.",
      cultura: "Auf Märkten ist moderates Feilschen okay; beim Essen „buen provecho“ wünschen kommt gut an.",
    },
    bolivia: {
      hostel: "La Paz und Uyuni liegen sehr hoch – langsam machen, warm anziehen, Dorms sind oft unbeheizt.",
      bus: "Nachtbusse sind günstig, aber Straßen rau und kalt – Schlafsack/Decke mitnehmen, seriösen Anbieter wählen.",
      grupo: "Die Salar-de-Uyuni-Tour (3 Tage) fährt man als Jeep-Gruppe – such dir Mitreisende vorher aus.",
      cultura: "In indigenen Regionen zurückhaltend fotografieren; cholitas reagieren oft empfindlich auf Kameras.",
    },
    chile: {
      hostel: "Hostels sind gut organisiert, aber teuer; in Patagonien (Torres del Paine) Plätze weit im Voraus sichern.",
      bus: "Fernbusse (z. B. Turbus, Pullman) sind komfortabel und pünktlich – Chile ist verlässlicher als viele Nachbarn.",
      grupo: "Für Patagonien-Treks („W“-Trek) Ausrüstung und Camps teilen – Gruppen senken Kosten deutlich.",
      cultura: "Chilenisches Spanisch ist schnell und voller Slang („¿cachái?“); ruhig nachfragen, das ist okay.",
    },
    argentina: {
      hostel: "In Buenos Aires startet das Nachtleben spät – Dorm-Mitbewohner kommen um 3–4 Uhr, also Ohrstöpsel parat.",
      bus: "Fernbusse („micros“) sind exzellent: „cama“ oder „cama-suite“ buchen für flache Sitze auf langen Strecken.",
      grupo: "Beim Asado (Grillen) und Mate-Teilen wird man schnell Teil der Runde – Mate kreisen lassen, nicht umrühren.",
      cultura: "Hier gilt Voseo (vos statt tú) und „che“ als Anrede; Begrüßung oft mit Wangenkuss, auch unter Männern.",
    },
    uruguay: {
      hostel: "In Montevideo und Punta del Este ruhig und sicher; in der Nebensaison sind viele Küsten-Hostels geschlossen.",
      bus: "Busnetz ist sauber, pünktlich und sicher – Tickets am Terminal (Tres Cruces) lösen.",
      grupo: "Strandorte wie La Paloma/Cabo Polonio sind klein und gesellig – man lernt sich von selbst kennen.",
      cultura: "Mate ist überall dabei (Thermoskanne unterm Arm); entspannter, formeller Umgangston, Trinkgeld ~10 %.",
    },
    paraguay: {
      hostel: "Wenig touristisch – in Asunción gibt es einige Hostels, sonst eher Pensionen; Hitze beachten (Ventilator/AC).",
      bus: "Fernbusse verbinden die größeren Städte; für den Chaco gute Planung und seriöse Anbieter wählen.",
      grupo: "Reisende sind selten – sei offen, dann ergeben sich Kontakte fast von allein.",
      cultura: "Guaraní wird neben Spanisch gesprochen; ein „mba'éichapa“ (Hallo auf Guaraní) sorgt für Begeisterung.",
    },
  };

  window.SC = window.SC || {};
  window.SC.knigge = { TOPICS, ACCENTS };
})();
