/*
 * banderas.js  (SC.banderas) – Modul „Banderas: Landesflaggen spielerisch lernen“.
 * REINE DATEN, keine Logik (wie juegos.js / salud.js / flirt.js). Lädt vor app.js
 * und hängt sich an window.SC. Zwei Verwendungen:
 *
 *   1) COUNTRIES – die eigentlichen Flaggen-Daten je Land (Emoji, Name ES/DE/EN,
 *      Region, Farben, Symbolik & ein Merk-Fakt). Speisen das interaktive
 *      Flaggen-Quiz und die „Galería“ (Durchblättern & Lernen) in
 *      features/banderas-game.js. So lernt man Flaggen spielerisch – beim Raten
 *      erscheint jedes Mal, wofür Farben und Symbole stehen.
 *
 *   2) Info-Modul-Schema (INTRO/TOPICS/PHRASES/GLOSSARY/CHECKLIST) – „Saber más“:
 *      Wissen zu Flaggen insgesamt (Vexillologie, Farben, gemeinsame Symbole
 *      Lateinamerikas, verwechselbare Flaggen, Etikette, Emoji-Flaggen). Wird vom
 *      Spiel über die gemeinsame moduleSheet-Darstellung (wie Juegos/Salud)
 *      gerendert – gleiches Schema, kein neuer Renderer.
 *
 * Fokus: die spanischsprachige Welt Amerikas + España, dazu Brasil als großer
 * Nachbar – genau die Länder, die HolaRuta-Reisende treffen. Inhalte recherchiert
 * und bewusst knapp gehalten: pro Land eine korrekte Symbolik-Zeile plus eine
 * Eselsbrücke/Anekdote, mit der man die Flagge sicher wiedererkennt.
 *
 * Schemas (identisch zu juegos.js, damit ui sie 1:1 rendern kann):
 *   COUNTRIES: [{ id, flag, es, de, en, region, capital, colors, colorsEn,
 *               sym, symEn, fact, factEn }]  – region ∈ {sur, centro, europa}.
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Info-Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], tips:[…] }] – aufklappbar (+ …En);
 *              dos = Fakten, tips = Merkhilfen (💡). Einige tragen ein spanisches
 *              Lesetraining (es/vocab/level).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – Sätze zu Herkunft.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Flaggen.
 *   CHECKLIST: [{ icon, item, why }] – Merk-Tricks (+ …En).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // ---------- Die Flaggen je Land (Quiz + Galería) ----------
  // region: "sur" = Sudamérica · "centro" = Centroamérica y el Caribe · "europa" = España
  const COUNTRIES = [
    // ----- Sudamérica -----
    {
      id: "ar", flag: "🇦🇷", es: "Argentina", de: "Argentinien", en: "Argentina",
      region: "sur", capital: "Buenos Aires", colors: "Hellblau · Weiß", colorsEn: "Light blue · White",
      sym: "Drei waagerechte Streifen in Himmelblau-Weiß-Himmelblau, in der Mitte die „Sol de Mayo“ – eine goldene Sonne mit Gesicht für die Mai-Revolution von 1810.",
      symEn: "Three horizontal stripes of sky-blue, white and sky-blue, with the „Sol de Mayo“ in the centre – a golden sun with a face, for the May Revolution of 1810.",
      fact: "Die Sonne hat ein Gesicht – das ist der „Inti“, die Sonne der Inka. Genau dieselbe Sonne trägt auch Uruguays Flagge.",
      factEn: "The sun has a face – it is „Inti“, the Inca sun. The very same sun appears on Uruguay's flag too.",
    },
    {
      id: "bo", flag: "🇧🇴", es: "Bolivia", de: "Bolivien", en: "Bolivia",
      region: "sur", capital: "Sucre / La Paz", colors: "Rot · Gelb · Grün", colorsEn: "Red · Yellow · Green",
      sym: "Rot-Gelb-Grün waagerecht, mit dem Staatswappen in der Mitte: Rot für das Blut der Helden, Gelb für die Bodenschätze, Grün für die fruchtbare Natur.",
      symEn: "Red-yellow-green horizontal bands with the state coat of arms: red for the heroes' blood, yellow for mineral wealth, green for fertile nature.",
      fact: "Bolivien hat zwei offizielle Flaggen: die Trikolore und die „Wiphala“, ein buntes Karomuster der indigenen Andenvölker.",
      factEn: "Bolivia has two official flags: the tricolour and the „Wiphala“, a colourful chequered emblem of the indigenous Andean peoples.",
    },
    {
      id: "cl", flag: "🇨🇱", es: "Chile", de: "Chile", en: "Chile",
      region: "sur", capital: "Santiago", colors: "Weiß · Blau · Rot", colorsEn: "White · Blue · Red",
      sym: "Oben weiß, unten rot, dazu ein blaues Eck mit einem weißen Stern: Weiß für den Schnee der Anden, Blau für den Himmel, Rot für das Blut, der Stern für Ehre und Fortschritt.",
      symEn: "White over red, with a blue canton bearing a white star: white for the Andean snow, blue for the sky, red for the blood, the star for honour and progress.",
      fact: "„La Estrella Solitaria“ – der einzelne Stern. Verwechslungsgefahr mit Texas, aber bei Chile ist der rote Streifen unten und breiter.",
      factEn: "„La Estrella Solitaria“ – the lone star. Easy to confuse with Texas, but on Chile the red band sits at the bottom and is wider.",
    },
    {
      id: "co", flag: "🇨🇴", es: "Colombia", de: "Kolumbien", en: "Colombia",
      region: "sur", capital: "Bogotá", colors: "Gelb · Blau · Rot", colorsEn: "Yellow · Blue · Red",
      sym: "Gelb (obere Hälfte), Blau und Rot: Gelb für den Reichtum und das Gold des Landes, Blau für die zwei Ozeane und Flüsse, Rot für das vergossene Blut.",
      symEn: "Yellow (the top half), blue and red: yellow for the country's wealth and gold, blue for the two oceans and rivers, red for the blood that was shed.",
      fact: "Merkhilfe: Das Gelb ist so wertvoll, dass es die halbe Flagge einnimmt – die anderen beiden Farben teilen sich die untere Hälfte.",
      factEn: "Memory hook: the gold is so precious it takes up half the flag – the other two colours share the lower half.",
    },
    {
      id: "ec", flag: "🇪🇨", es: "Ecuador", de: "Ecuador", en: "Ecuador",
      region: "sur", capital: "Quito", colors: "Gelb · Blau · Rot", colorsEn: "Yellow · Blue · Red",
      sym: "Dieselben Gran-Colombia-Farben Gelb-Blau-Rot, aber mit Wappen: ein Kondor über dem Vulkan Chimborazo und einem Dampfschiff im Fluss.",
      symEn: "The same Gran Colombia colours – yellow, blue, red – but with a coat of arms: a condor above Mt Chimborazo and a steamship on the river.",
      fact: "So unterscheidest du das Trio: Ecuador trägt immer das große Wappen mit dem Kondor, Kolumbien hat gar keines.",
      factEn: "How to tell the trio apart: Ecuador always carries the big condor crest, while Colombia has none at all.",
    },
    {
      id: "py", flag: "🇵🇾", es: "Paraguay", de: "Paraguay", en: "Paraguay",
      region: "sur", capital: "Asunción", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Rot-Weiß-Blau waagerecht mit einem Emblem in der weißen Mitte – Farben für Unabhängigkeit, Frieden und Gerechtigkeit.",
      symEn: "Red-white-blue horizontal bands with an emblem in the white centre – colours for independence, peace and justice.",
      fact: "Weltweit einzigartig: Vorder- und Rückseite sind verschieden! Vorne der Stern des Staatswappens, hinten der Löwe des Schatzamtes.",
      factEn: "Unique in the world: the front and back differ! The star of the national arms on the front, the treasury's lion on the back.",
    },
    {
      id: "pe", flag: "🇵🇪", es: "Perú", de: "Peru", en: "Peru",
      region: "sur", capital: "Lima", colors: "Rot · Weiß · Rot", colorsEn: "Red · White · Red",
      sym: "Drei senkrechte Streifen Rot-Weiß-Rot; die Staatsflagge trägt mittig das Wappen mit Vikunja, Chinarindenbaum und Füllhorn.",
      symEn: "Three vertical bands of red-white-red; the state flag bears the coat of arms with a vicuña, a cinchona tree and a cornucopia.",
      fact: "Der Legende nach wählte San Martín Rot-Weiß nach den rot-weißen Flamingos, die er bei seiner Landung auffliegen sah.",
      factEn: "Legend says San Martín chose red and white after the red-and-white flamingos he saw take flight as he landed.",
    },
    {
      id: "uy", flag: "🇺🇾", es: "Uruguay", de: "Uruguay", en: "Uruguay",
      region: "sur", capital: "Montevideo", colors: "Weiß · Blau", colorsEn: "White · Blue",
      sym: "Neun weiße und blaue Streifen plus die „Sol de Mayo“ im weißen Eck: Die neun Streifen stehen für die neun ursprünglichen Departamentos.",
      symEn: "Nine white and blue stripes plus the „Sol de Mayo“ in the white canton: the nine stripes stand for the nine original departments.",
      fact: "Dieselbe goldene Gesichts-Sonne wie Argentinien – kein Zufall: Beide gehen auf die Mai-Revolution am Río de la Plata zurück.",
      factEn: "The same golden face-sun as Argentina – no coincidence: both go back to the May Revolution on the Río de la Plata.",
    },
    {
      id: "ve", flag: "🇻🇪", es: "Venezuela", de: "Venezuela", en: "Venezuela",
      region: "sur", capital: "Caracas", colors: "Gelb · Blau · Rot", colorsEn: "Yellow · Blue · Red",
      sym: "Gelb-Blau-Rot mit einem Bogen aus acht weißen Sternen in der blauen Mitte – die Sterne stehen für acht Provinzen der Unabhängigkeit.",
      symEn: "Yellow-blue-red with an arc of eight white stars in the blue band – the stars stand for eight provinces of the independence.",
      fact: "Lange waren es sieben Sterne; den achten ließ Hugo Chávez 2006 für die Provinz Guayana hinzufügen – nach einem Wunsch Bolívars.",
      factEn: "For a long time there were seven stars; Hugo Chávez had an eighth added in 2006 for Guayana province – following a wish of Bolívar's.",
    },
    {
      id: "br", flag: "🇧🇷", es: "Brasil", de: "Brasilien", en: "Brazil",
      region: "sur", capital: "Brasília", colors: "Grün · Gelb · Blau", colorsEn: "Green · Yellow · Blue",
      sym: "Grünes Feld, gelbe Raute, blaue Kugel mit Sternen und dem Spruch „Ordem e Progresso“ (Ordnung und Fortschritt).",
      symEn: "A green field, a yellow rhombus and a blue globe with stars and the motto „Ordem e Progresso“ (Order and Progress).",
      fact: "Die Sterne zeigen den Sternenhimmel über Rio in der Nacht des 15. November 1889 – jeder Stern ist ein Bundesstaat.",
      factEn: "The stars depict the night sky over Rio on 15 November 1889 – each star is a federal state.",
    },
    // ----- Centroamérica y el Caribe -----
    {
      id: "mx", flag: "🇲🇽", es: "México", de: "Mexiko", en: "Mexico",
      region: "centro", capital: "Ciudad de México", colors: "Grün · Weiß · Rot", colorsEn: "Green · White · Red",
      sym: "Grün-Weiß-Rot senkrecht, in der Mitte ein Adler auf einem Kaktus, der eine Schlange verschlingt: Grün für Hoffnung, Weiß für Einheit, Rot für das Blut der Helden.",
      symEn: "Green-white-red vertical bands with an eagle on a cactus devouring a snake: green for hope, white for unity, red for the heroes' blood.",
      fact: "Das Wappen erzählt die Azteken-Gründungssage von Tenochtitlan – genau dort, wo der Adler saß, entstand Mexiko-Stadt.",
      factEn: "The emblem tells the Aztec founding legend of Tenochtitlan – Mexico City arose exactly where the eagle was perched.",
    },
    {
      id: "gt", flag: "🇬🇹", es: "Guatemala", de: "Guatemala", en: "Guatemala",
      region: "centro", capital: "Ciudad de Guatemala", colors: "Blau · Weiß · Blau", colorsEn: "Blue · White · Blue",
      sym: "Senkrechtes Blau-Weiß-Blau mit Wappen: ein Quetzal-Vogel, eine Schriftrolle und gekreuzte Gewehre und Schwerter. Blau für die zwei Ozeane, Weiß für den Frieden.",
      symEn: "Vertical blue-white-blue with a crest: a quetzal bird, a scroll and crossed rifles and swords. Blue for the two oceans, white for peace.",
      fact: "Der Quetzal ist der Nationalvogel und steht für Freiheit – in Gefangenschaft stirbt er. So heißt auch die Währung: der Quetzal.",
      factEn: "The quetzal is the national bird and stands for liberty – it dies in captivity. The currency shares its name: the quetzal.",
    },
    {
      id: "hn", flag: "🇭🇳", es: "Honduras", de: "Honduras", en: "Honduras",
      region: "centro", capital: "Tegucigalpa", colors: "Blau · Weiß · Blau", colorsEn: "Blue · White · Blue",
      sym: "Blau-Weiß-Blau waagerecht mit fünf blauen Sternen in der Mitte – die Sterne stehen für die fünf Staaten der einstigen Zentralamerikanischen Föderation.",
      symEn: "Blue-white-blue horizontal bands with five blue stars in the centre – the stars stand for the five states of the old Central American Federation.",
      fact: "Merkhilfe für die blau-weiß-blauen Nachbarn: Honduras ist das mit den fünf Sternen, ganz ohne großes Wappen.",
      factEn: "Memory hook for the blue-white-blue neighbours: Honduras is the one with five stars and no big coat of arms.",
    },
    {
      id: "sv", flag: "🇸🇻", es: "El Salvador", de: "El Salvador", en: "El Salvador",
      region: "centro", capital: "San Salvador", colors: "Blau · Weiß · Blau", colorsEn: "Blue · White · Blue",
      sym: "Blau-Weiß-Blau mit einem runden Wappen: ein Dreieck mit fünf Vulkanen, Regenbogen und Freiheitsmütze – die Föderationsfarben Zentralamerikas.",
      symEn: "Blue-white-blue with a round emblem: a triangle with five volcanoes, a rainbow and a liberty cap – the Central American federation colours.",
      fact: "Das Dreieck steht für Gleichheit, die fünf Vulkane für die fünf Föderationsstaaten – dasselbe Motiv wie bei Nicaragua.",
      factEn: "The triangle stands for equality, the five volcanoes for the five federation states – the same motif as Nicaragua's.",
    },
    {
      id: "ni", flag: "🇳🇮", es: "Nicaragua", de: "Nicaragua", en: "Nicaragua",
      region: "centro", capital: "Managua", colors: "Blau · Weiß · Blau", colorsEn: "Blue · White · Blue",
      sym: "Blau-Weiß-Blau mit einem Wappendreieck samt fünf Vulkanen und Regenbogen – nah verwandt mit El Salvador, beide aus der Föderation.",
      symEn: "Blue-white-blue with an emblem triangle of five volcanoes and a rainbow – closely related to El Salvador, both from the federation.",
      fact: "So trennst du beide: Nicaraguas Wappen ist farbig (mit Regenbogen), El Salvadors Inschrift bildet einen Halbkreis um das Dreieck.",
      factEn: "How to tell them apart: Nicaragua's emblem is colourful (with a rainbow), while El Salvador's inscription curves around the triangle.",
    },
    {
      id: "cr", flag: "🇨🇷", es: "Costa Rica", de: "Costa Rica", en: "Costa Rica",
      region: "centro", capital: "San José", colors: "Blau · Weiß · Rot", colorsEn: "Blue · White · Red",
      sym: "Blau-Weiß-Rot-Weiß-Blau mit breitem rotem Mittelstreifen: Blau für den Himmel und die Chancen, Weiß für Frieden und Weisheit, Rot für die Wärme der „Ticos“.",
      symEn: "Blue-white-red-white-blue with a broad red central band: blue for the sky and opportunity, white for peace and wisdom, red for the warmth of the „Ticos“.",
      fact: "Der rote Streifen kam 1848 dazu – inspiriert von der französischen Trikolore. Das macht Costa Rica unter den Nachbarn leicht erkennbar.",
      factEn: "The red band was added in 1848 – inspired by the French tricolour. It makes Costa Rica easy to spot among its neighbours.",
    },
    {
      id: "pa", flag: "🇵🇦", es: "Panamá", de: "Panama", en: "Panama",
      region: "centro", capital: "Ciudad de Panamá", colors: "Weiß · Rot · Blau", colorsEn: "White · Red · Blue",
      sym: "Vier Felder: weiß mit blauem Stern, weiß mit rotem Stern, dazu ein rotes und ein blaues Feld. Blau und Rot stehen für die zwei großen Parteien, Weiß für den Frieden zwischen ihnen.",
      symEn: "Four quarters: white with a blue star, white with a red star, plus a red and a blue field. Blue and red stand for the two main parties, white for the peace between them.",
      fact: "Die zwei Sterne stehen für Reinheit und Autorität – ein seltenes Vier-Felder-Design, das du sofort wiedererkennst.",
      factEn: "The two stars stand for purity and authority – a rare four-quarter design you recognise instantly.",
    },
    {
      id: "cu", flag: "🇨🇺", es: "Cuba", de: "Kuba", en: "Cuba",
      region: "centro", capital: "La Habana", colors: "Blau · Weiß · Rot", colorsEn: "Blue · White · Red",
      sym: "Fünf blau-weiße Streifen mit rotem Dreieck und weißem Stern: drei blaue Streifen für die alten Landesteile, das rote Dreieck und der Stern für Freiheit und Unabhängigkeit.",
      symEn: "Five blue and white stripes with a red triangle and a white star: three blue stripes for the old regions, the red triangle and star for freedom and independence.",
      fact: "Auch „La Estrella Solitaria“. Puerto Ricos Flagge ist fast spiegelbildlich – nur sind dort die Streifen rot und das Dreieck blau.",
      factEn: "Also „La Estrella Solitaria“. Puerto Rico's flag is almost a mirror image – there the stripes are red and the triangle is blue.",
    },
    {
      id: "do", flag: "🇩🇴", es: "República Dominicana", de: "Dominikanische Republik", en: "Dominican Republic",
      region: "centro", capital: "Santo Domingo", colors: "Blau · Rot · Weiß", colorsEn: "Blue · Red · White",
      sym: "Ein weißes Kreuz teilt die Flagge in blaue und rote Felder; in der Mitte das Wappen mit Schild, Lorbeer und einer aufgeschlagenen Bibel.",
      symEn: "A white cross divides the flag into blue and red fields; in the centre the coat of arms with a shield, laurel and an open Bible.",
      fact: "Die einzige Nationalflagge der Welt mit einer Bibel im Wappen – sie ist beim Buch des Johannes „Die Wahrheit macht euch frei“ aufgeschlagen.",
      factEn: "The only national flag in the world with a Bible in its emblem – opened at the Gospel of John, „the truth shall set you free“.",
    },
    {
      id: "pr", flag: "🇵🇷", es: "Puerto Rico", de: "Puerto Rico", en: "Puerto Rico",
      region: "centro", capital: "San Juan", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Fünf Streifen in Rot und Weiß mit einem blauen Dreieck und einem weißen Stern: das Dreieck steht für die drei Staatsgewalten, der Stern für die Insel selbst.",
      symEn: "Five red and white stripes with a blue triangle and a white star: the triangle stands for the three branches of government, the star for the island itself.",
      fact: "Fast spiegelbildlich zu Kuba – nur sind hier die Streifen rot und das Dreieck blau. Beide Flaggen entstanden um 1895 fast zur selben Zeit.",
      factEn: "Almost a mirror image of Cuba – here the stripes are red and the triangle is blue. Both flags emerged around 1895 at nearly the same time.",
    },
    // ----- España -----
    {
      id: "es", flag: "🇪🇸", es: "España", de: "Spanien", en: "Spain",
      region: "europa", capital: "Madrid", colors: "Rot · Gelb", colorsEn: "Red · Yellow",
      sym: "Die „Rojigualda“: ein breiter gelber Streifen zwischen zwei roten, mit dem Wappen links – Burg und Löwe der alten Königreiche und die Säulen des Herkules mit „Plus Ultra“.",
      symEn: "The „Rojigualda“: a wide yellow band between two red ones, with the coat of arms on the left – castle and lion of the old kingdoms and the Pillars of Hercules with „Plus Ultra“.",
      fact: "Der gelbe Streifen ist doppelt so breit wie jeder rote – gut sichtbar auf See, wofür König Karl III. die Farben 1785 wählte.",
      factEn: "The yellow band is twice as wide as each red one – highly visible at sea, which is why King Charles III chose the colours in 1785.",
    },
  ];

  // ---------- „Saber más“: Wissen zu Flaggen insgesamt ----------
  const INTRO =
    "Flaggen sind die kürzeste Sprache der Welt: Drei Farben und ein Symbol " +
    "erzählen eine ganze Nationalgeschichte. Hier lernst du die Flaggen " +
    "Lateinamerikas und Spaniens spielerisch kennen – und das Wissen drumherum: " +
    "Warum sich so viele Flaggen ähneln, wofür die Farben stehen und wie du " +
    "selbst die verwechselbarsten auseinanderhältst.";

  const INTRO_EN =
    "Flags are the world's shortest language: three colours and a symbol tell a " +
    "whole national story. Here you get to know the flags of Latin America and " +
    "Spain in a playful way – plus the knowledge around them: why so many flags " +
    "look alike, what the colours mean, and how to tell even the trickiest ones apart.";

  const TOPICS = [
    {
      icon: "🚩",
      title: "Was eine Flagge erzählt (Vexillologie)",
      titleEn: "What a flag tells you (vexillology)",
      intro: "Die Lehre von den Flaggen heißt Vexillologie. Eine gute Flagge ist so einfach, dass ein Kind sie aus dem Gedächtnis malen kann – und trotzdem voller Bedeutung.",
      introEn: "The study of flags is called vexillology. A good flag is simple enough for a child to draw from memory – and yet full of meaning.",
      dos: [
        "Senkrechte Streifen (México, Perú, Guatemala) gehen meist auf die französische Trikolore zurück.",
        "Waagerechte Streifen (Argentina, Colombia, Bolivia) sind in Lateinamerika am häufigsten.",
        "Ein Wappen oder „escudo“ in der Mitte macht aus einer Bürgerflagge die offizielle Staatsflagge.",
        "Fünf Grundregeln guten Flaggendesigns: einfach halten, sinnvolle Symbole, 2–3 Farben, keine Schrift, einprägsam.",
      ],
      dosEn: [
        "Vertical stripes (Mexico, Peru, Guatemala) usually trace back to the French tricolour.",
        "Horizontal stripes (Argentina, Colombia, Bolivia) are the most common in Latin America.",
        "A coat of arms or „escudo“ in the middle turns a civil flag into the official state flag.",
        "Five basic rules of good flag design: keep it simple, meaningful symbols, 2–3 colours, no lettering, be memorable.",
      ],
      tips: [
        "Frag dich bei jeder Flagge zuerst: Streifen senkrecht oder waagerecht? Das halbiert schon die Verwechslungskandidaten.",
        "Ein Wappen ist der beste Anker zum Merken – es ist immer einzigartig, anders als bloße Farbstreifen.",
      ],
      tipsEn: [
        "With any flag, first ask: are the stripes vertical or horizontal? That already halves the look-alike candidates.",
        "A coat of arms is the best anchor for memory – it is always unique, unlike plain colour stripes.",
      ],
    },
    {
      icon: "🎨",
      title: "Die Farben und was sie bedeuten",
      titleEn: "The colours and what they mean",
      intro: "In ganz Lateinamerika wiederholen sich dieselben Farbbedeutungen – sie stammen aus der Zeit der Unabhängigkeitskriege.",
      introEn: "Across Latin America the same colour meanings recur – they date back to the wars of independence.",
      dos: [
        "Rot steht fast überall für das vergossene Blut der Helden und den Mut.",
        "Blau bedeutet meist Himmel, Meer und die zwei Ozeane (Pazifik & Atlantik/Karibik).",
        "Weiß steht für Frieden, Reinheit und Einheit.",
        "Gelb/Gold meint Reichtum, Bodenschätze und das fruchtbare Land.",
        "Grün steht für Hoffnung, Wälder und die Natur.",
      ],
      dosEn: [
        "Red almost everywhere stands for the heroes' shed blood and for courage.",
        "Blue usually means sky, sea and the two oceans (Pacific & Atlantic/Caribbean).",
        "White stands for peace, purity and unity.",
        "Yellow/gold means wealth, mineral riches and the fertile land.",
        "Green stands for hope, forests and nature.",
      ],
      tips: [
        "Die Gran-Colombia-Farben Gelb-Blau-Rot teilen sich Colombia, Ecuador und Venezuela – ein Erbe aus Bolívars Großstaat.",
        "Blau-Weiß-Blau ist die Familienfarbe Zentralamerikas: Guatemala, Honduras, El Salvador, Nicaragua – alle aus einer Föderation.",
      ],
      tipsEn: [
        "The Gran Colombia colours yellow-blue-red are shared by Colombia, Ecuador and Venezuela – a legacy of Bolívar's great state.",
        "Blue-white-blue is the family colour of Central America: Guatemala, Honduras, El Salvador, Nicaragua – all from one federation.",
      ],
      level: "B1",
      es: [
        "Casi todas las *banderas* de Hispanoamérica comparten un mismo *código* de colores nacido en las guerras de *independencia*.",
        "El *rojo* recuerda la *sangre* de los héroes, el *azul* el cielo y los océanos, y el *blanco* la *paz*.",
      ],
      vocab: [
        { es: "banderas", de: "Flaggen", en: "flags", take: true },
        { es: "código", de: "Code, Schlüssel", en: "code", take: false },
        { es: "independencia", de: "Unabhängigkeit", en: "independence", take: true },
        { es: "rojo", de: "rot", en: "red", take: true },
        { es: "sangre", de: "Blut", en: "blood", take: true },
        { es: "azul", de: "blau", en: "blue", take: true },
        { es: "blanco", de: "weiß", en: "white", take: true },
        { es: "paz", de: "Frieden", en: "peace", take: true },
      ],
    },
    {
      icon: "☀️",
      title: "Gemeinsame Symbole Lateinamerikas",
      titleEn: "Shared symbols of Latin America",
      intro: "Sonne, Sterne und Vulkane tauchen auf vielen Flaggen auf – und meinen oft dasselbe.",
      introEn: "Sun, stars and volcanoes appear on many flags – and often mean the same thing.",
      dos: [
        "Die „Sol de Mayo“, eine goldene Sonne mit Gesicht, steht für die Mai-Revolution (Argentina & Uruguay) und geht auf die Inka-Sonne Inti zurück.",
        "Sterne zählen oft Provinzen oder Gründerstaaten (Venezuela 8, Honduras 5, Brasil 27).",
        "Fünf Vulkane stehen für die fünf Staaten der Zentralamerikanischen Föderation (El Salvador, Nicaragua).",
        "Die Freiheitsmütze („gorro frigio“) ist ein republikanisches Symbol gegen die Monarchie.",
      ],
      dosEn: [
        "The „Sol de Mayo“, a golden sun with a face, marks the May Revolution (Argentina & Uruguay) and goes back to the Inca sun Inti.",
        "Stars often count provinces or founding states (Venezuela 8, Honduras 5, Brazil 27).",
        "Five volcanoes stand for the five states of the Central American Federation (El Salvador, Nicaragua).",
        "The liberty cap („gorro frigio“) is a republican symbol against the monarchy.",
      ],
      tips: [
        "Siehst du eine Sonne mit Gesicht, denk an den Río de la Plata: Argentina oder Uruguay.",
        "Zähl die Sterne – ihre Zahl ist fast immer ein Hinweis aufs Land.",
      ],
      tipsEn: [
        "If you see a sun with a face, think of the Río de la Plata: Argentina or Uruguay.",
        "Count the stars – their number is almost always a clue to the country.",
      ],
    },
    {
      icon: "🤔",
      title: "Flaggen, die sich zum Verwechseln ähneln",
      titleEn: "Flags that look confusingly alike",
      intro: "Ein paar Gruppen sehen fast gleich aus. Mit einem Merkmal pro Land hältst du sie sicher auseinander.",
      introEn: "A few groups look almost identical. With one feature per country you can tell them apart for sure.",
      dos: [
        "Gelb-Blau-Rot: Colombia (kein Wappen, Gelb halb so groß), Ecuador (großes Wappen mit Kondor), Venezuela (Sternenbogen).",
        "Blau-Weiß-Blau: Honduras (5 Sterne), El Salvador & Nicaragua (Wappen mit Vulkanen), Guatemala (senkrecht, Quetzal).",
        "Einzelstern auf Streifen: Chile (rot unten), Cuba (rotes Dreieck), Puerto Rico (blaues Dreieck).",
        "Sonne mit Gesicht: Argentina (3 Streifen) vs. Uruguay (9 Streifen, Sonne im Eck).",
      ],
      dosEn: [
        "Yellow-blue-red: Colombia (no crest, yellow is half), Ecuador (big condor crest), Venezuela (arc of stars).",
        "Blue-white-blue: Honduras (5 stars), El Salvador & Nicaragua (volcano emblems), Guatemala (vertical, quetzal).",
        "Single star on stripes: Chile (red at the bottom), Cuba (red triangle), Puerto Rico (blue triangle).",
        "Sun with a face: Argentina (3 stripes) vs. Uruguay (9 stripes, sun in the canton).",
      ],
      tips: [
        "Merksatz fürs Trio Gelb-Blau-Rot: „Colombia ist nackt, Ecuador trägt den Kondor, Venezuela die Sterne.“",
        "Bei Chile vs. Cuba: Chile hat nur einen Streifen unter dem Stern-Eck, Cuba gleich fünf.",
      ],
      tipsEn: [
        "Mnemonic for the yellow-blue-red trio: „Colombia is bare, Ecuador wears the condor, Venezuela the stars.“",
        "For Chile vs. Cuba: Chile has just one band below the star canton, Cuba has five.",
      ],
    },
    {
      icon: "🙌",
      title: "Etikette: eine Flagge respektvoll behandeln",
      titleEn: "Etiquette: treating a flag with respect",
      intro: "Flaggen sind für viele ein heiliges Symbol. Ein paar einfache Regeln bewahren dich unterwegs vor Fettnäpfchen.",
      introEn: "For many people a flag is a sacred symbol. A few simple rules keep you out of trouble while travelling.",
      dos: [
        "An Nationalfeiertagen (z. B. „Fiestas Patrias“) wird die Flagge überall gehisst – ein guter Moment für ein respektvolles Foto.",
        "Frag nach, bevor du eine Flagge als Umhang oder Kostüm trägst – das gilt mancherorts als respektlos.",
        "Eine Flagge berührt traditionell nie den Boden.",
        "Beim Abspielen der Hymne stehen die Menschen auf – mach es einfach mit.",
      ],
      dosEn: [
        "On national holidays (e.g. „Fiestas Patrias“) flags fly everywhere – a good moment for a respectful photo.",
        "Ask before wearing a flag as a cape or costume – in some places it is seen as disrespectful.",
        "A flag traditionally never touches the ground.",
        "When the anthem plays, people stand up – simply do the same.",
      ],
      tips: [
        "Ein ehrliches „Me encanta su bandera, ¿qué significan los colores?“ öffnet überall Herzen und Gespräche.",
        "Sportevents sind die sicherste Gelegenheit, Flaggen mitzufeiern – da ist alles erlaubt.",
      ],
      tipsEn: [
        "An honest „Me encanta su bandera, ¿qué significan los colores?“ opens hearts and conversations everywhere.",
        "Sports events are the safest occasion to celebrate with flags – anything goes there.",
      ],
    },
    {
      icon: "📱",
      title: "Emoji-Flaggen – wie sie funktionieren",
      titleEn: "Flag emojis – how they work",
      intro: "Die 🇲🇽-Emojis sind kein einzelnes Bild, sondern ein cleverer Trick aus zwei Buchstaben.",
      introEn: "The 🇲🇽 emojis are not a single picture but a clever trick made of two letters.",
      dos: [
        "Jede Flaggen-Emoji besteht aus zwei „Regional Indicator“-Zeichen – dem Ländercode nach ISO (MX, AR, ES …).",
        "🇲 + 🇽 ergibt 🇲🇽 – dein Gerät setzt die zwei Buchstaben automatisch zu einer Flagge zusammen.",
        "Darum zeigen manche Geräte (vor allem alte Windows-PCs) statt der Flagge nur die zwei Buchstaben.",
        "Es gibt nur Emojis für Länder mit offiziellem ISO-Code – für Regionen wie Schottland gibt es Sonderfälle.",
      ],
      dosEn: [
        "Each flag emoji is made of two „regional indicator“ characters – the ISO country code (MX, AR, ES …).",
        "🇲 + 🇽 makes 🇲🇽 – your device automatically merges the two letters into a flag.",
        "That is why some devices (especially old Windows PCs) show just the two letters instead of the flag.",
        "Emojis only exist for countries with an official ISO code – regions like Scotland are special cases.",
      ],
      tips: [
        "Der ISO-Code ist eine super Eselsbrücke: AR = Argentina, CO = Colombia, PE = Perú, ES = España.",
        "In dieser App siehst du überall echte Flaggen – sie kommen genau aus diesen zwei-Buchstaben-Codes.",
      ],
      tipsEn: [
        "The ISO code is a great memory aid: AR = Argentina, CO = Colombia, PE = Peru, ES = Spain.",
        "In this app you see real flags everywhere – they come from exactly these two-letter codes.",
      ],
    },
  ];

  // ---------- Sätze rund um Herkunft & Flaggen ----------
  const PHRASES = [
    {
      id: "origen",
      icon: "🌎",
      title: "Herkunft & Nationalität",
      titleEn: "Origin & nationality",
      items: [
        { es: "¿De dónde eres?", de: "Woher kommst du?", en: "Where are you from?" },
        { es: "Soy de Alemania.", de: "Ich komme aus Deutschland.", en: "I'm from Germany." },
        { es: "¿De qué país es esta bandera?", de: "Von welchem Land ist diese Flagge?", en: "Which country is this flag from?" },
        { es: "Esta es la bandera de México.", de: "Das ist die Flagge von Mexiko.", en: "This is the flag of Mexico." },
        { es: "¿Cuál es tu nacionalidad?", de: "Welche Staatsangehörigkeit hast du?", en: "What's your nationality?" },
      ],
    },
    {
      id: "colores",
      icon: "🎨",
      title: "Über Farben & Symbole reden",
      titleEn: "Talking about colours & symbols",
      items: [
        { es: "¿Qué significan los colores de tu bandera?", de: "Was bedeuten die Farben eurer Flagge?", en: "What do the colours of your flag mean?" },
        { es: "Me encanta tu bandera.", de: "Ich mag eure Flagge sehr.", en: "I love your flag." },
        { es: "El rojo significa la sangre de los héroes.", de: "Rot bedeutet das Blut der Helden.", en: "Red means the heroes' blood." },
        { es: "¿Qué es ese símbolo del centro?", de: "Was ist das Symbol in der Mitte?", en: "What is that symbol in the centre?" },
        { es: "Las dos banderas se parecen mucho.", de: "Die zwei Flaggen ähneln sich sehr.", en: "The two flags look very similar." },
      ],
    },
  ];

  // ---------- Glossar rund um Flaggen ----------
  const GLOSSARY = [
    { es: "la bandera", de: "die Flagge", en: "the flag" },
    { es: "el escudo", de: "das Wappen", en: "the coat of arms" },
    { es: "la franja", de: "der Streifen", en: "the stripe, band" },
    { es: "la estrella", de: "der Stern", en: "the star" },
    { es: "el sol", de: "die Sonne", en: "the sun" },
    { es: "bicolor", de: "zweifarbig", en: "two-coloured" },
    { es: "tricolor", de: "dreifarbig (Trikolore)", en: "three-coloured (tricolour)" },
    { es: "el asta", de: "der Fahnenmast", en: "the flagpole" },
    { es: "ondear", de: "wehen, flattern", en: "to wave, to fly" },
    { es: "izar", de: "hissen", en: "to hoist" },
    { es: "el lema", de: "der Wahlspruch, das Motto", en: "the motto" },
    { es: "la independencia", de: "die Unabhängigkeit", en: "independence" },
  ];

  // ---------- „Trucos“: Flaggen sicher merken ----------
  const CHECKLIST = [
    {
      icon: "🧭",
      item: "Zuerst die Form lesen",
      itemEn: "Read the layout first",
      why: "Streifen senkrecht oder waagerecht, Wappen ja/nein – das grenzt jede Flagge sofort stark ein.",
      whyEn: "Vertical or horizontal stripes, crest or not – that narrows down any flag straight away.",
    },
    {
      icon: "🎨",
      item: "Farben als Geschichte denken",
      itemEn: "Think of colours as a story",
      why: "Rot = Blut, Blau = Meer, Gelb = Gold, Grün = Natur. Wer die Bedeutung kennt, vergisst die Farben nicht.",
      whyEn: "Red = blood, blue = sea, yellow = gold, green = nature. Knowing the meaning means never forgetting the colours.",
    },
    {
      icon: "⭐",
      item: "Sterne und Symbole zählen",
      itemEn: "Count stars and symbols",
      why: "Die Zahl der Sterne oder Vulkane ist fast immer ein eindeutiger Fingerabdruck des Landes.",
      whyEn: "The number of stars or volcanoes is almost always a unique fingerprint of the country.",
    },
    {
      icon: "👯",
      item: "Zwillinge paarweise lernen",
      itemEn: "Learn the twins in pairs",
      why: "Verwechselbare Flaggen (Chile/Cuba, das Gelb-Blau-Rot-Trio) merkt man sich am besten mit ihrem Unterschied zusammen.",
      whyEn: "Look-alike flags (Chile/Cuba, the yellow-blue-red trio) stick best when you learn them with their difference.",
    },
    {
      icon: "🔁",
      item: "Spielen statt pauken",
      itemEn: "Play instead of cramming",
      why: "Ein paar Quiz-Runden bringen mehr als langes Anstarren – beim Raten bleibt jede Flagge mit ihrer Geschichte hängen.",
      whyEn: "A few quiz rounds beat long staring – guessing makes each flag stick together with its story.",
    },
  ];

  window.SC.banderas = { COUNTRIES, INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
