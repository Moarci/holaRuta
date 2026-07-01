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
 * Nachbar – und „El mundo“, die großen Reiseziele der Welt (USA, Europa, Japan,
 * Thailand, Australien, Marokko …), die HolaRuta-Reisende ebenfalls ansteuern.
 * Inhalte recherchiert und bewusst knapp gehalten: pro Land eine korrekte
 * Symbolik-Zeile plus eine Eselsbrücke/Anekdote, mit der man die Flagge sicher
 * wiedererkennt.
 *
 * Schemas (identisch zu juegos.js, damit ui sie 1:1 rendern kann):
 *   COUNTRIES: [{ id, flag, es, de, en, region, capital, colors, colorsEn,
 *               sym, symEn, fact, factEn }]  – region ∈ {sur, centro, europa, mundo}.
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
  // region: "sur" = Sudamérica · "centro" = Centroamérica y el Caribe · "europa" = España · "mundo" = große Reiseziele der Welt
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
      fact: "Die Sterne zeigen den Sternenhimmel über Rio in der Nacht des 15. November 1889 – jeder Stern steht für einen Bundesstaat oder den Hauptstadtdistrikt.",
      factEn: "The stars depict the night sky over Rio on 15 November 1889 – each star stands for a federal state or the capital district.",
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
      fact: "Fast spiegelbildlich zu Kuba – nur sind hier die Streifen rot und das Dreieck blau. Puerto-ricanische Exilanten entwarfen sie 1895 bewusst als Spiegelbild der kubanischen Flagge – als Zeichen der Solidarität im Unabhängigkeitskampf.",
      factEn: "Almost a mirror image of Cuba – here the stripes are red and the triangle is blue. Puerto Rican exiles designed it in 1895 as a deliberate mirror of Cuba's flag – a sign of solidarity in the independence struggle.",
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
    // ----- Mundo: die großen Reiseziele der Welt -----
    {
      id: "us", flag: "🇺🇸", es: "Estados Unidos", de: "USA", en: "United States",
      region: "mundo", capital: "Washington D. C.", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Die „Stars and Stripes“: 13 rot-weiße Streifen für die 13 Gründerkolonien, dazu 50 weiße Sterne im blauen Feld – einer je Bundesstaat.",
      symEn: "The „Stars and Stripes“: 13 red-and-white stripes for the 13 founding colonies, plus 50 white stars on the blue canton – one per state.",
      fact: "Einfach zu merken: 50 Sterne = 50 Staaten, 13 Streifen = 13 Kolonien. Mit jedem neuen Staat kam ein Stern dazu.",
      factEn: "Easy to remember: 50 stars = 50 states, 13 stripes = 13 colonies. A new star was added for every new state.",
    },
    {
      id: "ca", flag: "🇨🇦", es: "Canadá", de: "Kanada", en: "Canada",
      region: "mundo", capital: "Ottawa", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Rot-Weiß-Rot senkrecht (das breite weiße „kanadische Feld“ in der Mitte), darin ein rotes Ahornblatt mit elf Spitzen – das Nationalsymbol.",
      symEn: "Vertical red-white-red (the broad white „Canadian pale“ in the middle) with a red maple leaf of eleven points – the national emblem.",
      fact: "Das Ahornblatt erkennt man sofort. Die elf Zacken haben keine besondere Bedeutung – sie wirkten im Wind einfach am ruhigsten.",
      factEn: "The maple leaf is instantly recognisable. The eleven points carry no special meaning – they simply looked steadiest in the wind.",
    },
    {
      id: "gb", flag: "🇬🇧", es: "Reino Unido", de: "Vereinigtes Königreich", en: "United Kingdom",
      region: "mundo", capital: "Londres", colors: "Blau · Weiß · Rot", colorsEn: "Blue · White · Red",
      sym: "Der „Union Jack“ überlagert drei Kreuze: das rote St.-Georgs-Kreuz (England), das weiße St.-Andreas-Kreuz (Schottland) und das rote St.-Patricks-Kreuz (Irland).",
      symEn: "The „Union Jack“ layers three crosses: the red cross of St George (England), the white saltire of St Andrew (Scotland) and the red saltire of St Patrick (Ireland).",
      fact: "Sie hat ein Oben und Unten: Der breite weiße Diagonalstreifen gehört oben an den Mast – falsch herum gehisst gilt als Notsignal.",
      factEn: "It has a right way up: the wider white diagonal belongs at the top by the mast – flown upside down it signals distress.",
    },
    {
      id: "fr", flag: "🇫🇷", es: "Francia", de: "Frankreich", en: "France",
      region: "mundo", capital: "París", colors: "Blau · Weiß · Rot", colorsEn: "Blue · White · Red",
      sym: "Die „Tricolore“: Blau, Weiß und Rot senkrecht. Blau und Rot sind die Farben von Paris, Weiß die des Königshauses – vereint seit der Revolution von 1789.",
      symEn: "The „Tricolore“: blue, white and red in vertical bands. Blue and red are the colours of Paris, white that of the monarchy – united since the 1789 Revolution.",
      fact: "Vorbild für unzählige Trikoloren weltweit. Tipp: Blau steht am Mast – so unterscheidet man sie von den Niederlanden (waagerecht).",
      factEn: "The model for countless tricolours worldwide. Tip: blue sits at the mast – that tells it apart from the Netherlands (which is horizontal).",
    },
    {
      id: "it", flag: "🇮🇹", es: "Italia", de: "Italien", en: "Italy",
      region: "mundo", capital: "Roma", colors: "Grün · Weiß · Rot", colorsEn: "Green · White · Red",
      sym: "„Il Tricolore“: Grün, Weiß und Rot senkrecht. Oft gedeutet als Grün für die Landschaft, Weiß für die Alpen/den Schnee und Rot für das vergossene Blut.",
      symEn: "„Il Tricolore“: green, white and red vertical bands, often read as green for the landscape, white for the Alps/snow and red for the blood that was shed.",
      fact: "Nicht mit Mexiko verwechseln: Italien hat dieselben Farben, aber kein Wappen in der Mitte – das weiße Feld bleibt leer.",
      factEn: "Don't confuse it with Mexico: Italy has the same colours but no emblem in the centre – the white band stays empty.",
    },
    {
      id: "de", flag: "🇩🇪", es: "Alemania", de: "Deutschland", en: "Germany",
      region: "mundo", capital: "Berlín", colors: "Schwarz · Rot · Gold", colorsEn: "Black · Red · Gold",
      sym: "Schwarz, Rot und Gold waagerecht. Die Farben gehen auf die Uniformen des Lützowschen Freikorps und die Revolution von 1848 für ein einiges, freies Deutschland zurück.",
      symEn: "Black, red and gold in horizontal bands. The colours trace back to the uniforms of the Lützow Free Corps and the 1848 revolution for a united, free Germany.",
      fact: "Nicht mit Belgien verwechseln: gleiche Farben, aber Belgien stellt sie senkrecht.",
      factEn: "Don't confuse it with Belgium: same colours, but Belgium arranges them vertically.",
    },
    {
      id: "pt", flag: "🇵🇹", es: "Portugal", de: "Portugal", en: "Portugal",
      region: "mundo", capital: "Lisboa", colors: "Grün · Rot", colorsEn: "Green · Red",
      sym: "Grün am Mast, Rot zum Flugende, auf der Trennlinie eine gelbe Armillarsphäre mit dem Landeswappen – Grün für die Hoffnung, Rot für das Blut der Gefallenen.",
      symEn: "Green at the mast, red at the fly, and on the dividing line a yellow armillary sphere bearing the national shield – green for hope, red for the blood of the fallen.",
      fact: "Die Armillarsphäre (ein altes Navigationsinstrument) erinnert an Portugals Seefahrer im Zeitalter der Entdeckungen.",
      factEn: "The armillary sphere (an old navigation instrument) recalls Portugal's seafarers in the Age of Discoveries.",
    },
    {
      id: "nl", flag: "🇳🇱", es: "Países Bajos", de: "Niederlande", en: "Netherlands",
      region: "mundo", capital: "Ámsterdam", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Rot, Weiß und Blau waagerecht – die älteste Trikolore der Welt, abgeleitet von den Farben Wilhelms von Oranien.",
      symEn: "Red, white and blue horizontal bands – the world's oldest tricolour, derived from the colours of William of Orange.",
      fact: "Ursprünglich war der oberste Streifen Orange; er verblasste auf See zu Rot. Orange bleibt bis heute die Farbe der Königsfamilie.",
      factEn: "The top band was originally orange; it faded to red at sea. Orange remains the colour of the royal family to this day.",
    },
    {
      id: "ch", flag: "🇨🇭", es: "Suiza", de: "Schweiz", en: "Switzerland",
      region: "mundo", capital: "Berna", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Ein weißes, frei stehendes Kreuz auf rotem Grund – die Arme sind alle gleich lang und berühren den Rand nicht.",
      symEn: "A white, free-standing cross on a red field – the arms are all equal in length and do not touch the edges.",
      fact: "Eine von nur zwei quadratischen Nationalflaggen (die andere ist die des Vatikans). Das Rote Kreuz ist genau ihre Umkehrung.",
      factEn: "One of only two square national flags (the other is Vatican City's). The Red Cross emblem is exactly its inversion.",
    },
    {
      id: "gr", flag: "🇬🇷", es: "Grecia", de: "Griechenland", en: "Greece",
      region: "mundo", capital: "Atenas", colors: "Blau · Weiß", colorsEn: "Blue · White",
      sym: "Neun blau-weiße Streifen und oben links ein weißes Kreuz auf blauem Feld – das Kreuz steht für den orthodoxen Glauben.",
      symEn: "Nine blue-and-white stripes with a white cross on a blue canton in the upper hoist – the cross stands for the Orthodox faith.",
      fact: "Die neun Streifen werden gern mit den neun Silben von „Eleftheria i Thanatos“ („Freiheit oder Tod“) verbunden.",
      factEn: "The nine stripes are popularly linked to the nine syllables of „Eleftheria i Thanatos“ („Freedom or Death“).",
    },
    {
      id: "jp", flag: "🇯🇵", es: "Japón", de: "Japan", en: "Japan",
      region: "mundo", capital: "Tokio", colors: "Weiß · Rot", colorsEn: "White · Red",
      sym: "Die „Hinomaru“: eine schlichte rote Scheibe – die Sonne – mittig auf weißem Grund.",
      symEn: "The „Hinomaru“: a plain red disc – the sun – centred on a white field.",
      fact: "„Land der aufgehenden Sonne“: Der rote Kreis ist genau diese Sonne. Kaum eine Flagge ist reduzierter und einprägsamer.",
      factEn: "„Land of the Rising Sun“: the red circle is that very sun. Few flags are more minimal or more memorable.",
    },
    {
      id: "th", flag: "🇹🇭", es: "Tailandia", de: "Thailand", en: "Thailand",
      region: "mundo", capital: "Bangkok", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Fünf waagerechte Streifen rot-weiß-blau-weiß-rot, der blaue in der Mitte doppelt so breit: Rot für die Nation, Weiß für die Religion, Blau für das Königshaus.",
      symEn: "Five horizontal bands red-white-blue-white-red, the central blue one twice as wide: red for the nation, white for religion, blue for the monarchy.",
      fact: "Die blaue Mittelfarbe für den König wurde im Ersten Weltkrieg ergänzt – damals zur Solidarität mit den Alliierten.",
      factEn: "The central blue for the king was added during the First World War – then a gesture of solidarity with the Allies.",
    },
    {
      id: "au", flag: "🇦🇺", es: "Australia", de: "Australien", en: "Australia",
      region: "mundo", capital: "Canberra", colors: "Blau · Weiß · Rot", colorsEn: "Blue · White · Red",
      sym: "Blaues Feld mit dem Union Jack oben links, darunter der große siebenzackige „Commonwealth-Stern“ und rechts das Sternbild Kreuz des Südens.",
      symEn: "A blue field with the Union Jack in the upper hoist, the large seven-pointed „Commonwealth Star“ below it and the Southern Cross constellation on the fly.",
      fact: "Das Kreuz des Südens steht am Südhimmel – es zeigt auf einen Blick die Lage des Landes auf der Südhalbkugel.",
      factEn: "The Southern Cross sits in the southern sky – at a glance it marks the country's place in the Southern Hemisphere.",
    },
    {
      id: "ma", flag: "🇲🇦", es: "Marruecos", de: "Marokko", en: "Morocco",
      region: "mundo", capital: "Rabat", colors: "Rot · Grün", colorsEn: "Red · Green",
      sym: "Rotes Feld mit einem grünen, fünfzackigen Stern – dem „Siegel Salomos“. Rot steht für die Herrscherdynastie, der grüne Stern für den Islam.",
      symEn: "A red field with a green five-pointed star – the „Seal of Solomon“. Red stands for the ruling dynasty, the green star for Islam.",
      fact: "Die fünf Zacken werden mit den fünf Säulen des Islam verbunden. Der grüne Stern kam 1915 hinzu, das Rot ist viel älter.",
      factEn: "The five points are linked to the Five Pillars of Islam. The green star was added in 1915; the red is far older.",
    },
    {
      id: "eg", flag: "🇪🇬", es: "Egipto", de: "Ägypten", en: "Egypt",
      region: "mundo", capital: "El Cairo", colors: "Rot · Weiß · Schwarz", colorsEn: "Red · White · Black",
      sym: "Rot, Weiß und Schwarz waagerecht (die arabischen Befreiungsfarben), in der Mitte der goldene „Adler Saladins“.",
      symEn: "Red, white and black horizontal bands (the Arab Liberation colours) with the golden „Eagle of Saladin“ in the centre.",
      fact: "Rot steht für den Kampf, Weiß für die unblutige Revolution von 1952, Schwarz für das Ende der Unterdrückung.",
      factEn: "Red stands for the struggle, white for the bloodless 1952 revolution and black for the end of oppression.",
    },
    {
      id: "tr", flag: "🇹🇷", es: "Turquía", de: "Türkei", en: "Turkey",
      region: "mundo", capital: "Ankara", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Rotes Feld mit weißem Halbmond und einem fünfzackigen Stern – traditionelle Sinnbilder, die schon das Osmanische Reich führte.",
      symEn: "A red field with a white crescent and a five-pointed star – traditional emblems already carried by the Ottoman Empire.",
      fact: "Halbmond und Stern stehen heute bei vielen Ländern für den Islam – verbreitet wurden sie vor allem durch die Osmanen.",
      factEn: "The crescent and star today symbolise Islam for many countries – they were spread above all by the Ottomans.",
    },
    {
      id: "ie", flag: "🇮🇪", es: "Irlanda", de: "Irland", en: "Ireland",
      region: "mundo", capital: "Dublín", colors: "Grün · Weiß · Orange", colorsEn: "Green · White · Orange",
      sym: "Grün, Weiß und Orange senkrecht: Grün für die gälisch-katholische Tradition, Orange für die protestantische Minderheit – das Weiß dazwischen für den Frieden zwischen beiden.",
      symEn: "Green, white and orange vertical bands: green for the Gaelic-Catholic tradition, orange for the Protestant minority – the white between them for peace between the two.",
      fact: "Grün gehört an den Mast. Genau umgekehrt ist die Elfenbeinküste (Orange-Weiß-Grün) – eine klassische Verwechslung.",
      factEn: "Green belongs at the mast. Côte d'Ivoire is the exact reverse (orange-white-green) – a classic mix-up.",
    },
    {
      id: "at", flag: "🇦🇹", es: "Austria", de: "Österreich", en: "Austria",
      region: "mundo", capital: "Viena", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Rot-Weiß-Rot waagerecht – eine der ältesten Flaggen Europas, schlicht und ohne Wappen.",
      symEn: "Red-white-red horizontal bands – one of Europe's oldest flags, plain and without an emblem.",
      fact: "Der Legende nach färbte sich der Waffenrock Herzog Leopolds V. im Kampf blutrot – nur unter dem Gürtel blieb ein weißer Streifen.",
      factEn: "Legend says Duke Leopold V's tunic turned blood-red in battle – only the band under his belt stayed white.",
    },
    {
      id: "se", flag: "🇸🇪", es: "Suecia", de: "Schweden", en: "Sweden",
      region: "mundo", capital: "Estocolmo", colors: "Blau · Gelb", colorsEn: "Blue · Yellow",
      sym: "Blaues Feld mit einem gelben, zum Mast verschobenen Skandinavienkreuz – die Farben des Wappens (drei goldene Kronen auf Blau).",
      symEn: "A blue field with a yellow Nordic cross shifted toward the hoist – the colours of the coat of arms (three golden crowns on blue).",
      fact: "Das liegende Kreuz, leicht zum Mast versetzt, teilen sich alle nordischen Länder – es geht auf die dänische Dannebrog zurück.",
      factEn: "The off-centre cross is shared by all the Nordic countries – it traces back to the Danish Dannebrog.",
    },
    {
      id: "no", flag: "🇳🇴", es: "Noruega", de: "Norwegen", en: "Norway",
      region: "mundo", capital: "Oslo", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Rotes Feld mit einem blauen, weiß umrandeten Skandinavienkreuz – Rot, Weiß und Blau für die Freiheit.",
      symEn: "A red field with a blue, white-bordered Nordic cross – red, white and blue for freedom.",
      fact: "Im roten dänischen Kreuz steckt ein blaues schwedisches – Norwegen vereint so die Farben beider Nachbarn, mit denen es lange verbunden war.",
      factEn: "A blue Swedish cross sits within the red Danish one – Norway thus unites the colours of both neighbours it was long tied to.",
    },
    {
      id: "dk", flag: "🇩🇰", es: "Dinamarca", de: "Dänemark", en: "Denmark",
      region: "mundo", capital: "Copenhague", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Rotes Feld mit weißem Skandinavienkreuz – der „Dannebrog“, das Vorbild aller nordischen Kreuzflaggen.",
      symEn: "A red field with a white Nordic cross – the „Dannebrog“, the model for every Nordic cross flag.",
      fact: "Gilt als älteste durchgehend genutzte Nationalflagge der Welt – der Sage nach fiel sie 1219 mitten in einer Schlacht vom Himmel.",
      factEn: "Reputed to be the world's oldest continuously used national flag – legend says it fell from the sky during a battle in 1219.",
    },
    {
      id: "pl", flag: "🇵🇱", es: "Polonia", de: "Polen", en: "Poland",
      region: "mundo", capital: "Varsovia", colors: "Weiß · Rot", colorsEn: "White · Red",
      sym: "Zwei waagerechte Streifen, Weiß oben über Rot – Weiß für den weißen Adler im Wappen, Rot für das Feld dahinter.",
      symEn: "Two horizontal bands, white over red – white for the white eagle in the arms, red for the field behind it.",
      fact: "Merke: Weiß ist OBEN. Dreht man es um, ist es Indonesien (und Monaco) – Rot über Weiß.",
      factEn: "Remember: white is on TOP. Flip it and you get Indonesia (and Monaco) – red over white.",
    },
    {
      id: "hr", flag: "🇭🇷", es: "Croacia", de: "Kroatien", en: "Croatia",
      region: "mundo", capital: "Zagreb", colors: "Rot · Weiß · Blau", colorsEn: "Red · White · Blue",
      sym: "Rot-Weiß-Blau waagerecht (panslawisch), in der Mitte das rot-weiße Schachbrett-Wappen „šahovnica“ mit einer Krone aus fünf Regionalschilden.",
      symEn: "Red-white-blue horizontal (pan-Slavic) with the red-and-white chequy „šahovnica“ shield in the centre, crowned by five regional emblems.",
      fact: "Das rot-weiße Schachbrett ist Kroatiens Markenzeichen – man sieht es auch auf den Trikots der Fußball-Nationalmannschaft.",
      factEn: "The red-and-white chequerboard is Croatia's hallmark – you also see it on the football team's shirts.",
    },
    {
      id: "cn", flag: "🇨🇳", es: "China", de: "China", en: "China",
      region: "mundo", capital: "Pekín", colors: "Rot · Gelb", colorsEn: "Red · Yellow",
      sym: "Rotes Feld, oben links ein großer goldener Stern und vier kleinere im Bogen: Rot für die Revolution, der große Stern für die Partei, die vier kleinen für das geeinte Volk.",
      symEn: "A red field with one large golden star and four smaller ones in an arc in the upper hoist: red for the revolution, the big star for the Party, the four small stars for the united people.",
      fact: "Die vier kleinen Sterne neigen sich alle dem großen zu – das soll Einheit und Zusammenhalt ausdrücken.",
      factEn: "The four small stars all tilt toward the large one – meant to express unity and cohesion.",
    },
    {
      id: "kr", flag: "🇰🇷", es: "Corea del Sur", de: "Südkorea", en: "South Korea",
      region: "mundo", capital: "Seúl", colors: "Weiß · Rot · Blau · Schwarz", colorsEn: "White · Red · Blue · Black",
      sym: "Weißes Feld mit dem rot-blauen „Taegeuk“ (Yin-Yang) in der Mitte und vier schwarzen Trigrammen in den Ecken – Himmel, Erde, Wasser, Feuer.",
      symEn: "A white field with the red-and-blue „Taegeuk“ (yin-yang) in the centre and four black trigrams in the corners – heaven, earth, water and fire.",
      fact: "Weiß steht für Frieden und Reinheit, der Kreis für das Gleichgewicht der Gegensätze – kaum eine Flagge ist so philosophisch.",
      factEn: "White stands for peace and purity, the circle for the balance of opposites – few flags are so philosophical.",
    },
    {
      id: "in", flag: "🇮🇳", es: "India", de: "Indien", en: "India",
      region: "mundo", capital: "Nueva Delhi", colors: "Safran · Weiß · Grün", colorsEn: "Saffron · White · Green",
      sym: "Safran, Weiß und Grün waagerecht, mittig das blaue 24-speichige „Ashoka-Rad“: Safran für Mut, Weiß für Wahrheit, Grün für Fruchtbarkeit.",
      symEn: "Saffron, white and green horizontal bands with the blue 24-spoke „Ashoka Chakra“ in the centre: saffron for courage, white for truth, green for fertility.",
      fact: "Das Rad ist das „Rad des Gesetzes“ (Dharma); seine 24 Speichen stehen für die Stunden eines Tages – ein Aufruf, in Bewegung zu bleiben.",
      factEn: "The wheel is the „wheel of law“ (dharma); its 24 spokes stand for the hours of a day – a call to keep moving forward.",
    },
    {
      id: "vn", flag: "🇻🇳", es: "Vietnam", de: "Vietnam", en: "Vietnam",
      region: "mundo", capital: "Hanói", colors: "Rot · Gelb", colorsEn: "Red · Yellow",
      sym: "Rotes Feld mit einem großen gelben fünfzackigen Stern in der Mitte – Rot für Revolution und Blut, der Stern für das geeinte Volk.",
      symEn: "A red field with one large yellow five-pointed star in the centre – red for revolution and blood, the star for the united people.",
      fact: "Die fünf Zacken werden oft den Arbeitern, Bauern, Soldaten, Intellektuellen und der Jugend zugeordnet.",
      factEn: "The five points are often assigned to workers, farmers, soldiers, intellectuals and the youth.",
    },
    {
      id: "id", flag: "🇮🇩", es: "Indonesia", de: "Indonesien", en: "Indonesia",
      region: "mundo", capital: "Yakarta", colors: "Rot · Weiß", colorsEn: "Red · White",
      sym: "Zwei gleich breite Streifen, Rot über Weiß – Rot für den Mut, Weiß für die Reinheit. „Sang Saka Merah-Putih“.",
      symEn: "Two equal bands, red over white – red for courage, white for purity. „Sang Saka Merah-Putih“.",
      fact: "Praktisch identisch mit Monaco (nur etwas höher) und das genaue Gegenteil von Polen (Weiß über Rot).",
      factEn: "Practically identical to Monaco (just a little taller) and the exact opposite of Poland (white over red).",
    },
    {
      id: "za", flag: "🇿🇦", es: "Sudáfrica", de: "Südafrika", en: "South Africa",
      region: "mundo", capital: "Pretoria", colors: "Grün · Rot · Blau · Schwarz · Weiß · Gold", colorsEn: "Green · Red · Blue · Black · White · Gold",
      sym: "Ein grünes Y legt sich über die Flagge und führt zwei Arme (Rot oben, Blau unten) zu einem zusammen; am Mast ein schwarzes Dreieck, alles weiß-golden gesäumt.",
      symEn: "A green Y-shape lays over the flag, merging two arms (red above, blue below) into one; a black triangle sits at the hoist, all edged in white and gold.",
      fact: "Das zusammenlaufende Y steht für viele Wege, die zu einem werden – das Sinnbild der „Regenbogennation“ nach der Apartheid.",
      factEn: "The converging Y stands for many paths becoming one – the emblem of the post-apartheid „Rainbow Nation“.",
    },
    {
      id: "nz", flag: "🇳🇿", es: "Nueva Zelanda", de: "Neuseeland", en: "New Zealand",
      region: "mundo", capital: "Wellington", colors: "Blau · Rot · Weiß", colorsEn: "Blue · Red · White",
      sym: "Blaue Flagge mit dem Union Jack oben links und vier roten, weiß umrandeten Sternen des Kreuzes des Südens zum Flugende.",
      symEn: "A blue flag with the Union Jack in the upper hoist and the four red, white-bordered stars of the Southern Cross on the fly.",
      fact: "Fast wie Australien – aber Neuseeland hat NUR das Kreuz des Südens (vier rote Sterne), keinen großen Commonwealth-Stern.",
      factEn: "Almost like Australia – but New Zealand has ONLY the Southern Cross (four red stars), no large Commonwealth star.",
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
