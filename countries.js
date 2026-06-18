/*
 * countries.js  (SC.countries) – Modell für die Infoseite "Länderkunde".
 * REINE DATEN, keine Logik (wie data.js). Wird von ui.renderInfo gerendert,
 * der Controller (app.js) wählt per Dropdown ein Land aus.
 *
 * Region:  einer von REGIONS (Reihenfolge im Dropdown = Reihenfolge hier).
 * Land:    { id, name, flag, region, capital, tagline,
 *            about, history, language, words:[{es,de}],
 *            food:[Gericht], drink:[Gericht], sports, tip }
 * sports:  { intro, popular:[{name,note}], athletes:[{name,sport,note}] }
 *   intro    = ein, zwei Sätze: was das Land sportlich bewegt
 *   popular  = beliebteste Sportarten (Name + Kurznotiz)
 *   athletes = prägende Sportler (Name + Disziplin + ein Satz)
 *   …En-Felder (introEn, nameEn, noteEn, sportEn) liefern die englische Fassung;
 *   Eigennamen ohne …En bleiben sprachunabhängig (siehe localizeDeep).
 * Gericht: { name, desc, long, ingredients, origin, occasions, order, img }
 *   desc        = kurze Zeile (Akkordeon-Kopf)
 *   long        = ausführliche Beschreibung (aufgeklappt)
 *   ingredients = Hauptzutaten
 *   origin      = Herkunft/Geschichte
 *   occasions   = typische Anlässe
 *   order       = spanischer Bestellsatz
 *   img         = Bild-URL (Wikimedia/Wikipedia); leer = kein Bild.
 *                 Offline/bei Fehler wird das Bild ausgeblendet (onerror in ui.js).
 *
 * HINWEIS: Diese Datei wird aus Basisdaten + Detailtexten + Bild-URLs generiert
 * (tmp_build_countries.js). Inhalte können hier aber direkt gepflegt werden.
 */
(function () {
  "use strict";

  const REGIONS = ["Mittelamerika","Karibik","Südamerika"];

  const LIST = [
    {
      "id": "mexico",
      "sports": {
        "intro": "Fußball ist die unangefochtene Nummer eins – die Liga MX füllt riesige Stadien, und die ‚El Tri'-Nationalelf eint das Land. Daneben haben Boxen und die spektakuläre Lucha Libre Kultstatus, im Norden wird Baseball gespielt.",
        "introEn": "Football is the undisputed number one – Liga MX fills huge stadiums and the ‘El Tri' national team unites the country. Boxing and the spectacular Lucha Libre have cult status too, and the north plays baseball.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1 mit fanatischer Liga-MX-Kultur.", "noteEn": "The number-one sport, with a fanatical Liga MX culture." },
          { "name": "Boxen", "nameEn": "Boxing", "note": "Große Tradition mit zahlreichen Weltmeistern.", "noteEn": "A great tradition with many world champions." },
          { "name": "Lucha Libre", "nameEn": "Lucha Libre", "note": "Maskenkampf-Spektakel, halb Sport, halb Show.", "noteEn": "A masked-wrestling spectacle, half sport, half show." }
        ],
        "athletes": [
          { "name": "Saúl „Canelo“ Álvarez", "sport": "Boxen", "sportEn": "Boxing", "note": "Mehrfacher Weltmeister und einer der besten Boxer der Gegenwart.", "noteEn": "Multiple world champion and one of the best boxers of today." },
          { "name": "Hugo Sánchez", "sport": "Fußball", "sportEn": "Football", "note": "Tor-Legende von Real Madrid, Mexikos berühmtester Fußballer.", "noteEn": "Goal-scoring legend at Real Madrid, Mexico's most famous footballer." },
          { "name": "Javier „Chicharito“ Hernández", "sport": "Fußball", "sportEn": "Football", "note": "Rekordtorschütze der Nationalmannschaft, spielte u. a. für Manchester United.", "noteEn": "Record scorer for the national team, who played for Manchester United among others." }
        ]
      },
      "name": "Mexiko",
      "flag": "🇲🇽",
      "region": "Mittelamerika",
      "capital": "Mexiko-Stadt",
      "tagline": "Tacos, Maya-Ruinen und endlose Karibikstrände",
      "taglineEn": "Tacos, Maya ruins and endless Caribbean beaches",
      "population": "Rund 132 Millionen Menschen (2025) – das bevölkerungsreichste spanischsprachige Land der Welt.",
      "populationEn": "Around 132 million people (2025) – the most populous Spanish-speaking country in the world.",
      "ageStructure": "Noch junge, aber langsam alternde Bevölkerung mit einem Medianalter von etwa 31 Jahren.",
      "ageStructureEn": "A still young but slowly ageing population with a median age of about 31.",
      "government": "Föderale präsidentielle Republik aus 31 Bundesstaaten und der Hauptstadt Mexiko-Stadt; das Staatsoberhaupt wird für sechs Jahre gewählt und nie wiedergewählt.",
      "governmentEn": "A federal presidential republic of 31 states plus the capital, Mexico City; the head of state is elected for six years and never re-elected.",
      "economy": "Zweitgrößte Volkswirtschaft Lateinamerikas und eng mit den USA verflochten; wachsende Mittelschicht, aber starke regionale Ungleichheit.",
      "economyEn": "The second-largest economy in Latin America, closely intertwined with the USA; a growing middle class but strong regional inequality.",
      "livelihood": "Industrie (Auto- und Elektronikfertigung), Erdöl, Tourismus sowie Überweisungen (remesas) von Auswanderern in den USA.",
      "livelihoodEn": "Industry (car and electronics manufacturing), oil, tourism and remittances (remesas) from emigrants in the USA.",
      "about": "Mexiko ist das nördlichste Land Lateinamerikas mit über 9.000 km Küste an Pazifik und Karibik. Backpacker zieht es zu den Maya-Ruinen von Yucatán, den Cenoten, kolonialen Städten wie Oaxaca und dem pulsierenden Mexiko-Stadt. Wüsten, Vulkane und Dschungel machen die Geografie extrem vielfältig.",
      "aboutEn": "Mexico is the northernmost country in Latin America, with over 9,000 km of coastline along the Pacific and the Caribbean. Backpackers are drawn to the Maya ruins of Yucatán, the cenotes, colonial cities like Oaxaca and the buzzing Mexico City. Deserts, volcanoes and jungle make for an extremely varied landscape.",
      "history": "Vor der Eroberung blühten hier die Hochkulturen der Olmeken, Maya und Azteken. 1521 unterwarf Hernán Cortés das Aztekenreich, woraufhin drei Jahrhunderte spanische Kolonialherrschaft folgten. 1810 begann der Unabhängigkeitskampf, 1821 wurde Mexiko unabhängig. Die Revolution von 1910 prägt bis heute das nationale Selbstverständnis.",
      "historyEn": "Before the conquest, the advanced civilisations of the Olmecs, Maya and Aztecs flourished here. In 1521 Hernán Cortés subjugated the Aztec Empire, ushering in three centuries of Spanish colonial rule. The struggle for independence began in 1810, and Mexico became independent in 1821. The Revolution of 1910 still shapes the country's national identity today.",
      "language": "Das mexikanische Spanisch gilt als klar und gut verständlich, mit weichem Tonfall. Voseo gibt es nicht – man verwendet 'tú'. Typisch sind viele Nahuatl-Lehnwörter wie 'chocolate', 'tomate' oder 'aguacate'. Neben Spanisch werden noch rund 68 indigene Sprachen gesprochen, vor allem Nahuatl und Maya.",
      "languageEn": "Mexican Spanish is considered clear and easy to understand, with a gentle lilt. There's no voseo – people use 'tú'. It's full of Nahuatl loanwords like 'chocolate', 'tomate' and 'aguacate'. Alongside Spanish, some 68 indigenous languages are spoken, above all Nahuatl and Maya.",
      "words": [
        {
          "es": "¿Qué onda?",
          "de": "Was geht? (lockere Begrüßung)",
          "en": "What's up? (casual greeting)"
        },
        {
          "es": "¡Órale!",
          "de": "Wow! / Los geht's! (vielseitiger Ausruf)",
          "en": "Wow! / Let's go! (versatile exclamation)"
        },
        {
          "es": "chido",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "güey",
          "de": "Alter, Kumpel (sehr umgangssprachlich)",
          "en": "mate, dude (very colloquial)"
        },
        {
          "es": "ahorita",
          "de": "gleich / sofort (oft eher vage)",
          "en": "in a bit / right away (often rather vague)"
        },
        {
          "es": "no manches",
          "de": "echt jetzt? / krass!",
          "en": "no way? / wild!"
        }
      ],
      "food": [
        {
          "name": "Tacos al pastor",
          "desc": "Mariniertes Schweinefleisch vom Drehspieß mit Ananas, auf Maistortilla.",
          "descEn": "Marinated pork from the spit with pineapple, on a corn tortilla.",
          "long": "Dünn geschnittenes, mariniertes Schweinefleisch, das auf einem vertikalen Drehspieß (trompo) gegart und mit einem Stück Ananas gekrönt wird. Serviert auf kleinen Maistortillas mit Koriander, Zwiebeln und Salsa, oft direkt vom Stand. Saftig, leicht süßlich-würzig und unwiderstehlich aromatisch.",
          "longEn": "Thinly sliced, marinated pork, cooked on a vertical spit (trompo) and crowned with a piece of pineapple. Served on small corn tortillas with coriander, onions and salsa, often straight from the stall. Juicy, slightly sweet-savoury and irresistibly fragrant.",
          "ingredients": "Maistortilla, mariniertes Schweinefleisch, Ananas, Koriander, Zwiebeln, Salsa, Limette",
          "ingredientsEn": "Corn tortilla, marinated pork, pineapple, coriander, onions, salsa, lime",
          "origin": "Entstanden im 20. Jahrhundert durch libanesische Einwanderer, die das Drehspieß-Prinzip des Shawarma nach Mexiko brachten und an lokale Zutaten anpassten.",
          "originEn": "Created in the 20th century by Lebanese immigrants, who brought the spit-roasting principle of the shawarma to Mexico and adapted it to local ingredients.",
          "occasions": "Klassisches Streetfood, das man vor allem abends und nachts an Taquerías genießt.",
          "occasionsEn": "Classic street food, enjoyed above all in the evening and at night at taquerías.",
          "order": "Una orden de tacos al pastor, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/%28El_Flaco%29_Al_Pastor_Tacos.jpg/960px-%28El_Flaco%29_Al_Pastor_Tacos.jpg"
        },
        {
          "name": "Mole poblano",
          "desc": "Komplexe Sauce aus Chili und Schokolade, meist über Hähnchen.",
          "descEn": "A complex sauce of chilli and chocolate, usually over chicken.",
          "long": "Eine dunkle, komplexe Sauce aus Dutzenden Zutaten, darunter Chilischoten und Schokolade, traditionell über Hühnchen oder Truthahn serviert. Sie schmeckt vielschichtig: würzig, leicht bitter, süßlich und tiefgründig. Gilt als eines der Nationalgerichte Mexikos.",
          "longEn": "A dark, complex sauce of dozens of ingredients, including chillies and chocolate, traditionally served over chicken or turkey. It tastes multi-layered: spicy, slightly bitter, sweetish and deep. Regarded as one of Mexico's national dishes.",
          "ingredients": "Verschiedene Chilis, Schokolade, Gewürze, Nüsse und Samen, Tomaten, Brot, Hühnchen oder Truthahn",
          "ingredientsEn": "Various chillies, chocolate, spices, nuts and seeds, tomatoes, bread, chicken or turkey",
          "origin": "Stammt aus dem Bundesstaat Puebla; der Legende nach in einem Kloster erfunden, vereint die Sauce indigene und spanische Einflüsse.",
          "originEn": "From the state of Puebla; according to legend invented in a convent, the sauce brings together indigenous and Spanish influences.",
          "occasions": "Festtagsgericht zu besonderen Anlässen wie Hochzeiten, Taufen und religiösen Feiern.",
          "occasionsEn": "A celebration dish for special occasions such as weddings, christenings and religious feasts.",
          "order": "Quisiera el pollo con mole poblano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Mole_in_Puebla.JPG/960px-Mole_in_Puebla.JPG"
        },
        {
          "name": "Tamales",
          "desc": "Gedämpfter Maisteig mit Füllung, in Maisblättern gegart.",
          "descEn": "Steamed corn dough with a filling, cooked in corn husks.",
          "long": "In Mais- oder Bananenblätter gewickelte und gedämpfte Maisteigtaschen, gefüllt mit Fleisch, Käse, Chili oder süßen Zutaten. Die Hülle wird vor dem Essen abgelöst. Weich, herzhaft oder süß und wunderbar sättigend.",
          "longEn": "Pockets of corn dough wrapped in corn or banana leaves and steamed, filled with meat, cheese, chilli or sweet ingredients. The wrapper is peeled off before eating. Soft, savoury or sweet and wonderfully filling.",
          "ingredients": "Maisteig (masa), Schmalz, Füllung (Fleisch, Chili, Käse oder Süßes), Mais- oder Bananenblätter",
          "ingredientsEn": "Corn dough (masa), lard, filling (meat, chilli, cheese or sweet), corn or banana leaves",
          "origin": "Ein präkolumbisches Gericht mit Jahrtausende alter Tradition, das in ganz Mesoamerika verbreitet war.",
          "originEn": "A pre-Columbian dish with a tradition thousands of years old, once found all over Mesoamerica.",
          "occasions": "Beliebtes Frühstück und Festessen, besonders zum Día de la Candelaria und an Weihnachten.",
          "occasionsEn": "A popular breakfast and feast dish, especially for the Día de la Candelaria and at Christmas.",
          "order": "Me da dos tamales, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Tamales_mexicanos.jpg"
        },
        {
          "name": "Chiles en nogada",
          "desc": "Gefüllte Paprika mit Walnusssauce und Granatapfel in Nationalfarben.",
          "descEn": "Stuffed peppers with walnut sauce and pomegranate in the national colours.",
          "long": "Gefüllte Poblano-Chilis mit einer cremigen Walnusssauce und Granatapfelkernen, die die Farben der mexikanischen Flagge zeigen. Die Füllung aus Hackfleisch und Früchten macht das Gericht süß-herzhaft. Optisch beeindruckend und festlich.",
          "longEn": "Stuffed poblano chillies with a creamy walnut sauce and pomegranate seeds, showing the colours of the Mexican flag. The filling of mince and fruit makes the dish sweet and savoury. Striking to look at and festive.",
          "ingredients": "Poblano-Chilis, Hackfleisch mit Früchten (picadillo), Walnusssauce (nogada), Granatapfelkerne, Petersilie",
          "ingredientsEn": "Poblano chillies, mince with fruit (picadillo), walnut sauce (nogada), pomegranate seeds, parsley",
          "origin": "Stammt aus Puebla und wird mit der Feier der mexikanischen Unabhängigkeit in Verbindung gebracht; die Farben symbolisieren die Nationalflagge.",
          "originEn": "From Puebla and associated with the celebration of Mexican independence; the colours symbolise the national flag.",
          "occasions": "Saisongericht, das vor allem im Spätsommer rund um den Unabhängigkeitstag im September gegessen wird.",
          "occasionsEn": "A seasonal dish eaten above all in late summer around Independence Day in September.",
          "order": "Quisiera unos chiles en nogada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Chile_relleno_en_nogada_con_granada.jpg/960px-Chile_relleno_en_nogada_con_granada.jpg"
        },
        {
          "name": "Pozole",
          "desc": "Herzhafter Eintopf aus Hominy-Mais und Fleisch.",
          "descEn": "A hearty stew of hominy corn and meat.",
          "long": "Ein herzhafter Eintopf aus großen Maiskörnern (Hominy) und Fleisch, meist Schwein, in würziger Brühe. Wird mit Salat, Rettich, Zwiebeln, Limette und Chili am Tisch garniert. Wärmend, sättigend und sehr aromatisch.",
          "longEn": "A hearty stew of large corn kernels (hominy) and meat, usually pork, in a spicy broth. Garnished at the table with salad, radish, onions, lime and chilli. Warming, filling and very aromatic.",
          "ingredients": "Hominy-Mais, Schweine- oder Hühnerfleisch, Chili, Garnituren (Salat, Rettich, Zwiebeln, Limette, Oregano)",
          "ingredientsEn": "Hominy corn, pork or chicken, chilli, garnishes (salad, radish, onions, lime, oregano)",
          "origin": "Ein Gericht mit präkolumbischen Wurzeln, das einst rituelle Bedeutung hatte und bis heute zur mexikanischen Festkultur gehört.",
          "originEn": "A dish with pre-Columbian roots that once held ritual significance and is still part of Mexican festive culture today.",
          "occasions": "Typisches Wochenend- und Feiertagsessen, oft an Nationalfeiertagen und zu Familienfeiern.",
          "occasionsEn": "A typical weekend and holiday meal, often on national holidays and at family gatherings.",
          "order": "Un pozole rojo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Pozole_rojo_%282017%29.jpg"
        },
        {
          "name": "Cochinita pibil",
          "desc": "Langsam gegartes, in Achiote mariniertes Schweinefleisch aus Yucatán.",
          "descEn": "Slow-cooked pork from Yucatán, marinated in achiote.",
          "long": "Langsam gegartes Schweinefleisch, mariniert in Achiote und Bitterorangensaft, traditionell in Bananenblättern gegart. Das Fleisch wird butterzart und intensiv würzig mit erdig-säuerlicher Note. Serviert mit eingelegten roten Zwiebeln und Tortillas.",
          "longEn": "Slow-cooked pork, marinated in achiote and bitter-orange juice, traditionally cooked in banana leaves. The meat turns meltingly tender and intensely spiced with an earthy, tangy note. Served with pickled red onions and tortillas.",
          "ingredients": "Schweinefleisch, Achiote (Annatto), Bitterorangensaft, Bananenblätter, eingelegte rote Zwiebeln, Habanero",
          "ingredientsEn": "Pork, achiote (annatto), bitter-orange juice, banana leaves, pickled red onions, habanero",
          "origin": "Ein traditionelles Gericht der Halbinsel Yucatán mit Maya-Wurzeln; 'pibil' verweist auf das Garen in einer Erdgrube.",
          "originEn": "A traditional dish of the Yucatán peninsula with Maya roots; 'pibil' refers to cooking in an earth pit.",
          "occasions": "Beliebtes Sonntagsgericht und Festessen, oft als Taco-Füllung serviert.",
          "occasionsEn": "A popular Sunday dish and feast food, often served as a taco filling.",
          "order": "Unos tacos de cochinita pibil, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Cochinita_pibil_2.jpg/960px-Cochinita_pibil_2.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mezcal",
          "desc": "Rauchiger Agavenbrand, traditionell pur mit Orange und Wurmsalz getrunken.",
          "descEn": "A smoky agave spirit, traditionally drunk neat with orange and worm salt.",
          "long": "Eine destillierte Spirituose aus dem Herzen der Agave, bekannt für ihren charakteristisch rauchigen Geschmack. Wird oft pur in kleinen Schlucken mit Orangenscheiben und Wurmsalz (sal de gusano) getrunken. Komplex, erdig und kräftig.",
          "longEn": "A distilled spirit from the heart of the agave, known for its distinctively smoky flavour. Often drunk neat in small sips with orange slices and worm salt (sal de gusano). Complex, earthy and strong.",
          "ingredients": "Agave (oft Espadín), Wasser; traditionell begleitet von Orange und sal de gusano",
          "ingredientsEn": "Agave (often Espadín), water; traditionally accompanied by orange and sal de gusano",
          "origin": "Stammt überwiegend aus dem Bundesstaat Oaxaca, wo die Agave in Erdöfen geröstet wird, was den rauchigen Charakter erzeugt.",
          "originEn": "Mostly from the state of Oaxaca, where the agave is roasted in earth ovens, which creates its smoky character.",
          "occasions": "Getränk für gesellige Abende und Feiern, oft langsam genippt statt geschossen.",
          "occasionsEn": "A drink for sociable evenings and celebrations, often sipped slowly rather than downed as a shot.",
          "order": "Un mezcal, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Mezcal_bottles_.jpg/960px-Mezcal_bottles_.jpg"
        },
        {
          "name": "Tequila",
          "desc": "Berühmter Agavenbrand aus der Region Jalisco.",
          "descEn": "A famous agave spirit from the Jalisco region.",
          "long": "Eine Spirituose aus der blauen Agave, je nach Reifung von klar (blanco) bis goldbraun (añejo). Wird pur, als Shot mit Salz und Limette oder in Cocktails wie der Margarita getrunken. Kräftig und je nach Sorte mild bis komplex.",
          "longEn": "A spirit made from blue agave, ranging from clear (blanco) to golden-brown (añejo) depending on its ageing. Drunk neat, as a shot with salt and lime, or in cocktails like the margarita. Strong and, depending on the type, mild to complex.",
          "ingredients": "Blaue Agave, Wasser; klassisch begleitet von Salz und Limette",
          "ingredientsEn": "Blue agave, water; classically accompanied by salt and lime",
          "origin": "Benannt nach der Stadt Tequila im Bundesstaat Jalisco und durch eine geschützte Herkunftsbezeichnung definiert.",
          "originEn": "Named after the town of Tequila in the state of Jalisco and defined by a protected designation of origin.",
          "occasions": "Beliebt bei Feiern und Partys, sowohl als Shot als auch in Cocktails.",
          "occasionsEn": "Popular at celebrations and parties, both as a shot and in cocktails.",
          "order": "Un tequila, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/15-09-26-RalfR-WLC-0244.jpg/960px-15-09-26-RalfR-WLC-0244.jpg"
        },
        {
          "name": "Horchata",
          "desc": "Süßes, erfrischendes Reisgetränk mit Zimt.",
          "descEn": "A sweet, refreshing rice drink with cinnamon.",
          "long": "Ein erfrischendes, milchig-weißes Getränk aus eingeweichtem Reis, gesüßt und mit Zimt verfeinert. Wird gut gekühlt serviert und schmeckt cremig-süß. In Mexiko eines der klassischen aguas frescas.",
          "longEn": "A refreshing, milky-white drink of soaked rice, sweetened and flavoured with cinnamon. Served well chilled, it tastes creamy and sweet. In Mexico it's one of the classic aguas frescas.",
          "ingredients": "Reis, Zucker, Zimt, Wasser, manchmal Vanille oder Milch",
          "ingredientsEn": "Rice, sugar, cinnamon, water, sometimes vanilla or milk",
          "origin": "Geht auf ein spanisches Getränk zurück, das in Mexiko in einer Reisvariante populär wurde.",
          "originEn": "Derived from a Spanish drink that became popular in Mexico in a rice version.",
          "occasions": "Erfrischung zu herzhaften Speisen und an heißen Tagen.",
          "occasionsEn": "A refresher with savoury food and on hot days.",
          "order": "Un agua de horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Agua de Jamaica",
          "desc": "Erfrischender Eistee aus Hibiskusblüten.",
          "descEn": "A refreshing iced tea made from hibiscus flowers.",
          "long": "Ein leuchtend rotes, erfrischendes Getränk aus getrockneten Hibiskusblüten, gesüßt und gekühlt serviert. Schmeckt angenehm säuerlich-fruchtig, ähnlich wie Cranberry. Eines der beliebtesten aguas frescas Mexikos.",
          "longEn": "A bright-red, refreshing drink of dried hibiscus flowers, sweetened and served chilled. It tastes pleasantly tart and fruity, rather like cranberry. One of Mexico's most popular aguas frescas.",
          "ingredients": "Getrocknete Hibiskusblüten (Jamaica), Zucker, Wasser",
          "ingredientsEn": "Dried hibiscus flowers (Jamaica), sugar, water",
          "origin": "Die Hibiskuspflanze gelangte über Handelswege nach Mexiko, wo das Getränk zu einem festen Bestandteil der aguas frescas wurde.",
          "originEn": "The hibiscus plant reached Mexico via trade routes, where the drink became a fixture of the aguas frescas.",
          "occasions": "Erfrischung zum Essen, besonders an warmen Tagen und in Fondas.",
          "occasionsEn": "A refresher with food, especially on warm days and in fondas.",
          "order": "Un agua de Jamaica, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/A_glass_of_hibiscus_tea_01.jpg/960px-A_glass_of_hibiscus_tea_01.jpg"
        }
      ],
      "tip": "Trinke nur abgefülltes oder gefiltertes Wasser – auch beim Zähneputzen.",
      "tipEn": "Only drink bottled or filtered water, even when brushing your teeth."
    },
    {
      "id": "guatemala",
      "sports": {
        "intro": "Fußball ist mit Abstand der beliebteste Sport, doch international machte Guatemala vor allem im Gehen auf sich aufmerksam – mit der ersten olympischen Medaille des Landes.",
        "introEn": "Football is by far the most popular sport, but internationally Guatemala made its mark above all in race walking – with the country's first Olympic medal.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Der populärste Sport, mit Clubs wie Municipal und Comunicaciones.", "noteEn": "The most popular sport, with clubs like Municipal and Comunicaciones." },
          { "name": "Gehen (Leichtathletik)", "nameEn": "Race walking", "note": "Guatemalas internationale Vorzeigedisziplin.", "noteEn": "Guatemala's flagship international discipline." }
        ],
        "athletes": [
          { "name": "Érick Barrondo", "sport": "Gehen", "sportEn": "Race walking", "note": "Gewann 2012 mit Olympiasilber die erste olympische Medaille Guatemalas.", "noteEn": "Won Guatemala's first-ever Olympic medal, silver in 2012." },
          { "name": "Carlos Ruiz „El Pescadito“", "sport": "Fußball", "sportEn": "Football", "note": "Rekordtorschütze der Nationalmannschaft und nationale Ikone.", "noteEn": "Record scorer for the national team and a national icon." }
        ]
      },
      "name": "Guatemala",
      "flag": "🇬🇹",
      "region": "Mittelamerika",
      "capital": "Guatemala-Stadt",
      "tagline": "Vulkane, Maya-Kultur und der türkisfarbene Atitlán-See",
      "taglineEn": "Volcanoes, Maya culture and the turquoise Lake Atitlán",
      "population": "Rund 18 Millionen Einwohner (2025) – nach Mexiko das bevölkerungsreichste Land Mittelamerikas.",
      "populationEn": "Around 18 million inhabitants (2025) – after Mexico the most populous country in Central America.",
      "ageStructure": "Sehr junge Bevölkerung mit einem Medianalter von nur etwa 23 Jahren und hohem Anteil indigener Maya.",
      "ageStructureEn": "A very young population with a median age of only about 23 and a high proportion of indigenous Maya.",
      "government": "Präsidentielle Republik; der Präsident wird für vier Jahre gewählt und darf nicht wiedergewählt werden.",
      "governmentEn": "A presidential republic; the president is elected for four years and may not be re-elected.",
      "economy": "Nach Mexiko die größte Volkswirtschaft Mittelamerikas, aber mit hoher Armut und großer Einkommensungleichheit.",
      "economyEn": "After Mexico the largest economy in Central America, but with high poverty and great income inequality.",
      "livelihood": "Landwirtschaft (Kaffee, Zucker, Bananen, Kardamom), Textilindustrie und Überweisungen aus dem Ausland.",
      "livelihoodEn": "Agriculture (coffee, sugar, bananas, cardamom), the textile industry and remittances from abroad.",
      "about": "Guatemala ist das Herz der Maya-Welt mit über 30 Vulkanen, dichtem Regenwald und dem kolonialen Juwel Antigua. Backpacker lieben den Atitlán-See, die Ruinen von Tikal und die Vulkanwanderung zum aktiven Acatenango. Das Hochland ist kühl, die Küsten tropisch-heiß.",
      "aboutEn": "Guatemala is the heart of the Maya world, with over 30 volcanoes, dense rainforest and the colonial gem of Antigua. Backpackers love Lake Atitlán, the ruins of Tikal and the volcano hike up the active Acatenango. The highlands are cool and the coasts tropically hot.",
      "history": "Guatemala war Zentrum der klassischen Maya-Zivilisation, deren größte Stadt Tikal war. 1524 eroberte Pedro de Alvarado die Region für Spanien. 1821 wurde das Land unabhängig, später folgte ein brutaler Bürgerkrieg (1960–1996). Die indigene Maya-Bevölkerung macht bis heute einen großen Teil der Gesellschaft aus.",
      "historyEn": "Guatemala was the centre of the classic Maya civilisation, whose largest city was Tikal. In 1524 Pedro de Alvarado conquered the region for Spain. The country became independent in 1821, and a brutal civil war (1960–1996) followed later. The indigenous Maya population still makes up a large part of society today.",
      "language": "Das guatemaltekische Spanisch wird langsam und deutlich gesprochen, ideal für Lernende. Voseo ist verbreitet – statt 'tú' hört man oft 'vos'. Daneben werden über 20 Maya-Sprachen wie K'iche', Kaqchikel und Mam gesprochen. Viele Indigene sprechen Spanisch als Zweitsprache.",
      "languageEn": "Guatemalan Spanish is spoken slowly and clearly, ideal for learners. Voseo is common – instead of 'tú' you often hear 'vos'. Alongside it, more than 20 Maya languages such as K'iche', Kaqchikel and Mam are spoken. Many indigenous people speak Spanish as a second language.",
      "words": [
        {
          "es": "¡Qué chilero!",
          "de": "Wie cool! / Super!",
          "en": "How cool! / Great!"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú', sehr verbreitet)",
          "en": "you (instead of 'tú', very common)"
        },
        {
          "es": "cerote",
          "de": "Kumpel (derb-freundschaftlich)",
          "en": "mate (crude but friendly)"
        },
        {
          "es": "chapín",
          "de": "Guatemalteke/in (Spitzname)",
          "en": "Guatemalan (nickname)"
        },
        {
          "es": "patojo",
          "de": "Kind, junger Mensch",
          "en": "kid, young person"
        },
        {
          "es": "¡Púchica!",
          "de": "Mensch! / Verflixt! (milder Ausruf)",
          "en": "Gosh! / Darn it! (mild exclamation)"
        }
      ],
      "food": [
        {
          "name": "Pepián",
          "desc": "Würziger Eintopf aus Fleisch, Gemüse und gerösteten Samen, ein Nationalgericht.",
          "descEn": "A spicy stew of meat, vegetables and roasted seeds, a national dish.",
          "long": "Ein dicker, würziger Eintopf aus Fleisch in einer Sauce aus gerösteten Samen, Gewürzen und Chilis. Die Röstung verleiht ihm eine tiefe, erdige Note. Wird meist mit Reis und Tortillas serviert.",
          "longEn": "A thick, spicy stew of meat in a sauce of roasted seeds, spices and chillies. The roasting gives it a deep, earthy note. Usually served with rice and tortillas.",
          "ingredients": "Hühner- oder Rindfleisch, Kürbis- und Sesamsamen, Tomaten, Chilis, Gewürze, Reis",
          "ingredientsEn": "Chicken or beef, pumpkin and sesame seeds, tomatoes, chillies, spices, rice",
          "origin": "Gilt als eines der ältesten Gerichte Guatemalas mit Maya-Wurzeln und vereint indigene und spanische Einflüsse.",
          "originEn": "Considered one of Guatemala's oldest dishes, with Maya roots, bringing together indigenous and Spanish influences.",
          "occasions": "Festliches Gericht zu besonderen Anlässen und Familienfeiern.",
          "occasionsEn": "A festive dish for special occasions and family gatherings.",
          "order": "Un pepián de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cocinando_El_Pepian.jpg/960px-Cocinando_El_Pepian.jpg"
        },
        {
          "name": "Tamales colorados",
          "desc": "Maisteig mit Fleisch und roter Sauce, in Bananenblättern gegart.",
          "descEn": "Corn dough with meat and a red sauce, cooked in banana leaves.",
          "long": "In Bananenblätter gewickelte, gedämpfte Maisteigtaschen mit roter, leicht würziger Sauce und einer Füllung aus Fleisch. Die Farbe stammt von Tomaten und Achiote. Weich, herzhaft und festlich.",
          "longEn": "Pockets of corn dough wrapped in banana leaves and steamed, with a red, mildly spicy sauce and a meat filling. The colour comes from tomatoes and achiote. Soft, savoury and festive.",
          "ingredients": "Maisteig (masa), rote Sauce mit Tomaten und Achiote, Hühner- oder Schweinefleisch, Paprika, Oliven, Bananenblätter",
          "ingredientsEn": "Corn dough (masa), red sauce with tomatoes and achiote, chicken or pork, peppers, olives, banana leaves",
          "origin": "Eine guatemaltekische Variante der mesoamerikanischen Tamal-Tradition mit präkolumbischen Wurzeln.",
          "originEn": "A Guatemalan version of the Mesoamerican tamal tradition with pre-Columbian roots.",
          "occasions": "Typisch für Wochenenden, Weihnachten und besondere Feiertage.",
          "occasionsEn": "Typical for weekends, Christmas and special holidays.",
          "order": "Dos tamales colorados, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Tamales_mexicanos.jpg"
        },
        {
          "name": "Kak'ik",
          "desc": "Würzige Truthahnsuppe der Q'eqchi'-Maya mit Achiote und Koriander.",
          "descEn": "A spicy turkey soup of the Q'eqchi' Maya with achiote and coriander.",
          "long": "Eine würzige Truthahnsuppe in einer roten Brühe aus Tomaten, Chilis und Gewürzen. Sie schmeckt kräftig, leicht scharf und aromatisch. Wird mit Reis und Tamalitos serviert.",
          "longEn": "A spicy turkey soup in a red broth of tomatoes, chillies and spices. It tastes rich, mildly hot and aromatic. Served with rice and tamalitos.",
          "ingredients": "Truthahn, Tomaten, Chilis, Koriander, Minze, Achiote, Gewürze",
          "ingredientsEn": "Turkey, tomatoes, chillies, coriander, mint, achiote, spices",
          "origin": "Ein traditionelles Gericht der Q'eqchi'-Maya aus dem Hochland von Alta Verapaz mit langer indigener Geschichte.",
          "originEn": "A traditional dish of the Q'eqchi' Maya from the Alta Verapaz highlands with a long indigenous history.",
          "occasions": "Festtagsgericht zu zeremoniellen und besonderen Anlässen.",
          "occasionsEn": "A celebration dish for ceremonial and special occasions.",
          "order": "Un kak'ik, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/2010.05.13.141849_Kac-iq_Fonda_Calle_Real_Antigua_Guatemala.jpg/960px-2010.05.13.141849_Kac-iq_Fonda_Calle_Real_Antigua_Guatemala.jpg"
        },
        {
          "name": "Hilachas",
          "desc": "Zerzupftes Rindfleisch in Tomaten-Chili-Sauce.",
          "descEn": "Shredded beef in a tomato-and-chilli sauce.",
          "long": "Zerzupftes Rindfleisch in einer Tomatensauce mit Gemüse, deren Name 'Fäden' bedeutet, weil das Fleisch faserig gezupft wird. Schmeckt herzhaft und mild würzig. Wird mit Reis und Tortillas gegessen.",
          "longEn": "Shredded beef in a tomato sauce with vegetables, whose name means 'threads' because the meat is pulled into fibres. It tastes savoury and mildly spiced. Eaten with rice and tortillas.",
          "ingredients": "Zerzupftes Rindfleisch, Tomaten, Kartoffeln, Karotten, Chilis, Gewürze, Reis",
          "ingredientsEn": "Shredded beef, tomatoes, potatoes, carrots, chillies, spices, rice",
          "origin": "Ein traditionelles guatemaltekisches Hausmannsgericht, das spanische und indigene Kocheinflüsse verbindet.",
          "originEn": "A traditional Guatemalan home-cooked dish that combines Spanish and indigenous culinary influences.",
          "occasions": "Beliebtes Mittagessen für Familienanlässe und Wochenenden.",
          "occasionsEn": "A popular lunch for family occasions and weekends.",
          "order": "Unas hilachas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Hilacha.jpg/960px-Hilacha.jpg"
        },
        {
          "name": "Jocón",
          "desc": "Hähnchen in grüner Tomatillo-Koriander-Sauce.",
          "descEn": "Chicken in a green tomatillo-and-coriander sauce.",
          "long": "Ein grüner Eintopf aus Hühnchen in einer Sauce aus Tomatillos, grünem Koriander und Kürbissamen. Die Sauce ist frisch, leicht säuerlich und aromatisch. Serviert mit Reis und Tortillas.",
          "longEn": "A green stew of chicken in a sauce of tomatillos, fresh coriander and pumpkin seeds. The sauce is fresh, slightly tart and aromatic. Served with rice and tortillas.",
          "ingredients": "Hühnchen, Tomatillos, grüne Tomaten, Koriander, Frühlingszwiebeln, Kürbissamen, Reis",
          "ingredientsEn": "Chicken, tomatillos, green tomatoes, coriander, spring onions, pumpkin seeds, rice",
          "origin": "Eines der traditionellen Maya-Gerichte des guatemaltekischen Hochlands.",
          "originEn": "One of the traditional Maya dishes of the Guatemalan highlands.",
          "occasions": "Gericht für Familienessen und besondere Gelegenheiten.",
          "occasionsEn": "A dish for family meals and special occasions.",
          "order": "Un jocón de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/07/Jocon.jpg"
        },
        {
          "name": "Rellenitos",
          "desc": "Frittierte Kochbananen-Bällchen mit süßer Bohnenfüllung.",
          "descEn": "Fried plantain balls with a sweet bean filling.",
          "long": "Süße Bällchen aus Kochbananenteig, gefüllt mit gesüßten schwarzen Bohnen und frittiert. Außen knusprig, innen süß und cremig. Werden mit Zucker bestreut als Dessert oder Snack genossen.",
          "longEn": "Sweet balls of plantain dough, filled with sweetened black beans and deep-fried. Crisp outside, sweet and creamy within. Dusted with sugar and enjoyed as a dessert or snack.",
          "ingredients": "Reife Kochbananen, schwarze Bohnen, Zucker, Zimt, Öl zum Frittieren",
          "ingredientsEn": "Ripe plantains, black beans, sugar, cinnamon, oil for frying",
          "origin": "Eine traditionelle guatemaltekische Süßspeise, die die Kombination aus Kochbananen und Bohnen kreativ nutzt.",
          "originEn": "A traditional Guatemalan sweet that makes creative use of the combination of plantain and beans.",
          "occasions": "Beliebtes Dessert und Nachmittagssnack.",
          "occasionsEn": "A popular dessert and afternoon snack.",
          "order": "Unos rellenitos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Pl%C3%A1tanos_rellenos_en_Para%C3%ADso%2C_Tabasco.jpg/960px-Pl%C3%A1tanos_rellenos_en_Para%C3%ADso%2C_Tabasco.jpg"
        }
      ],
      "drink": [
        {
          "name": "Café guatemalteco",
          "desc": "Weltberühmter Hochlandkaffee mit ausgeprägtem Aroma.",
          "descEn": "World-famous highland coffee with a pronounced aroma.",
          "long": "Hochwertiger Hochlandkaffee, bekannt für sein ausgewogenes Aroma mit fruchtigen und schokoladigen Noten. Wird meist schwarz oder mit etwas Zucker getrunken. Gilt international als Spitzenkaffee.",
          "longEn": "A high-quality highland coffee, known for its balanced aroma with fruity and chocolatey notes. Usually drunk black or with a little sugar. Internationally regarded as a top-class coffee.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "ingredientsEn": "Roasted arabica coffee beans, water",
          "origin": "Guatemala zählt zu den renommiertesten Kaffeeanbauländern der Welt, mit Anbaugebieten wie Antigua und Huehuetenango.",
          "originEn": "Guatemala is among the most renowned coffee-growing countries in the world, with growing regions such as Antigua and Huehuetenango.",
          "occasions": "Getränk für den Morgen und gesellige Pausen.",
          "occasionsEn": "A drink for the morning and sociable breaks.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Espresso_Coffee_01.jpg/960px-Espresso_Coffee_01.jpg"
        },
        {
          "name": "Atol de elote",
          "desc": "Warmes, süßes Getränk aus frischem Mais.",
          "descEn": "A warm, sweet drink made from fresh corn.",
          "long": "Ein warmes, cremiges Getränk aus frischem Mais, Milch und Zucker mit Zimt. Es ist dickflüssig, süß und sättigend. Wird oft an Straßenständen heiß serviert.",
          "longEn": "A warm, creamy drink of fresh corn, milk and sugar with cinnamon. It's thick, sweet and filling. Often served hot at street stalls.",
          "ingredients": "Frischer Mais (elote), Milch, Zucker, Zimt",
          "ingredientsEn": "Fresh corn (elote), milk, sugar, cinnamon",
          "origin": "Eine guatemaltekische Variante des präkolumbischen Atoles, eines traditionellen Maisgetränks Mesoamerikas.",
          "originEn": "A Guatemalan version of pre-Columbian atole, a traditional Mesoamerican corn drink.",
          "occasions": "Warmes Getränk für kühle Abende und als Frühstück oder Snack.",
          "occasionsEn": "A warm drink for cool evenings and as a breakfast or snack.",
          "order": "Un atol de elote, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Atole_de_guayaba.jpg/960px-Atole_de_guayaba.jpg"
        },
        {
          "name": "Ron Zacapa",
          "desc": "Preisgekrönter, im Hochland gereifter Premium-Rum.",
          "descEn": "An award-winning premium rum aged in the highlands.",
          "long": "Ein preisgekrönter Premium-Rum, der in der Höhe gereift wird und für seine seidige, komplexe Note mit Karamell- und Vanillearomen bekannt ist. Wird pur oder auf Eis genossen. Gilt als einer der besten Rums der Welt.",
          "longEn": "An award-winning premium rum, aged at altitude and known for its silky, complex character with caramel and vanilla aromas. Enjoyed neat or on the rocks. Considered one of the best rums in the world.",
          "ingredients": "Erster Zuckerrohrhonig, gereift in Fässern",
          "ingredientsEn": "First-press cane-sugar honey, aged in barrels",
          "origin": "Hergestellt in Guatemala und benannt nach der Stadt Zacapa; gereift im Hochland mittels Solera-Verfahren.",
          "originEn": "Made in Guatemala and named after the town of Zacapa; aged in the highlands using the solera method.",
          "occasions": "Genussgetränk für besondere Anlässe und entspannte Abende.",
          "occasionsEn": "A treat for special occasions and relaxed evenings.",
          "order": "Un Ron Zacapa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ron_Zacapa_Centenario_23_anos.jpg"
        },
        {
          "name": "Rosa de Jamaica",
          "desc": "Erfrischender Hibiskus-Eistee.",
          "descEn": "A refreshing hibiscus iced tea.",
          "long": "Ein erfrischendes rotes Getränk aus Hibiskusblüten, gesüßt und gekühlt serviert. Schmeckt angenehm säuerlich und fruchtig. Eine beliebte natürliche Erfrischung.",
          "longEn": "A refreshing red drink of hibiscus flowers, sweetened and served chilled. It tastes pleasantly tart and fruity. A popular natural refresher.",
          "ingredients": "Getrocknete Hibiskusblüten, Zucker, Wasser",
          "ingredientsEn": "Dried hibiscus flowers, sugar, water",
          "origin": "Die Hibiskuspflanze wird in Guatemala für dieses traditionelle Erfrischungsgetränk verwendet.",
          "originEn": "The hibiscus plant is used in Guatemala for this traditional refresher.",
          "occasions": "Erfrischung zum Essen und an warmen Tagen.",
          "occasionsEn": "A refresher with food and on warm days.",
          "order": "Un fresco de rosa de Jamaica, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/A_glass_of_hibiscus_tea_01.jpg/960px-A_glass_of_hibiscus_tea_01.jpg"
        }
      ],
      "tip": "Den Vulkan Acatenango nur mit Guide und warmer Kleidung besteigen – nachts wird es eiskalt.",
      "tipEn": "Only climb the Acatenango volcano with a guide and warm clothing, as it gets freezing cold at night."
    },
    {
      "id": "honduras",
      "sports": {
        "intro": "Fußball ist nahezu Religion; die Qualifikation für eine WM löst landesweite Feiern aus. Mehrere Honduraner haben sich in europäischen Topligen einen Namen gemacht.",
        "introEn": "Football is almost a religion; qualifying for a World Cup sparks nationwide celebrations. Several Hondurans have made a name for themselves in Europe's top leagues.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Mit Abstand Volkssport Nr. 1 mit den Rivalen Olimpia und Motagua.", "noteEn": "By far the number-one sport, with rivals Olimpia and Motagua." }
        ],
        "athletes": [
          { "name": "David Suazo", "sport": "Fußball", "sportEn": "Football", "note": "Stürmerstar bei Inter Mailand, einer der besten Spieler des Landes.", "noteEn": "A striker star at Inter Milan, one of the country's best players." },
          { "name": "Wilson Palacios", "sport": "Fußball", "sportEn": "Football", "note": "Mittelfeldspieler in der englischen Premier League (u. a. Tottenham).", "noteEn": "A midfielder in the English Premier League (Tottenham among others)." }
        ]
      },
      "name": "Honduras",
      "flag": "🇭🇳",
      "region": "Mittelamerika",
      "capital": "Tegucigalpa",
      "tagline": "Karibische Tauchparadiese und Maya-Ruinen",
      "taglineEn": "Caribbean diving paradises and Maya ruins",
      "population": "Rund 10,8 Millionen Einwohner (2025).",
      "populationEn": "Around 10.8 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 26 Jahren.",
      "ageStructureEn": "A young population with a median age of about 26.",
      "government": "Präsidentielle Republik; 2022 wählte das Land mit Xiomara Castro erstmals eine Frau zur Präsidentin.",
      "governmentEn": "A presidential republic; in 2022 the country elected Xiomara Castro as its first female president.",
      "economy": "Eines der ärmsten Länder der Region mit hoher Ungleichheit und Abhängigkeit von Exporten.",
      "economyEn": "One of the poorest countries in the region, with high inequality and reliance on exports.",
      "livelihood": "Kaffee- und Bananenexport, Textilfabriken (maquilas) und Überweisungen von Migranten.",
      "livelihoodEn": "Coffee and banana exports, textile factories (maquilas) and remittances from migrants.",
      "about": "Honduras lockt mit den Bay Islands Roatán und Utila, einem der günstigsten Tauchreviere der Welt am zweitgrößten Riff der Erde. Im Landesinneren liegen die Maya-Ruinen von Copán und üppige Bergnebelwälder. Die Karibikküste ist tropisch, das Hochland angenehm mild.",
      "aboutEn": "Honduras tempts you with the Bay Islands of Roatán and Utila, one of the cheapest diving spots in the world on the planet's second-largest reef. Inland lie the Maya ruins of Copán and lush mountain cloud forests. The Caribbean coast is tropical and the highlands pleasantly mild.",
      "history": "In Copán blühte eine bedeutende Maya-Stadt mit kunstvollen Stelen. 1502 erreichte Kolumbus die Küste, danach kam das Gebiet unter spanische Herrschaft. 1821 wurde Honduras unabhängig und war kurz Teil der Zentralamerikanischen Föderation. Im 20. Jahrhundert prägten Bananenkonzerne die Wirtschaft – daher der Begriff 'Bananenrepublik'.",
      "historyEn": "An important Maya city with ornate stelae flourished at Copán. Columbus reached the coast in 1502, after which the area came under Spanish rule. Honduras became independent in 1821 and was briefly part of the Federal Republic of Central America. In the 20th century, banana companies dominated the economy, hence the term 'banana republic'.",
      "language": "Das honduranische Spanisch nutzt den Voseo, 'vos' ersetzt oft 'tú'. Die Aussprache ist eher schnell, Endsilben werden manchmal verschluckt. Typisch ist der Ausdruck 'catracho' für Honduraner. Indigene Sprachen wie Garífuna an der Küste und Miskito im Osten sind noch lebendig.",
      "languageEn": "Honduran Spanish uses voseo, with 'vos' often replacing 'tú'. The pronunciation is fairly fast, and final syllables are sometimes swallowed. The word 'catracho' for Hondurans is typical. Indigenous languages such as Garífuna on the coast and Miskito in the east are still alive.",
      "words": [
        {
          "es": "catracho",
          "de": "Honduraner/in (Spitzname)",
          "en": "Honduran (nickname)"
        },
        {
          "es": "¡Qué tuanis!",
          "de": "Wie cool! / Super!",
          "en": "How cool! / Great!"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')",
          "en": "you (instead of 'tú')"
        },
        {
          "es": "pisto",
          "de": "Geld",
          "en": "money"
        },
        {
          "es": "macanudo",
          "de": "großartig, klasse",
          "en": "great, brilliant"
        },
        {
          "es": "cipote",
          "de": "Kind, Junge",
          "en": "kid, boy"
        }
      ],
      "food": [
        {
          "name": "Baleada",
          "desc": "Dicke Weizentortilla mit Bohnen, Käse und Sahne, der Streetfood-Klassiker.",
          "descEn": "A thick wheat tortilla with beans, cheese and cream, the street-food classic.",
          "long": "Eine dicke Weizentortilla, gefaltet und gefüllt mit zerdrückten Bohnen, saurer Sahne und Käse. Optional kommen Ei, Avocado oder Fleisch hinzu. Einfach, sättigend und das beliebteste Streetfood des Landes.",
          "longEn": "A thick wheat tortilla, folded and filled with mashed beans, soured cream and cheese. Egg, avocado or meat can be added. Simple, filling and the country's most popular street food.",
          "ingredients": "Weizentortilla, gebratene Bohnen, saure Sahne (mantequilla), Trockenkäse, optional Ei oder Avocado",
          "ingredientsEn": "Wheat tortilla, refried beans, soured cream (mantequilla), dry cheese, optionally egg or avocado",
          "origin": "Ein typisch honduranisches Gericht, das vor allem an der Nordküste populär wurde.",
          "originEn": "A typically Honduran dish that became popular above all on the north coast.",
          "occasions": "Allgegenwärtiges Streetfood zum Frühstück oder als schneller Snack zu jeder Tageszeit.",
          "occasionsEn": "An ever-present street food for breakfast or as a quick snack at any time of day.",
          "order": "Una baleada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Baleada.jpg"
        },
        {
          "name": "Sopa de caracol",
          "desc": "Cremige Meeresschnecken-Suppe mit Kokosmilch.",
          "descEn": "A creamy conch soup with coconut milk.",
          "long": "Eine cremige Meeresschneckensuppe in Kokosmilch mit Yuca, Kochbananen und Gewürzen. Sie schmeckt reichhaltig, leicht süßlich und aromatisch nach Meer. Ein Festessen der Karibikküste.",
          "longEn": "A creamy conch soup in coconut milk with cassava, plantain and spices. It tastes rich, slightly sweet and aromatically of the sea. A feast dish of the Caribbean coast.",
          "ingredients": "Meeresschnecken (caracol), Kokosmilch, Yuca, Kochbananen, Koriander, Gewürze",
          "ingredientsEn": "Conch (caracol), coconut milk, cassava, plantain, coriander, spices",
          "origin": "Ein Gericht der Garífuna-Kultur an der honduranischen Karibikküste, durch ein bekanntes Lied auch international berühmt geworden.",
          "originEn": "A dish of the Garífuna culture on the Honduran Caribbean coast, made internationally famous by a well-known song.",
          "occasions": "Festliches Wochenend- und Feiergericht, besonders an der Küste.",
          "occasionsEn": "A festive weekend and celebration dish, especially on the coast.",
          "order": "Una sopa de caracol, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/3b/%22Sopa_de_Caracol%22.jpg"
        },
        {
          "name": "Plato típico",
          "desc": "Teller mit Fleisch, Bohnen, Reis, Kochbanane und Käse.",
          "descEn": "A plate of meat, beans, rice, plantain and cheese.",
          "long": "Ein üppiger Teller mit einer Auswahl typischer Speisen: gegrilltes Fleisch, Bohnen, Reis, gebratene Kochbananen, Käse und saure Sahne. Eine komplette, herzhafte Mahlzeit. Spiegelt die ganze Bandbreite der honduranischen Küche wider.",
          "longEn": "A generous plate with a selection of typical dishes: grilled meat, beans, rice, fried plantain, cheese and soured cream. A complete, hearty meal. It reflects the full range of Honduran cooking.",
          "ingredients": "Gegrilltes Fleisch, Bohnen, Reis, gebratene Kochbananen, Käse, saure Sahne, Avocado, Tortillas",
          "ingredientsEn": "Grilled meat, beans, rice, fried plantain, cheese, soured cream, avocado, tortillas",
          "origin": "Eine Zusammenstellung klassischer honduranischer Grundnahrungsmittel zu einem repräsentativen Nationalteller.",
          "originEn": "A combination of classic Honduran staples into a representative national platter.",
          "occasions": "Reichhaltiges Mittag- oder Wochenendessen für Familien und Besucher.",
          "occasionsEn": "A rich lunch or weekend meal for families and visitors.",
          "order": "Un plato típico, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Honduran_food_breakfast.jpg/960px-Honduran_food_breakfast.jpg"
        },
        {
          "name": "Tajadas",
          "desc": "Frittierte grüne Kochbananenscheiben, oft mit Fleisch.",
          "descEn": "Fried slices of green plantain, often with meat.",
          "long": "Dünn geschnittene, frittierte grüne Kochbananen, knusprig und leicht salzig. Werden oft als Beilage oder mit Fleisch und Salat als Hauptgericht (con todo) serviert. Ein beliebter, knuspriger Snack.",
          "longEn": "Thinly sliced, fried green plantain, crisp and lightly salted. Often served as a side or with meat and salad as a main course (con todo). A popular, crunchy snack.",
          "ingredients": "Grüne Kochbananen, Öl zum Frittieren, Salz, optional Fleisch und Krautsalat",
          "ingredientsEn": "Green plantains, oil for frying, salt, optionally meat and slaw",
          "origin": "Ein in ganz Mittelamerika verbreitetes Kochbananengericht, das in Honduras zum Alltag gehört.",
          "originEn": "A plantain dish found all over Central America that is part of everyday life in Honduras.",
          "occasions": "Beliebte Beilage und Streetfood-Snack zu jeder Gelegenheit.",
          "occasionsEn": "A popular side dish and street-food snack for any occasion.",
          "order": "Unas tajadas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Platanas_fritas.jpg/960px-Platanas_fritas.jpg"
        },
        {
          "name": "Pastelitos",
          "desc": "Frittierte Teigtaschen mit Fleisch- oder Kartoffelfüllung.",
          "descEn": "Fried pastries with a meat or potato filling.",
          "long": "Frittierte Maisteigtaschen, gefüllt mit gewürztem Fleisch, Kartoffeln und Reis. Außen knusprig, innen herzhaft. Werden oft mit Salsa und Krautsalat serviert.",
          "longEn": "Fried corn-dough pastries, filled with seasoned meat, potatoes and rice. Crisp outside, savoury within. Often served with salsa and slaw.",
          "ingredients": "Maisteig, Hackfleisch, Kartoffeln, Reis, Gewürze, Krautsalat, Salsa",
          "ingredientsEn": "Corn dough, mince, potatoes, rice, spices, slaw, salsa",
          "origin": "Ein traditioneller honduranischer Snack, der zur Familie der frittierten Teigtaschen Mittelamerikas gehört.",
          "originEn": "A traditional Honduran snack belonging to the family of Central American fried pastries.",
          "occasions": "Snack und Imbiss, beliebt an Ständen und bei Feiern.",
          "occasionsEn": "A snack and bite, popular at stalls and celebrations.",
          "order": "Unos pastelitos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/9/92/Pastelitos_criollos_argentinos.jpg"
        },
        {
          "name": "Yuca con chicharrón",
          "desc": "Gekochter Maniok mit knusprigem Schweinefleisch.",
          "descEn": "Boiled cassava with crispy pork.",
          "long": "Gekochte oder frittierte Yuca, serviert mit knusprigem Schweinefleisch und eingelegtem Krautsalat. Die Kombination ist herzhaft, knusprig und säuerlich-frisch. Ein populäres Gericht von Straßenständen.",
          "longEn": "Boiled or fried cassava, served with crispy pork and pickled slaw. The combination is savoury, crunchy and tangily fresh. A popular dish from street stalls.",
          "ingredients": "Yuca, knuspriges Schweinefleisch (chicharrón), eingelegter Krautsalat (curtido), Limette",
          "ingredientsEn": "Cassava, crispy pork (chicharrón), pickled slaw (curtido), lime",
          "origin": "Ein traditionelles Gericht Mittelamerikas, das die Stärkeknolle Yuca mit frittiertem Schwein verbindet.",
          "originEn": "A traditional Central American dish that combines the starchy cassava tuber with fried pork.",
          "occasions": "Beliebtes Streetfood, oft am Nachmittag oder bei Festen.",
          "occasionsEn": "A popular street food, often in the afternoon or at festivals.",
          "order": "Una yuca con chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Chicharrones_Cerdo_Salamanca_02.jpg/960px-Chicharrones_Cerdo_Salamanca_02.jpg"
        }
      ],
      "drink": [
        {
          "name": "Horchata",
          "desc": "Süßes Reis- oder Samengetränk mit Zimt.",
          "descEn": "A sweet rice or seed drink with cinnamon.",
          "long": "Ein süßes, erfrischendes Getränk, das in Honduras oft aus Samen, Reis oder Morro-Kernen mit Zimt und Zucker zubereitet wird. Cremig-mild und gut gekühlt serviert. Eine klassische Erfrischung zum Essen.",
          "longEn": "A sweet, refreshing drink, in Honduras often made from seeds, rice or morro kernels with cinnamon and sugar. Creamy, mild and served well chilled. A classic refresher with meals.",
          "ingredients": "Morro- oder Reissamen, Zucker, Zimt, Wasser oder Milch",
          "ingredientsEn": "Morro or rice seeds, sugar, cinnamon, water or milk",
          "origin": "Eine mittelamerikanische Variante der Horchata, regional mit unterschiedlichen Samen zubereitet.",
          "originEn": "A Central American version of horchata, prepared regionally with different seeds.",
          "occasions": "Erfrischung zum Essen und an heißen Tagen.",
          "occasionsEn": "A refresher with food and on hot days.",
          "order": "Una horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Café hondureño",
          "desc": "Hochwertiger Hochlandkaffee, ein wichtiges Exportgut.",
          "descEn": "High-quality highland coffee, an important export.",
          "long": "Honduranischer Hochlandkaffee mit mildem, ausgewogenem Aroma und sanften fruchtigen Noten. Wird meist schwarz oder leicht gesüßt getrunken. Honduras ist ein bedeutender Kaffeeexporteur.",
          "longEn": "Honduran highland coffee with a mild, balanced aroma and gentle fruity notes. Usually drunk black or lightly sweetened. Honduras is a major coffee exporter.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "ingredientsEn": "Roasted arabica coffee beans, water",
          "origin": "Honduras gehört zu den größten Kaffeeproduzenten Mittelamerikas mit Anbau in mehreren Hochlandregionen.",
          "originEn": "Honduras is among the largest coffee producers in Central America, with cultivation in several highland regions.",
          "occasions": "Getränk für den Morgen und Pausen.",
          "occasionsEn": "A drink for the morning and breaks.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Coffeebeansorting.jpg"
        },
        {
          "name": "Cerveza Salva Vida",
          "desc": "Beliebtes lokales Lagerbier.",
          "descEn": "A popular local lager.",
          "long": "Ein traditionelles honduranisches Lagerbier, mild und süffig. Wird gut gekühlt getrunken und ist im ganzen Land verbreitet. Eine der bekanntesten Biermarken des Landes.",
          "longEn": "A traditional Honduran lager, mild and easy-drinking. Drunk well chilled and found throughout the country. One of the country's best-known beer brands.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Eine in Honduras gebraute, traditionsreiche Biermarke.",
          "originEn": "A long-established beer brand brewed in Honduras.",
          "occasions": "Erfrischung für gesellige Anlässe und zum Essen.",
          "occasionsEn": "A refresher for social occasions and with food.",
          "order": "Una Salva Vida bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Beer_wuerzburger_hofbraue_v.jpg/960px-Beer_wuerzburger_hofbraue_v.jpg"
        },
        {
          "name": "Licuado",
          "desc": "Frischer Fruchtshake mit Milch oder Wasser.",
          "descEn": "A fresh fruit shake with milk or water.",
          "long": "Ein erfrischendes Mixgetränk aus frischen Früchten, gemixt mit Milch oder Wasser und Zucker. Cremig, fruchtig und sättigend. Beliebte Sorten sind Banane, Papaya und Erdbeere.",
          "longEn": "A refreshing blended drink of fresh fruit, mixed with milk or water and sugar. Creamy, fruity and filling. Popular flavours are banana, papaya and strawberry.",
          "ingredients": "Frische Früchte, Milch oder Wasser, Zucker, Eis",
          "ingredientsEn": "Fresh fruit, milk or water, sugar, ice",
          "origin": "Ein in ganz Lateinamerika verbreitetes Fruchtmixgetränk.",
          "originEn": "A blended fruit drink found all over Latin America.",
          "occasions": "Erfrischung zum Frühstück oder als Snack zwischendurch.",
          "occasionsEn": "A refresher for breakfast or as a snack in between.",
          "order": "Un licuado de banano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/37/2011.09_smoothie2.JPG"
        }
      ],
      "tip": "Roatán und Utila sind sicher und entspannt – in Großstädten wie San Pedro Sula dagegen Vorsicht walten lassen.",
      "tipEn": "Roatán and Utila are safe and laid-back, but be careful in big cities like San Pedro Sula."
    },
    {
      "id": "elsalvador",
      "sports": {
        "intro": "Fußball ist der Lieblingssport, doch das Land hat sich auch als Surf-Destination einen Namen gemacht und richtet internationale Wellenreit-Wettbewerbe aus.",
        "introEn": "Football is the favourite sport, but the country has also made a name for itself as a surfing destination and hosts international surf competitions.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Der populärste Sport im Land.", "noteEn": "The most popular sport in the country." },
          { "name": "Surfen", "nameEn": "Surfing", "note": "Erstklassige Pazifikwellen; ‚Surf City' zieht die Weltspitze an.", "noteEn": "First-class Pacific waves; ‘Surf City' draws the world's best." }
        ],
        "athletes": [
          { "name": "Jorge „Mágico“ González", "sport": "Fußball", "sportEn": "Football", "note": "Legendärer Spielmacher, Idol des spanischen Klubs Cádiz.", "noteEn": "A legendary playmaker and idol of the Spanish club Cádiz." }
        ]
      },
      "name": "El Salvador",
      "flag": "🇸🇻",
      "region": "Mittelamerika",
      "capital": "San Salvador",
      "tagline": "Surfer-Wellen, Vulkane und Bitcoin-Pionier",
      "taglineEn": "Surfers' waves, volcanoes and Bitcoin pioneer",
      "population": "Etwa 6,4 Millionen Einwohner (2025) – das am dichtesten besiedelte Land des amerikanischen Festlands.",
      "populationEn": "About 6.4 million inhabitants (2025) – the most densely populated country on the American mainland.",
      "ageStructure": "Medianalter von rund 29 Jahren; viele Salvadorianer leben im Ausland.",
      "ageStructureEn": "A median age of around 29; many Salvadorans live abroad.",
      "government": "Präsidentielle Republik; das Bitcoin-Experiment von 2021 wurde 2025 zurückgefahren – Bitcoin ist kein gesetzliches Zahlungsmittel mehr, Hauptwährung bleibt der US-Dollar.",
      "governmentEn": "A presidential republic; the 2021 Bitcoin experiment was scaled back in 2025 – Bitcoin is no longer legal tender and the main currency remains the US dollar.",
      "economy": "Dollarisierte Wirtschaft; nach Jahren hoher Kriminalität stark verbessertes Sicherheitsgefühl, aber weiter abhängig von Überweisungen.",
      "economyEn": "A dollarised economy; after years of high crime a much improved sense of safety, but still dependent on remittances.",
      "livelihood": "Überweisungen (über ein Fünftel des BIP), Textilindustrie, Kaffee und zunehmend Tourismus.",
      "livelihoodEn": "Remittances (over a fifth of GDP), the textile industry, coffee and increasingly tourism.",
      "about": "El Salvador ist das kleinste Land Mittelamerikas, aber ein Surf-Mekka mit erstklassigen Pazifikwellen bei El Tunco und El Zonte. Die 'Ruta de las Flores' führt durch Kaffeedörfer und Vulkanlandschaften. Das Land hat als erstes der Welt Bitcoin als gesetzliches Zahlungsmittel eingeführt.",
      "aboutEn": "El Salvador is the smallest country in Central America, yet a surfing mecca with world-class Pacific waves at El Tunco and El Zonte. The 'Ruta de las Flores' winds through coffee villages and volcanic landscapes. It was the first country in the world to adopt Bitcoin as legal tender.",
      "history": "Vor der Eroberung lebten hier die Pipil, ein Nahua-Volk. 1524 begann die spanische Eroberung durch Pedro de Alvarado. 1821 wurde El Salvador unabhängig. Nach einem blutigen Bürgerkrieg (1980–1992) kämpfte das Land lange mit Bandengewalt, gilt heute aber als deutlich sicherer.",
      "historyEn": "Before the conquest, the Pipil, a Nahua people, lived here. The Spanish conquest began in 1524 under Pedro de Alvarado. El Salvador became independent in 1821. After a bloody civil war (1980–1992), the country long struggled with gang violence, but it's now considered much safer.",
      "language": "Das salvadorianische Spanisch verwendet stark den Voseo mit 'vos'. Gesprochen wird oft schnell, mit verschluckten Silben am Wortende. Salvadorianer nennen sich selbst 'guanacos'. Nawat (Pipil) ist eine fast ausgestorbene indigene Sprache, die wiederbelebt wird.",
      "languageEn": "Salvadoran Spanish makes heavy use of voseo with 'vos'. It's often spoken fast, with syllables swallowed at the ends of words. Salvadorans call themselves 'guanacos'. Nawat (Pipil) is a nearly extinct indigenous language now being revived.",
      "words": [
        {
          "es": "¡Qué chivo!",
          "de": "Wie cool! / Geil!",
          "en": "How cool! / Awesome!"
        },
        {
          "es": "guanaco",
          "de": "Salvadorianer/in (Spitzname)",
          "en": "Salvadoran (nickname)"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')",
          "en": "you (instead of 'tú')"
        },
        {
          "es": "cipote",
          "de": "Kind, Junge",
          "en": "kid, boy"
        },
        {
          "es": "bicho",
          "de": "Kind / Jugendlicher (umgangssprachlich)",
          "en": "kid / teenager (colloquial)"
        },
        {
          "es": "¡Púchica!",
          "de": "Mensch! / Verflixt!",
          "en": "Gosh! / Darn it!"
        }
      ],
      "food": [
        {
          "name": "Pupusas",
          "desc": "Gefüllte Maisfladen mit Käse, Bohnen oder Chicharrón, das Nationalgericht.",
          "descEn": "Stuffed corn flatbreads with cheese, beans or chicharrón, the national dish.",
          "long": "Dicke, handgeformte Maisfladen, gefüllt mit Käse, Bohnen, Schweinefleisch (chicharrón) oder einer Kombination, und auf der Platte gebacken. Werden mit Krautsalat (curtido) und Tomatensauce serviert. Das absolute Nationalgericht El Salvadors.",
          "longEn": "Thick, hand-shaped corn flatbreads, filled with cheese, beans, pork (chicharrón) or a combination, and baked on the griddle. Served with slaw (curtido) and tomato sauce. El Salvador's absolute national dish.",
          "ingredients": "Maisteig, Käse, Bohnen, Schweinefleisch (chicharrón), Loroco, Krautsalat, Tomatensauce",
          "ingredientsEn": "Corn dough, cheese, beans, pork (chicharrón), loroco, slaw, tomato sauce",
          "origin": "Ein Gericht mit präkolumbischen Wurzeln, das zum kulinarischen Wahrzeichen El Salvadors wurde und sogar einen eigenen Nationaltag hat.",
          "originEn": "A dish with pre-Columbian roots that became El Salvador's culinary emblem and even has its own national day.",
          "occasions": "Beliebt zum Frühstück oder Abendessen, an jedem Tag und besonders am nationalen Pupusa-Tag.",
          "occasionsEn": "Popular for breakfast or dinner, any day and especially on national Pupusa Day.",
          "order": "Dos pupusas de queso con frijoles, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Pupusas_olocuilta_el_salvador_2012.jpg/960px-Pupusas_olocuilta_el_salvador_2012.jpg"
        },
        {
          "name": "Curtido",
          "desc": "Eingelegter Krautsalat, der klassische Begleiter zu Pupusas.",
          "descEn": "A pickled cabbage slaw, the classic companion to pupusas.",
          "long": "Ein leicht fermentierter, säuerlicher Krautsalat aus Weißkohl, Karotten und Zwiebeln mit Essig und Oregano. Knackig, frisch und säuerlich. Unverzichtbare Beilage zu Pupusas.",
          "longEn": "A lightly fermented, tangy slaw of white cabbage, carrots and onions with vinegar and oregano. Crunchy, fresh and tart. An indispensable side to pupusas.",
          "ingredients": "Weißkohl, Karotten, Zwiebeln, Essig, Oregano, Chili",
          "ingredientsEn": "White cabbage, carrots, onions, vinegar, oregano, chilli",
          "origin": "Eine traditionelle salvadorianische Beilage, die als fermentierter Begleiter zu Maisgerichten dient.",
          "originEn": "A traditional Salvadoran side dish that serves as a fermented companion to corn dishes.",
          "occasions": "Wird ständig als Beilage zu Pupusas und frittierten Speisen gereicht.",
          "occasionsEn": "Served constantly as a side to pupusas and fried dishes.",
          "order": "Un poco de curtido, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Pupusas_El_Salvador_Centro_America.JPG/960px-Pupusas_El_Salvador_Centro_America.JPG"
        },
        {
          "name": "Yuca frita",
          "desc": "Frittierter Maniok mit Schweinefleisch und Salat.",
          "descEn": "Fried cassava with pork and salad.",
          "long": "Frittierte Yuca-Stücke, außen knusprig und innen weich, oft mit Schweinefleisch oder Fisch und Krautsalat serviert. Herzhaft und sättigend. Ein klassisches Straßengericht.",
          "longEn": "Fried pieces of cassava, crisp outside and soft within, often served with pork or fish and slaw. Savoury and filling. A classic street dish.",
          "ingredients": "Yuca, Öl zum Frittieren, Schweinefleisch oder Fisch, Krautsalat (curtido), Salsa",
          "ingredientsEn": "Cassava, oil for frying, pork or fish, slaw (curtido), salsa",
          "origin": "Ein traditionelles Gericht El Salvadors auf Basis der für die Region wichtigen Yuca-Knolle.",
          "originEn": "A traditional Salvadoran dish based on the cassava tuber, so important to the region.",
          "occasions": "Beliebter Snack am Nachmittag und Abend an Ständen.",
          "occasionsEn": "A popular snack at stalls in the afternoon and evening.",
          "order": "Una yuca frita con chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Yuca_frita_in_Bolivia.jpg/960px-Yuca_frita_in_Bolivia.jpg"
        },
        {
          "name": "Panes con pollo",
          "desc": "Mariniertes Hähnchen-Sandwich mit Gemüse und Sauce.",
          "descEn": "A marinated chicken sandwich with vegetables and sauce.",
          "long": "Ein gefülltes Sandwich mit mariniertem Hühnchen, Gemüse und einer würzigen Sauce. Saftig, würzig und reichhaltig. Beliebt bei Feiern und Versammlungen.",
          "longEn": "A stuffed sandwich with marinated chicken, vegetables and a spicy sauce. Juicy, spiced and rich. Popular at celebrations and gatherings.",
          "ingredients": "Brötchen, mariniertes Hühnchen, Tomaten, Salat, Gurke, Rettich, würzige Sauce",
          "ingredientsEn": "Bread roll, marinated chicken, tomatoes, salad, cucumber, radish, spicy sauce",
          "origin": "Ein traditionelles salvadorianisches Festsandwich, das oft bei Familien- und Gemeindefeiern serviert wird.",
          "originEn": "A traditional Salvadoran celebration sandwich, often served at family and community gatherings.",
          "occasions": "Typisch für Feiern, Festtage und gesellige Abende.",
          "occasionsEn": "Typical for celebrations, holidays and sociable evenings.",
          "order": "Un pan con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Subway_Monterey_Chicken_Melt_wRoasted_Chicken_%2816235266571%29.jpg"
        },
        {
          "name": "Tamales de elote",
          "desc": "Süße Tamales aus frischem Mais.",
          "descEn": "Sweet tamales made from fresh corn.",
          "long": "Süße bis milde Tamales aus frischem, jungem Mais, in Maisblättern gedämpft. Cremig, leicht süß und zart. Werden oft mit saurer Sahne gegessen.",
          "longEn": "Sweet to mild tamales of fresh young corn, steamed in corn husks. Creamy, lightly sweet and tender. Often eaten with soured cream.",
          "ingredients": "Frischer junger Mais (elote), Zucker oder Salz, Butter oder Sahne, Maisblätter",
          "ingredientsEn": "Fresh young corn (elote), sugar or salt, butter or cream, corn husks",
          "origin": "Eine salvadorianische Variante der mesoamerikanischen Tamal-Tradition, die jungen Mais nutzt.",
          "originEn": "A Salvadoran version of the Mesoamerican tamal tradition that uses young corn.",
          "occasions": "Snack und Beilage, beliebt zur Erntezeit und am Nachmittag mit Kaffee.",
          "occasionsEn": "A snack and side, popular at harvest time and in the afternoon with coffee.",
          "order": "Unos tamales de elote, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tamales_Mexicanos_sweet_corn_tamales_01.jpg/960px-Tamales_Mexicanos_sweet_corn_tamales_01.jpg"
        },
        {
          "name": "Sopa de pata",
          "desc": "Herzhafte Suppe aus Rinderfuß und Gemüse.",
          "descEn": "A hearty soup of cow's trotter and vegetables.",
          "long": "Eine herzhafte Suppe aus Rinderfuß und Kutteln mit Gemüse, Yuca und Kochbananen in würziger Brühe. Reichhaltig, sättigend und kräftig. Ein traditionelles Wohlfühlgericht.",
          "longEn": "A hearty soup of cow's trotter and tripe with vegetables, cassava and plantain in a spicy broth. Rich, filling and robust. A traditional comfort dish.",
          "ingredients": "Rinderfuß, Kutteln, Yuca, Kochbananen, Mais, Gemüse, Gewürze",
          "ingredientsEn": "Cow's trotter, tripe, cassava, plantain, corn, vegetables, spices",
          "origin": "Ein traditionelles salvadorianisches Gericht, das günstige Fleischteile zu einer sättigenden Suppe verarbeitet.",
          "originEn": "A traditional Salvadoran dish that turns cheap cuts of meat into a filling soup.",
          "occasions": "Wärmendes Wochenend- und Familiengericht.",
          "occasionsEn": "A warming weekend and family dish.",
          "order": "Una sopa de pata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sopa_de_pata.jpg/960px-Sopa_de_pata.jpg"
        }
      ],
      "drink": [
        {
          "name": "Horchata",
          "desc": "Hier aus Morro-Samen gemacht, würzig und cremig.",
          "descEn": "Here made from morro seeds, spicy and creamy.",
          "long": "Die salvadorianische Horchata wird typisch aus Morro-Samen mit weiteren Samen und Gewürzen zubereitet und schmeckt nussig und würzig. Cremig-mild und gut gekühlt. Eine der beliebtesten Erfrischungen des Landes.",
          "longEn": "Salvadoran horchata is typically made from morro seeds with other seeds and spices, and tastes nutty and spiced. Creamy, mild and well chilled. One of the country's most popular refreshers.",
          "ingredients": "Morro-Samen, weitere Samen und Nüsse, Zimt, Zucker, Wasser oder Milch",
          "ingredientsEn": "Morro seeds, further seeds and nuts, cinnamon, sugar, water or milk",
          "origin": "Eine charakteristische salvadorianische Variante der Horchata auf Basis von Morro-Samen.",
          "originEn": "A distinctive Salvadoran version of horchata based on morro seeds.",
          "occasions": "Erfrischung zum Essen, besonders zu Pupusas.",
          "occasionsEn": "A refresher with food, especially with pupusas.",
          "order": "Una horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Kolashanpan",
          "desc": "Süße, leuchtend orange Limonade, eine lokale Ikone.",
          "descEn": "A sweet, bright-orange fizzy drink, a local icon.",
          "long": "Eine süße, leuchtend rote Limonade mit fruchtigem Geschmack, eine bekannte salvadorianische Erfrischungsmarke. Sehr süß und sprudelnd. Beliebt im ganzen Land.",
          "longEn": "A sweet, bright-red fizzy drink with a fruity flavour, a well-known Salvadoran soft-drink brand. Very sweet and bubbly. Popular across the country.",
          "ingredients": "Karbonisiertes Wasser, Zucker, Fruchtaroma",
          "ingredientsEn": "Carbonated water, sugar, fruit flavouring",
          "origin": "Eine traditionsreiche salvadorianische Erfrischungsmarke.",
          "originEn": "A long-established Salvadoran soft-drink brand.",
          "occasions": "Beliebt zum Essen und bei Feiern.",
          "occasionsEn": "Popular with food and at celebrations.",
          "order": "Una Kolashanpan, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Cola_champagne_%28639468787%29.jpg/960px-Cola_champagne_%28639468787%29.jpg"
        },
        {
          "name": "Café salvadoreño",
          "desc": "Aromatischer Hochlandkaffee von den Vulkanhängen.",
          "descEn": "Aromatic highland coffee from the volcanic slopes.",
          "long": "Salvadorianischer Hochlandkaffee mit ausgewogenem, sanftem Aroma und süßlichen Noten. Wird meist schwarz oder leicht gesüßt getrunken. Kaffee hat eine lange Geschichte in der Wirtschaft des Landes.",
          "longEn": "Salvadoran highland coffee with a balanced, gentle aroma and sweetish notes. Usually drunk black or lightly sweetened. Coffee has a long history in the country's economy.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "ingredientsEn": "Roasted arabica coffee beans, water",
          "origin": "El Salvador ist ein traditionsreiches Kaffeeanbauland mit Anbaugebieten in den Vulkanregionen.",
          "originEn": "El Salvador is a long-established coffee-growing country with growing regions in the volcanic areas.",
          "occasions": "Getränk für den Morgen und Pausen.",
          "occasionsEn": "A drink for the morning and breaks.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/960px-A_small_cup_of_coffee.JPG"
        },
        {
          "name": "Cerveza Pilsener",
          "desc": "Das bekannteste lokale Bier.",
          "descEn": "The best-known local beer.",
          "long": "Ein klassisches salvadorianisches Lagerbier im Pilsener-Stil, mild und erfrischend. Wird gut gekühlt getrunken und ist landesweit verbreitet. Eine der ältesten Biermarken des Landes.",
          "longEn": "A classic Salvadoran pilsner-style lager, mild and refreshing. Drunk well chilled and found nationwide. One of the country's oldest beer brands.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Eine traditionsreiche, in El Salvador gebraute Biermarke.",
          "originEn": "A long-established beer brand brewed in El Salvador.",
          "occasions": "Erfrischung für gesellige Anlässe und zum Essen.",
          "occasionsEn": "A refresher for social occasions and with food.",
          "order": "Una Pilsener bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/11/Logo_Pilsener.jpg"
        }
      ],
      "tip": "El Zonte ('Bitcoin Beach') akzeptiert vielerorts Bitcoin – aber Bargeld ist überall sicherer.",
      "tipEn": "El Zonte ('Bitcoin Beach') accepts Bitcoin in many places, but cash is safer everywhere."
    },
    {
      "id": "nicaragua",
      "sports": {
        "intro": "Anders als die meisten Nachbarn ist Nicaragua ein Baseball-Land – der Sport ist Nationalleidenschaft. Auch Boxen hat dank großer Champions einen hohen Stellenwert.",
        "introEn": "Unlike most of its neighbours, Nicaragua is a baseball country – the sport is a national passion. Boxing also enjoys high status thanks to great champions.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Der inoffizielle Nationalsport, in jedem Dorf gespielt.", "noteEn": "The unofficial national sport, played in every village." },
          { "name": "Boxen", "nameEn": "Boxing", "note": "Tief verwurzelt, mit weltbekannten Champions.", "noteEn": "Deeply rooted, with world-famous champions." }
        ],
        "athletes": [
          { "name": "Alexis Argüello", "sport": "Boxen", "sportEn": "Boxing", "note": "Weltmeister in drei Gewichtsklassen, Box-Legende und Nationalheld.", "noteEn": "Three-weight world champion, a boxing legend and national hero." },
          { "name": "Dennis Martínez", "sport": "Baseball", "sportEn": "Baseball", "note": "Erster Nicaraguaner in der MLB, warf ein Perfect Game.", "noteEn": "The first Nicaraguan in MLB, who pitched a perfect game." }
        ]
      },
      "name": "Nicaragua",
      "flag": "🇳🇮",
      "region": "Mittelamerika",
      "capital": "Managua",
      "tagline": "Vulkane, Seen und koloniale Farbenpracht",
      "taglineEn": "Volcanoes, lakes and colonial splendour",
      "population": "Rund 6,6 Millionen Einwohner (2025).",
      "populationEn": "Around 6.6 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 26 Jahren.",
      "ageStructureEn": "A young population with a median age of about 26.",
      "government": "Präsidialrepublik, faktisch autoritär regiert durch Daniel Ortega und seine Frau als Co-Präsidentin.",
      "governmentEn": "A presidential republic, in practice ruled authoritatively by Daniel Ortega and his wife as co-president.",
      "economy": "Eines der ärmsten Länder der Hemisphäre; die politische Krise seit 2018 belastet die Wirtschaft.",
      "economyEn": "One of the poorest countries in the hemisphere; a political crisis since 2018 weighs on the economy.",
      "livelihood": "Landwirtschaft (Kaffee, Rindfleisch, Zucker, Gold), Textilfabriken und Überweisungen.",
      "livelihoodEn": "Agriculture (coffee, beef, sugar, gold), textile factories and remittances.",
      "about": "Nicaragua ist das größte Land Mittelamerikas und bekannt für die kolonialen Schmuckstädte Granada und León sowie den riesigen Nicaragua-See. Backpacker surfen in San Juan del Sur, fahren Vulkan-Boarding am Cerro Negro und erkunden die Insel Ometepe mit ihren zwei Vulkanen. Preise sind niedrig, die Natur spektakulär.",
      "aboutEn": "Nicaragua is the largest country in Central America, known for the colonial gems of Granada and León and the vast Lake Nicaragua. Backpackers surf in San Juan del Sur, go volcano boarding on Cerro Negro and explore the island of Ometepe with its two volcanoes. Prices are low and the scenery spectacular.",
      "history": "Vor der Eroberung lebten hier Völker wie die Nicarao und Chorotega. 1524 gründete Spanien Granada und León. 1821 wurde Nicaragua unabhängig. Das 20. Jahrhundert war geprägt von der Somoza-Diktatur und der Sandinistischen Revolution 1979, deren Folgen die Politik bis heute bestimmen.",
      "historyEn": "Before the conquest, peoples such as the Nicarao and Chorotega lived here. In 1524 Spain founded Granada and León. Nicaragua became independent in 1821. The 20th century was marked by the Somoza dictatorship and the Sandinista Revolution of 1979, whose consequences still shape politics today.",
      "language": "Das nicaraguanische Spanisch nutzt durchgängig den Voseo mit 'vos'. Das 's' am Silbenende wird oft zu einem behauchten 'h'. Nicaraguaner nennen sich liebevoll 'nicas' oder 'pinoleros'. An der Karibikküste werden Englisch-Kreol und indigene Sprachen wie Miskito gesprochen.",
      "languageEn": "Nicaraguan Spanish uses voseo with 'vos' throughout. The 's' at the end of a syllable often becomes a breathy 'h'. Nicaraguans affectionately call themselves 'nicas' or 'pinoleros'. On the Caribbean coast, an English-based creole and indigenous languages such as Miskito are spoken.",
      "words": [
        {
          "es": "¡Qué tuani!",
          "de": "Wie cool! / Super!",
          "en": "How cool! / Great!"
        },
        {
          "es": "nica",
          "de": "Nicaraguaner/in (Spitzname)",
          "en": "Nicaraguan (nickname)"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')",
          "en": "you (instead of 'tú')"
        },
        {
          "es": "dale pues",
          "de": "okay / alles klar / los",
          "en": "okay / all right / go on"
        },
        {
          "es": "maje",
          "de": "Kumpel, Alter",
          "en": "mate, dude"
        },
        {
          "es": "chunche",
          "de": "Dings, Ding (für irgendeinen Gegenstand)",
          "en": "thingy, whatsit (for any object)"
        }
      ],
      "food": [
        {
          "name": "Gallo pinto",
          "desc": "Gebratener Reis mit Bohnen, das tägliche Grundgericht.",
          "descEn": "Fried rice with beans, the daily staple.",
          "long": "Eine herzhafte Mischung aus Reis und roten Bohnen, zusammen angebraten und gewürzt. Bildet die Basis vieler Mahlzeiten und wird oft zum Frühstück gegessen. Einfach, sättigend und allgegenwärtig.",
          "longEn": "A hearty mix of rice and red beans, fried together and seasoned. It forms the base of many meals and is often eaten for breakfast. Simple, filling and everywhere.",
          "ingredients": "Reis, rote Bohnen, Zwiebeln, Paprika, Öl, Gewürze",
          "ingredientsEn": "Rice, red beans, onions, peppers, oil, spices",
          "origin": "Ein Grundnahrungsmittel Nicaraguas und Costa Ricas; beide Länder beanspruchen seinen Ursprung.",
          "originEn": "A staple of Nicaragua and Costa Rica; both countries claim it as their own.",
          "occasions": "Klassisches Frühstück, oft mit Ei, Käse oder Tortilla begleitet.",
          "occasionsEn": "A classic breakfast, often accompanied by egg, cheese or tortilla.",
          "order": "Un gallo pinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Gallo_pinto-IMG_0672.JPG/960px-Gallo_pinto-IMG_0672.JPG"
        },
        {
          "name": "Nacatamal",
          "desc": "Großer, gefüllter Maisteig-Tamale in Bananenblättern.",
          "descEn": "A large stuffed corn-dough tamale in banana leaves.",
          "long": "Ein großer, in Bananenblätter gewickelter und gedämpfter Maistamal, gefüllt mit Schweinefleisch, Reis, Kartoffeln und Gemüse. Reichhaltig, herzhaft und sättigend. Ein traditionelles Wochenendgericht.",
          "longEn": "A large corn tamale wrapped in banana leaves and steamed, filled with pork, rice, potatoes and vegetables. Rich, savoury and filling. A traditional weekend dish.",
          "ingredients": "Maisteig, Schweinefleisch, Reis, Kartoffeln, Tomaten, Paprika, Minze, Bananenblätter",
          "ingredientsEn": "Corn dough, pork, rice, potatoes, tomatoes, peppers, mint, banana leaves",
          "origin": "Eine nicaraguanische Variante des Tamales mit präkolumbischen Wurzeln und besonders üppiger Füllung.",
          "originEn": "A Nicaraguan version of the tamale with pre-Columbian roots and a particularly generous filling.",
          "occasions": "Typisches Wochenend- und Festtagsgericht, oft zum Sonntagsfrühstück.",
          "occasionsEn": "A typical weekend and holiday dish, often for Sunday breakfast.",
          "order": "Un nacatamal, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/091223_tamales.jpg/960px-091223_tamales.jpg"
        },
        {
          "name": "Vigorón",
          "desc": "Maniok mit Schweinekruste und Krautsalat auf Bananenblatt.",
          "descEn": "Cassava with crispy pork and slaw on a banana leaf.",
          "long": "Gekochte Yuca, belegt mit knusprigem Schweinefleisch und säuerlichem Krautsalat, serviert auf einem Bananenblatt. Die Kombination ist knusprig, frisch und herzhaft. Ein populäres Straßengericht aus Granada.",
          "longEn": "Boiled cassava topped with crispy pork and tangy slaw, served on a banana leaf. The combination is crunchy, fresh and savoury. A popular street dish from Granada.",
          "ingredients": "Yuca, knuspriges Schweinefleisch (chicharrón), Krautsalat (curtido), Tomaten, Chili, Bananenblatt",
          "ingredientsEn": "Cassava, crispy pork (chicharrón), slaw (curtido), tomatoes, chilli, banana leaf",
          "origin": "Stammt aus der Stadt Granada und gilt als eines der bekanntesten Streetfoods Nicaraguas.",
          "originEn": "From the city of Granada and considered one of Nicaragua's best-known street foods.",
          "occasions": "Beliebter Snack und Imbiss, oft auf Märkten und bei Festen.",
          "occasionsEn": "A popular snack and bite, often at markets and festivals.",
          "order": "Un vigorón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/VIGORON.JPG/960px-VIGORON.JPG"
        },
        {
          "name": "Quesillo",
          "desc": "Tortilla mit Käse, Zwiebeln und saurer Sahne.",
          "descEn": "A tortilla with cheese, onions and soured cream.",
          "long": "Eine weiche Tortilla, gefüllt mit weichem Käse, eingelegten Zwiebeln und saurer Sahne, gerollt und serviert. Cremig, säuerlich und herzhaft. Ein beliebter Snack, traditionell aus der Region um Nagarote.",
          "longEn": "A soft tortilla, filled with soft cheese, pickled onions and soured cream, rolled and served. Creamy, tangy and savoury. A popular snack, traditionally from the Nagarote area.",
          "ingredients": "Tortilla, weicher Käse (quesillo), eingelegte Zwiebeln, saure Sahne, Salz",
          "ingredientsEn": "Tortilla, soft cheese (quesillo), pickled onions, soured cream, salt",
          "origin": "Ein typisch nicaraguanisches Gericht, besonders verbreitet in den Städten Nagarote und La Paz Centro.",
          "originEn": "A typically Nicaraguan dish, especially common in the towns of Nagarote and La Paz Centro.",
          "occasions": "Beliebter Snack zwischendurch und auf Reisen.",
          "occasionsEn": "A popular snack in between and while travelling.",
          "order": "Un quesillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Quesillo_con_dulce_de_cayote%2C_nueces_y_miel_de_ca%C3%B1a_%28Postre_t%C3%ADpico_de_Salta%29.jpg/960px-Quesillo_con_dulce_de_cayote%2C_nueces_y_miel_de_ca%C3%B1a_%28Postre_t%C3%ADpico_de_Salta%29.jpg"
        },
        {
          "name": "Indio viejo",
          "desc": "Deftiger Maiseintopf mit zerzupftem Fleisch.",
          "descEn": "A hearty corn stew with shredded meat.",
          "long": "Ein traditioneller, dicker Eintopf aus zerzupftem Fleisch und Maisteig in einer würzigen Sauce mit Tomaten und Gewürzen. Aromatisch, herzhaft und sämig. Ein indigenes Wohlfühlgericht.",
          "longEn": "A traditional, thick stew of shredded meat and corn dough in a spicy sauce with tomatoes and spices. Aromatic, savoury and smooth. An indigenous comfort dish.",
          "ingredients": "Zerzupftes Rindfleisch, Maismehl, Tomaten, Zwiebeln, Paprika, Minze, Achiote",
          "ingredientsEn": "Shredded beef, corn flour, tomatoes, onions, peppers, mint, achiote",
          "origin": "Ein Gericht mit indigenen Wurzeln, dessen Name 'alter Indianer' bedeutet und auf eine alte Legende verweist.",
          "originEn": "A dish with indigenous roots, whose name means 'old Indian' and refers to an old legend.",
          "occasions": "Traditionelles Mittagessen für Familien- und Festanlässe.",
          "occasionsEn": "A traditional lunch for family and festive occasions.",
          "order": "Un indio viejo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ropa_vieja_Canarian_style_in_Fataga%2C_Gran_Canaria%2C_the_Canary_Islands.JPG/960px-Ropa_vieja_Canarian_style_in_Fataga%2C_Gran_Canaria%2C_the_Canary_Islands.JPG"
        },
        {
          "name": "Baho",
          "desc": "Gedämpftes Gericht aus Fleisch, Kochbanane und Maniok.",
          "descEn": "A steamed dish of meat, plantain and cassava.",
          "long": "Ein gedämpftes Gericht aus Rindfleisch, grünen und reifen Kochbananen und Yuca, langsam in Bananenblättern gegart. Saftig, herzhaft und sättigend. Ein beliebtes Wochenendgericht zum Teilen.",
          "longEn": "A steamed dish of beef, green and ripe plantain and cassava, slow-cooked in banana leaves. Juicy, savoury and filling. A popular weekend dish for sharing.",
          "ingredients": "Rindfleisch, grüne und reife Kochbananen, Yuca, Krautsalat, Bananenblätter",
          "ingredientsEn": "Beef, green and ripe plantains, cassava, slaw, banana leaves",
          "origin": "Ein traditionelles nicaraguanisches Gericht, dessen Name vom Dämpfen ('vaho') abgeleitet ist.",
          "originEn": "A traditional Nicaraguan dish whose name derives from steaming ('vaho').",
          "occasions": "Großes Wochenend- und Familiengericht zum gemeinsamen Essen.",
          "occasionsEn": "A big weekend and family dish for eating together.",
          "order": "Un baho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Baho.jpg/960px-Baho.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pinolillo",
          "desc": "Traditionelles Getränk aus geröstetem Mais und Kakao.",
          "descEn": "A traditional drink made from roasted corn and cacao.",
          "long": "Ein traditionelles Getränk aus geröstetem Maismehl und Kakao mit Zimt, gemixt mit Wasser oder Milch. Es schmeckt erdig, leicht süß und schokoladig. Gilt als Nationalgetränk Nicaraguas.",
          "longEn": "A traditional drink of roasted corn flour and cacao with cinnamon, mixed with water or milk. It tastes earthy, lightly sweet and chocolatey. Considered Nicaragua's national drink.",
          "ingredients": "Geröstetes Maismehl, Kakao, Zimt, Zucker, Wasser oder Milch",
          "ingredientsEn": "Roasted corn flour, cacao, cinnamon, sugar, water or milk",
          "origin": "Ein Getränk mit präkolumbischen Wurzeln, das so prägend ist, dass Nicaraguaner sich selbst als 'pinoleros' bezeichnen.",
          "originEn": "A drink with pre-Columbian roots that is so defining that Nicaraguans call themselves 'pinoleros'.",
          "occasions": "Erfrischung zu jeder Tageszeit und bei Festen.",
          "occasionsEn": "A refresher at any time of day and at celebrations.",
          "order": "Un pinolillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Pinolillo.jpg"
        },
        {
          "name": "Flor de Caña",
          "desc": "Weltbekannter, vulkanisch gereifter Premium-Rum.",
          "descEn": "A world-famous premium rum aged at the foot of a volcano.",
          "long": "Ein international ausgezeichneter nicaraguanischer Rum, der am Fuß eines Vulkans gereift wird und für seine sanfte, ausgewogene Note bekannt ist. Wird pur, auf Eis oder in Cocktails getrunken. Ein Stolz des Landes.",
          "longEn": "An internationally acclaimed Nicaraguan rum, aged at the foot of a volcano and known for its smooth, balanced character. Drunk neat, on the rocks or in cocktails. A point of national pride.",
          "ingredients": "Zuckerrohr, gereift in Eichenfässern",
          "ingredientsEn": "Sugar cane, aged in oak barrels",
          "origin": "Hergestellt in Nicaragua und seit dem 19. Jahrhundert in der Nähe des Vulkans San Cristóbal gereift.",
          "originEn": "Made in Nicaragua and aged near the San Cristóbal volcano since the 19th century.",
          "occasions": "Genussgetränk für Feiern und besondere Anlässe.",
          "occasionsEn": "A treat for celebrations and special occasions.",
          "order": "Un Flor de Caña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Old_Rum_bottles%2C_2014.jpg/960px-Old_Rum_bottles%2C_2014.jpg"
        },
        {
          "name": "Cerveza Toña",
          "desc": "Beliebtes lokales Lagerbier.",
          "descEn": "A popular local lager.",
          "long": "Ein leichtes, erfrischendes nicaraguanisches Lagerbier. Wird gut gekühlt getrunken und ist landesweit beliebt. Eine der bekanntesten Biermarken des Landes.",
          "longEn": "A light, refreshing Nicaraguan lager. Drunk well chilled and popular nationwide. One of the country's best-known beer brands.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Eine traditionsreiche, in Nicaragua gebraute Biermarke.",
          "originEn": "A long-established beer brand brewed in Nicaragua.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "occasionsEn": "A refresher for social occasions and hot days.",
          "order": "Una Toña bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/To%C3%B1a_Beer.jpg/960px-To%C3%B1a_Beer.jpg"
        },
        {
          "name": "Cacao",
          "desc": "Erfrischendes kaltes Kakaogetränk mit Maismehl.",
          "descEn": "A refreshing cold cacao drink with corn flour.",
          "long": "Ein erfrischendes Getränk aus gerösteten Kakaobohnen, gemixt mit Reis, Milch oder Wasser, Zucker und Zimt. Schokoladig, cremig und mild süß. Eine traditionelle, kalte Erfrischung.",
          "longEn": "A refreshing drink of roasted cacao beans, blended with rice, milk or water, sugar and cinnamon. Chocolatey, creamy and mildly sweet. A traditional cold refresher.",
          "ingredients": "Geröstete Kakaobohnen, Reis, Zimt, Zucker, Milch oder Wasser",
          "ingredientsEn": "Roasted cacao beans, rice, cinnamon, sugar, milk or water",
          "origin": "Ein Getränk mit präkolumbischen Wurzeln, da Kakao in Mesoamerika seit jeher geschätzt wurde.",
          "originEn": "A drink with pre-Columbian roots, as cacao has always been prized in Mesoamerica.",
          "occasions": "Erfrischung an heißen Tagen und bei Festen.",
          "occasionsEn": "A refresher on hot days and at celebrations.",
          "order": "Un cacao, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Theobroma_cacao_Blanco_clean.jpg/960px-Theobroma_cacao_Blanco_clean.jpg"
        }
      ],
      "tip": "Vulkan-Boarding am Cerro Negro bei León ist ein einzigartiges Abenteuer – Schutzanzug nicht vergessen.",
      "tipEn": "Volcano boarding on Cerro Negro near León is a one-of-a-kind adventure, so don't forget the protective suit."
    },
    {
      "id": "costarica",
      "sports": {
        "intro": "Fußball begeistert das ganze Land, vor allem seit dem Viertelfinale bei der WM 2014. Die ‚Sele' und ihre Stars sind Quelle großen Nationalstolzes.",
        "introEn": "Football thrills the whole country, especially since reaching the 2014 World Cup quarter-finals. The ‘Sele' and its stars are a source of great national pride.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Der mit Abstand beliebteste Sport; Erzrivalen sind Saprissa und Alajuelense.", "noteEn": "By far the most popular sport; the arch-rivals are Saprissa and Alajuelense." }
        ],
        "athletes": [
          { "name": "Keylor Navas", "sport": "Fußball", "sportEn": "Football", "note": "Weltklasse-Torwart, gewann mit Real Madrid mehrfach die Champions League.", "noteEn": "A world-class goalkeeper who won the Champions League several times with Real Madrid." },
          { "name": "Claudia Poll", "sport": "Schwimmen", "sportEn": "Swimming", "note": "Gewann 1996 Olympiagold – die erste Goldmedaille des Landes.", "noteEn": "Won Olympic gold in 1996 – the country's first gold medal." }
        ]
      },
      "name": "Costa Rica",
      "flag": "🇨🇷",
      "region": "Mittelamerika",
      "capital": "San José",
      "tagline": "Pura Vida: Regenwald, Wildtiere und Traumstrände",
      "taglineEn": "Pura Vida: rainforest, wildlife and dream beaches",
      "population": "Etwa 5,3 Millionen Einwohner (2025).",
      "populationEn": "About 5.3 million inhabitants (2025).",
      "ageStructure": "Älter als die Nachbarn: Medianalter um die 33 Jahre, mit einer der höchsten Lebenserwartungen der Region.",
      "ageStructureEn": "Older than its neighbours: a median age of around 33 and one of the highest life expectancies in the region.",
      "government": "Stabile präsidentielle Demokratie ohne eigenes Militär (1948 abgeschafft).",
      "governmentEn": "A stable presidential democracy with no army of its own (abolished in 1948).",
      "economy": "Eine der wohlhabendsten und stabilsten Volkswirtschaften Mittelamerikas mit starker Mittelschicht.",
      "economyEn": "One of the wealthiest and most stable economies in Central America, with a strong middle class.",
      "livelihood": "Ökotourismus, Hightech- und Medizintechnik-Exporte, Dienstleistungen sowie Kaffee und Ananas.",
      "livelihoodEn": "Eco-tourism, high-tech and medical-device exports, services as well as coffee and pineapple.",
      "about": "Costa Rica ist ein Öko-Tourismus-Paradies mit Nebelwäldern, Vulkanen und Stränden an Pazifik und Karibik. Rund ein Viertel des Landes steht unter Naturschutz – ideal für Faultiere, Tukane und Zip-Lining. Die entspannte 'Pura Vida'-Lebenshaltung ist überall spürbar.",
      "aboutEn": "Costa Rica is an ecotourism paradise with cloud forests, volcanoes and beaches on both the Pacific and the Caribbean. Around a quarter of the country is protected nature reserve, ideal for sloths, toucans and zip-lining. The laid-back 'Pura Vida' attitude is everywhere you go.",
      "history": "Die Region war dünn besiedelt von indigenen Völkern, ohne große Hochkultur. 1502 landete Kolumbus an der Karibikküste. Nach der spanischen Kolonialzeit wurde Costa Rica 1821 unabhängig. 1948 schaffte das Land sein Militär ab und investierte stattdessen in Bildung und Naturschutz.",
      "historyEn": "The region was sparsely settled by indigenous peoples, without any great civilisation. Columbus landed on the Caribbean coast in 1502. After the Spanish colonial era, Costa Rica became independent in 1821. In 1948 the country abolished its army and invested in education and nature conservation instead.",
      "language": "Das costa-ricanische Spanisch verwendet überwiegend 'usted', aber auch Voseo mit 'vos'. Es klingt weich und höflich, mit eigenem Slang. Das Markenzeichen ist 'Pura Vida' – Begrüßung, Dank und Lebensgefühl zugleich. Costa-Ricaner nennen sich selbst 'ticos'.",
      "languageEn": "Costa Rican Spanish mostly uses 'usted', but also voseo with 'vos'. It sounds soft and polite, with its own slang. Its hallmark is 'Pura Vida' – greeting, thanks and a whole outlook on life all at once. Costa Ricans call themselves 'ticos'.",
      "words": [
        {
          "es": "¡Pura vida!",
          "de": "Alles super! (Gruß, Dank, Lebensgefühl)",
          "en": "All good! (greeting, thanks, way of life)"
        },
        {
          "es": "tico/tica",
          "de": "Costa-Ricaner/in (Spitzname)",
          "en": "Costa Rican (nickname)"
        },
        {
          "es": "mae",
          "de": "Alter, Kumpel",
          "en": "mate, dude"
        },
        {
          "es": "tuanis",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "¡Qué chiva!",
          "de": "Wie cool! / Klasse!",
          "en": "How cool! / Brilliant!"
        },
        {
          "es": "soda",
          "de": "kleines, einfaches Lokal mit Hausmannskost",
          "en": "small, simple eatery serving home cooking"
        }
      ],
      "food": [
        {
          "name": "Gallo pinto",
          "desc": "Reis mit Bohnen, das klassische Frühstück.",
          "descEn": "Rice with beans, the classic breakfast.",
          "long": "Die costa-ricanische Version aus Reis und schwarzen oder roten Bohnen, oft mit der typischen Würzsauce Salsa Lizano verfeinert. Herzhaft, leicht würzig und sättigend. Das klassische Frühstück des Landes.",
          "longEn": "The Costa Rican version of rice and black or red beans, often seasoned with the typical sauce Salsa Lizano. Savoury, lightly spiced and filling. The country's classic breakfast.",
          "ingredients": "Reis, Bohnen, Zwiebeln, Paprika, Koriander, Salsa Lizano",
          "ingredientsEn": "Rice, beans, onions, peppers, coriander, Salsa Lizano",
          "origin": "Grundnahrungsmittel Costa Ricas; das Land teilt sich die Tradition mit Nicaragua und verwendet typischerweise Salsa Lizano.",
          "originEn": "A staple of Costa Rica; the country shares the tradition with Nicaragua and typically uses Salsa Lizano.",
          "occasions": "Traditionelles Frühstück, oft mit Ei, Käse oder Tortilla.",
          "occasionsEn": "A traditional breakfast, often with egg, cheese or tortilla.",
          "order": "Un gallo pinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Gallo_pinto-IMG_0672.JPG/960px-Gallo_pinto-IMG_0672.JPG"
        },
        {
          "name": "Casado",
          "desc": "Tellergericht mit Reis, Bohnen, Salat, Kochbanane und Fleisch.",
          "descEn": "A plate of rice, beans, salad, plantain and meat.",
          "long": "Ein ausgewogener Teller mit Reis, Bohnen, Salat, Kochbananen und einer Proteinwahl wie Fleisch, Huhn oder Fisch. Eine vollständige, herzhafte Mahlzeit. Das typische Mittagessen Costa Ricas.",
          "longEn": "A balanced plate of rice, beans, salad, plantain and a choice of protein like meat, chicken or fish. A complete, hearty meal. Costa Rica's typical lunch.",
          "ingredients": "Reis, Bohnen, Salat, gebratene Kochbananen, Fleisch oder Fisch, manchmal Ei oder Käse",
          "ingredientsEn": "Rice, beans, salad, fried plantain, meat or fish, sometimes egg or cheese",
          "origin": "Der Name bedeutet 'verheiratet' und verweist scherzhaft auf die feste Kombination der Komponenten auf einem Teller.",
          "originEn": "The name means 'married' and jokingly refers to the fixed combination of components on one plate.",
          "occasions": "Klassisches Mittagessen in Sodas (kleinen Lokalen) im ganzen Land.",
          "occasionsEn": "A classic lunch in sodas (small eateries) all over the country.",
          "order": "Un casado con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Casado_Tico.jpg/960px-Casado_Tico.jpg"
        },
        {
          "name": "Olla de carne",
          "desc": "Herzhafter Rindfleischeintopf mit Knollengemüse.",
          "descEn": "A hearty beef stew with root vegetables.",
          "long": "Ein herzhafter Rindfleischeintopf mit viel Wurzelgemüse wie Yuca, Kochbananen, Mais und Kürbis. Reichhaltig, sättigend und wärmend. Ein traditionelles Sonntagsgericht.",
          "longEn": "A hearty beef stew with plenty of root vegetables like cassava, plantain, corn and squash. Rich, filling and warming. A traditional Sunday dish.",
          "ingredients": "Rindfleisch, Yuca, Kochbananen, Mais, Chayote, Kürbis, Karotten, Gewürze",
          "ingredientsEn": "Beef, cassava, plantain, corn, chayote, squash, carrots, spices",
          "origin": "Ein traditionelles costa-ricanisches Eintopfgericht, das die heimischen Wurzelgemüse zur Geltung bringt.",
          "originEn": "A traditional Costa Rican stew that showcases the local root vegetables.",
          "occasions": "Typisches Sonntags- und Familiengericht.",
          "occasionsEn": "A typical Sunday and family dish.",
          "order": "Una olla de carne, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Olla_de_carne_2.png/960px-Olla_de_carne_2.png"
        },
        {
          "name": "Ceviche",
          "desc": "In Limette marinierter roher Fisch mit Koriander.",
          "descEn": "Raw fish marinated in lime with coriander.",
          "long": "Roher Fisch, mariniert in Limettensaft mit Koriander, Zwiebeln und Paprika. Frisch, säuerlich und leicht. Wird kalt serviert, oft mit Crackern oder Kochbananenchips.",
          "longEn": "Raw fish, marinated in lime juice with coriander, onions and pepper. Fresh, tangy and light. Served cold, often with crackers or plantain crisps.",
          "ingredients": "Frischer Fisch, Limettensaft, Koriander, Zwiebeln, Paprika, Salz",
          "ingredientsEn": "Fresh fish, lime juice, coriander, onions, peppers, salt",
          "origin": "Eine costa-ricanische Variante des in ganz Lateinamerika beliebten Ceviches, meist mit lokalem Weißfisch.",
          "originEn": "A Costa Rican version of the ceviche popular all over Latin America, usually with local white fish.",
          "occasions": "Erfrischende Vorspeise oder Snack, besonders an der Küste und an heißen Tagen.",
          "occasionsEn": "A refreshing starter or snack, especially on the coast and on hot days.",
          "order": "Un ceviche de pescado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Chifrijo",
          "desc": "Schichtgericht aus Reis, Bohnen, Chicharrón und Pico de Gallo.",
          "descEn": "A layered dish of rice, beans, chicharrón and pico de gallo.",
          "long": "Ein Schichtgericht aus Reis, Bohnen, knusprigem Schweinefleisch und Pico de Gallo, serviert mit Tortillachips. Herzhaft, knusprig und frisch zugleich. Ein beliebter Bar-Snack.",
          "longEn": "A layered dish of rice, beans, crispy pork and pico de gallo, served with tortilla chips. Savoury, crunchy and fresh all at once. A popular bar snack.",
          "ingredients": "Reis, Bohnen, knuspriges Schweinefleisch (chicharrón), Pico de Gallo, Avocado, Tortillachips",
          "ingredientsEn": "Rice, beans, crispy pork (chicharrón), pico de gallo, avocado, tortilla chips",
          "origin": "Ein relativ modernes costa-ricanisches Gericht, dessen Name sich aus chicharrón und frijoles zusammensetzt.",
          "originEn": "A relatively modern Costa Rican dish whose name is a blend of chicharrón and frijoles.",
          "occasions": "Beliebter Snack zu Bier in Bars und bei geselligen Anlässen.",
          "occasionsEn": "A popular snack with beer in bars and at social occasions.",
          "order": "Un chifrijo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Chifrijo.jpg/960px-Chifrijo.jpg"
        },
        {
          "name": "Arroz con pollo",
          "desc": "Würziger Reis mit Hähnchen, ein Party-Klassiker.",
          "descEn": "Spicy rice with chicken, a party classic.",
          "long": "Gewürzter Reis, gemischt mit zerzupftem Hühnchen und Gemüse, oft mit Salsa Lizano abgeschmeckt. Herzhaft, aromatisch und sättigend. Ein Klassiker für Feiern.",
          "longEn": "Seasoned rice, mixed with shredded chicken and vegetables, often seasoned with Salsa Lizano. Savoury, aromatic and filling. A classic for celebrations.",
          "ingredients": "Reis, Hühnchen, Paprika, Erbsen, Karotten, Mais, Koriander, Salsa Lizano",
          "ingredientsEn": "Rice, chicken, peppers, peas, carrots, corn, coriander, Salsa Lizano",
          "origin": "Eine costa-ricanische Variante des in ganz Lateinamerika verbreiteten Reis-mit-Huhn-Gerichts.",
          "originEn": "A Costa Rican version of the rice-with-chicken dish found all over Latin America.",
          "occasions": "Beliebt bei Geburtstagen, Feiern und Familienanlässen.",
          "occasionsEn": "Popular at birthdays, celebrations and family occasions.",
          "order": "Un arroz con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Arroz-con-Pollo.jpg/960px-Arroz-con-Pollo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Café costarricense",
          "desc": "Hochwertiger Hochlandkaffee, oft im 'Chorreador' gebrüht.",
          "descEn": "High-quality highland coffee, often brewed in a 'chorreador'.",
          "long": "Hochwertiger costa-ricanischer Kaffee mit klarem, ausgewogenem Aroma und hellen, fruchtigen Noten. Wird traditionell durch einen Stofffilter (chorreador) zubereitet. Gilt als einer der besten der Welt.",
          "longEn": "High-quality Costa Rican coffee with a clean, balanced aroma and bright, fruity notes. Traditionally made through a cloth filter (chorreador). Considered one of the best in the world.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "ingredientsEn": "Roasted arabica coffee beans, water",
          "origin": "Costa Rica hat eine lange Kaffeetradition; das Land erlaubt per Gesetz nur den Anbau von hochwertigem Arabica.",
          "originEn": "Costa Rica has a long coffee tradition; by law the country permits only the cultivation of high-quality arabica.",
          "occasions": "Getränk für den Morgen und gesellige Pausen.",
          "occasionsEn": "A drink for the morning and sociable breaks.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/La_flor_del_cafe_Costa_Rica.JPG/960px-La_flor_del_cafe_Costa_Rica.JPG"
        },
        {
          "name": "Agua dulce",
          "desc": "Heißes Getränk aus aufgelöstem Rohrzucker.",
          "descEn": "A hot drink made from dissolved cane sugar.",
          "long": "Ein warmes, süßes Getränk aus aufgelöstem Rohrzucker (tapa de dulce) in Wasser oder Milch. Mild, süß und wärmend. Ein traditionelles ländliches Getränk.",
          "longEn": "A warm, sweet drink of dissolved cane sugar (tapa de dulce) in water or milk. Mild, sweet and warming. A traditional rural drink.",
          "ingredients": "Rohrzucker (tapa de dulce), Wasser oder Milch",
          "ingredientsEn": "Cane sugar (tapa de dulce), water or milk",
          "origin": "Ein traditionelles costa-ricanisches Getränk aus unraffiniertem Zuckerrohr, besonders auf dem Land verbreitet.",
          "originEn": "A traditional Costa Rican drink of unrefined sugar cane, especially common in the countryside.",
          "occasions": "Warmes Getränk zum Frühstück und an kühlen Tagen.",
          "occasionsEn": "A warm drink for breakfast and on cool days.",
          "order": "Un agua dulce, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Panela_en_cuadros.JPG/960px-Panela_en_cuadros.JPG"
        },
        {
          "name": "Imperial",
          "desc": "Das ikonische lokale Bier mit dem Adler-Logo.",
          "descEn": "The iconic local beer with the eagle logo.",
          "long": "Das bekannteste Lagerbier Costa Ricas, mild und erfrischend, erkennbar am Adler-Logo. Wird gut gekühlt getrunken und gilt als nationales Symbol. Allgegenwärtig im ganzen Land.",
          "longEn": "Costa Rica's best-known lager, mild and refreshing, recognisable by its eagle logo. Drunk well chilled and considered a national symbol. Found everywhere in the country.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Eine traditionsreiche, in Costa Rica gebraute Biermarke und ein nationales Wahrzeichen.",
          "originEn": "A long-established beer brand brewed in Costa Rica and a national landmark.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "occasionsEn": "A refresher for social occasions and hot days.",
          "order": "Una Imperial bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Cerveza_Imperial.JPG/960px-Cerveza_Imperial.JPG"
        },
        {
          "name": "Guaro",
          "desc": "Klarer Zuckerrohrschnaps, der Nationalschnaps.",
          "descEn": "A clear cane-sugar spirit, the national tipple.",
          "long": "Eine klare Spirituose auf Zuckerrohrbasis, mild im Geschmack und vielseitig einsetzbar. Wird pur, als Shot oder in Cocktails wie dem Guaro Sour getrunken. Die nationale Spirituose Costa Ricas.",
          "longEn": "A clear cane-sugar spirit, mild in flavour and versatile. Drunk neat, as a shot or in cocktails like the Guaro Sour. Costa Rica's national spirit.",
          "ingredients": "Zuckerrohr, Wasser",
          "ingredientsEn": "Sugar cane, water",
          "origin": "Die bekannteste Marke wird staatlich reguliert hergestellt und gilt als Nationalschnaps Costa Ricas.",
          "originEn": "The best-known brand is made under state regulation and is considered Costa Rica's national spirit.",
          "occasions": "Beliebt bei Partys und Feiern, oft als Shot oder Cocktail.",
          "occasionsEn": "Popular at parties and celebrations, often as a shot or cocktail.",
          "order": "Un guaro, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Guaro_%28M%C3%A1laga%29.jpg"
        }
      ],
      "tip": "Die Trockenzeit (Dezember bis April) ist ideal – in der Regenzeit sind viele Pisten matschig.",
      "tipEn": "The dry season (December to April) is ideal, as many tracks turn to mud in the rainy season."
    },
    {
      "id": "panama",
      "sports": {
        "intro": "Baseball und Boxen haben eine lange Tradition und brachten Weltstars hervor; zugleich gewinnt Fußball immer mehr Anhänger.",
        "introEn": "Baseball and boxing have a long tradition and produced global stars; at the same time football keeps gaining followers.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Traditionssport mit großen MLB-Exporten.", "noteEn": "A traditional sport with major MLB exports." },
          { "name": "Boxen", "nameEn": "Boxing", "note": "Reiche Geschichte mit zahlreichen Weltmeistern.", "noteEn": "A rich history with numerous world champions." },
          { "name": "Fußball", "nameEn": "Football", "note": "Wachsende Begeisterung seit der WM-Teilnahme 2018.", "noteEn": "Growing enthusiasm since the 2018 World Cup appearance." }
        ],
        "athletes": [
          { "name": "Mariano Rivera", "sport": "Baseball", "sportEn": "Baseball", "note": "Bester Closer der MLB-Geschichte, einstimmig in die Hall of Fame gewählt.", "noteEn": "The greatest closer in MLB history, elected unanimously to the Hall of Fame." },
          { "name": "Roberto Durán", "sport": "Boxen", "sportEn": "Boxing", "note": "„Manos de Piedra“, einer der größten Boxer aller Zeiten.", "noteEn": "‘Manos de Piedra', one of the greatest boxers of all time." },
          { "name": "Irving Saladino", "sport": "Weitsprung", "sportEn": "Long jump", "note": "Gewann 2008 Olympiagold – Panamas erste Goldmedaille.", "noteEn": "Won Olympic gold in 2008 – Panama's first gold medal." }
        ]
      },
      "name": "Panama",
      "flag": "🇵🇦",
      "region": "Mittelamerika",
      "capital": "Panama-Stadt",
      "tagline": "Kanal, Karibikinseln und Großstadt-Skyline",
      "taglineEn": "Canal, Caribbean islands and a big-city skyline",
      "population": "Rund 4,5 Millionen Einwohner (2025).",
      "populationEn": "Around 4.5 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 30 Jahren.",
      "ageStructureEn": "A young population with a median age of about 30.",
      "government": "Präsidentielle Republik; nutzt den US-Dollar (Balboa) als Währung.",
      "governmentEn": "A presidential republic; it uses the US dollar (balboa) as its currency.",
      "economy": "Eine der dynamischsten Volkswirtschaften der Region, getragen vom Kanal und vom Finanzsektor.",
      "economyEn": "One of the most dynamic economies in the region, driven by the canal and the financial sector.",
      "livelihood": "Der Panamakanal, Logistik und Häfen, Bankwesen, Handel in der Freihandelszone Colón und Tourismus.",
      "livelihoodEn": "The Panama Canal, logistics and ports, banking, trade in the Colón free-trade zone and tourism.",
      "about": "Panama verbindet als Landbrücke Nord- und Südamerika und beherbergt den weltberühmten Panamakanal. Backpacker zieht es zu den paradiesischen San-Blas-Inseln der Guna, zum Surferort Bocas del Toro und in die moderne Hauptstadt mit kolonialer Altstadt. Pazifik und Karibik liegen nur Stunden auseinander.",
      "aboutEn": "As a land bridge, Panama connects North and South America and is home to the world-famous Panama Canal. Backpackers are drawn to the Guna's idyllic San Blas Islands, the surf town of Bocas del Toro and the modern capital with its colonial old town. The Pacific and the Caribbean are just hours apart.",
      "history": "Vor der Eroberung lebten hier Völker wie die Guna, Emberá und Ngäbe. 1501 kamen die Spanier, Panama wurde wichtiger Umschlagplatz für Silber. 1821 löste sich das Land von Spanien und schloss sich Großkolumbien an. 1903 wurde Panama mit US-Hilfe von Kolumbien unabhängig; der Kanal wurde 1914 eröffnet und 1999 an Panama übergeben.",
      "historyEn": "Before the conquest, peoples such as the Guna, Emberá and Ngäbe lived here. The Spanish arrived in 1501, and Panama became an important transit point for silver. In 1821 the country broke away from Spain and joined Gran Colombia. In 1903 Panama gained independence from Colombia with US help; the canal opened in 1914 and was handed over to Panama in 1999.",
      "language": "Das panamaische Spanisch klingt karibisch: schnell, mit verschlucktem 's' und weichen Endungen. Voseo ist unüblich, man nutzt 'tú'. Durch die Kanalgeschichte gibt es viele Anglizismen. Indigene Sprachen wie Guna und Ngäbere sowie Englisch-Kreol an der Karibikküste sind verbreitet.",
      "languageEn": "Panamanian Spanish sounds Caribbean: fast, with a swallowed 's' and soft endings. Voseo is unusual; people use 'tú'. Because of the canal's history, there are many anglicisms. Indigenous languages such as Guna and Ngäbere, as well as an English-based creole on the Caribbean coast, are common.",
      "words": [
        {
          "es": "¿Qué xopá?",
          "de": "Was geht? (typische Begrüßung)",
          "en": "What's up? (typical greeting)"
        },
        {
          "es": "chuleta",
          "de": "Mann! / Verflixt! (Ausruf)",
          "en": "Man! / Darn it! (exclamation)"
        },
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "buena leche",
          "de": "Glück / Glückspilz",
          "en": "luck / lucky devil"
        },
        {
          "es": "fren",
          "de": "Freund, Kumpel (von engl. 'friend')",
          "en": "friend, mate (from English 'friend')"
        },
        {
          "es": "pelao/pelá",
          "de": "Kind / junger Mensch",
          "en": "kid / young person"
        }
      ],
      "food": [
        {
          "name": "Sancocho",
          "desc": "Würzige Hähnchensuppe mit Yam und Koriander, das Nationalgericht.",
          "descEn": "A spicy chicken soup with yam and coriander, the national dish.",
          "long": "Eine herzhafte Hühnersuppe mit Yuca, Mais und der typischen Kräuterwürze Culantro. Kräftig, wärmend und aromatisch. Gilt als das tröstende Nationalgericht Panamas.",
          "longEn": "A hearty chicken soup with cassava, corn and the typical herb culantro. Robust, warming and aromatic. Considered Panama's comforting national dish.",
          "ingredients": "Hühnchen, Yuca, Mais, Culantro (Langer Koriander), Zwiebeln, Gewürze",
          "ingredientsEn": "Chicken, cassava, corn, culantro (long coriander), onions, spices",
          "origin": "Eine panamaische Variante des in der Karibik und Lateinamerika verbreiteten Sancocho-Eintopfs.",
          "originEn": "A Panamanian version of the sancocho stew found across the Caribbean and Latin America.",
          "occasions": "Beliebt als Wohlfühlgericht, oft am Wochenende oder gegen Kater.",
          "occasionsEn": "Popular as a comfort dish, often at weekends or to cure a hangover.",
          "order": "Un sancocho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Ropa vieja",
          "desc": "Zerzupftes Rindfleisch in Tomatensauce mit Reis.",
          "descEn": "Shredded beef in tomato sauce with rice.",
          "long": "Zerzupftes Rindfleisch, geschmort in einer Tomatensauce mit Paprika und Zwiebeln. Der Name bedeutet 'alte Kleider' wegen der faserigen Optik. Herzhaft und aromatisch, serviert mit Reis.",
          "longEn": "Shredded beef, braised in a tomato sauce with pepper and onions. The name means 'old clothes' because of its stringy look. Savoury and aromatic, served with rice.",
          "ingredients": "Zerzupftes Rindfleisch, Tomaten, Paprika, Zwiebeln, Knoblauch, Gewürze, Reis",
          "ingredientsEn": "Shredded beef, tomatoes, peppers, onions, garlic, spices, rice",
          "origin": "Ein Gericht mit spanisch-karibischen Wurzeln, das in mehreren Ländern der Region verbreitet ist.",
          "originEn": "A dish with Spanish-Caribbean roots, found in several countries of the region.",
          "occasions": "Beliebtes Mittagessen für Familien- und Alltagsanlässe.",
          "occasionsEn": "A popular lunch for family and everyday occasions.",
          "order": "Una ropa vieja, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ropa_vieja_plato_cubano_por_excelencia_2.jpg/960px-Ropa_vieja_plato_cubano_por_excelencia_2.jpg"
        },
        {
          "name": "Patacones",
          "desc": "Frittierte, platt gedrückte grüne Kochbananen.",
          "descEn": "Fried, flattened green plantains.",
          "long": "Zweimal frittierte, flach gedrückte Scheiben grüner Kochbananen, außen knusprig und innen weich. Werden gesalzen als Beilage oder Snack serviert. Knusprig und herzhaft.",
          "longEn": "Twice-fried, flattened slices of green plantain, crisp outside and soft within. Served salted as a side or snack. Crunchy and savoury.",
          "ingredients": "Grüne Kochbananen, Öl zum Frittieren, Salz",
          "ingredientsEn": "Green plantains, oil for frying, salt",
          "origin": "Ein in der Karibik und Mittelamerika verbreitetes Kochbananengericht, fester Bestandteil der panamaischen Küche.",
          "originEn": "A plantain dish common across the Caribbean and Central America, a fixture of Panamanian cooking.",
          "occasions": "Allgegenwärtige Beilage zu Fleisch und Fisch sowie als Snack.",
          "occasionsEn": "An ever-present side to meat and fish and as a snack.",
          "order": "Unos patacones, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Arroz con pollo",
          "desc": "Würziger Reis mit Hähnchen, ein Alltagsklassiker.",
          "descEn": "Spicy rice with chicken, an everyday classic.",
          "long": "Gewürzter Reis mit zerzupftem Hühnchen und Gemüse, eine sättigende Alltagsmahlzeit. Herzhaft, aromatisch und farbenfroh. Beliebt bei Familienanlässen.",
          "longEn": "Seasoned rice with shredded chicken and vegetables, a filling everyday meal. Savoury, aromatic and colourful. Popular at family occasions.",
          "ingredients": "Reis, Hühnchen, Paprika, Erbsen, Karotten, Mais, Koriander, Gewürze",
          "ingredientsEn": "Rice, chicken, peppers, peas, carrots, corn, coriander, spices",
          "origin": "Eine panamaische Variante des in ganz Lateinamerika beliebten Reis-mit-Huhn-Gerichts.",
          "originEn": "A Panamanian version of the rice-with-chicken dish popular all over Latin America.",
          "occasions": "Beliebt bei Feiern, Geburtstagen und als Mittagessen.",
          "occasionsEn": "Popular at celebrations, birthdays and as a lunch.",
          "order": "Un arroz con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Arroz-con-Pollo.jpg/960px-Arroz-con-Pollo.jpg"
        },
        {
          "name": "Carimañola",
          "desc": "Frittierte Maniok-Rolle mit Fleischfüllung.",
          "descEn": "A fried cassava roll with a meat filling.",
          "long": "Eine längliche, frittierte Teigtasche aus Yuca-Teig, gefüllt mit gewürztem Fleisch oder Käse. Außen knusprig, innen weich und herzhaft. Ein beliebter Frühstücks- und Snackklassiker.",
          "longEn": "A long fried pasty of cassava dough, filled with seasoned meat or cheese. Crisp outside, soft and savoury within. A popular breakfast and snack classic.",
          "ingredients": "Yuca, Hackfleisch oder Käse, Zwiebeln, Gewürze, Öl zum Frittieren",
          "ingredientsEn": "Cassava, mince or cheese, onions, spices, oil for frying",
          "origin": "Ein traditionelles Gericht der panamaischen und kolumbianischen Karibikküste auf Yuca-Basis.",
          "originEn": "A traditional cassava-based dish of the Panamanian and Colombian Caribbean coast.",
          "occasions": "Beliebtes Frühstück und Snack an Ständen.",
          "occasionsEn": "A popular breakfast and snack at stalls.",
          "order": "Una carimañola, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Barranquilla_-_Carima%C3%B1olas.jpg/960px-Barranquilla_-_Carima%C3%B1olas.jpg"
        },
        {
          "name": "Hojaldre",
          "desc": "Frittiertes Fladenbrot, beliebt zum Frühstück.",
          "descEn": "A fried flatbread, popular for breakfast.",
          "long": "Ein frittiertes, luftiges Weizengebäck, ähnlich einem Fettkuchen, außen knusprig und innen weich. Wird oft salzig oder mit etwas Zucker zum Frühstück gegessen. Begleitet typischerweise herzhafte Speisen und Kaffee.",
          "longEn": "A fried, airy wheat pastry, similar to a fried doughnut, crisp outside and soft within. Often eaten savoury or with a little sugar for breakfast. Typically accompanies savoury dishes and coffee.",
          "ingredients": "Weizenmehl, Backpulver, Salz, Zucker, Öl zum Frittieren",
          "ingredientsEn": "Wheat flour, baking powder, salt, sugar, oil for frying",
          "origin": "Ein traditionelles panamaisches Frühstücksgebäck, das zur Familie der frittierten Brote gehört.",
          "originEn": "A traditional Panamanian breakfast pastry belonging to the family of fried breads.",
          "occasions": "Klassische Frühstücksbeilage, oft zu Fleisch, Ei oder Kaffee.",
          "occasionsEn": "A classic breakfast side, often with meat, egg or coffee.",
          "order": "Un hojaldre, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/CocinaPalentina-Tarta_Hojaldre_y_Yema_001.JPG/960px-CocinaPalentina-Tarta_Hojaldre_y_Yema_001.JPG"
        }
      ],
      "drink": [
        {
          "name": "Chicha",
          "desc": "Erfrischender Saft aus frischen Früchten wie Tamarinde oder Maracuja.",
          "descEn": "A refreshing juice from fresh fruit such as tamarind or passion fruit.",
          "long": "Ein erfrischendes Getränk aus frischen Früchten oder Mais, gemixt mit Wasser und Zucker. Fruchtig, süß und gut gekühlt. In Panama meist als alkoholfreies Fruchtgetränk gemeint.",
          "longEn": "A refreshing drink of fresh fruit or corn, blended with water and sugar. Fruity, sweet and well chilled. In Panama it usually means a non-alcoholic fruit drink.",
          "ingredients": "Frische Früchte oder Mais, Wasser, Zucker",
          "ingredientsEn": "Fresh fruit or corn, water, sugar",
          "origin": "Der Begriff hat in Lateinamerika viele Bedeutungen; in Panama bezeichnet er meist erfrischende Fruchtsäfte.",
          "originEn": "The term has many meanings in Latin America; in Panama it usually refers to refreshing fruit juices.",
          "occasions": "Erfrischung zum Essen und an heißen Tagen.",
          "occasionsEn": "A refresher with food and on hot days.",
          "order": "Una chicha de maracuyá, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Seco Herrerano",
          "desc": "Klarer Zuckerrohrschnaps, der Nationalschnaps Panamas.",
          "descEn": "A clear cane-sugar spirit, Panama's national tipple.",
          "long": "Eine klare Spirituose auf Zuckerrohrbasis, die als Nationalschnaps Panamas gilt. Wird pur, mit Milch (seco con leche) oder in Cocktails getrunken. Mild und vielseitig.",
          "longEn": "A clear cane-sugar spirit regarded as Panama's national tipple. Drunk neat, with milk (seco con leche) or in cocktails. Mild and versatile.",
          "ingredients": "Zuckerrohr, Wasser",
          "ingredientsEn": "Sugar cane, water",
          "origin": "Hergestellt in der Provinz Herrera und seit Langem als Nationalspirituose Panamas etabliert.",
          "originEn": "Made in the province of Herrera and long established as Panama's national spirit.",
          "occasions": "Beliebt bei Festen und Feiern, oft als Cocktail.",
          "occasionsEn": "Popular at festivals and celebrations, often as a cocktail.",
          "order": "Un seco con leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Whiskey_sour.jpg/960px-Whiskey_sour.jpg"
        },
        {
          "name": "Cerveza Balboa",
          "desc": "Beliebtes lokales Lagerbier.",
          "descEn": "A popular local lager.",
          "long": "Ein traditionelles panamaisches Lagerbier, mild und erfrischend, benannt nach dem Entdecker Vasco Núñez de Balboa. Wird gut gekühlt getrunken. Eine der bekanntesten Biermarken des Landes.",
          "longEn": "A traditional Panamanian lager, mild and refreshing, named after the explorer Vasco Núñez de Balboa. Drunk well chilled. One of the country's best-known beer brands.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Eine traditionsreiche, in Panama gebraute Biermarke.",
          "originEn": "A long-established beer brand brewed in Panama.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "occasionsEn": "A refresher for social occasions and hot days.",
          "order": "Una Balboa bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cerveza_Balboa_-_Erik_Cleves_Kristensen.jpg/960px-Cerveza_Balboa_-_Erik_Cleves_Kristensen.jpg"
        },
        {
          "name": "Raspado",
          "desc": "Geschabtes Eis mit Sirup und Kondensmilch.",
          "descEn": "Shaved ice with syrup and condensed milk.",
          "long": "Ein erfrischendes Dessertgetränk aus geschabtem Eis, übergossen mit buntem Fruchtsirup und oft gesüßter Kondensmilch. Süß, kalt und farbenfroh. Ein beliebter Straßensnack bei Hitze.",
          "longEn": "A refreshing dessert drink of shaved ice, drizzled with colourful fruit syrup and often sweetened condensed milk. Sweet, cold and colourful. A popular street snack in the heat.",
          "ingredients": "Geschabtes Eis, Fruchtsirup, gesüßte Kondensmilch",
          "ingredientsEn": "Shaved ice, fruit syrup, sweetened condensed milk",
          "origin": "Eine in Lateinamerika weit verbreitete Eis-Spezialität, in Panama von Straßenverkäufern angeboten.",
          "originEn": "An iced treat widespread in Latin America, sold in Panama by street vendors.",
          "occasions": "Erfrischender Snack an heißen Tagen, besonders beliebt bei Kindern.",
          "occasionsEn": "A refreshing snack on hot days, especially popular with children.",
          "order": "Un raspado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Sno_cone.jpg/960px-Sno_cone.jpg"
        }
      ],
      "tip": "Für die San-Blas-Inseln Bargeld in kleinen Scheinen mitnehmen – die Guna nehmen keine Karten.",
      "tipEn": "Take cash in small notes for the San Blas Islands, as the Guna don't accept cards."
    },
    {
      "id": "cuba",
      "sports": {
        "intro": "Baseball ist Nationalsport und Herzensangelegenheit, während Kuba im Amateurboxen zur absoluten Weltspitze zählt und reihenweise Olympiasieger hervorbringt.",
        "introEn": "Baseball is the national sport and a matter of the heart, while Cuba is among the very best in amateur boxing, producing a string of Olympic champions.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Nationalsport mit fanatischer Anhängerschaft.", "noteEn": "The national sport with a fanatical following." },
          { "name": "Boxen", "nameEn": "Boxing", "note": "Eine der erfolgreichsten Boxnationen der Olympia-Geschichte.", "noteEn": "One of the most successful boxing nations in Olympic history." }
        ],
        "athletes": [
          { "name": "Teófilo Stevenson", "sport": "Boxen", "sportEn": "Boxing", "note": "Dreifacher Olympiasieger im Schwergewicht, Box-Legende.", "noteEn": "Three-time Olympic heavyweight champion, a boxing legend." },
          { "name": "Javier Sotomayor", "sport": "Hochsprung", "sportEn": "High jump", "note": "Hält bis heute den Hochsprung-Weltrekord (2,45 m).", "noteEn": "Still holds the high-jump world record (2.45 m)." }
        ]
      },
      "name": "Kuba",
      "flag": "🇨🇺",
      "region": "Karibik",
      "capital": "Havanna",
      "tagline": "Oldtimer, Rum und Salsa zwischen Verfall und Charme",
      "taglineEn": "Vintage cars, rum and salsa, between decay and charm",
      "population": "Etwa 11 Millionen Einwohner (2025) – durch starke Auswanderung zuletzt rückläufig.",
      "populationEn": "About 11 million inhabitants (2025) – recently declining due to heavy emigration.",
      "ageStructure": "Älteste Bevölkerung Lateinamerikas mit einem Medianalter von rund 43 Jahren.",
      "ageStructureEn": "The oldest population in Latin America, with a median age of around 43.",
      "government": "Sozialistischer Einparteienstaat unter Führung der Kommunistischen Partei.",
      "governmentEn": "A socialist one-party state led by the Communist Party.",
      "economy": "Staatlich gelenkte Wirtschaft in schwerer Krise mit Versorgungsengpässen und US-Embargo.",
      "economyEn": "A state-run economy in deep crisis, with supply shortages and the US embargo.",
      "livelihood": "Tourismus, Export von Ärzten und medizinischen Diensten, Tabak (Zigarren), Rum und Nickel.",
      "livelihoodEn": "Tourism, the export of doctors and medical services, tobacco (cigars), rum and nickel.",
      "about": "Kuba ist die größte Insel der Karibik und besticht durch koloniale Altstädte, Tabakfelder im Viñales-Tal und kilometerlange Strände wie Varadero. Backpacker reisen oft per Colectivo und übernachten in privaten Casas Particulares, die einen authentischen Einblick ins Alltagsleben geben.",
      "aboutEn": "Cuba is the largest island in the Caribbean and captivates with colonial old towns, tobacco fields in the Viñales valley and miles of beaches like Varadero. Backpackers often travel by colectivo and stay in private casas particulares, which give an authentic glimpse into everyday life.",
      "history": "Vor der Ankunft von Kolumbus 1492 lebten Taíno und Ciboney auf der Insel, bevor Spanien Kuba als Kolonie und Sklavenhalter-Zentrum für Zuckerrohr ausbeutete. 1898 endete die spanische Herrschaft, doch erst die Revolution von 1959 unter Fidel Castro und Che Guevara machte Kuba zum sozialistischen Staat. Nach Jahrzehnten unter US-Embargo öffnet sich das Land langsam, bleibt politisch aber ein Einparteienstaat.",
      "historyEn": "Before Columbus arrived in 1492, the Taíno and Ciboney lived on the island, before Spain exploited Cuba as a colony and a centre of slavery for sugar cane. Spanish rule ended in 1898, but it was the Revolution of 1959 under Fidel Castro and Che Guevara that turned Cuba into a socialist state. After decades under the US embargo, the country is slowly opening up, but politically it remains a one-party state.",
      "language": "Das kubanische Spanisch ist schnell und melodisch, wobei das S am Silbenende oft verschluckt oder zu einem Hauch wird (z.B. 'ehtá' statt 'está'). Auch das R wird häufig zu L abgeschwächt und Endsilben verschwinden. Typisch sind viele afrokubanische Einflüsse und ein lebhafter, von Diminutiven geprägter Tonfall.",
      "languageEn": "Cuban Spanish is fast and melodic, with the 's' at the end of a syllable often swallowed or softened to a breath (e.g. 'ehtá' instead of 'está'). The 'r' is frequently softened to 'l' too, and final syllables disappear. It's marked by strong Afro-Cuban influences and a lively tone full of diminutives.",
      "words": [
        {
          "es": "asere",
          "de": "Kumpel, Alter (kubanischer Slang)",
          "en": "mate, dude (Cuban slang)"
        },
        {
          "es": "guagua",
          "de": "Bus",
          "en": "bus"
        },
        {
          "es": "jamar",
          "de": "essen (umgangssprachlich)",
          "en": "to eat (colloquial)"
        },
        {
          "es": "pinchar",
          "de": "arbeiten",
          "en": "to work"
        },
        {
          "es": "yuma",
          "de": "Ausländer, Tourist (oft US-Amerikaner)",
          "en": "foreigner, tourist (often American)"
        },
        {
          "es": "¿qué bolá?",
          "de": "Was geht? / Wie läuft's?",
          "en": "What's up? / How's it going?"
        }
      ],
      "food": [
        {
          "name": "Ropa vieja",
          "desc": "Geschmortes, zerfasertes Rindfleisch in würziger Tomatensauce.",
          "descEn": "Braised, shredded beef in a spicy tomato sauce.",
          "long": "Ropa vieja (wörtlich 'alte Kleider') ist eines der Nationalgerichte Kubas und besteht aus zartem, in Streifen gezupftem Rindfleisch, das in einer würzigen Tomatensauce geschmort wird. Es schmeckt herzhaft und leicht süßlich und wird meist mit weißem Reis und Kochbananen serviert.",
          "longEn": "Ropa vieja (literally 'old clothes') is one of Cuba's national dishes and consists of tender beef pulled into strips, braised in a spicy tomato sauce. It tastes savoury and slightly sweet, and is usually served with white rice and plantain.",
          "ingredients": "Rindfleisch (Flankensteak), Tomaten, Paprika, Zwiebeln, Knoblauch, Wein, Kreuzkümmel",
          "ingredientsEn": "Beef (flank steak), tomatoes, peppers, onions, garlic, wine, cumin",
          "origin": "Das Gericht hat seine Wurzeln in der spanischen Küche, vermutlich den Kanarischen Inseln und Andalusien, und gelangte über die spanische Kolonialzeit in die Karibik.",
          "originEn": "The dish has its roots in Spanish cooking, probably the Canary Islands and Andalusia, and reached the Caribbean during the Spanish colonial era.",
          "occasions": "Ein klassisches Mittagsgericht, das gerne bei Familienessen und Sonntagsmahlzeiten aufgetischt wird.",
          "occasionsEn": "A classic lunch dish, happily served at family meals and Sunday lunches.",
          "order": "Quisiera una ropa vieja con arroz blanco, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ropa_vieja_plato_cubano_por_excelencia_2.jpg/960px-Ropa_vieja_plato_cubano_por_excelencia_2.jpg"
        },
        {
          "name": "Moros y cristianos",
          "desc": "Schwarze Bohnen mit Reis zusammen gekocht.",
          "descEn": "Black beans cooked together with rice.",
          "long": "Moros y cristianos ('Mauren und Christen') ist ein Gericht aus schwarzen Bohnen und weißem Reis, die zusammen gekocht werden, sodass sich die Aromen verbinden. Der Name spielt auf den Farbkontrast von dunklen Bohnen und hellem Reis an; das Gericht ist herzhaft und dient meist als Beilage.",
          "longEn": "Moros y cristianos ('Moors and Christians') is a dish of black beans and white rice cooked together so the flavours meld. The name plays on the colour contrast of dark beans and pale rice; the dish is savoury and usually serves as a side.",
          "ingredients": "Schwarze Bohnen, weißer Reis, Knoblauch, Zwiebeln, Paprika, Kreuzkümmel, Lorbeer",
          "ingredientsEn": "Black beans, white rice, garlic, onions, peppers, cumin, bay leaf",
          "origin": "Der Name verweist auf die maurische Herrschaft auf der iberischen Halbinsel und kam mit den spanischen Siedlern nach Kuba.",
          "originEn": "The name refers to Moorish rule on the Iberian peninsula and came to Cuba with the Spanish settlers.",
          "occasions": "Wird als alltägliche Beilage zu fast jedem Hauptgericht gereicht.",
          "occasionsEn": "Served as an everyday side to almost any main course.",
          "order": "Para mí, moros y cristianos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Ropa_viecha_2.jpg/960px-Ropa_viecha_2.jpg"
        },
        {
          "name": "Lechón asado",
          "desc": "Langsam gegrilltes Spanferkel, oft zu Festen.",
          "descEn": "Slow-grilled suckling pig, often for celebrations.",
          "long": "Lechón asado ist ein langsam gegartes, knusprig gebratenes Spanferkel, das in der kubanischen Küche besonders geschätzt wird. Das Fleisch wird vorher in einer Marinade aus Bitterorange und Knoblauch eingelegt, was ihm einen säuerlich-würzigen Geschmack und zarte Konsistenz verleiht.",
          "longEn": "Lechón asado is a slow-cooked, crisply roasted suckling pig that is especially prized in Cuban cooking. The meat is first marinated in bitter orange and garlic, which gives it a tangy, spiced flavour and tender texture.",
          "ingredients": "Schweinefleisch (ganzes Ferkel), Bitterorange (naranja agria), Knoblauch, Oregano, Kreuzkümmel, Salz",
          "ingredientsEn": "Pork (whole suckling pig), bitter orange (naranja agria), garlic, oregano, cumin, salt",
          "origin": "Das Braten von ganzem Schwein hat spanische Wurzeln und ist in der gesamten Karibik verbreitet.",
          "originEn": "Roasting a whole pig has Spanish roots and is common throughout the Caribbean.",
          "occasions": "Das festliche Hauptgericht zu Weihnachten (Nochebuena) und großen Familienfeiern.",
          "occasionsEn": "The festive main dish at Christmas (Nochebuena) and big family celebrations.",
          "order": "Me gustaría probar el lechón asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/GEDC0117_%2815057625722%29.jpg/960px-GEDC0117_%2815057625722%29.jpg"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "descEn": "Fried, flattened green plantains.",
          "long": "Tostones sind zweimal frittierte Scheiben grüner Kochbananen, die nach dem ersten Frittieren plattgedrückt und erneut goldbraun ausgebacken werden. Sie sind außen knusprig, innen weich und werden gesalzen oft als Beilage oder Snack gegessen.",
          "longEn": "Tostones are twice-fried slices of green plantain, which after the first frying are flattened and fried again until golden brown. They are crisp outside, soft within, and are salted and often eaten as a side or snack.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz, optional Knoblauch",
          "ingredientsEn": "Green plantains (plátanos verdes), oil, salt, optionally garlic",
          "origin": "Tostones sind in der gesamten Karibik und Lateinamerika verbreitet und gehen auf die Verwendung von Kochbananen aus Afrika zurück.",
          "originEn": "Tostones are common across the Caribbean and Latin America and trace back to the use of plantains from Africa.",
          "occasions": "Beliebt als Beilage oder Knabberei zu jeder Tageszeit.",
          "occasionsEn": "Popular as a side or nibble at any time of day.",
          "order": "¿Me pone una ración de tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Yuca con mojo",
          "desc": "Maniok mit einer Knoblauch-Zitrus-Sauce.",
          "descEn": "Cassava with a garlic-and-citrus sauce.",
          "long": "Yuca con mojo besteht aus weich gekochter Maniokwurzel, die mit einer Sauce aus Knoblauch, Bitterorange und Olivenöl übergossen wird. Das Gericht schmeckt knoblauchig-säuerlich und hat eine zart-stärkehaltige Konsistenz.",
          "longEn": "Yuca con mojo consists of soft-boiled cassava root, doused in a sauce of garlic, bitter orange and olive oil. The dish tastes garlicky and tangy and has a tender, starchy texture.",
          "ingredients": "Maniok (yuca), Knoblauch, Bitterorange, Olivenöl, Zwiebeln, Salz",
          "ingredientsEn": "Cassava (yuca), garlic, bitter orange, olive oil, onions, salt",
          "origin": "Maniok ist ein Grundnahrungsmittel der indigenen Taíno-Bevölkerung der Karibik, kombiniert mit dem spanisch geprägten Mojo.",
          "originEn": "Cassava is a staple of the indigenous Taíno population of the Caribbean, combined with the Spanish-influenced mojo.",
          "occasions": "Eine typische Beilage zu Schweinefleisch und bei Festessen.",
          "occasionsEn": "A typical side to pork and at feasts.",
          "order": "Quisiera yuca con mojo de acompañamiento.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Mandioca_%28yuca%29_hervida_como_acompa%C3%B1amiento_para_un_asado_como_plato_principal.jpg/960px-Mandioca_%28yuca%29_hervida_como_acompa%C3%B1amiento_para_un_asado_como_plato_principal.jpg"
        },
        {
          "name": "Picadillo",
          "desc": "Hackfleisch mit Oliven, Rosinen und Gewürzen.",
          "descEn": "Minced beef with olives, raisins and spices.",
          "long": "Picadillo ist ein herzhaftes Hackfleischgericht in einer würzigen Tomatensauce, das mit Oliven und Rosinen eine charakteristische süß-salzige Note erhält. Es wird typischerweise mit weißem Reis und manchmal mit gebratenen Kochbananen serviert.",
          "longEn": "Picadillo is a savoury mince dish in a spicy tomato sauce, which olives and raisins give a characteristic sweet-salty note. It is typically served with white rice and sometimes fried plantain.",
          "ingredients": "Rinderhackfleisch, Tomaten, Zwiebeln, Knoblauch, Oliven, Rosinen, Kapern, Kreuzkümmel",
          "ingredientsEn": "Minced beef, tomatoes, onions, garlic, olives, raisins, capers, cumin",
          "origin": "Picadillo ist in vielen spanischsprachigen Ländern verbreitet und kam über die spanische Küche nach Kuba.",
          "originEn": "Picadillo is common in many Spanish-speaking countries and came to Cuba via Spanish cooking.",
          "occasions": "Ein häufiges, einfaches Mittag- oder Abendessen im Alltag.",
          "occasionsEn": "A common, simple lunch or dinner in everyday life.",
          "order": "Para mí un picadillo con arroz, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mexican_picadillo.jpg/960px-Mexican_picadillo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mojito",
          "desc": "Cocktail aus Rum, Minze, Limette, Zucker und Soda.",
          "descEn": "A cocktail of rum, mint, lime, sugar and soda.",
          "long": "Der Mojito ist ein erfrischender kubanischer Cocktail aus weißem Rum, frischer Minze, Limette, Zucker und Sodawasser. Er schmeckt spritzig, minzig-frisch und ist eines der bekanntesten Getränke Kubas.",
          "longEn": "The mojito is a refreshing Cuban cocktail of white rum, fresh mint, lime, sugar and soda water. It tastes zesty and minty-fresh and is one of Cuba's best-known drinks.",
          "ingredients": "Weißer Rum, Minze (hierbabuena), Limette, Zucker, Sodawasser, Eis",
          "ingredientsEn": "White rum, mint (hierbabuena), lime, sugar, soda water, ice",
          "origin": "Der Mojito hat seine Wurzeln in Havanna und war ein Lieblingsgetränk von Ernest Hemingway.",
          "originEn": "The mojito has its roots in Havana and was a favourite drink of Ernest Hemingway.",
          "occasions": "Wird gerne als erfrischender Aperitif an heißen Tagen und in Bars getrunken.",
          "occasionsEn": "Happily drunk as a refreshing aperitif on hot days and in bars.",
          "order": "Un mojito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Mojito98775.jpeg/960px-Mojito98775.jpeg"
        },
        {
          "name": "Cuba Libre",
          "desc": "Rum mit Cola und Limette.",
          "descEn": "Rum with cola and lime.",
          "long": "Cuba Libre ist ein einfacher, aber populärer Longdrink aus Rum, Cola und einem Spritzer Limette. Er schmeckt süß-spritzig mit der frischen Säure der Limette.",
          "longEn": "Cuba Libre is a simple but popular long drink of rum, cola and a splash of lime. It tastes sweet and zesty with the fresh acidity of the lime.",
          "ingredients": "Rum, Cola, Limette, Eis",
          "ingredientsEn": "Rum, cola, lime, ice",
          "origin": "Der Drink entstand Anfang des 20. Jahrhunderts in Kuba, als Cola auf die Insel kam, und sein Name bedeutet 'Freies Kuba'.",
          "originEn": "The drink came about in Cuba in the early 20th century, when cola arrived on the island, and its name means 'Free Cuba'.",
          "occasions": "Ein Klassiker für gesellige Abende und Partys.",
          "occasionsEn": "A classic for sociable evenings and parties.",
          "order": "Me pone un Cuba Libre, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/15-09-26-RalfR-WLC-0056.jpg/960px-15-09-26-RalfR-WLC-0056.jpg"
        },
        {
          "name": "Daiquirí",
          "desc": "Gemixter Cocktail aus Rum, Limette und Zucker.",
          "descEn": "A shaken cocktail of rum, lime and sugar.",
          "long": "Der Daiquirí ist ein klassischer kubanischer Cocktail aus weißem Rum, Limettensaft und Zucker, der eiskalt serviert wird. Er schmeckt frisch, herb-süß und ausgewogen sauer.",
          "longEn": "The daiquirí is a classic Cuban cocktail of white rum, lime juice and sugar, served ice-cold. It tastes fresh, dry-sweet and balanced in its sourness.",
          "ingredients": "Weißer Rum, Limettensaft, Zucker, Eis",
          "ingredientsEn": "White rum, lime juice, sugar, ice",
          "origin": "Benannt nach dem Bergwerksort Daiquirí bei Santiago de Cuba und ebenfalls durch Hemingway berühmt geworden.",
          "originEn": "Named after the mining town of Daiquirí near Santiago de Cuba and likewise made famous by Hemingway.",
          "occasions": "Ein eleganter Cocktail für den Abend oder zum Anstoßen.",
          "occasionsEn": "An elegant cocktail for the evening or to toast with.",
          "order": "Quisiera un daiquirí, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Classic_Daiquiri_in_Cocktail_Glass.jpg/960px-Classic_Daiquiri_in_Cocktail_Glass.jpg"
        },
        {
          "name": "Café cubano",
          "desc": "Starker, stark gezuckerter Espresso.",
          "descEn": "A strong, heavily sweetened espresso.",
          "long": "Café cubano ist ein stark gesüßter Espresso, bei dem der Zucker bereits während des Brühens zu einer schaumigen Crema (espuma) aufgeschlagen wird. Er ist intensiv, süß und wird in kleinen Tassen getrunken.",
          "longEn": "Café cubano is a heavily sweetened espresso, where the sugar is whipped into a frothy crema (espuma) during brewing. It is intense, sweet and drunk in small cups.",
          "ingredients": "Espresso (dunkel geröstet), Zucker",
          "ingredientsEn": "Espresso (dark roast), sugar",
          "origin": "Der Café cubano entwickelte sich nach der Einführung italienischer Espressomaschinen in Kuba.",
          "originEn": "Café cubano developed after Italian espresso machines were introduced to Cuba.",
          "occasions": "Wird über den ganzen Tag, besonders nach dem Essen, getrunken.",
          "occasionsEn": "Drunk throughout the day, especially after meals.",
          "order": "Un café cubano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cuban_coffee-_2013-04-05_14-30.jpg/960px-Cuban_coffee-_2013-04-05_14-30.jpg"
        }
      ],
      "tip": "Tausche Geld nur an offiziellen Stellen und bringe genug Bargeld mit, da ausländische Kreditkarten oft nicht funktionieren.",
      "tipEn": "Only change money at official places and bring enough cash, as foreign credit cards often don't work."
    },
    {
      "id": "republica-dominicana",
      "sports": {
        "intro": "Baseball ist eine landesweite Obsession – kein Land stellt pro Kopf mehr MLB-Profis. Die größten Stars werden wie Nationalhelden gefeiert.",
        "introEn": "Baseball is a nationwide obsession – no country sends more players per capita to MLB. The biggest stars are celebrated like national heroes.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Der Nationalsport schlechthin, von Kindesbeinen an gespielt.", "noteEn": "The national sport above all, played from early childhood." }
        ],
        "athletes": [
          { "name": "David „Big Papi“ Ortiz", "sport": "Baseball", "sportEn": "Baseball", "note": "Red-Sox-Idol und Hall-of-Famer, einer der besten Schlagmänner der MLB.", "noteEn": "Red Sox idol and Hall of Famer, one of MLB's greatest hitters." },
          { "name": "Pedro Martínez", "sport": "Baseball", "sportEn": "Baseball", "note": "Einer der dominantesten Pitcher der MLB-Geschichte, Hall of Fame.", "noteEn": "One of the most dominant pitchers in MLB history, Hall of Fame." },
          { "name": "Félix Sánchez", "sport": "Leichtathletik", "sportEn": "Athletics", "note": "Zweifacher Olympiasieger über 400 m Hürden.", "noteEn": "Two-time Olympic champion in the 400 m hurdles." }
        ]
      },
      "name": "Dominikanische Republik",
      "flag": "🇩🇴",
      "region": "Karibik",
      "capital": "Santo Domingo",
      "tagline": "Traumstrände, Merengue und der älteste Kolonialkern Amerikas",
      "taglineEn": "Dream beaches, merengue and the oldest colonial quarter in the Americas",
      "population": "Rund 11,5 Millionen Einwohner (2025).",
      "populationEn": "Around 11.5 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 29 Jahren.",
      "ageStructureEn": "A young population with a median age of about 29.",
      "government": "Präsidentielle Republik mit regelmäßigen demokratischen Wahlen.",
      "governmentEn": "A presidential republic with regular democratic elections.",
      "economy": "Eine der am schnellsten wachsenden Volkswirtschaften Lateinamerikas.",
      "economyEn": "One of the fastest-growing economies in Latin America.",
      "livelihood": "Tourismus (Punta Cana), Freihandelszonen, Bergbau (Gold), Landwirtschaft und Überweisungen.",
      "livelihoodEn": "Tourism (Punta Cana), free-trade zones, mining (gold), agriculture and remittances.",
      "about": "Die Dominikanische Republik teilt sich die Insel Hispaniola mit Haiti und lockt mit Palmenstränden, dem Bergmassiv Pico Duarte und der historischen Zona Colonial von Santo Domingo. Backpacker finden neben den Pauschalresorts auch authentische Orte wie Las Terrenas oder die Wasserfälle von Damajagua.",
      "aboutEn": "The Dominican Republic shares the island of Hispaniola with Haiti and tempts you with palm-fringed beaches, the Pico Duarte mountain range and the historic Zona Colonial of Santo Domingo. Beyond the package resorts, backpackers also find authentic spots like Las Terrenas or the Damajagua waterfalls.",
      "history": "Die Insel war von Taíno besiedelt, als Kolumbus 1492 landete und Santo Domingo zur ältesten dauerhaften europäischen Siedlung Amerikas wurde. Nach spanischer und kurzer haitianischer Herrschaft erlangte das Land 1844 seine Unabhängigkeit von Haiti. Das 20. Jahrhundert war von der brutalen Diktatur Trujillos geprägt, bevor sich eine Demokratie und ein tourismusgetriebener Aufschwung entwickelten.",
      "historyEn": "The island was settled by the Taíno when Columbus landed in 1492, and Santo Domingo became the oldest permanent European settlement in the Americas. After Spanish and a brief Haitian rule, the country gained its independence from Haiti in 1844. The 20th century was marked by Trujillo's brutal dictatorship, before a democracy and a tourism-driven boom took shape.",
      "language": "Das dominikanische Spanisch ist schnell und stark vom karibischen Akzent geprägt, mit verschlucktem S am Silbenende (z.B. 'lo niño' statt 'los niños'). Das R wird oft zu I oder L (z.B. 'puelta' statt 'puerta'), und viele Wörter werden stark verkürzt. Es gibt zahlreiche Taíno- und afrikanische Lehnwörter.",
      "languageEn": "Dominican Spanish is fast and heavily marked by the Caribbean accent, with the 's' swallowed at the end of a syllable (e.g. 'lo niño' instead of 'los niños'). The 'r' often becomes 'i' or 'l' (e.g. 'puelta' instead of 'puerta'), and many words are heavily shortened. There are numerous Taíno and African loanwords.",
      "words": [
        {
          "es": "¿qué lo que?",
          "de": "Was geht? (Begrüßung, oft 'klo ke')",
          "en": "What's up? (greeting, often 'klo ke')"
        },
        {
          "es": "chin",
          "de": "ein bisschen, eine kleine Menge",
          "en": "a bit, a small amount"
        },
        {
          "es": "guagua",
          "de": "Bus",
          "en": "bus"
        },
        {
          "es": "vaina",
          "de": "Ding, Sache (Allzweckwort)",
          "en": "thing, stuff (all-purpose word)"
        },
        {
          "es": "tíguere",
          "de": "schlauer, gewiefter Typ",
          "en": "a sharp, cunning sort"
        },
        {
          "es": "concho",
          "de": "Sammeltaxi",
          "en": "shared taxi"
        }
      ],
      "food": [
        {
          "name": "La bandera",
          "desc": "Nationalgericht aus Reis, roten Bohnen und Fleisch.",
          "descEn": "A national dish of rice, red beans and meat.",
          "long": "La bandera ('die Flagge') ist das Nationalgericht der Dominikanischen Republik und besteht aus weißem Reis, roten Bohnen und geschmortem Fleisch, oft begleitet von Salat oder gebratenen Kochbananen. Die Farben erinnern an die Landesflagge, und es ist eine herzhafte, ausgewogene Mahlzeit.",
          "longEn": "La bandera ('the flag') is the national dish of the Dominican Republic and consists of white rice, red beans and braised meat, often accompanied by salad or fried plantain. The colours echo the national flag, and it is a hearty, balanced meal.",
          "ingredients": "Weißer Reis, rote Bohnen (habichuelas), Fleisch (Huhn oder Rind), Salat, Kochbananen",
          "ingredientsEn": "White rice, red beans (habichuelas), meat (chicken or beef), salad, plantain",
          "origin": "Das Gericht ist seit Generationen das tägliche Mittagessen der Dominikaner und symbolisiert die nationale Identität.",
          "originEn": "For generations the dish has been the Dominicans' daily lunch and symbolises the national identity.",
          "occasions": "Das klassische, tägliche Mittagessen (almuerzo) in fast jedem Haushalt.",
          "occasionsEn": "The classic, daily lunch (almuerzo) in almost every household.",
          "order": "Quiero la bandera dominicana, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sancocho_dominican.jpg/960px-Sancocho_dominican.jpg"
        },
        {
          "name": "Mangú",
          "desc": "Püree aus Kochbananen, oft zum Frühstück mit Zwiebeln.",
          "descEn": "A purée of plantains, often for breakfast with onions.",
          "long": "Mangú ist ein cremiges Püree aus gekochten grünen Kochbananen, das mit etwas Öl und Zwiebeln verfeinert wird. Es ist sättigend und mild im Geschmack und wird klassisch zum Frühstück gereicht.",
          "longEn": "Mangú is a creamy purée of boiled green plantains, enriched with a little oil and onions. It is filling and mild in flavour and is classically served at breakfast.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, in Essig geschmorte Zwiebeln, Salz",
          "ingredientsEn": "Green plantains (plátanos verdes), oil, onions braised in vinegar, salt",
          "origin": "Mangú hat afrikanische Wurzeln und kam über versklavte Westafrikaner in die Dominikanische Republik.",
          "originEn": "Mangú has African roots and came to the Dominican Republic via enslaved West Africans.",
          "occasions": "Ein typisches Frühstück, besonders als 'Los Tres Golpes' mit Käse, Salami und Ei.",
          "occasionsEn": "A typical breakfast, especially as 'Los Tres Golpes' with cheese, salami and egg.",
          "order": "Me da un mangú con los tres golpes, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/be/Mangu_dominicano_--Contenido-_-Lonjas_de_salami_fritas_-Lonjas_de_queso_blanco_-Mangu_o_pur%C3%A9_de_pl%C3%A1tano_verde_-Mantequilla_--Este_es_un_plato_t%C3%ADpico_en_el_desayuno_dominicano_--Rep%C3%BAblica_Dominicana_-_2013-10-08_14-28.jpg"
        },
        {
          "name": "Sancocho",
          "desc": "Deftiger Eintopf mit verschiedenen Fleischsorten und Knollen.",
          "descEn": "A hearty stew with various meats and tubers.",
          "long": "Sancocho ist ein deftiger Eintopf aus verschiedenen Fleischsorten und Wurzelgemüse, der lange geköchelt wird. Er ist reichhaltig, würzig und gilt als Festtagsgericht, das wärmt und sättigt.",
          "longEn": "Sancocho is a hearty stew of various meats and root vegetables, simmered for a long time. It is rich, spiced and regarded as a feast dish that warms and fills you up.",
          "ingredients": "Verschiedene Fleischsorten, Maniok (yuca), Yautía, Kochbananen, Kürbis (auyama), Koriander",
          "ingredientsEn": "Various meats, cassava (yuca), yautía, plantain, squash (auyama), coriander",
          "origin": "Der Sancocho hat spanische und indigene Wurzeln und existiert in vielen lateinamerikanischen Varianten.",
          "originEn": "Sancocho has Spanish and indigenous roots and exists in many Latin American versions.",
          "occasions": "Ein Festgericht für Familienfeiern, Regentage und besondere Anlässe.",
          "occasionsEn": "A feast dish for family celebrations, rainy days and special occasions.",
          "order": "Quisiera un plato de sancocho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "descEn": "Fried, flattened green plantains.",
          "long": "Tostones sind zweimal frittierte Scheiben grüner Kochbananen, die nach dem ersten Frittieren plattgedrückt und erneut ausgebacken werden. Sie sind knusprig und werden gesalzen als Beilage oder Snack gegessen.",
          "longEn": "Tostones are twice-fried slices of green plantain, which after the first frying are flattened and fried again. They are crisp and are salted and eaten as a side or snack.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz",
          "ingredientsEn": "Green plantains (plátanos verdes), oil, salt",
          "origin": "Tostones sind in der gesamten Karibik verbreitet und auch in der Dominikanischen Republik ein fester Bestandteil der Küche.",
          "originEn": "Tostones are common across the Caribbean and are a fixture of cooking in the Dominican Republic too.",
          "occasions": "Beliebt als Beilage zu Fleisch und Fisch oder als Snack.",
          "occasionsEn": "Popular as a side to meat and fish or as a snack.",
          "order": "¿Me trae unos tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Chicharrón",
          "desc": "Knusprig frittiertes Schweinefleisch oder -bauch.",
          "descEn": "Crispy fried pork or pork belly.",
          "long": "Chicharrón besteht aus frittierten, knusprigen Schweinefleisch- oder Schwartenstücken, die außen kross und innen saftig sind. Es wird oft mit Yuca oder Tostones und einem Spritzer Limette serviert.",
          "longEn": "Chicharrón consists of fried, crispy pieces of pork or crackling, crisp outside and juicy within. It is often served with cassava or tostones and a squeeze of lime.",
          "ingredients": "Schweinefleisch mit Schwarte, Knoblauch, Bitterorange, Salz, Öl",
          "ingredientsEn": "Pork with rind, garlic, bitter orange, salt, oil",
          "origin": "Chicharrón ist in der spanischsprachigen Welt weit verbreitet und stammt aus der spanischen Küche.",
          "originEn": "Chicharrón is widespread in the Spanish-speaking world and comes from Spanish cooking.",
          "occasions": "Ein beliebter Snack auf Straßenfesten und am Wochenende.",
          "occasionsEn": "A popular snack at street festivals and at weekends.",
          "order": "Me pone un poco de chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Chicharrones_Cerdo_Salamanca_02.jpg/960px-Chicharrones_Cerdo_Salamanca_02.jpg"
        },
        {
          "name": "Mofongo",
          "desc": "Stampf aus frittierten Kochbananen mit Knoblauch und Schwarte.",
          "descEn": "A mash of fried plantains with garlic and crackling.",
          "long": "Mofongo ist ein herzhafter Klops aus zerstampften, frittierten grünen Kochbananen, der mit Knoblauch und Schweinegrieben (chicharrón) vermengt wird. Es ist sättigend, knoblauchig und wird oft mit Brühe oder Fleisch gefüllt serviert.",
          "longEn": "Mofongo is a hearty patty of mashed, fried green plantains, mixed with garlic and pork crackling (chicharrón). It is filling, garlicky and often served stuffed with broth or meat.",
          "ingredients": "Grüne Kochbananen, Knoblauch, Schweinegrieben (chicharrón), Olivenöl, Salz",
          "ingredientsEn": "Green plantains, garlic, pork crackling (chicharrón), olive oil, salt",
          "origin": "Mofongo hat westafrikanische Wurzeln (verwandt mit Fufu) und ist in der gesamten Karibik beliebt.",
          "originEn": "Mofongo has West African roots (related to fufu) and is popular throughout the Caribbean.",
          "occasions": "Ein deftiges Hauptgericht zum Mittag- oder Abendessen.",
          "occasionsEn": "A hearty main course for lunch or dinner.",
          "order": "Quisiera un mofongo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mofongo.jpg/960px-Mofongo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mamajuana",
          "desc": "Würziger Kräuterschnaps aus Rum, Rotwein und Honig auf Rinden und Kräutern.",
          "descEn": "A spicy herbal liqueur of rum, red wine and honey steeped on bark and herbs.",
          "long": "Mamajuana ist ein traditionelles dominikanisches Getränk aus Rum, Rotwein und Honig, das in einer Flasche mit Kräutern und Baumrinden zieht. Es schmeckt würzig-süß und kräuterig und gilt als Tonikum mit angeblich belebender Wirkung.",
          "longEn": "Mamajuana is a traditional Dominican drink of rum, red wine and honey, steeped in a bottle with herbs and tree bark. It tastes spiced-sweet and herbal and is regarded as a tonic with supposedly invigorating effects.",
          "ingredients": "Rum, Rotwein, Honig, Kräuter, Baumrinden, Wurzeln",
          "ingredientsEn": "Rum, red wine, honey, herbs, tree bark, roots",
          "origin": "Die Rezeptur geht auf Heilgetränke der indigenen Taíno zurück, später mit Alkohol verfeinert.",
          "originEn": "The recipe goes back to medicinal drinks of the indigenous Taíno, later enhanced with alcohol.",
          "occasions": "Wird gerne als Aperitif oder gesundheitsförderndes Getränk in Gesellschaft getrunken.",
          "occasionsEn": "Happily drunk as an aperitif or a health-giving drink in company.",
          "order": "Quiero probar la mamajuana, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Mamajuana.jpg"
        },
        {
          "name": "Morir soñando",
          "desc": "Erfrischender Mix aus Orangensaft, Milch und Zucker.",
          "descEn": "A refreshing mix of orange juice, milk and sugar.",
          "long": "Morir soñando ('Sterben im Träumen') ist ein erfrischendes, cremiges Getränk aus Orangensaft, Milch, Zucker und Eis. Der Name spielt auf den himmlischen Geschmack an; es ist süß, fruchtig und sehr erfrischend.",
          "longEn": "Morir soñando ('to die dreaming') is a refreshing, creamy drink of orange juice, milk, sugar and ice. The name plays on its heavenly taste; it is sweet, fruity and very refreshing.",
          "ingredients": "Orangensaft, Milch (oder Kondensmilch), Zucker, Eis",
          "ingredientsEn": "Orange juice, milk (or condensed milk), sugar, ice",
          "origin": "Das Getränk ist eine dominikanische Erfindung und ein beliebter Klassiker des Landes.",
          "originEn": "The drink is a Dominican invention and a popular national classic.",
          "occasions": "Eine erfrischende Abkühlung an heißen Nachmittagen.",
          "occasionsEn": "A refreshing cool-down on hot afternoons.",
          "order": "Me da un morir soñando, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Orange_Julius-SG.JPG/960px-Orange_Julius-SG.JPG"
        },
        {
          "name": "Presidente",
          "desc": "Das beliebteste dominikanische Lagerbier, eiskalt serviert.",
          "descEn": "The most popular Dominican lager, served ice-cold.",
          "long": "Presidente ist die bekannteste Biermarke der Dominikanischen Republik, ein helles, leichtes Lagerbier, das eiskalt ('vestida de novia', in beschlagener Flasche) getrunken wird. Es ist erfrischend und mild im Geschmack.",
          "longEn": "Presidente is the best-known beer brand of the Dominican Republic, a pale, light lager drunk ice-cold ('vestida de novia', in a frosted bottle). It is refreshing and mild in flavour.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "ingredientsEn": "Barley malt, hops, water, yeast",
          "origin": "Presidente wird seit 1935 gebraut und ist zum nationalen Bier der Dominikanischen Republik geworden.",
          "originEn": "Presidente has been brewed since 1935 and has become the national beer of the Dominican Republic.",
          "occasions": "Das gesellige Bier für Strand, Feiern und gemütliche Abende.",
          "occasionsEn": "The sociable beer for the beach, celebrations and cosy evenings.",
          "order": "Una Presidente bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Presidente-Bier.jpg/960px-Presidente-Bier.jpg"
        },
        {
          "name": "Ron dominicano",
          "desc": "Dominikanischer Rum, z.B. Brugal oder Barceló.",
          "descEn": "Dominican rum, e.g. Brugal or Barceló.",
          "long": "Ron dominicano ist der lokale Rum der Dominikanischen Republik, bekannt für seine Qualität und vielfältigen Sorten von hell bis dunkel gealtert. Er schmeckt je nach Reifung mild bis komplex mit Noten von Karamell und Vanille und wird pur oder im Cocktail genossen.",
          "longEn": "Ron dominicano is the local rum of the Dominican Republic, known for its quality and varied styles from light to dark-aged. Depending on its ageing it tastes mild to complex with notes of caramel and vanilla, and is enjoyed neat or in a cocktail.",
          "ingredients": "Zuckerrohr (Melasse), Wasser, Hefe",
          "ingredientsEn": "Sugar cane (molasses), water, yeast",
          "origin": "Die Dominikanische Republik ist eine der großen Rum-Nationen der Karibik mit Marken wie Brugal, Barceló und Bermúdez.",
          "originEn": "The Dominican Republic is one of the great rum nations of the Caribbean, with brands such as Brugal, Barceló and Bermúdez.",
          "occasions": "Wird pur, auf Eis oder in Cocktails zu geselligen Anlässen getrunken.",
          "occasionsEn": "Drunk neat, on the rocks or in cocktails at social occasions.",
          "order": "Quisiera un ron dominicano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Barcel%C3%B2_Boat.jpeg/960px-Barcel%C3%B2_Boat.jpeg"
        }
      ],
      "tip": "Nutze für Kurzstrecken die günstigen Conchos und Guaguas, aber vereinbare den Preis am besten vorher.",
      "tipEn": "For short trips, use the cheap conchos and guaguas, but it's best to agree the price beforehand."
    },
    {
      "id": "puerto-rico",
      "sports": {
        "intro": "Baseball, Boxen und Basketball prägen den Sport der Insel. Puerto Rico tritt bei Olympia und Weltmeisterschaften als eigenständiges Team an und feiert seine Stars ausgiebig.",
        "introEn": "Baseball, boxing and basketball define the island's sport. Puerto Rico competes as its own team at the Olympics and world championships and celebrates its stars enthusiastically.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Tief verwurzelt, mit vielen MLB-Spielern.", "noteEn": "Deeply rooted, with many MLB players." },
          { "name": "Boxen", "nameEn": "Boxing", "note": "Große Tradition mit zahlreichen Weltmeistern.", "noteEn": "A great tradition with numerous world champions." },
          { "name": "Basketball", "nameEn": "Basketball", "note": "Sehr populär; eigene starke Nationalmannschaft.", "noteEn": "Very popular; a strong national team of its own." }
        ],
        "athletes": [
          { "name": "Roberto Clemente", "sport": "Baseball", "sportEn": "Baseball", "note": "Baseball-Legende und Humanist, erster Latino in der Hall of Fame.", "noteEn": "Baseball legend and humanitarian, the first Latino in the Hall of Fame." },
          { "name": "Mónica Puig", "sport": "Tennis", "sportEn": "Tennis", "note": "Gewann 2016 Olympiagold – das erste Gold für Puerto Rico überhaupt.", "noteEn": "Won Olympic gold in 2016 – the first-ever gold for Puerto Rico." },
          { "name": "Félix „Tito“ Trinidad", "sport": "Boxen", "sportEn": "Boxing", "note": "Gefeierter Weltmeister und einer der populärsten Sportler der Insel.", "noteEn": "A celebrated world champion and one of the island's most popular athletes." }
        ]
      },
      "name": "Puerto Rico",
      "flag": "🇵🇷",
      "region": "Karibik",
      "capital": "San Juan",
      "tagline": "US-Karibik mit Regenwald, Altstadtcharme und Reggaetón",
      "taglineEn": "American Caribbean with rainforest, old-town charm and reggaeton",
      "population": "Etwa 3,2 Millionen Einwohner (2025), mit anhaltender Abwanderung aufs US-Festland.",
      "populationEn": "About 3.2 million inhabitants (2025), with continuing migration to the US mainland.",
      "ageStructure": "Stark alternde Bevölkerung mit einem Medianalter von rund 45 Jahren – eine der höchsten Amerikas.",
      "ageStructureEn": "A markedly ageing population with a median age of around 45 – one of the highest in the Americas.",
      "government": "Nicht inkorporiertes Außengebiet der USA mit eigenem Gouverneur; die Einwohner sind US-Bürger.",
      "governmentEn": "An unincorporated US territory with its own governor; residents are US citizens.",
      "economy": "Mit dem US-Dollar; nach Staatsschuldenkrise und Hurrikan María im Wiederaufbau.",
      "economyEn": "On the US dollar; rebuilding after a debt crisis and Hurricane María.",
      "livelihood": "Pharma- und Medizintechnikindustrie, Tourismus und Dienstleistungen; eng an die US-Wirtschaft gebunden.",
      "livelihoodEn": "Pharmaceutical and medical-device industry, tourism and services; tightly tied to the US economy.",
      "about": "Puerto Rico ist ein US-Außengebiet mit karibischem Flair, vom kopfsteingepflasterten Old San Juan über den Regenwald El Yunque bis zu den biolumineszenten Buchten. Als Backpacker reist du ohne Visum (für US-Einreiseberechtigte) und zahlst bequem in US-Dollar.",
      "aboutEn": "Puerto Rico is a US territory with Caribbean flair, from cobblestoned Old San Juan to the El Yunque rainforest and the bioluminescent bays. As a backpacker you travel without a visa (if you're allowed into the US) and pay conveniently in US dollars.",
      "history": "Die Taíno nannten die Insel Borikén, bevor Spanien sie ab 1493 kolonisierte und San Juan stark befestigte. 1898 trat Spanien Puerto Rico nach dem Spanisch-Amerikanischen Krieg an die USA ab, deren Bürger die Puertoricaner seit 1917 sind. Heute ist die Insel ein nicht inkorporiertes US-Territorium mit eigener Kultur und anhaltender Debatte über ihren politischen Status.",
      "historyEn": "The Taíno called the island Borikén before Spain began colonising it in 1493 and heavily fortified San Juan. In 1898, after the Spanish-American War, Spain ceded Puerto Rico to the United States, whose citizens Puerto Ricans have been since 1917. Today the island is an unincorporated US territory with its own culture and an ongoing debate about its political status.",
      "language": "Das puerto-ricanische Spanisch ist karibisch geprägt, mit verschlucktem S und dem typischen Wandel von R zu L am Silbenende (z.B. 'puelto' statt 'puerto'). Häufig wird das R am Wortanfang auch velar, fast wie ein deutsches Rachen-R, ausgesprochen. Durch die US-Bindung gibt es viele englische Lehnwörter (Spanglish).",
      "languageEn": "Puerto Rican Spanish has a Caribbean feel, with a swallowed 's' and the typical shift from 'r' to 'l' at the end of a syllable (e.g. 'puelto' instead of 'puerto'). The 'r' at the start of a word is also often pronounced guttural, almost like a throaty French 'r'. Because of the US connection, there are many English loanwords (Spanglish).",
      "words": [
        {
          "es": "wepa",
          "de": "Ausruf der Freude / 'geil!'",
          "en": "exclamation of joy / 'awesome!'"
        },
        {
          "es": "boricua",
          "de": "Puertoricaner/in (Selbstbezeichnung)",
          "en": "Puerto Rican (what they call themselves)"
        },
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "guagua",
          "de": "Bus",
          "en": "bus"
        },
        {
          "es": "janguear",
          "de": "abhängen, ausgehen (von engl. 'hang out')",
          "en": "to hang out, go out (from English 'hang out')"
        },
        {
          "es": "bregar",
          "de": "sich mit etwas abmühen, etwas regeln",
          "en": "to struggle with something, to sort something out"
        }
      ],
      "food": [
        {
          "name": "Mofongo",
          "desc": "Stampf aus frittierten Kochbananen mit Knoblauch und Schweineschwarte.",
          "descEn": "A mash of fried plantains with garlic and pork crackling.",
          "long": "Mofongo ist das ikonische Gericht Puerto Ricos: zerstampfte, frittierte grüne Kochbananen, vermengt mit Knoblauch und Schweinegrieben, oft zu einer Kuppel geformt. Es ist knoblauchig, sättigend und wird häufig mit einer Füllung aus Fleisch, Meeresfrüchten oder Brühe serviert.",
          "longEn": "Mofongo is the iconic dish of Puerto Rico: mashed, fried green plantains mixed with garlic and pork crackling, often shaped into a dome. It is garlicky, filling and frequently served with a filling of meat, seafood or broth.",
          "ingredients": "Grüne Kochbananen, Knoblauch, Schweinegrieben (chicharrón), Olivenöl, Brühe, Salz",
          "ingredientsEn": "Green plantains, garlic, pork crackling (chicharrón), olive oil, broth, salt",
          "origin": "Mofongo hat westafrikanische Wurzeln (verwandt mit Fufu) und entwickelte sich in Puerto Rico zum Nationalgericht.",
          "originEn": "Mofongo has West African roots (related to fufu) and became the national dish in Puerto Rico.",
          "occasions": "Ein beliebtes Hauptgericht in Restaurants und bei Familienessen.",
          "occasionsEn": "A popular main course in restaurants and at family meals.",
          "order": "Quiero un mofongo relleno, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Shrimp_mofongo_from_Rompeolas_restaurant_in_Aguadilla%2C_Puerto_Rico.jpg/960px-Shrimp_mofongo_from_Rompeolas_restaurant_in_Aguadilla%2C_Puerto_Rico.jpg"
        },
        {
          "name": "Arroz con gandules",
          "desc": "Reis mit Taubenerbsen und Sofrito, das Nationalgericht.",
          "descEn": "Rice with pigeon peas and sofrito, the national dish.",
          "long": "Arroz con gandules ist das Nationalgericht Puerto Ricos und besteht aus Reis, der mit Taubenerbsen und der würzigen Basis Sofrito gekocht wird. Es schmeckt herzhaft-würzig und wird oft mit Schweinebraten (pernil) serviert.",
          "longEn": "Arroz con gandules is the national dish of Puerto Rico and consists of rice cooked with pigeon peas and the spicy base sofrito. It tastes savoury and spiced and is often served with roast pork (pernil).",
          "ingredients": "Reis, Taubenerbsen (gandules), Sofrito, Schweinefleisch oder Speck, Sazón, Oliven",
          "ingredientsEn": "Rice, pigeon peas (gandules), sofrito, pork or bacon, sazón, olives",
          "origin": "Das Gericht vereint spanische, afrikanische und indigene Einflüsse und ist Sinnbild der puerto-ricanischen Küche.",
          "originEn": "The dish brings together Spanish, African and indigenous influences and is emblematic of Puerto Rican cooking.",
          "occasions": "Das unverzichtbare Festgericht zu Weihnachten und besonderen Anlässen.",
          "occasionsEn": "The indispensable feast dish at Christmas and on special occasions.",
          "order": "Para mí, arroz con gandules, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Arroz_con_gandules.jpg/960px-Arroz_con_gandules.jpg"
        },
        {
          "name": "Lechón asado",
          "desc": "Am Spieß gegrilltes Spanferkel, Spezialität der Bergregion Guavate.",
          "descEn": "Spit-roasted suckling pig, a speciality of the Guavate mountain region.",
          "long": "Lechón asado ist langsam am Spieß gebratenes Spanferkel mit knuspriger Haut und saftigem Fleisch. In Puerto Rico wird es traditionell über Holzkohle gegart und mit Adobo und Knoblauch gewürzt.",
          "longEn": "Lechón asado is suckling pig slowly spit-roasted with crispy skin and juicy meat. In Puerto Rico it is traditionally cooked over charcoal and seasoned with adobo and garlic.",
          "ingredients": "Schweinefleisch (ganzes Ferkel), Knoblauch, Adobo, Oregano, Bitterorange, Salz",
          "ingredientsEn": "Pork (whole suckling pig), garlic, adobo, oregano, bitter orange, salt",
          "origin": "Das Spießbraten ist tief in der puerto-ricanischen Tradition verwurzelt, besonders entlang der 'Ruta del Lechón' in Guavate.",
          "originEn": "Spit-roasting is deeply rooted in Puerto Rican tradition, especially along the 'Ruta del Lechón' in Guavate.",
          "occasions": "Das Herzstück festlicher Mahlzeiten, vor allem zu Weihnachten.",
          "occasionsEn": "The centrepiece of festive meals, above all at Christmas.",
          "order": "Quisiera probar el lechón asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/GEDC0117_%2815057625722%29.jpg/960px-GEDC0117_%2815057625722%29.jpg"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "descEn": "Fried, flattened green plantains.",
          "long": "Tostones sind zweimal frittierte, plattgedrückte Scheiben grüner Kochbananen, die außen knusprig und innen weich sind. Sie werden gesalzen und oft mit einer Knoblauchsauce (mojo) oder Ketchup-Mayo-Dip gegessen.",
          "longEn": "Tostones are twice-fried, flattened slices of green plantain, crisp outside and soft within. They are salted and often eaten with a garlic sauce (mojo) or a ketchup-mayo dip.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz, Knoblauch",
          "ingredientsEn": "Green plantains (plátanos verdes), oil, salt, garlic",
          "origin": "Tostones sind in ganz Puerto Rico und der Karibik eine allgegenwärtige Beilage.",
          "originEn": "Tostones are an ever-present side dish all over Puerto Rico and the Caribbean.",
          "occasions": "Beliebt als Beilage oder Snack zu jeder Tageszeit.",
          "occasionsEn": "Popular as a side or snack at any time of day.",
          "order": "¿Me pone unos tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Alcapurrias",
          "desc": "Frittierte Teigtaschen aus Kochbanane und Taro, gefüllt mit Fleisch.",
          "descEn": "Fried pastries of plantain and taro, filled with meat.",
          "long": "Alcapurrias sind frittierte Teigtaschen aus einem Teig von grünen Kochbananen und Taro (yautía), gefüllt mit gewürztem Hackfleisch. Sie sind außen knusprig, innen weich und ein klassischer Straßen- und Strandimbiss.",
          "longEn": "Alcapurrias are fried pasties made from a dough of green plantain and taro (yautía), filled with seasoned mince. They are crisp outside, soft within and a classic street and beach snack.",
          "ingredients": "Grüne Kochbananen, Taro (yautía), Rinder- oder Schweinehackfleisch, Sofrito, Sazón, Öl",
          "ingredientsEn": "Green plantains, taro (yautía), minced beef or pork, sofrito, sazón, oil",
          "origin": "Alcapurrias gehören zu den 'frituras' Puerto Ricos und verbinden indigene und afrikanische Einflüsse.",
          "originEn": "Alcapurrias belong to Puerto Rico's 'frituras' and combine indigenous and African influences.",
          "occasions": "Ein typischer Snack an Strandständen (kioskos) und auf Festen.",
          "occasionsEn": "A typical snack at beach stalls (kioskos) and at festivals.",
          "order": "Me da dos alcapurrias, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Alcapurrias-many.jpg/960px-Alcapurrias-many.jpg"
        },
        {
          "name": "Pernil",
          "desc": "Langsam geschmorte, gewürzte Schweineschulter.",
          "descEn": "Slow-braised, seasoned pork shoulder.",
          "long": "Pernil ist eine langsam gebratene Schweineschulter, die zuvor mit Adobo, Knoblauch und Kräutern mariniert wird, bis das Fleisch zart zerfällt und die Haut (cuerito) knusprig wird. Es ist saftig, würzig und ein Festtagsklassiker.",
          "longEn": "Pernil is a slow-roasted pork shoulder, first marinated with adobo, garlic and herbs until the meat falls apart tenderly and the skin (cuerito) turns crispy. It is juicy, spiced and a festive classic.",
          "ingredients": "Schweineschulter, Knoblauch, Adobo, Oregano, Bitterorange, Olivenöl, Salz",
          "ingredientsEn": "Pork shoulder, garlic, adobo, oregano, bitter orange, olive oil, salt",
          "origin": "Pernil ist ein zentrales Gericht der puerto-ricanischen Festtagsküche, vor allem zur Weihnachtszeit.",
          "originEn": "Pernil is a central dish of Puerto Rican festive cooking, above all at Christmas time.",
          "occasions": "Das traditionelle Hauptgericht zu Weihnachten und Familienfeiern.",
          "occasionsEn": "The traditional main dish at Christmas and family celebrations.",
          "order": "Quisiera un plato de pernil, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Pernil.1.jpg/960px-Pernil.1.jpg"
        }
      ],
      "drink": [
        {
          "name": "Piña colada",
          "desc": "In San Juan erfundener Cocktail aus Rum, Kokoscreme und Ananassaft.",
          "descEn": "A cocktail of rum, coconut cream and pineapple juice, invented in San Juan.",
          "long": "Die Piña colada ist ein cremiger Cocktail aus Rum, Kokoscreme und Ananassaft, der eiskalt und oft mit zerstoßenem Eis serviert wird. Sie schmeckt süß, tropisch-fruchtig und cremig.",
          "longEn": "The piña colada is a creamy cocktail of rum, coconut cream and pineapple juice, served ice-cold and often with crushed ice. It tastes sweet, tropically fruity and creamy.",
          "ingredients": "Weißer Rum, Kokoscreme (crema de coco), Ananassaft, Eis",
          "ingredientsEn": "White rum, coconut cream (crema de coco), pineapple juice, ice",
          "origin": "Die Piña colada wurde in San Juan, Puerto Rico, erfunden und ist das offizielle Nationalgetränk der Insel.",
          "originEn": "The piña colada was invented in San Juan, Puerto Rico, and is the island's official national drink.",
          "occasions": "Der klassische Strand- und Urlaubscocktail für entspannte Stunden.",
          "occasionsEn": "The classic beach and holiday cocktail for relaxed hours.",
          "order": "Una piña colada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pina_Colada_with_key_ingredients.jpg/960px-Pina_Colada_with_key_ingredients.jpg"
        },
        {
          "name": "Coquito",
          "desc": "Cremiger Kokos-Rum-Likör, typisch zur Weihnachtszeit.",
          "descEn": "A creamy coconut-and-rum liqueur, typical at Christmas time.",
          "long": "Coquito ist ein cremiges Kokos-Getränk auf Rum-Basis, das oft als 'puerto-ricanischer Eierlikör' bezeichnet wird. Es schmeckt süß, kokosnussig und würzig nach Zimt und wird eisgekühlt in kleinen Gläsern serviert.",
          "longEn": "Coquito is a creamy rum-based coconut drink, often called 'Puerto Rican eggnog'. It tastes sweet, coconutty and spiced with cinnamon and is served chilled in small glasses.",
          "ingredients": "Weißer Rum, Kokosmilch, Kokoscreme, Kondensmilch, Zimt, Vanille",
          "ingredientsEn": "White rum, coconut milk, coconut cream, condensed milk, cinnamon, vanilla",
          "origin": "Coquito ist ein traditionelles Weihnachtsgetränk Puerto Ricos mit spanischen Wurzeln.",
          "originEn": "Coquito is a traditional Christmas drink of Puerto Rico with Spanish roots.",
          "occasions": "Das festliche Getränk zur Weihnachtszeit und auf Familienfeiern.",
          "occasionsEn": "The festive drink for the Christmas season and at family celebrations.",
          "order": "Me da un coquito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Coquito_in_a_glass.jpg/960px-Coquito_in_a_glass.jpg"
        },
        {
          "name": "Medalla Light",
          "desc": "Das lokale, leichte Inselbier.",
          "descEn": "The local, light island beer.",
          "long": "Medalla Light ist das bekannteste Bier Puerto Ricos, ein leichtes, helles Lagerbier mit niedrigem Alkoholgehalt. Es ist erfrischend, mild und ideal für das tropische Klima.",
          "longEn": "Medalla Light is the best-known beer of Puerto Rico, a light, pale lager with a low alcohol content. It is refreshing, mild and ideal for the tropical climate.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "ingredientsEn": "Barley malt, hops, water, yeast",
          "origin": "Medalla wird seit 1979 auf Puerto Rico gebraut und ist zum lokalen Kultbier geworden.",
          "originEn": "Medalla has been brewed in Puerto Rico since 1979 and has become the local cult beer.",
          "occasions": "Das Strand- und Partybier der Insel für heiße Tage.",
          "occasionsEn": "The island's beach and party beer for hot days.",
          "order": "Una Medalla bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Medalla_truck_%2802%29.jpg/960px-Medalla_truck_%2802%29.jpg"
        },
        {
          "name": "Ron del Barrilito",
          "desc": "Renommierter, gereifter puerto-ricanischer Rum.",
          "descEn": "A renowned, aged Puerto Rican rum.",
          "long": "Ron del Barrilito ist ein traditionsreicher, gereifter puerto-ricanischer Rum, der für seinen vollmundigen, komplexen Geschmack geschätzt wird. Er weist Noten von Karamell, Trockenfrüchten und Gewürzen auf und wird gerne pur genossen.",
          "longEn": "Ron del Barrilito is a long-established, aged Puerto Rican rum, prized for its full-bodied, complex flavour. It has notes of caramel, dried fruit and spices and is enjoyed neat.",
          "ingredients": "Zuckerrohr (Melasse), Wasser, Hefe",
          "ingredientsEn": "Sugar cane (molasses), water, yeast",
          "origin": "Ron del Barrilito wird seit 1880 auf der Hacienda Santa Ana in Bayamón hergestellt und gehört zu den ältesten Rummarken Puerto Ricos.",
          "originEn": "Ron del Barrilito has been made at the Hacienda Santa Ana in Bayamón since 1880 and is one of the oldest rum brands in Puerto Rico.",
          "occasions": "Ein edler Rum für besondere Momente, pur oder auf Eis genossen.",
          "occasionsEn": "A fine rum for special moments, enjoyed neat or on the rocks.",
          "order": "Quisiera un Ron del Barrilito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Old_Rum_bottles%2C_2014.jpg/960px-Old_Rum_bottles%2C_2014.jpg"
        }
      ],
      "tip": "Miete für Ausflüge ein Auto, da der öffentliche Nahverkehr außerhalb San Juans kaum ausgebaut ist.",
      "tipEn": "Hire a car for day trips, as public transport is barely developed outside San Juan."
    },
    {
      "id": "colombia",
      "sports": {
        "intro": "Fußball ist die große Leidenschaft und bewegt das ganze Land, doch auch der Radsport hat Weltklasse-Niveau – kolumbianische ‚escarabajos' gewinnen die größten Rundfahrten.",
        "introEn": "Football is the great passion and moves the whole country, but cycling is world-class too – Colombian ‘escarabajos' (beetles) win the biggest grand tours.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1; Spiele der ‚Tricolor' legen das Land lahm.", "noteEn": "The number-one sport; games of the ‘Tricolor' bring the country to a standstill." },
          { "name": "Radsport", "nameEn": "Cycling", "note": "Bergstarke Profis dominieren Tour, Giro und Vuelta.", "noteEn": "Climbing specialists dominate the Tour, Giro and Vuelta." }
        ],
        "athletes": [
          { "name": "Luis „Lucho“ Díaz", "sport": "Fußball", "sportEn": "Football", "note": "Wirbelwind auf dem Flügel beim FC Liverpool und Publikumsliebling.", "noteEn": "A whirlwind on the wing for Liverpool and a fan favourite." },
          { "name": "James Rodríguez", "sport": "Fußball", "sportEn": "Football", "note": "Torschützenkönig der WM 2014, spielte u. a. für Real Madrid.", "noteEn": "Top scorer at the 2014 World Cup, who played for Real Madrid among others." },
          { "name": "Egan Bernal", "sport": "Radsport", "sportEn": "Cycling", "note": "Gewann 2019 als erster Kolumbianer die Tour de France.", "noteEn": "In 2019 became the first Colombian to win the Tour de France." }
        ]
      },
      "name": "Kolumbien",
      "flag": "🇨🇴",
      "region": "Südamerika",
      "capital": "Bogotá",
      "tagline": "Karibikküste, Anden, Kaffeezone und überschwängliche Herzlichkeit",
      "taglineEn": "Caribbean coast, Andes, coffee country and exuberant warmth",
      "population": "Rund 53 Millionen Einwohner (2025) – das zweitbevölkerungsreichste Land Südamerikas.",
      "populationEn": "Around 53 million inhabitants (2025) – the second most populous country in South America.",
      "ageStructure": "Medianalter von etwa 32 Jahren; aufgenommen wurden fast drei Millionen venezolanische Migranten.",
      "ageStructureEn": "A median age of about 32; it has taken in nearly three million Venezuelan migrants.",
      "government": "Präsidentielle Republik; 2022 wählte das Land mit Gustavo Petro erstmals einen linksgerichteten Präsidenten.",
      "governmentEn": "A presidential republic; in 2022 the country elected Gustavo Petro as its first left-wing president.",
      "economy": "Drittgrößte Volkswirtschaft Südamerikas, im Aufschwung nach dem Friedensprozess mit der FARC.",
      "economyEn": "The third-largest economy in South America, recovering after the peace process with the FARC.",
      "livelihood": "Erdöl und Kohle, Kaffee, Blumen, Bergbau (Gold, Smaragde) und wachsender Tourismus.",
      "livelihoodEn": "Oil and coal, coffee, flowers, mining (gold, emeralds) and growing tourism.",
      "about": "Kolumbien reicht von Karibikstränden über die dreigeteilten Anden bis zum Amazonas. Backpacker-Highlights sind die Kolonialstadt Cartagena, das Kaffee-Dreieck um Salento, Medellín und die Karibikküste rund um Tayrona. Das Land bietet enorme landschaftliche und kulturelle Vielfalt.",
      "aboutEn": "Colombia stretches from Caribbean beaches across the three branches of the Andes all the way to the Amazon. Backpacker highlights include the colonial city of Cartagena, the coffee triangle around Salento, Medellín and the Caribbean coast around Tayrona. The country offers enormous scenic and cultural variety.",
      "history": "Vor der Kolonialzeit lebten hier u. a. die Muisca, bekannt für ihren Goldreichtum (El-Dorado-Legende). Ab dem 16. Jahrhundert wurde das Gebiet von Spanien kolonialisiert, 1819 erkämpfte Simón Bolívar die Unabhängigkeit von Großkolumbien. Das 20. Jahrhundert war von Bürgerkrieg, Guerillas (FARC) und Drogenkartellen geprägt. Seit dem Friedensabkommen von 2016 hat sich die Sicherheitslage in vielen Regionen deutlich verbessert.",
      "historyEn": "Before colonial times, peoples such as the Muisca lived here, famous for their wealth of gold (the El Dorado legend). From the 16th century the area was colonised by Spain, and in 1819 Simón Bolívar won independence as part of Gran Colombia. The 20th century was marked by civil war, guerrillas (the FARC) and drug cartels. Since the 2016 peace agreement, the security situation has improved markedly in many regions.",
      "language": "Kolumbianisches Spanisch, besonders aus Bogotá, gilt als sehr klar und gut verständlich. Auffällig ist das verbreitete höfliche 'usted' auch unter Freunden sowie 'su merced' im Andenland. An der Karibikküste wird schneller gesprochen und das 's' oft verschluckt. Indigene Sprachen wie Wayuunaiki existieren, im Alltag dominiert aber Spanisch.",
      "languageEn": "Colombian Spanish, especially from Bogotá, is considered very clear and easy to understand. Notable is the widespread polite 'usted', even among friends, and 'su merced' in the Andean highlands. On the Caribbean coast it's spoken faster and the 's' is often swallowed. Indigenous languages such as Wayuunaiki exist, but Spanish dominates everyday life.",
      "words": [
        {
          "es": "parcero/parce",
          "de": "Kumpel, Freund",
          "en": "mate, friend"
        },
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "bacano",
          "de": "toll, klasse",
          "en": "great, brilliant"
        },
        {
          "es": "¡qué nota!",
          "de": "wie geil! / klasse!",
          "en": "how awesome! / brilliant!"
        },
        {
          "es": "tinto",
          "de": "schwarzer Filterkaffee",
          "en": "black filter coffee"
        },
        {
          "es": "berraco",
          "de": "draufgängerisch / krass gut",
          "en": "gutsy / seriously good"
        }
      ],
      "food": [
        {
          "name": "Bandeja paisa",
          "desc": "Üppiger Teller mit Bohnen, Reis, Hackfleisch, Chicharrón, Ei, Kochbanane und Avocado.",
          "descEn": "A lavish plate of beans, rice, mince, chicharrón, egg, plantain and avocado.",
          "long": "Eine üppige Riesenplatte aus der Region Antioquia, die mehrere Komponenten auf einem Teller vereint. Sie gilt als deftigstes Sattmacher-Gericht Kolumbiens und ist für viele Reisende die ultimative Mahlzeit nach einem langen Wandertag.",
          "longEn": "A lavish, enormous platter from the Antioquia region that brings several components together on one plate. It's considered Colombia's heartiest, most filling dish and, for many travellers, the ultimate meal after a long day's hike.",
          "ingredients": "Rote Bohnen, Reis, Hackfleisch, Chicharrón (frittierter Schweinebauch), Bratwurst, Spiegelei, Kochbanane, Avocado, Arepa",
          "ingredientsEn": "Red beans, rice, mince, chicharrón (fried pork belly), sausage, fried egg, plantain, avocado, arepa",
          "origin": "Stammt von den Bauern (paisas) der Bergregion Antioquia rund um Medellín, wo die kalorienreiche Kost die harte Feldarbeit ausgleichen sollte.",
          "originEn": "From the farmers (paisas) of the Antioquia mountain region around Medellín, where the calorie-rich fare was meant to fuel hard work in the fields.",
          "occasions": "Wird meist mittags als Hauptmahlzeit gegessen, oft am Wochenende oder wenn man richtig hungrig ist.",
          "occasionsEn": "Usually eaten at midday as the main meal, often at the weekend or when you're really hungry.",
          "order": "Una bandeja paisa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bandepaisabog.JPG/960px-Bandepaisabog.JPG"
        },
        {
          "name": "Arepa",
          "desc": "Gegrillte oder gebratene Maisfladen, oft mit Käse oder Ei gefüllt.",
          "descEn": "Grilled or fried corn flatbreads, often filled with cheese or egg.",
          "long": "Ein flacher, runder Maisfladen, der gegrillt, gebacken oder frittiert wird und in Kolumbien zu fast jeder Mahlzeit gehört. Je nach Region wird sie pur, mit Käse oder gefüllt gegessen und ist ein günstiger, allgegenwärtiger Snack.",
          "longEn": "A flat, round corn flatbread, grilled, baked or fried, that accompanies almost every meal in Colombia. Depending on the region it's eaten plain, with cheese or stuffed, and is a cheap, ever-present snack.",
          "ingredients": "Maismehl (oft weiß), Wasser, Salz, je nach Variante Käse oder Butter",
          "ingredientsEn": "Corn flour (often white), water, salt, depending on the version cheese or butter",
          "origin": "Eine vorkolumbianische Speise indigener Völker, die heute in Kolumbien und Venezuela als Grundnahrungsmittel gilt.",
          "originEn": "A pre-Columbian dish of indigenous peoples that is today a staple in Colombia and Venezuela.",
          "occasions": "Wird zum Frühstück, als Beilage oder als Snack zu jeder Tageszeit gegessen.",
          "occasionsEn": "Eaten for breakfast, as a side or as a snack at any time of day.",
          "order": "Una arepa con queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Arepitas_Food_Macro.jpg/960px-Arepitas_Food_Macro.jpg"
        },
        {
          "name": "Ajiaco",
          "desc": "Herzhafte Hühnersuppe aus Bogotá mit drei Kartoffelsorten, Mais und Guascas-Kraut.",
          "descEn": "A hearty chicken soup from Bogotá with three kinds of potato, corn and guascas herb.",
          "long": "Eine dicke, cremige Kartoffelsuppe aus Bogotá, die mit Hähnchen und dem typischen Kraut Guascas gewürzt wird. Sie wird traditionell mit Sahne, Kapern und Avocado serviert, die man nach Geschmack hineingibt.",
          "longEn": "A thick, creamy potato soup from Bogotá, seasoned with chicken and the typical herb guascas. It's traditionally served with cream, capers and avocado, which you add to taste.",
          "ingredients": "Drei Kartoffelsorten, Hähnchen, Mais am Kolben, Guascas-Kraut, Sahne, Kapern, Avocado",
          "ingredientsEn": "Three kinds of potato, chicken, corn on the cob, guascas herb, cream, capers, avocado",
          "origin": "Das Gericht ist eng mit der Hauptstadt Bogotá und dem kühlen Hochland der Anden verbunden.",
          "originEn": "The dish is closely tied to the capital, Bogotá, and the cool highlands of the Andes.",
          "occasions": "Wird gern mittags und besonders an kühlen, regnerischen Tagen gegessen.",
          "occasionsEn": "Happily eaten at midday and especially on cool, rainy days.",
          "order": "Un ajiaco santafereño, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ajiaco.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Frittierte Maistaschen, gefüllt mit Fleisch und Kartoffeln.",
          "descEn": "Fried corn pasties, filled with meat and potato.",
          "long": "Frittierte, halbmondförmige Maisteigtaschen mit herzhafter Füllung, die in Kolumbien als beliebter Straßensnack verkauft werden. Sie werden meist mit scharfer Ají-Sauce serviert und sind günstig sowie überall erhältlich.",
          "longEn": "Fried, crescent-shaped corn-dough pasties with a savoury filling, sold as a popular street snack in Colombia. They're usually served with spicy ají sauce and are cheap and available everywhere.",
          "ingredients": "Maismehlteig, Füllung aus Kartoffel und Fleisch (Rind oder Schwein), Ají-Sauce zum Dippen",
          "ingredientsEn": "Corn-flour dough, filling of potato and meat (beef or pork), ají sauce for dipping",
          "origin": "Empanadas verbreiteten sich über die spanische Kolonialzeit in ganz Lateinamerika, mit eigener regionaler Ausprägung in Kolumbien.",
          "originEn": "Empanadas spread all over Latin America during the Spanish colonial era, with their own regional form in Colombia.",
          "occasions": "Werden als schneller Snack zwischendurch oder zum Aperitif gegessen.",
          "occasionsEn": "Eaten as a quick snack in between or as an appetiser.",
          "order": "Dos empanadas con ají, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        },
        {
          "name": "Sancocho",
          "desc": "Deftiger Eintopf mit Fleisch oder Fisch, Kochbanane und Knollengemüse.",
          "descEn": "A hearty stew with meat or fish, plantain and root vegetables.",
          "long": "Ein herzhafter Eintopf mit Fleisch und kräftigem Wurzelgemüse, der in vielen regionalen Varianten existiert. Er gilt als typisches Familien- und Wochenendgericht und wird oft in großen Töpfen für viele Personen gekocht.",
          "longEn": "A hearty stew with meat and robust root vegetables, found in many regional versions. It's considered a typical family and weekend dish and is often cooked in big pots for lots of people.",
          "ingredients": "Fleisch (Huhn, Rind oder Fisch), Yuca, Kochbanane, Kartoffel, Mais, Koriander",
          "ingredientsEn": "Meat (chicken, beef or fish), cassava, plantain, potato, corn, coriander",
          "origin": "Der Sancocho ist in vielen Ländern Lateinamerikas und der Karibik verbreitet und in Kolumbien je nach Region unterschiedlich ausgeprägt.",
          "originEn": "Sancocho is common in many countries of Latin America and the Caribbean and varies by region within Colombia.",
          "occasions": "Wird gern am Wochenende, bei Familientreffen und Feiern gegessen.",
          "occasionsEn": "Happily eaten at the weekend, at family gatherings and celebrations.",
          "order": "Un sancocho de gallina, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Lechona",
          "desc": "Im Ganzen gefülltes und gebackenes Spanferkel mit Reis und Erbsen.",
          "descEn": "A whole suckling pig, stuffed and baked, with rice and peas.",
          "long": "Ein ganzes Spanferkel, das mit Reis, Erbsen und Gewürzen gefüllt und stundenlang im Ofen geröstet wird. Die knusprige Haut ist besonders begehrt, und das Gericht wird portionsweise mit Arepa serviert.",
          "longEn": "A whole suckling pig, stuffed with rice, peas and spices and roasted in the oven for hours. The crispy skin is especially prized, and the dish is served by the portion with arepa.",
          "ingredients": "Ganzes Schwein, Reis, gelbe Erbsen, Zwiebeln, Gewürze",
          "ingredientsEn": "Whole pig, rice, yellow peas, onions, spices",
          "origin": "Die Lechona stammt aus der Region Tolima im Zentrum Kolumbiens und ist dort ein traditionelles Festgericht.",
          "originEn": "Lechona comes from the Tolima region in central Colombia, where it is a traditional celebration dish.",
          "occasions": "Wird vor allem bei Festen, Feiern und besonderen Anlässen serviert.",
          "occasionsEn": "Served above all at festivals, celebrations and special occasions.",
          "order": "Una porción de lechona, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/LEchona_%28Spain%29.JPG/960px-LEchona_%28Spain%29.JPG"
        }
      ],
      "drink": [
        {
          "name": "Aguardiente",
          "desc": "Anisbetonter Schnaps aus Zuckerrohr, das kolumbianische Nationalgetränk.",
          "descEn": "An anise-forward cane-sugar spirit, the Colombian national drink.",
          "long": "Ein klarer, anisaromatisierter Schnaps aus Zuckerrohr, der als kolumbianisches Nationalgetränk gilt. Er wird meist pur in kleinen Gläsern getrunken und ist auf Feiern und beim Feiern allgegenwärtig.",
          "longEn": "A clear, anise-flavoured cane-sugar spirit regarded as the Colombian national drink. It's usually drunk neat in small glasses and is everywhere at parties and celebrations.",
          "ingredients": "Zuckerrohrdestillat, Anis, Zucker",
          "ingredientsEn": "Cane-sugar distillate, anise, sugar",
          "origin": "Aguardiente wird in Kolumbien seit der Kolonialzeit hergestellt, wobei jede Region ihre eigene Marke hat.",
          "originEn": "Aguardiente has been made in Colombia since colonial times, with each region having its own brand.",
          "occasions": "Wird auf Partys, Festen und in geselliger Runde getrunken.",
          "occasionsEn": "Drunk at parties, festivals and in good company.",
          "order": "Un aguardiente, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/TAPA_ROJA.jpeg/960px-TAPA_ROJA.jpeg"
        },
        {
          "name": "Tinto",
          "desc": "Kleiner, oft süßer schwarzer Kaffee, überall an Straßenständen erhältlich.",
          "descEn": "A small, often sweet black coffee, sold everywhere at street stalls.",
          "long": "Ein kleiner, schwarzer Filterkaffee, der in Kolumbien überall und zu jeder Tageszeit getrunken wird. Trotz des Namens (tinto heißt eigentlich rot) bezeichnet er den schwarzen Kaffee und wird oft von Straßenverkäufern angeboten.",
          "longEn": "A small black filter coffee, drunk everywhere in Colombia at all hours. Despite the name (tinto actually means red), it refers to black coffee and is often sold by street vendors.",
          "ingredients": "Kaffee, Wasser, oft viel Zucker",
          "ingredientsEn": "Coffee, water, often plenty of sugar",
          "origin": "Als eines der größten Kaffeeanbauländer der Welt hat Kolumbien eine tief verwurzelte Kaffeekultur.",
          "originEn": "As one of the largest coffee-growing countries in the world, Colombia has a deeply rooted coffee culture.",
          "occasions": "Wird den ganzen Tag über getrunken, oft als kurze Pause oder beim Plausch.",
          "occasionsEn": "Drunk throughout the day, often as a short break or while having a chat.",
          "order": "Un tinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/960px-A_small_cup_of_coffee.JPG"
        },
        {
          "name": "Lulada",
          "desc": "Erfrischendes Getränk aus der sauren Lulo-Frucht, beliebt in Cali.",
          "descEn": "A refreshing drink from the tart lulo fruit, popular in Cali.",
          "long": "Ein erfrischendes Getränk aus der zerdrückten Lulo-Frucht mit Limette, Zucker und Eis, typisch für die Stadt Cali. Die säuerlich-fruchtige Mischung wird mit Fruchtstücken serviert und kühlt an heißen Tagen angenehm ab.",
          "longEn": "A refreshing drink of crushed lulo fruit with lime, sugar and ice, typical of the city of Cali. The tart, fruity mix is served with pieces of fruit and cools you down nicely on hot days.",
          "ingredients": "Lulo-Frucht, Limette, Zucker, Wasser, Eis",
          "ingredientsEn": "Lulo fruit, lime, sugar, water, ice",
          "origin": "Die Lulada stammt aus der Region Valle del Cauca im Südwesten Kolumbiens, besonders aus Cali.",
          "originEn": "Lulada comes from the Valle del Cauca region in south-western Colombia, especially from Cali.",
          "occasions": "Wird als erfrischendes Getränk an heißen Nachmittagen getrunken.",
          "occasionsEn": "Drunk as a refreshing drink on hot afternoons.",
          "order": "Una lulada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/4/43/Champ%C3%BAs_Titular.jpg"
        },
        {
          "name": "Refajo",
          "desc": "Mischung aus Bier und der roten Limonade Colombiana.",
          "descEn": "A mix of beer and the red soft drink Colombiana.",
          "long": "Eine Mischung aus hellem Bier und der roten Limonade Colombiana, die süß und leicht trinkbar ist. Sie wird gern auf Feiern in geselliger Runde getrunken und ist weniger stark als reines Bier.",
          "longEn": "A mix of pale beer and the red soft drink Colombiana, sweet and easy to drink. It's popular at parties in good company and is less strong than beer on its own.",
          "ingredients": "Helles Lagerbier, rote Limonade (Colombiana), oft Eis",
          "ingredientsEn": "Pale lager, red soft drink (Colombiana), often ice",
          "origin": "Das Mischgetränk ist in ganz Kolumbien als geselliges Partygetränk verbreitet.",
          "originEn": "The mixed drink is common all over Colombia as a sociable party drink.",
          "occasions": "Wird bei Feiern, Grillabenden und in geselliger Runde getrunken.",
          "occasionsEn": "Drunk at celebrations, barbecues and in good company.",
          "order": "Un refajo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Shandy_beer.jpg/960px-Shandy_beer.jpg"
        }
      ],
      "tip": "Sag '¿me regalas...?' statt 'quiero' beim Bestellen oder Bezahlen, das ist in Kolumbien die übliche höfliche Formel.",
      "tipEn": "Say '¿me regalas...?' instead of 'quiero' when ordering or paying – that's the usual polite phrasing in Colombia."
    },
    {
      "id": "venezuela",
      "sports": {
        "intro": "Anders als der Großteil Südamerikas ist Venezuela vor allem ein Baseball-Land; der Sport ist Nationalleidenschaft. Fußball holt aber rasant auf, und in der Leichtathletik sorgt das Land für Weltrekorde.",
        "introEn": "Unlike most of South America, Venezuela is above all a baseball country; the sport is a national passion. Football is catching up fast, and in athletics the country has set world records.",
        "popular": [
          { "name": "Baseball", "nameEn": "Baseball", "note": "Der populärste Sport, mit leidenschaftlicher Liga und vielen MLB-Stars.", "noteEn": "The most popular sport, with a passionate league and many MLB stars." },
          { "name": "Fußball", "nameEn": "Football", "note": "Wächst stark; die ‚Vinotinto' begeistert immer mehr Fans.", "noteEn": "Growing fast; the ‘Vinotinto' is winning over more and more fans." }
        ],
        "athletes": [
          { "name": "Miguel Cabrera", "sport": "Baseball", "sportEn": "Baseball", "note": "Triple-Crown-Gewinner und einer der besten Schlagmänner seiner Generation.", "noteEn": "A Triple Crown winner and one of the best hitters of his generation." },
          { "name": "Yulimar Rojas", "sport": "Dreisprung", "sportEn": "Triple jump", "note": "Olympiasiegerin und Weltrekordhalterin im Dreisprung.", "noteEn": "Olympic champion and world-record holder in the triple jump." }
        ]
      },
      "name": "Venezuela",
      "flag": "🇻🇪",
      "region": "Südamerika",
      "capital": "Caracas",
      "tagline": "Karibikstrände, Tafelberge und der höchste Wasserfall der Welt",
      "taglineEn": "Caribbean beaches, table mountains and the world's highest waterfall",
      "population": "Etwa 28 Millionen Einwohner (2025); über 7 Millionen sind seit 2015 ausgewandert.",
      "populationEn": "About 28 million inhabitants (2025); over 7 million have emigrated since 2015.",
      "ageStructure": "Medianalter von rund 30 Jahren, durch die Auswanderung junger Menschen im Wandel.",
      "ageStructureEn": "A median age of around 30, shifting as young people emigrate.",
      "government": "Präsidialrepublik, international umstritten und autoritär regiert unter Nicolás Maduro.",
      "governmentEn": "A presidential republic, internationally disputed and ruled authoritatively under Nicolás Maduro.",
      "economy": "Tiefe, langjährige Wirtschaftskrise mit Hyperinflation trotz der größten Ölreserven der Welt.",
      "economyEn": "A deep, long-running economic crisis with hyperinflation despite the world's largest oil reserves.",
      "livelihood": "Erdöl (über 90 % der Exporte), zunehmend Bergbau (Gold) und Überweisungen aus dem Ausland.",
      "livelihoodEn": "Oil (over 90% of exports), increasingly mining (gold) and remittances from abroad.",
      "about": "Venezuela liegt an der Karibikküste und reicht von Stränden über die Anden bis zum Amazonas und der Gran Sabana mit ihren Tafelbergen (Tepuis). Hier stürzt der Salto Ángel, der höchste Wasserfall der Erde, in die Tiefe. Wegen der politischen und wirtschaftlichen Krise ist Reisen aktuell schwierig und erfordert gute Vorbereitung.",
      "aboutEn": "Venezuela sits on the Caribbean coast and ranges from beaches across the Andes to the Amazon and the Gran Sabana with its table mountains (tepuis). This is where Angel Falls, the highest waterfall on Earth, plunges into the depths. Because of the political and economic crisis, travel is currently difficult and takes careful preparation.",
      "history": "Vor der Kolonialzeit lebten hier indigene Völker wie Caribe und Arawak. Spanien kolonialisierte das Gebiet ab dem 16. Jahrhundert; 1811 begann unter Simón Bolívar, hier geboren, der Unabhängigkeitskampf. Im 20. Jahrhundert machte Erdöl Venezuela zeitweise reich. Seit den 2000er-Jahren führten Misswirtschaft und Hyperinflation zu einer schweren Krise und massiver Auswanderung.",
      "historyEn": "Before colonial times, indigenous peoples such as the Carib and Arawak lived here. Spain colonised the area from the 16th century; in 1811 the struggle for independence began under Simón Bolívar, who was born here. In the 20th century, oil made Venezuela rich for a time. Since the 2000s, mismanagement and hyperinflation have led to a severe crisis and mass emigration.",
      "language": "Venezolanisches Spanisch klingt karibisch: schnell, melodisch und mit oft verschlucktem 's' am Silbenende. Verbreitet sind Verkleinerungsformen auf '-ico' statt '-ito' (z. B. 'ahorita' wird zu 'ahoritica'). Das Land ist berühmt für seinen lockeren Slang und Spitznamen für fast jeden. Indigene Sprachen wie Wayuunaiki und Warao werden regional noch gesprochen.",
      "languageEn": "Venezuelan Spanish sounds Caribbean: fast, melodic and with the 's' at the end of a syllable often swallowed. Diminutives ending in '-ico' rather than '-ito' are common (e.g. 'ahorita' becomes 'ahoritica'). The country is famous for its easy-going slang and nicknames for just about everyone. Indigenous languages such as Wayuunaiki and Warao are still spoken in some regions.",
      "words": [
        {
          "es": "chamo/chama",
          "de": "Typ / Mädel, Kumpel",
          "en": "bloke / girl, mate"
        },
        {
          "es": "pana",
          "de": "Kumpel, guter Freund",
          "en": "mate, good friend"
        },
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "vaina",
          "de": "Ding, Sache (Allzweckwort)",
          "en": "thing, stuff (all-purpose word)"
        },
        {
          "es": "arrecho",
          "de": "sauer/wütend oder krass (je nach Kontext)",
          "en": "annoyed/angry or wild (depending on context)"
        },
        {
          "es": "burda",
          "de": "sehr, voll (Verstärkung)",
          "en": "very, totally (intensifier)"
        }
      ],
      "food": [
        {
          "name": "Arepa",
          "desc": "Gefüllter Maisfladen, das venezolanische Grundnahrungsmittel schlechthin.",
          "descEn": "A stuffed corn flatbread, the Venezuelan staple par excellence.",
          "long": "In Venezuela ist die Arepa ein dicker Maisfladen, der aufgeschnitten und großzügig gefüllt wird, fast wie ein Sandwich. Die zahlreichen Füllvarianten haben eigene Namen, etwa die Reina Pepiada mit Avocado und Hähnchen.",
          "longEn": "In Venezuela the arepa is a thick corn flatbread, sliced open and generously filled, almost like a sandwich. The many filling variations have their own names, such as the Reina Pepiada with avocado and chicken.",
          "ingredients": "Maismehl (Harina P.A.N.), Wasser, Salz, Füllungen wie Käse, schwarze Bohnen, Avocado, Hähnchen",
          "ingredientsEn": "Corn flour (Harina P.A.N.), water, salt, fillings such as cheese, black beans, avocado, chicken",
          "origin": "Eine vorkolumbianische Maisspeise, die in Venezuela als tägliches Grundnahrungsmittel und nationales Symbol gilt.",
          "originEn": "A pre-Columbian corn dish that is a daily staple and national symbol in Venezuela.",
          "occasions": "Wird zum Frühstück, Abendessen oder als gefüllte Hauptmahlzeit gegessen.",
          "occasionsEn": "Eaten for breakfast, dinner or as a stuffed main meal.",
          "order": "Una arepa reina pepiada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Arepitas_Food_Macro.jpg/960px-Arepitas_Food_Macro.jpg"
        },
        {
          "name": "Pabellón criollo",
          "desc": "Nationalgericht aus geschmortem Zupffleisch, schwarzen Bohnen, Reis und Kochbanane.",
          "descEn": "A national dish of braised shredded beef, black beans, rice and plantain.",
          "long": "Das Nationalgericht Venezuelas vereint geschmortes, zerzupftes Rindfleisch mit Reis, schwarzen Bohnen und gebratener Kochbanane auf einem Teller. Die Kombination gilt als ausgewogenes, sättigendes Mittagsgericht und spiegelt die kulturelle Vielfalt des Landes wider.",
          "longEn": "Venezuela's national dish brings together braised, shredded beef with rice, black beans and fried plantain on one plate. The combination is considered a balanced, filling lunch and reflects the country's cultural diversity.",
          "ingredients": "Zerzupftes Rindfleisch (carne mechada), weißer Reis, schwarze Bohnen (caraotas), gebratene Kochbanane",
          "ingredientsEn": "Shredded beef (carne mechada), white rice, black beans (caraotas), fried plantain",
          "origin": "Das Gericht entstand aus der Mischung indigener, afrikanischer und europäischer Einflüsse und gilt als kulinarisches Sinnbild Venezuelas.",
          "originEn": "The dish arose from a mix of indigenous, African and European influences and is regarded as a culinary emblem of Venezuela.",
          "occasions": "Wird vor allem mittags als klassische Hauptmahlzeit gegessen.",
          "occasionsEn": "Eaten above all at midday as the classic main meal.",
          "order": "Un pabellón criollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pabell%C3%B3n_Criollo_Venezolano.jpg/960px-Pabell%C3%B3n_Criollo_Venezolano.jpg"
        },
        {
          "name": "Cachapa",
          "desc": "Süßlicher Pfannkuchen aus frischem Mais, oft mit Käse gefüllt.",
          "descEn": "A sweetish pancake made from fresh corn, often filled with cheese.",
          "long": "Ein dicker, leicht süßlicher Pfannkuchen aus frischem, jungem Mais, der goldgelb gebacken wird. Er wird meist mit dem weichen Käse Queso de mano gefüllt oder belegt und ist ein beliebtes Straßen- und Frühstücksgericht.",
          "longEn": "A thick, slightly sweet pancake of fresh young corn, baked golden. It's usually filled or topped with the soft cheese queso de mano and is a popular street and breakfast dish.",
          "ingredients": "Frischer junger Mais, etwas Zucker, Salz, Queso de mano (Frischkäse)",
          "ingredientsEn": "Fresh young corn, a little sugar, salt, queso de mano (fresh cheese)",
          "origin": "Die Cachapa ist eine traditionelle Maisspeise Venezuelas mit vorkolumbianischen Wurzeln.",
          "originEn": "The cachapa is a traditional Venezuelan corn dish with pre-Columbian roots.",
          "occasions": "Wird zum Frühstück oder als herzhafter Snack gegessen.",
          "occasionsEn": "Eaten for breakfast or as a savoury snack.",
          "order": "Una cachapa con queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Cachapas_from_Venezuela.jpg/960px-Cachapas_from_Venezuela.jpg"
        },
        {
          "name": "Hallaca",
          "desc": "Weihnachtsgericht aus Maisteig mit Schmorfüllung, in Bananenblättern gegart.",
          "descEn": "A Christmas dish of corn dough with a braised filling, cooked in banana leaves.",
          "long": "Ein gefülltes Maisteig-Päckchen, das in Bananenblättern gegart wird und als venezolanisches Weihnachtsgericht gilt. Die aufwendige Zubereitung der würzigen Fleischfüllung ist traditionell ein gemeinsames Familienereignis.",
          "longEn": "A parcel of stuffed corn dough, cooked in banana leaves and regarded as Venezuela's Christmas dish. The elaborate preparation of the spiced meat filling is traditionally a shared family event.",
          "ingredients": "Maisteig, Schmorfleisch (Rind, Schwein, Huhn), Oliven, Rosinen, Kapern, Paprika, Bananenblätter",
          "ingredientsEn": "Corn dough, braised meat (beef, pork, chicken), olives, raisins, capers, peppers, banana leaves",
          "origin": "Die Hallaca entstand in der Kolonialzeit und vereint indigene, afrikanische und europäische Zutaten zu einem Festgericht.",
          "originEn": "The hallaca arose in colonial times and brings together indigenous, African and European ingredients into a celebration dish.",
          "occasions": "Wird vor allem zur Weihnachtszeit und an Festtagen gegessen.",
          "occasionsEn": "Eaten above all at Christmas time and on holidays.",
          "order": "Una hallaca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hallacas_con_pan_de_jamon%2C_plato_Venezuelano.jpg/960px-Hallacas_con_pan_de_jamon%2C_plato_Venezuelano.jpg"
        },
        {
          "name": "Tequeños",
          "desc": "Frittierte Teigstangen mit geschmolzenem Käse, der beliebteste Snack.",
          "descEn": "Fried dough sticks with melted cheese, the most popular snack.",
          "long": "Frittierte Teigstangen, die mit weißem Käse gefüllt und außen knusprig sind. Sie gelten als der beliebteste Party- und Fingerfood-Snack Venezuelas und werden oft mit Dip-Saucen serviert.",
          "longEn": "Fried dough sticks, filled with white cheese and crisp on the outside. They're considered Venezuela's most popular party and finger-food snack and are often served with dipping sauces.",
          "ingredients": "Weizenmehlteig, weißer Käse (queso blanco), Öl zum Frittieren",
          "ingredientsEn": "Wheat-flour dough, white cheese (queso blanco), oil for frying",
          "origin": "Die Tequeños sollen aus dem Ort Los Teques nahe Caracas stammen und tragen daher ihren Namen.",
          "originEn": "Tequeños are said to come from the town of Los Teques near Caracas, which is how they got their name.",
          "occasions": "Werden auf Feiern, Partys und als Vorspeise gereicht.",
          "occasionsEn": "Served at celebrations, parties and as a starter.",
          "order": "Una orden de tequeños, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Teque%C3%B1os_v%C3%A9n%C3%A9zu%C3%A9liens_%C3%A0_Arepado_%28Lyon%29%2C_avril_2019_%282%29.jpg/960px-Teque%C3%B1os_v%C3%A9n%C3%A9zu%C3%A9liens_%C3%A0_Arepado_%28Lyon%29%2C_avril_2019_%282%29.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Frittierte Maistaschen, oft mit Käse, Fleisch oder Bohnen gefüllt.",
          "descEn": "Fried corn pasties, often filled with cheese, meat or beans.",
          "long": "In Venezuela werden Empanadas aus Maisteig hergestellt und frittiert, mit Füllungen von Käse über Fleisch bis Fisch. Sie sind ein klassischer Frühstücks- und Strandsnack und werden warm gegessen.",
          "longEn": "In Venezuela, empanadas are made from corn dough and fried, with fillings from cheese to meat to fish. They're a classic breakfast and beach snack and are eaten warm.",
          "ingredients": "Maismehlteig, Füllung aus Käse, Hackfleisch, Hähnchen oder Fisch",
          "ingredientsEn": "Corn-flour dough, filling of cheese, mince, chicken or fish",
          "origin": "Die frittierte Maisteig-Empanada ist eine venezolanische Variante der in ganz Lateinamerika verbreiteten Teigtasche.",
          "originEn": "The fried corn-dough empanada is a Venezuelan version of the pasty found all over Latin America.",
          "occasions": "Werden zum Frühstück oder als Snack, oft am Strand, gegessen.",
          "occasionsEn": "Eaten for breakfast or as a snack, often on the beach.",
          "order": "Una empanada de queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        }
      ],
      "drink": [
        {
          "name": "Ron venezolano",
          "desc": "Hochwertiger Rum, weltweit für seine Qualität geschätzt.",
          "descEn": "A high-quality rum, prized worldwide for its quality.",
          "long": "Venezolanischer Rum aus Zuckerrohr gilt als einer der besten der Welt und wird oft pur oder auf Eis genossen. Mehrere venezolanische Marken sind international für ihre langgereiften Sorten bekannt.",
          "longEn": "Venezuelan rum from sugar cane is considered one of the best in the world and is often enjoyed neat or on the rocks. Several Venezuelan brands are internationally known for their long-aged styles.",
          "ingredients": "Zuckerrohrmelasse, gereift in Eichenfässern",
          "ingredientsEn": "Sugar-cane molasses, aged in oak barrels",
          "origin": "Venezuela hat eine lange Rumtradition und unterliegt einer geschützten Herkunftsbezeichnung für Rum.",
          "originEn": "Venezuela has a long rum tradition and is subject to a protected designation of origin for rum.",
          "occasions": "Wird abends, auf Feiern oder als Genussgetränk getrunken.",
          "occasionsEn": "Drunk in the evening, at celebrations or as a treat.",
          "order": "Un ron en las rocas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Botella_de_Ron_Cacique.JPG"
        },
        {
          "name": "Papelón con limón",
          "desc": "Erfrischung aus Rohrzucker (Papelón) und Limette.",
          "descEn": "A refresher of cane sugar (papelón) and lime.",
          "long": "Ein erfrischendes Getränk aus unraffiniertem Rohrzucker (Papelón), Limette und Wasser. Es ist günstig, allgegenwärtig und löscht an heißen Tagen den Durst besonders gut.",
          "longEn": "A refreshing drink of unrefined cane sugar (papelón), lime and water. It's cheap, everywhere and especially good at quenching your thirst on hot days.",
          "ingredients": "Papelón (Rohrzuckerblock), Limette, Wasser, Eis",
          "ingredientsEn": "Papelón (block of cane sugar), lime, water, ice",
          "origin": "Das Getränk ist ein traditioneller, alltäglicher Durstlöscher in ganz Venezuela.",
          "originEn": "The drink is a traditional, everyday thirst-quencher all over Venezuela.",
          "occasions": "Wird zu Mahlzeiten oder als Erfrischung an heißen Tagen getrunken.",
          "occasionsEn": "Drunk with meals or as a refresher on hot days.",
          "order": "Un papelón con limón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Papel%C3%B3n_con_lim%C3%B3n_2.jpg/960px-Papel%C3%B3n_con_lim%C3%B3n_2.jpg"
        },
        {
          "name": "Chicha",
          "desc": "Süßes, sämiges Getränk auf Reisbasis mit Zimt.",
          "descEn": "A sweet, silky rice-based drink with cinnamon.",
          "long": "In Venezuela ist Chicha ein dickflüssiges, süßes Getränk auf Reisbasis, das mit Milch, Zimt und Zucker zubereitet wird. Es wird kalt serviert und oft von Straßenverkäufern angeboten.",
          "longEn": "In Venezuela, chicha is a thick, sweet rice-based drink made with milk, cinnamon and sugar. It's served cold and often sold by street vendors.",
          "ingredients": "Reis, Milch, Zucker, Zimt, manchmal Kondensmilch",
          "ingredientsEn": "Rice, milk, sugar, cinnamon, sometimes condensed milk",
          "origin": "Die venezolanische Reis-Chicha unterscheidet sich von den fermentierten Mais-Chichas anderer Andenländer.",
          "originEn": "Venezuelan rice chicha differs from the fermented corn chichas of other Andean countries.",
          "occasions": "Wird als süße Erfrischung oder kleiner Snack zwischendurch getrunken.",
          "occasionsEn": "Drunk as a sweet refresher or a little snack in between.",
          "order": "Una chicha, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Malta",
          "desc": "Alkoholfreies, dunkles Malzgetränk, sehr beliebt zum Essen.",
          "descEn": "A non-alcoholic dark malt drink, hugely popular with meals.",
          "long": "Ein dunkles, alkoholfreies Malzgetränk, das süß und vollmundig schmeckt. Es ist in ganz Venezuela beliebt und wird oft gekühlt oder zusammen mit Kondensmilch getrunken.",
          "longEn": "A dark, non-alcoholic malt drink that tastes sweet and full-bodied. It's popular all over Venezuela and is often drunk chilled or together with condensed milk.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Zucker (alkoholfrei)",
          "ingredientsEn": "Barley malt, hops, water, sugar (non-alcoholic)",
          "origin": "Malzgetränke wie die Malta sind in der gesamten Karibik und in Venezuela weit verbreitet.",
          "originEn": "Malt drinks like Malta are widespread throughout the Caribbean and in Venezuela.",
          "occasions": "Wird zu Mahlzeiten oder als süße Erfrischung getrunken.",
          "occasionsEn": "Drunk with meals or as a sweet refresher.",
          "order": "Una malta bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Maltin_polar_-_green_spot.jpg"
        }
      ],
      "tip": "Informiere dich vor der Reise gründlich über die aktuelle Sicherheits- und Versorgungslage und nimm ausreichend Bargeld (US-Dollar) mit, da Karten oft nicht funktionieren.",
      "tipEn": "Read up thoroughly on the current security and supply situation before you travel, and bring plenty of cash (US dollars), as cards often don't work."
    },
    {
      "id": "ecuador",
      "sports": {
        "intro": "Fußball ist der mit Abstand beliebteste Sport, doch Ecuador glänzt auch im Gehen und im Radsport – mit Olympiasiegern in beiden Disziplinen.",
        "introEn": "Football is by far the most popular sport, but Ecuador also shines in race walking and cycling – with Olympic champions in both disciplines.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1; ‚La Tri' qualifiziert sich regelmäßig für die WM.", "noteEn": "The number-one sport; ‘La Tri' regularly qualifies for the World Cup." },
          { "name": "Radsport", "nameEn": "Cycling", "note": "Im Aufwind dank Erfolgen bei den großen Rundfahrten.", "noteEn": "On the rise thanks to success in the grand tours." }
        ],
        "athletes": [
          { "name": "Antonio Valencia", "sport": "Fußball", "sportEn": "Football", "note": "Langjähriger Kapitän bei Manchester United, Ecuadors bekanntester Spieler.", "noteEn": "Long-time captain at Manchester United, Ecuador's best-known player." },
          { "name": "Richard Carapaz", "sport": "Radsport", "sportEn": "Cycling", "note": "Giro-d'Italia-Sieger 2019 und Olympiasieger 2021.", "noteEn": "Giro d'Italia winner in 2019 and Olympic champion in 2021." },
          { "name": "Jefferson Pérez", "sport": "Gehen", "sportEn": "Race walking", "note": "Gewann 1996 Olympiagold – Ecuadors erste olympische Medaille.", "noteEn": "Won Olympic gold in 1996 – Ecuador's first Olympic medal." }
        ]
      },
      "name": "Ecuador",
      "flag": "🇪🇨",
      "region": "Südamerika",
      "capital": "Quito",
      "tagline": "Galápagos, Vulkane und der Äquator auf kleinstem Raum",
      "taglineEn": "The Galápagos, volcanoes and the equator, all in a tiny space",
      "population": "Rund 18 Millionen Einwohner (2025).",
      "populationEn": "Around 18 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 29 Jahren.",
      "ageStructureEn": "A young population with a median age of about 29.",
      "government": "Präsidentielle Republik; nutzt seit 2000 den US-Dollar als Währung.",
      "governmentEn": "A presidential republic; it has used the US dollar as its currency since 2000.",
      "economy": "Dollarisierte Wirtschaft; zuletzt belastet durch stark gestiegene Drogenkriminalität.",
      "economyEn": "A dollarised economy; recently strained by a sharp rise in drug-related crime.",
      "livelihood": "Erdöl, Bananen (weltgrößter Exporteur), Garnelen, Blumen und Kakao.",
      "livelihoodEn": "Oil, bananas (the world's largest exporter), shrimp, flowers and cocoa.",
      "about": "Ecuador ist eines der kleinsten, aber vielfältigsten Länder Südamerikas: Küste, Anden mit Vulkanen, Amazonas und die einzigartigen Galápagos-Inseln. Backpacker lieben Quitos Altstadt, die Vulkanstraße ('Avenida de los Volcanes') und Baños als Abenteuer-Hub. Dank kompakter Größe sind die Regionen schnell erreichbar.",
      "aboutEn": "Ecuador is one of the smallest yet most diverse countries in South America: coast, volcano-studded Andes, Amazon and the unique Galápagos Islands. Backpackers love Quito's old town, the volcano road ('Avenida de los Volcanes') and Baños as an adventure hub. Thanks to its compact size, the regions are quick to reach.",
      "history": "Vor der spanischen Eroberung war das Andenhochland Teil des Inkareichs, mit Quito als wichtigem Zentrum. Spanien kolonialisierte das Gebiet ab dem 16. Jahrhundert; 1822 wurde es nach der Schlacht von Pichincha unabhängig und gehörte zunächst zu Großkolumbien. 1830 entstand der eigenständige Staat Ecuador. Seit 2000 ist der US-Dollar offizielle Währung.",
      "historyEn": "Before the Spanish conquest, the Andean highlands were part of the Inca Empire, with Quito as an important centre. Spain colonised the area from the 16th century; in 1822, after the Battle of Pichincha, it gained independence and was initially part of Gran Colombia. The independent state of Ecuador came into being in 1830. Since 2000 the US dollar has been the official currency.",
      "language": "Das Andenspanisch Ecuadors gilt als langsam und klar, ideal zum Spanischlernen. Quechua (lokal 'Kichwa') ist als indigene Sprache weit verbreitet und hat viele Wörter beigesteuert. Höflich wird oft das Verkleinerungssuffix '-ito/-ita' benutzt, sogar bei 'ahorita' oder 'despacito'. An der Küste wird schneller und karibischer gesprochen als im Hochland.",
      "languageEn": "The Andean Spanish of Ecuador is considered slow and clear, ideal for learning Spanish. Quechua (locally 'Kichwa') is a widely spoken indigenous language and has contributed many words. The diminutive suffix '-ito/-ita' is often used politely, even on words like 'ahorita' or 'despacito'. On the coast it's spoken faster and more Caribbean than in the highlands.",
      "words": [
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "pana",
          "de": "Kumpel, Freund",
          "en": "mate, friend"
        },
        {
          "es": "chuta",
          "de": "Mist! / verflixt! (mild)",
          "en": "darn! / blast it! (mild)"
        },
        {
          "es": "ñaño/ñaña",
          "de": "Bruder / Schwester (auch enger Freund)",
          "en": "brother / sister (also a close friend)"
        },
        {
          "es": "bacán",
          "de": "klasse, toll",
          "en": "brilliant, great"
        },
        {
          "es": "guagua",
          "de": "Kleinkind (aus dem Quechua)",
          "en": "toddler (from Quechua)"
        }
      ],
      "food": [
        {
          "name": "Ceviche",
          "desc": "Ecuadorianisches Ceviche, oft mit Garnelen und in einer tomatigen Marinade.",
          "descEn": "Ecuadorean ceviche, often with prawns and in a tomatoey marinade.",
          "long": "Das ecuadorianische Ceviche wird oft mit Garnelen zubereitet und in einer tomatigen, leicht süßlichen Marinade serviert. Anders als die peruanische Variante schwimmt es in mehr Flüssigkeit und wird gern mit Popcorn, gerösteten Maiskörnern oder Kochbananenchips gegessen.",
          "longEn": "Ecuadorean ceviche is often made with prawns and served in a tomatoey, slightly sweet marinade. Unlike the Peruvian version it swims in more liquid and is happily eaten with popcorn, toasted corn kernels or plantain crisps.",
          "ingredients": "Garnelen (oder Fisch), Limette, Tomate, Zwiebel, Koriander, dazu Canguil (Popcorn) oder Chifles",
          "ingredientsEn": "Prawns (or fish), lime, tomato, onion, coriander, plus canguil (popcorn) or chifles",
          "origin": "Ceviche ist an der ecuadorianischen Küste weit verbreitet und unterscheidet sich durch seinen tomatigen Sud von anderen Ländern.",
          "originEn": "Ceviche is widespread on the Ecuadorean coast and differs from other countries through its tomatoey liquor.",
          "occasions": "Wird gern mittags und als erfrischendes Gericht an warmen Tagen gegessen.",
          "occasionsEn": "Happily eaten at midday and as a refreshing dish on warm days.",
          "order": "Un ceviche de camarón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Encebollado",
          "desc": "Herzhafte Fischsuppe mit Thunfisch, Yuca und Zwiebeln, gilt als Katerfrühstück.",
          "descEn": "A hearty fish soup with tuna, cassava and onions, regarded as a hangover breakfast.",
          "long": "Eine herzhafte Fischsuppe mit Thunfisch, Yuca und viel mariniertem Zwiebelsalat, die als Klassiker der ecuadorianischen Küste gilt. Sie wird oft mit Chifles und Popcorn serviert und gilt als beliebtes Katermittel am Morgen.",
          "longEn": "A hearty fish soup with tuna, cassava and plenty of marinated onion salad, regarded as a classic of the Ecuadorean coast. It's often served with chifles and popcorn and is a popular morning hangover cure.",
          "ingredients": "Albacora-Thunfisch, Yuca, rote Zwiebeln, Tomate, Koriander, Limette, Chifles",
          "ingredientsEn": "Albacore tuna, cassava, red onions, tomato, coriander, lime, chifles",
          "origin": "Das Encebollado stammt von der Pazifikküste Ecuadors und gilt vielen als inoffizielles Nationalgericht.",
          "originEn": "Encebollado comes from the Pacific coast of Ecuador and is regarded by many as the unofficial national dish.",
          "occasions": "Wird besonders morgens und vormittags gegessen, gern auch gegen den Kater.",
          "occasionsEn": "Eaten especially in the morning, often to cure a hangover.",
          "order": "Un encebollado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Semifinal_del_Campeonato_del_Encebollado_en_Esmeraldas_2015_%2818062294436%29.jpg/960px-Semifinal_del_Campeonato_del_Encebollado_en_Esmeraldas_2015_%2818062294436%29.jpg"
        },
        {
          "name": "Llapingachos",
          "desc": "Gebratene Kartoffel-Käse-Puffer, meist mit Erdnusssauce serviert.",
          "descEn": "Fried potato-and-cheese cakes, usually served with peanut sauce.",
          "long": "Gebratene Kartoffelpuffer, die mit Käse gefüllt und goldbraun angebraten werden. Sie werden meist mit Erdnusssauce, Wurst, Ei und Avocado serviert und sind ein typisches Gericht des Hochlands.",
          "longEn": "Fried potato cakes, filled with cheese and pan-fried golden brown. They're usually served with peanut sauce, sausage, egg and avocado and are a typical highland dish.",
          "ingredients": "Kartoffeln, Käse, Zwiebeln, Achiote, Erdnusssauce als Beilage",
          "ingredientsEn": "Potatoes, cheese, onions, achiote, peanut sauce on the side",
          "origin": "Die Llapingachos stammen aus dem Andenhochland Ecuadors, besonders aus der Region Ambato.",
          "originEn": "Llapingachos come from the Andean highlands of Ecuador, especially the Ambato region.",
          "occasions": "Werden zum Frühstück, Mittag- oder Abendessen gegessen.",
          "occasionsEn": "Eaten for breakfast, lunch or dinner.",
          "order": "Unos llapingachos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Llapingachos._%2840491622163%29.jpg/960px-Llapingachos._%2840491622163%29.jpg"
        },
        {
          "name": "Hornado",
          "desc": "Langsam gebratenes, knuspriges Schweinefleisch aus dem Hochland.",
          "descEn": "Slow-roasted, crispy pork from the highlands.",
          "long": "Ein im Ganzen langsam geröstetes Schwein mit knuspriger Haut, das auf Märkten frisch portioniert verkauft wird. Es wird typischerweise mit Llapingachos, Mais und mariniertem Zwiebelsalat serviert.",
          "longEn": "A whole pig, slow-roasted with crispy skin, sold freshly portioned at markets. It's typically served with llapingachos, corn and marinated onion salad.",
          "ingredients": "Ganzes Schwein, Knoblauch, Kreuzkümmel, Achiote, Bier oder Chicha zum Marinieren",
          "ingredientsEn": "Whole pig, garlic, cumin, achiote, beer or chicha for marinating",
          "origin": "Der Hornado ist ein traditionelles Gericht des ecuadorianischen Andenhochlands und ein Markt-Klassiker.",
          "originEn": "Hornado is a traditional dish of the Ecuadorean Andean highlands and a market classic.",
          "occasions": "Wird mittags, besonders an Markttagen und bei Feiern, gegessen.",
          "occasionsEn": "Eaten at midday, especially on market days and at celebrations.",
          "order": "Un plato de hornado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ama_la_Vida_-_Flickr_-_Imbabura_Hornado_%2823%29_%2814294973591%29.jpg/960px-Ama_la_Vida_-_Flickr_-_Imbabura_Hornado_%2823%29_%2814294973591%29.jpg"
        },
        {
          "name": "Locro de papa",
          "desc": "Cremige Kartoffelsuppe mit Käse und Avocado.",
          "descEn": "A creamy potato soup with cheese and avocado.",
          "long": "Eine cremige Kartoffelsuppe mit Käse, die im kühlen Andenhochland besonders wärmt. Sie wird traditionell mit Avocado und manchmal mit Mais serviert und gilt als wohltuendes Hausmannskost-Gericht.",
          "longEn": "A creamy potato soup with cheese that's especially warming in the cool Andean highlands. It's traditionally served with avocado and sometimes corn and is considered a comforting home-cooked dish.",
          "ingredients": "Kartoffeln, Käse, Milch, Zwiebeln, Achiote, Avocado",
          "ingredientsEn": "Potatoes, cheese, milk, onions, achiote, avocado",
          "origin": "Der Locro de papa ist ein traditionelles Gericht der ecuadorianischen Anden.",
          "originEn": "Locro de papa is a traditional dish of the Ecuadorean Andes.",
          "occasions": "Wird gern mittags und an kühlen Tagen gegessen.",
          "occasionsEn": "Happily eaten at midday and on cool days.",
          "order": "Un locro de papa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Locro_de_papa.jpg/960px-Locro_de_papa.jpg"
        },
        {
          "name": "Cuy",
          "desc": "Gegrilltes Meerschweinchen, ein traditionelles Andengericht.",
          "descEn": "Grilled guinea pig, a traditional Andean dish.",
          "long": "Cuy ist gegrilltes oder geröstetes Meerschweinchen, eine Delikatesse des Andenhochlands mit langer Tradition. Das Tier wird im Ganzen über offenem Feuer gegart und mit Kartoffeln und Erdnusssauce serviert.",
          "longEn": "Cuy is grilled or roasted guinea pig, a delicacy of the Andean highlands with a long tradition. The animal is cooked whole over an open fire and served with potatoes and peanut sauce.",
          "ingredients": "Meerschweinchen, Knoblauch, Kreuzkümmel, Salz, Beilage aus Kartoffeln",
          "ingredientsEn": "Guinea pig, garlic, cumin, salt, potatoes on the side",
          "origin": "Cuy wird in den Anden seit vorkolumbianischer Zeit gegessen und gilt als Festtagsspeise indigener Kulturen.",
          "originEn": "Cuy has been eaten in the Andes since pre-Columbian times and is regarded as a celebration dish of indigenous cultures.",
          "occasions": "Wird vor allem bei Festen, Feiern und besonderen Anlässen gegessen.",
          "occasionsEn": "Eaten above all at festivals, celebrations and special occasions.",
          "order": "Un cuy asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Caviaklein.jpg"
        }
      ],
      "drink": [
        {
          "name": "Canelazo",
          "desc": "Heißes Getränk aus Zuckerrohrschnaps, Zimt und Naranjilla, ideal gegen die Andenkälte.",
          "descEn": "A hot drink of cane spirit, cinnamon and naranjilla, perfect against the Andean chill.",
          "long": "Ein heißes, alkoholisches Getränk aus Zimt, Wasser, Zucker und Zuckerrohrschnaps (Aguardiente). Es wärmt im kühlen Andenhochland und wird besonders abends und an Feiertagen getrunken.",
          "longEn": "A hot, alcoholic drink of cinnamon, water, sugar and cane spirit (aguardiente). It warms you in the cool Andean highlands and is drunk especially in the evenings and on holidays.",
          "ingredients": "Aguardiente, Zimt, Panela (Rohrzucker), Wasser, oft Naranjilla",
          "ingredientsEn": "Aguardiente, cinnamon, panela (cane sugar), water, often naranjilla",
          "origin": "Der Canelazo ist ein traditionelles Heißgetränk der Anden Ecuadors und Kolumbiens.",
          "originEn": "Canelazo is a traditional hot drink of the Andes of Ecuador and Colombia.",
          "occasions": "Wird an kühlen Abenden und bei Festen getrunken.",
          "occasionsEn": "Drunk on cool evenings and at festivals.",
          "order": "Un canelazo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Canelazo.jpg/960px-Canelazo.jpg"
        },
        {
          "name": "Pilsener",
          "desc": "Das populärste einheimische Lagerbier Ecuadors.",
          "descEn": "Ecuador's most popular home-grown lager.",
          "long": "Das meistgetrunkene Bier Ecuadors, ein helles Lagerbier, das überall erhältlich ist. Es wird gern eiskalt zu geselligen Anlässen und am Strand getrunken.",
          "longEn": "Ecuador's most-drunk beer, a pale lager available everywhere. It's happily drunk ice-cold at social occasions and on the beach.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "ingredientsEn": "Barley malt, hops, water, yeast",
          "origin": "Pilsener ist die bekannteste einheimische Biermarke Ecuadors mit langer Geschichte.",
          "originEn": "Pilsener is Ecuador's best-known home-grown beer brand, with a long history.",
          "occasions": "Wird in geselliger Runde, auf Feiern und am Strand getrunken.",
          "occasionsEn": "Drunk in good company, at celebrations and on the beach.",
          "order": "Una Pilsener bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Pilsener.png"
        },
        {
          "name": "Colada morada",
          "desc": "Dickflüssiges, gewürztes Beerengetränk, traditionell zum Allerseelenfest.",
          "descEn": "A thick, spiced berry drink, traditionally for All Souls' Day.",
          "long": "Ein warmes, dickflüssiges, dunkelviolettes Getränk aus violettem Mais und verschiedenen Früchten. Es wird traditionell zum Allerseelentag zusammen mit dem Gebäck Guaguas de pan getrunken.",
          "longEn": "A warm, thick, dark-purple drink of purple corn and various fruits. It's traditionally drunk on All Souls' Day together with the bread figures guaguas de pan.",
          "ingredients": "Violettes Maismehl, Brombeeren, Heidelbeeren, Naranjilla, Gewürze wie Zimt und Nelken",
          "ingredientsEn": "Purple corn flour, blackberries, blueberries, naranjilla, spices such as cinnamon and cloves",
          "origin": "Die Colada morada hat indigene Wurzeln und ist eng mit dem Día de los Difuntos verbunden.",
          "originEn": "Colada morada has indigenous roots and is closely tied to the Día de los Difuntos.",
          "occasions": "Wird vor allem Anfang November zum Allerseelentag getrunken.",
          "occasionsEn": "Drunk above all in early November for All Souls' Day.",
          "order": "Una colada morada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/COLADA_MORADA_Y_GUAGUAS_DE_PAN_%2838016386062%29.jpg/960px-COLADA_MORADA_Y_GUAGUAS_DE_PAN_%2838016386062%29.jpg"
        },
        {
          "name": "Jugo de naranjilla",
          "desc": "Erfrischender Saft aus der säuerlichen Naranjilla-Frucht.",
          "descEn": "A refreshing juice from the tart naranjilla fruit.",
          "long": "Ein erfrischender Saft aus der Naranjilla, einer säuerlichen grünen Frucht der Anden. Der spritzig-saure Geschmack macht ihn zu einem beliebten Durstlöscher an warmen Tagen.",
          "longEn": "A refreshing juice from the naranjilla, a tart green fruit of the Andes. Its zesty, sour taste makes it a popular thirst-quencher on warm days.",
          "ingredients": "Naranjilla (Lulo), Wasser, Zucker, Eis",
          "ingredientsEn": "Naranjilla (lulo), water, sugar, ice",
          "origin": "Die Naranjilla wächst in den Andenregionen Ecuadors und ist dort eine verbreitete Saftfrucht.",
          "originEn": "The naranjilla grows in the Andean regions of Ecuador, where it is a common juice fruit.",
          "occasions": "Wird zu Mahlzeiten oder als Erfrischung getrunken.",
          "occasionsEn": "Drunk with meals or as a refresher.",
          "order": "Un jugo de naranjilla, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Oranges_-_whole-halved-segment.jpg/960px-Oranges_-_whole-halved-segment.jpg"
        }
      ],
      "tip": "Nutze die kompakte Größe des Landes: Mit dem Bus erreichst du von Quito aus Küste, Anden und Dschungel jeweils in wenigen Stunden.",
      "tipEn": "Make the most of the country's compact size: by bus you can reach the coast, the Andes and the jungle from Quito in just a few hours each."
    },
    {
      "id": "peru",
      "sports": {
        "intro": "Fußball begeistert das ganze Land, vor allem die ‚Blanquirroja'. Daneben hat der Frauen-Volleyball eine ruhmreiche Tradition, und an der Küste boomt das Surfen.",
        "introEn": "Football thrills the whole country, especially the ‘Blanquirroja'. Women's volleyball has a glorious tradition too, and surfing is booming along the coast.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Der populärste Sport, mit den Rivalen Alianza Lima und Universitario.", "noteEn": "The most popular sport, with rivals Alianza Lima and Universitario." },
          { "name": "Volleyball", "nameEn": "Volleyball", "note": "Die Frauen-Nationalmannschaft gewann 1988 Olympiasilber.", "noteEn": "The women's national team won Olympic silver in 1988." },
          { "name": "Surfen", "nameEn": "Surfing", "note": "Weltklasse-Wellen; Peru stellte schon Weltmeister.", "noteEn": "World-class waves; Peru has produced world champions." }
        ],
        "athletes": [
          { "name": "Teófilo Cubillas", "sport": "Fußball", "sportEn": "Football", "note": "Größte Fußball-Legende des Landes, glänzte bei zwei WM-Turnieren.", "noteEn": "The country's greatest football legend, who shone at two World Cups." },
          { "name": "Sofía Mulánovich", "sport": "Surfen", "sportEn": "Surfing", "note": "Wurde 2004 als erste Lateinamerikanerin Surf-Weltmeisterin.", "noteEn": "In 2004 became the first Latin American woman to be surfing world champion." }
        ]
      },
      "name": "Peru",
      "flag": "🇵🇪",
      "region": "Südamerika",
      "capital": "Lima",
      "tagline": "Machu Picchu, Inka-Erbe und eine der besten Küchen der Welt",
      "taglineEn": "Machu Picchu, Inca heritage and one of the world's finest cuisines",
      "population": "Etwa 34,5 Millionen Einwohner (2025).",
      "populationEn": "About 34.5 million inhabitants (2025).",
      "ageStructure": "Medianalter von rund 31 Jahren; großer Anteil indigener Quechua und Aymara.",
      "ageStructureEn": "A median age of around 31; a large share of indigenous Quechua and Aymara.",
      "government": "Präsidentielle Republik mit anhaltender politischer Instabilität und häufigen Präsidentenwechseln.",
      "governmentEn": "A presidential republic with ongoing political instability and frequent changes of president.",
      "economy": "Rohstoffabhängige Volkswirtschaft mit langem Wachstum, aber großer Informalität.",
      "economyEn": "A commodity-dependent economy with long growth but high informality.",
      "livelihood": "Bergbau (Kupfer, Gold, Silber – weltweit führend), Fischmehl, Landwirtschaft und Tourismus (Machu Picchu).",
      "livelihoodEn": "Mining (copper, gold, silver – among the world's leaders), fishmeal, agriculture and tourism (Machu Picchu).",
      "about": "Peru vereint Wüstenküste, hohe Anden und Amazonasregenwald. Das absolute Highlight ist Machu Picchu, dazu kommen Cusco, das Heilige Tal, der Titicacasee und der Canyon von Colca. Lima gilt zudem als kulinarische Hauptstadt Lateinamerikas.",
      "aboutEn": "Peru brings together desert coastline, high Andes and Amazon rainforest. The absolute highlight is Machu Picchu, along with Cusco, the Sacred Valley, Lake Titicaca and the Colca Canyon. Lima is also regarded as the culinary capital of Latin America.",
      "history": "Peru war das Kernland des Inkareichs mit Cusco als Hauptstadt, dem ältere Hochkulturen wie Nazca, Moche und Chimú vorausgingen. 1532 eroberte Francisco Pizarro das Reich für Spanien, das daraufhin das mächtige Vizekönigreich Peru errichtete. 1821 erklärte José de San Martín die Unabhängigkeit. Heute ist Peru ein Zentrum andiner Kultur, in der Quechua-Tradition bis heute lebendig ist.",
      "historyEn": "Peru was the heartland of the Inca Empire, with Cusco as its capital, preceded by earlier civilisations such as the Nazca, Moche and Chimú. In 1532 Francisco Pizarro conquered the empire for Spain, which then established the powerful Viceroyalty of Peru. In 1821 José de San Martín declared independence. Today Peru is a centre of Andean culture, where the Quechua tradition remains alive to this day.",
      "language": "Das peruanische Andenspanisch ist meist klar und gut verständlich. Quechua ist zweite Amtssprache und vor allem rund um Cusco im Alltag präsent; auch Aymara wird am Titicacasee gesprochen. Viele Alltagswörter stammen aus dem Quechua, etwa 'wawa' (Baby) oder 'chacra' (Acker). An der Küste und in Lima wird schneller gesprochen als im Hochland.",
      "languageEn": "Peruvian Andean Spanish is usually clear and easy to understand. Quechua is a second official language and a part of everyday life, especially around Cusco; Aymara is also spoken by Lake Titicaca. Many everyday words come from Quechua, such as 'wawa' (baby) or 'chacra' (field). On the coast and in Lima it's spoken faster than in the highlands.",
      "words": [
        {
          "es": "pata",
          "de": "Kumpel, Freund",
          "en": "mate, friend"
        },
        {
          "es": "chévere",
          "de": "cool, super",
          "en": "cool, great"
        },
        {
          "es": "bacán",
          "de": "klasse, toll",
          "en": "brilliant, great"
        },
        {
          "es": "causa",
          "de": "Kumpel (auch ein Kartoffelgericht)",
          "en": "mate (also a potato dish)"
        },
        {
          "es": "jato",
          "de": "Haus, Bude",
          "en": "house, place"
        },
        {
          "es": "al toque",
          "de": "sofort, ruckzuck",
          "en": "right away, in a flash"
        }
      ],
      "food": [
        {
          "name": "Ceviche",
          "desc": "In Limettensaft marinierter roher Fisch mit Zwiebeln, Chili und Süßkartoffel, das Nationalgericht.",
          "descEn": "Raw fish marinated in lime juice with onions, chilli and sweet potato, the national dish.",
          "long": "Das peruanische Ceviche ist das Nationalgericht und besteht aus rohem Fisch, der in frischem Limettensaft gegart wird. Es wird klassisch mit roten Zwiebeln, Chili, Koriander, Süßkartoffel und Mais serviert, wobei die scharf-saure Marinade Leche de tigre besonders geschätzt wird.",
          "longEn": "Peruvian ceviche is the national dish and consists of raw fish 'cooked' in fresh lime juice. It's classically served with red onions, chilli, coriander, sweet potato and corn, and the spicy-sour marinade leche de tigre is especially prized.",
          "ingredients": "Roher Weißfisch, Limette, rote Zwiebeln, Ají (Chili), Koriander, Süßkartoffel, Choclo (Mais)",
          "ingredientsEn": "Raw white fish, lime, red onions, ají (chilli), coriander, sweet potato, choclo (corn)",
          "origin": "Ceviche hat in Peru vorkolumbianische Wurzeln und gilt als kulinarisches Nationalsymbol mit eigenem Feiertag.",
          "originEn": "Ceviche has pre-Columbian roots in Peru and is regarded as a culinary national symbol with its own holiday.",
          "occasions": "Wird traditionell mittags und besonders frisch zubereitet gegessen.",
          "occasionsEn": "Traditionally eaten at midday and especially when freshly made.",
          "order": "Un ceviche de pescado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Lomo saltado",
          "desc": "Pfannengebratenes Rindfleisch mit Zwiebeln, Tomaten und Pommes, chinesisch beeinflusst.",
          "descEn": "Stir-fried beef with onions, tomatoes and chips, with a Chinese influence.",
          "long": "Ein Pfannengericht aus mariniertem Rindfleisch, das mit Zwiebeln und Tomaten im Wok scharf angebraten wird. Es vereint chinesische und peruanische Küche und wird typischerweise mit Pommes frites und Reis zugleich serviert.",
          "longEn": "A stir-fry of marinated beef, seared in a wok with onions and tomatoes. It brings together Chinese and Peruvian cooking and is typically served with chips and rice at the same time.",
          "ingredients": "Rindfleischstreifen, Zwiebeln, Tomaten, Sojasauce, Ají amarillo, Pommes frites, Reis",
          "ingredientsEn": "Beef strips, onions, tomatoes, soy sauce, ají amarillo, chips, rice",
          "origin": "Lomo saltado entstand aus der chinesisch-peruanischen Chifa-Küche im 19. Jahrhundert.",
          "originEn": "Lomo saltado emerged from the Chinese-Peruvian Chifa cuisine in the 19th century.",
          "occasions": "Wird als sättigende Hauptmahlzeit mittags oder abends gegessen.",
          "occasionsEn": "Eaten as a filling main meal at midday or in the evening.",
          "order": "Un lomo saltado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Lomo-saltado-perudelights.jpg/960px-Lomo-saltado-perudelights.jpg"
        },
        {
          "name": "Ají de gallina",
          "desc": "Cremiges Hühnerragout mit gelbem Chili (Ají amarillo).",
          "descEn": "A creamy chicken stew with yellow chilli (ají amarillo).",
          "long": "Ein cremiges Gericht aus zerzupftem Hähnchen in einer würzigen, leicht scharfen gelben Sauce auf Basis von Ají amarillo. Es wird mit Reis, Kartoffeln, Oliven und Ei serviert und ist mild-pikant im Geschmack.",
          "longEn": "A creamy dish of shredded chicken in a spicy, mildly hot yellow sauce based on ají amarillo. It's served with rice, potatoes, olives and egg and is mild yet piquant in flavour.",
          "ingredients": "Hähnchen, Ají amarillo, Brot oder Cracker, Milch, Walnüsse, Parmesan, Kartoffeln",
          "ingredientsEn": "Chicken, ají amarillo, bread or crackers, milk, walnuts, parmesan, potatoes",
          "origin": "Das Gericht hat Wurzeln in der spanischen Kolonialküche und gilt als peruanischer Klassiker.",
          "originEn": "The dish has roots in Spanish colonial cooking and is regarded as a Peruvian classic.",
          "occasions": "Wird als wärmende Hauptmahlzeit mittags oder abends gegessen.",
          "occasionsEn": "Eaten as a warming main meal at midday or in the evening.",
          "order": "Un ají de gallina, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Aj%C3%AD_de_gallina_-_Tradicional.jpg/960px-Aj%C3%AD_de_gallina_-_Tradicional.jpg"
        },
        {
          "name": "Causa limeña",
          "desc": "Geschichteter, kalter Kartoffelstock mit Limette und herzhafter Füllung.",
          "descEn": "A layered, cold potato terrine with lime and a savoury filling.",
          "long": "Eine kalte Vorspeise aus gewürztem Kartoffelpüree, das mit Ají amarillo und Limette abgeschmeckt und geschichtet wird. Zwischen den Schichten befindet sich meist eine Füllung aus Thunfisch, Hähnchen oder Avocado.",
          "longEn": "A cold starter of seasoned mashed potato, flavoured with ají amarillo and lime and layered. Between the layers there's usually a filling of tuna, chicken or avocado.",
          "ingredients": "Gelbe Kartoffeln, Ají amarillo, Limette, Füllung aus Thunfisch oder Hähnchen, Avocado, Mayonnaise",
          "ingredientsEn": "Yellow potatoes, ají amarillo, lime, filling of tuna or chicken, avocado, mayonnaise",
          "origin": "Die Causa stammt aus Lima und hat ihren Ursprung vermutlich in der Zeit des Unabhängigkeitskriegs.",
          "originEn": "Causa comes from Lima and probably originated around the time of the war of independence.",
          "occasions": "Wird als kalte Vorspeise oder leichtes Gericht gegessen.",
          "occasionsEn": "Eaten as a cold starter or a light dish.",
          "order": "Una causa limeña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Causa_Rellena.jpg/960px-Causa_Rellena.jpg"
        },
        {
          "name": "Anticuchos",
          "desc": "Gegrillte Spieße, klassisch aus mariniertem Rinderherz.",
          "descEn": "Grilled skewers, classically of marinated beef heart.",
          "long": "Gegrillte Fleischspieße, die traditionell aus mariniertem Rinderherz bestehen und über Holzkohle gebraten werden. Sie sind ein beliebter Straßensnack und werden mit Kartoffeln und Maiskolben serviert.",
          "longEn": "Grilled meat skewers, traditionally of marinated beef heart, cooked over charcoal. They're a popular street snack and are served with potatoes and corn on the cob.",
          "ingredients": "Rinderherz, Ají panca, Knoblauch, Essig, Kreuzkümmel, dazu Kartoffeln und Choclo",
          "ingredientsEn": "Beef heart, ají panca, garlic, vinegar, cumin, plus potatoes and choclo",
          "origin": "Anticuchos haben afrikanisch-peruanische Wurzeln und gehen auf die Kolonialzeit zurück.",
          "originEn": "Anticuchos have Afro-Peruvian roots and date back to colonial times.",
          "occasions": "Werden abends als Straßensnack und bei Festen gegessen.",
          "occasionsEn": "Eaten in the evening as a street snack and at festivals.",
          "order": "Unos anticuchos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Anticuchos_de_la_Tia_Grima.jpg/960px-Anticuchos_de_la_Tia_Grima.jpg"
        },
        {
          "name": "Cuy",
          "desc": "Gegrilltes oder gebratenes Meerschweinchen, eine Andendelikatesse.",
          "descEn": "Grilled or fried guinea pig, an Andean delicacy.",
          "long": "Cuy ist geröstetes oder frittiertes Meerschweinchen und gilt im peruanischen Andenhochland als traditionelle Delikatesse. Es wird im Ganzen serviert, oft mit Kartoffeln und scharfer Sauce.",
          "longEn": "Cuy is roasted or fried guinea pig and is considered a traditional delicacy in the Peruvian Andean highlands. It's served whole, often with potatoes and a spicy sauce.",
          "ingredients": "Meerschweinchen, Knoblauch, Kreuzkümmel, Huacatay-Kraut, Kartoffeln",
          "ingredientsEn": "Guinea pig, garlic, cumin, huacatay herb, potatoes",
          "origin": "Cuy wird in den peruanischen Anden seit vorkolumbianischer Zeit gegessen und ist Teil der Festkultur.",
          "originEn": "Cuy has been eaten in the Peruvian Andes since pre-Columbian times and is part of festive culture.",
          "occasions": "Wird vor allem bei Festen und besonderen Anlässen gegessen.",
          "occasionsEn": "Eaten above all at festivals and special occasions.",
          "order": "Un cuy chactado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Caviaklein.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pisco Sour",
          "desc": "Cocktail aus Pisco, Limette, Eiweiß und Zuckersirup, der Nationalcocktail.",
          "descEn": "A cocktail of pisco, lime, egg white and sugar syrup, the national cocktail.",
          "long": "Der berühmteste Cocktail Perus aus dem Traubenbrand Pisco, Limette, Zuckersirup, Eiweiß und einem Spritzer Angostura. Er schmeckt frisch-säuerlich mit schaumiger Krone und gilt als Nationalcocktail.",
          "longEn": "Peru's most famous cocktail, made from the grape spirit pisco, lime, sugar syrup, egg white and a dash of Angostura. It tastes fresh and tart with a frothy crown and is regarded as the national cocktail.",
          "ingredients": "Pisco, Limette, Zuckersirup, Eiweiß, Angostura-Bitter, Eis",
          "ingredientsEn": "Pisco, lime, sugar syrup, egg white, Angostura bitters, ice",
          "origin": "Der Pisco Sour wurde Anfang des 20. Jahrhunderts in Lima erfunden, wobei Peru und Chile über die Herkunft des Pisco streiten.",
          "originEn": "The Pisco Sour was invented in Lima in the early 20th century, with Peru and Chile disputing the origin of pisco.",
          "occasions": "Wird als Aperitif, abends und zu Feiern getrunken.",
          "occasionsEn": "Drunk as an aperitif, in the evening and at celebrations.",
          "order": "Un pisco sour, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pisco_sour_20100613b.JPG/960px-Pisco_sour_20100613b.JPG"
        },
        {
          "name": "Inca Kola",
          "desc": "Knallgelbe, sehr süße Kultlimonade mit Kaugummigeschmack.",
          "descEn": "A bright-yellow, very sweet cult soft drink with a bubblegum flavour.",
          "long": "Eine knallgelbe Limonade mit süßem Kaugummi-Geschmack, die in Peru beliebter ist als Cola. Sie gilt als nationales Kultgetränk und wird zu fast jeder Mahlzeit getrunken.",
          "longEn": "A bright-yellow soft drink with a sweet bubblegum flavour that's more popular than cola in Peru. It's considered a national cult drink and is drunk with almost every meal.",
          "ingredients": "Wasser, Zucker, Kohlensäure, Zitronenverbenen-Aroma (Hierbaluisa)",
          "ingredientsEn": "Water, sugar, carbonation, lemon-verbena flavouring (hierbaluisa)",
          "origin": "Inca Kola wurde 1935 in Lima entwickelt und ist seither ein Symbol nationalen Stolzes.",
          "originEn": "Inca Kola was developed in Lima in 1935 and has been a symbol of national pride ever since.",
          "occasions": "Wird zu Mahlzeiten und als alltägliche Erfrischung getrunken.",
          "occasionsEn": "Drunk with meals and as an everyday refresher.",
          "order": "Una Inca Kola, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/IncaKolaBottleGlass.jpg/960px-IncaKolaBottleGlass.jpg"
        },
        {
          "name": "Chicha morada",
          "desc": "Süßes, alkoholfreies Getränk aus violettem Mais mit Gewürzen.",
          "descEn": "A sweet, non-alcoholic drink of purple corn with spices.",
          "long": "Ein alkoholfreies, tiefviolettes Getränk aus violettem Mais, das mit Ananas, Limette und Gewürzen gekocht wird. Es schmeckt fruchtig-süß und wird kalt zu vielen Mahlzeiten serviert.",
          "longEn": "A non-alcoholic, deep-purple drink of purple corn, cooked with pineapple, lime and spices. It tastes fruity and sweet and is served cold with many meals.",
          "ingredients": "Violetter Mais (maíz morado), Ananas, Limette, Zimt, Nelken, Zucker",
          "ingredientsEn": "Purple corn (maíz morado), pineapple, lime, cinnamon, cloves, sugar",
          "origin": "Die Chicha morada hat vorkolumbianische Wurzeln und ist in ganz Peru verbreitet.",
          "originEn": "Chicha morada has pre-Columbian roots and is found all over Peru.",
          "occasions": "Wird zu Mahlzeiten und als erfrischendes Alltagsgetränk getrunken.",
          "occasionsEn": "Drunk with meals and as a refreshing everyday drink.",
          "order": "Una chicha morada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chicha_Morada_2017.jpg/960px-Chicha_Morada_2017.jpg"
        },
        {
          "name": "Chicha de jora",
          "desc": "Traditionelles, leicht alkoholisches Getränk aus fermentiertem Mais.",
          "descEn": "A traditional, mildly alcoholic drink made from fermented corn.",
          "long": "Ein leicht alkoholisches, fermentiertes Getränk aus gekeimtem Mais mit langer Tradition. Es schmeckt herb-säuerlich und wird oft in einfachen, mit roter Fahne markierten Lokalen (Chicherías) ausgeschenkt.",
          "longEn": "A mildly alcoholic, fermented drink of sprouted corn with a long tradition. It tastes dry and tart and is often served in simple eateries (chicherías) marked with a red flag.",
          "ingredients": "Gekeimter Mais (Jora), Wasser, Zucker, natürliche Fermentation",
          "ingredientsEn": "Sprouted corn (jora), water, sugar, natural fermentation",
          "origin": "Die Chicha de jora war schon im Inkareich ein bedeutendes zeremonielles Getränk.",
          "originEn": "Chicha de jora was already an important ceremonial drink in the Inca Empire.",
          "occasions": "Wird in traditionellen Chicherías und bei ländlichen Festen getrunken.",
          "occasionsEn": "Drunk in traditional chicherías and at rural festivals.",
          "order": "Una chicha de jora, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Chicha_de_jora_en_vaso.JPG/960px-Chicha_de_jora_en_vaso.JPG"
        }
      ],
      "tip": "Plane in Cusco (3.400 m) ein bis zwei Tage zur Höhenanpassung ein und trinke Mate de Coca gegen die Höhenkrankheit.",
      "tipEn": "In Cusco (3,400 m), allow a day or two to acclimatise to the altitude and drink mate de coca to fend off altitude sickness."
    },
    {
      "id": "bolivia",
      "sports": {
        "intro": "Fußball ist der beliebteste Sport, und in La Paz spielt die Nationalelf auf über 3.600 m Höhe – ein gefürchteter Heimvorteil. Überraschend stark ist Bolivien im Racquetball, wo es zur Weltspitze zählt.",
        "introEn": "Football is the most popular sport, and in La Paz the national team plays at over 3,600 m altitude – a feared home advantage. Surprisingly, Bolivia is a world power in racquetball.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1; das Höhenstadion von La Paz ist berüchtigt.", "noteEn": "The number-one sport; the high-altitude stadium in La Paz is notorious." },
          { "name": "Racquetball", "nameEn": "Racquetball", "note": "Boliviens international erfolgreichste Sportart.", "noteEn": "Bolivia's most internationally successful sport." }
        ],
        "athletes": [
          { "name": "Marco Etcheverry", "sport": "Fußball", "sportEn": "Football", "note": "Größter Fußballstar des Landes, Idol in der US-Liga MLS.", "noteEn": "The country's greatest football star and an idol in the US league MLS." },
          { "name": "Conrrado Moscoso", "sport": "Racquetball", "sportEn": "Racquetball", "note": "Wurde Racquetball-Weltmeister und ist bolivianischer Sportheld.", "noteEn": "Became racquetball world champion and is a Bolivian sporting hero." }
        ]
      },
      "name": "Bolivien",
      "flag": "🇧🇴",
      "region": "Südamerika",
      "capital": "Sucre (konstitutionell), La Paz (Regierungssitz)",
      "tagline": "Anden, Altiplano und der größte Salzsee der Welt",
      "taglineEn": "The Andes, the Altiplano and the world's largest salt flat",
      "population": "Rund 12,4 Millionen Einwohner (2025).",
      "populationEn": "Around 12.4 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 26 Jahren und hohem indigenen Anteil.",
      "ageStructureEn": "A young population with a median age of about 26 and a high indigenous share.",
      "government": "Plurinationale präsidentielle Republik mit zwei Hauptstädten (Sucre und La Paz); 2025 endete nach fast 20 Jahren die Regierung der sozialistischen MAS.",
      "governmentEn": "A plurinational presidential republic with two capitals (Sucre and La Paz); in 2025 nearly 20 years of socialist MAS government came to an end.",
      "economy": "Eine der ärmsten Volkswirtschaften Südamerikas, stark von Rohstoffen abhängig.",
      "economyEn": "One of the poorest economies in South America, heavily dependent on commodities.",
      "livelihood": "Erdgas, Bergbau (Zinn, Silber, Lithium), Landwirtschaft (Soja, Quinoa) und Coca.",
      "livelihoodEn": "Natural gas, mining (tin, silver, lithium), agriculture (soya, quinoa) and coca.",
      "about": "Bolivien ist ein Binnenstaat im Herzen der Anden mit enormer Höhenlage: La Paz liegt auf rund 3.600 m, El Alto noch höher. Backpacker-Highlights sind der Salar de Uyuni, der Titicacasee und die Todesstraße bei La Paz. Das Land gehört zu den günstigsten Reisezielen Südamerikas.",
      "aboutEn": "Bolivia is a landlocked country in the heart of the Andes at staggering altitude: La Paz sits at around 3,600 m, and El Alto higher still. Backpacker highlights include the Salar de Uyuni, Lake Titicaca and the Death Road near La Paz. It's one of the cheapest destinations in South America.",
      "history": "Vor der Kolonialzeit war das Hochland Teil des Inkareichs, davor blühte die Tiwanaku-Kultur am Titicacasee. Ab dem 16. Jahrhundert beuteten die Spanier die Silberminen von Potosí aus, die den Kolonialreichtum trugen. 1825 wurde Bolivien unabhängig und nach Simón Bolívar benannt. Heute hat das Land einen der höchsten indigenen Bevölkerungsanteile Südamerikas und versteht sich als plurinationaler Staat.",
      "historyEn": "Before colonial times, the highlands were part of the Inca Empire, and before that the Tiwanaku culture flourished by Lake Titicaca. From the 16th century the Spanish exploited the silver mines of Potosí, which underpinned colonial wealth. In 1825 Bolivia became independent and was named after Simón Bolívar. Today the country has one of the highest proportions of indigenous people in South America and sees itself as a plurinational state.",
      "language": "Gesprochen wird ein andines Spanisch, das relativ klar und langsam klingt und für Lernende gut verständlich ist. Neben Spanisch sind Quechua und Aymara offizielle Sprachen und im Hochland weit verbreitet. Viele Alltagswörter stammen aus dem Quechua/Aymara, etwa 'wawa' (Baby/Kind). Das Voseo ist hier kaum verbreitet, man nutzt überwiegend 'tú'.",
      "languageEn": "People here speak an Andean Spanish that sounds relatively clear and slow and is easy for learners to follow. Alongside Spanish, Quechua and Aymara are official languages and widely spoken in the highlands. Many everyday words come from Quechua/Aymara, such as 'wawa' (baby/child). Voseo is barely used here; people mostly use 'tú'.",
      "words": [
        {
          "es": "wawa",
          "de": "Baby/Kleinkind (aus Quechua/Aymara)",
          "en": "baby/toddler (from Quechua/Aymara)"
        },
        {
          "es": "chango/a",
          "de": "Junge/Mädchen, junger Mensch",
          "en": "boy/girl, young person"
        },
        {
          "es": "¡qué macana!",
          "de": "wie ärgerlich! / so ein Mist!",
          "en": "how annoying! / what a pain!"
        },
        {
          "es": "cholita",
          "de": "indigene Frau in traditioneller Tracht",
          "en": "indigenous woman in traditional dress"
        },
        {
          "es": "yapa",
          "de": "kostenlose Zugabe beim Einkauf",
          "en": "a free extra thrown in when you buy something"
        },
        {
          "es": "ch'aki",
          "de": "Kater (nach Alkohol, aus Quechua)",
          "en": "hangover (from Quechua)"
        }
      ],
      "food": [
        {
          "name": "Salteña",
          "desc": "Saftige gefüllte Teigtasche mit Fleisch, Ei und Brühe, typischer Vormittagssnack.",
          "descEn": "A juicy stuffed pasty with meat, egg and broth, the typical mid-morning snack.",
          "long": "Die Salteña ist eine gebackene Teigtasche mit einer saftigen, leicht süßlich-würzigen Füllung, die fast wie ein Eintopf im Teigmantel schmeckt. Sie wird typischerweise am Vormittag als Snack gegessen und ist innen so saftig, dass man sie geschickt halten muss, um die Brühe nicht zu verlieren.",
          "longEn": "The salteña is a baked pasty with a juicy, slightly sweet-and-spicy filling that almost tastes like a stew in a pastry case. It's typically eaten in the morning as a snack and is so juicy inside that you have to hold it cleverly to keep from losing the broth.",
          "ingredients": "Weizenmehlteig, Rind- oder Hühnerfleisch, Kartoffeln, Erbsen, Oliven, hartgekochtes Ei, würzige Brühe",
          "ingredientsEn": "Wheat-flour dough, beef or chicken, potatoes, peas, olives, hard-boiled egg, spicy broth",
          "origin": "Die Salteña wird mit aus dem argentinischen Salta zugewanderten Familien im 19. Jahrhundert in Verbindung gebracht und gilt heute als bolivianisches Nationalgebäck.",
          "originEn": "The salteña is associated with families who migrated from Salta in Argentina in the 19th century and is today regarded as Bolivia's national pastry.",
          "occasions": "Sie wird klassisch als Vormittagssnack zwischen Frühstück und Mittagessen gegessen.",
          "occasionsEn": "Classically eaten as a mid-morning snack between breakfast and lunch.",
          "order": "Una salteña de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Salte%C3%B1as_%28Plaza_Mayor%29-2011.JPG/960px-Salte%C3%B1as_%28Plaza_Mayor%29-2011.JPG"
        },
        {
          "name": "Pique a lo macho",
          "desc": "Deftiger Teller aus Rindfleisch, Würstchen, Pommes, Zwiebeln und scharfer Soße.",
          "descEn": "A hearty plate of beef, sausages, chips, onions and a spicy sauce.",
          "long": "Pique a lo macho ist ein deftiges Gericht aus klein geschnittenem Rindfleisch und Würstchen auf einem Berg Pommes frites. Es wird mit Zwiebeln, Tomaten und scharfen Locoto-Schoten getoppt und ist als üppige Portion zum Teilen gedacht.",
          "longEn": "Pique a lo macho is a hearty dish of chopped beef and sausages on a mound of chips. It's topped with onions, tomatoes and hot locoto peppers and is meant as a generous portion to share.",
          "ingredients": "Rindfleisch, Würstchen, Pommes frites, Zwiebeln, Tomaten, Locoto (Chili), hartgekochtes Ei",
          "ingredientsEn": "Beef, sausages, chips, onions, tomatoes, locoto (chilli), hard-boiled egg",
          "origin": "Das Gericht entstand in der Region Cochabamba und gilt als moderne bolivianische Spezialität.",
          "originEn": "The dish arose in the Cochabamba region and is considered a modern Bolivian speciality.",
          "occasions": "Es wird gern beim gemeinsamen Mittag- oder Abendessen sowie bei geselligen Anlässen geteilt.",
          "occasionsEn": "Happily shared over lunch or dinner together and at social occasions.",
          "order": "Un pique a lo macho para compartir, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Pique_Macho_cochabanbino.jpg/960px-Pique_Macho_cochabanbino.jpg"
        },
        {
          "name": "Silpancho",
          "desc": "Dünn geklopftes paniertes Fleisch auf Reis und Kartoffeln, mit Spiegelei.",
          "descEn": "Thinly pounded breaded meat on rice and potatoes, with a fried egg.",
          "long": "Silpancho besteht aus einem dünn geklopften, panierten Schnitzel, das auf Reis und Kartoffeln serviert wird. Obenauf liegen ein Spiegelei sowie ein frischer Salat aus Tomaten und Zwiebeln, was es zu einer sehr sättigenden Mahlzeit macht.",
          "longEn": "Silpancho consists of a thinly pounded, breaded escalope served on rice and potatoes. On top sit a fried egg and a fresh salad of tomatoes and onions, making it a very filling meal.",
          "ingredients": "Dünn geklopftes Rindfleisch, Semmelbrösel, Reis, Kartoffeln, Spiegelei, Tomaten, Zwiebeln",
          "ingredientsEn": "Thinly pounded beef, breadcrumbs, rice, potatoes, fried egg, tomatoes, onions",
          "origin": "Silpancho stammt ebenfalls aus Cochabamba und ist dort ein klassisches Alltagsgericht.",
          "originEn": "Silpancho also comes from Cochabamba, where it is a classic everyday dish.",
          "occasions": "Es wird vor allem als kräftiges Mittagessen gegessen.",
          "occasionsEn": "Eaten above all as a hearty lunch.",
          "order": "Un silpancho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Silpancho_cochalo.jpg/960px-Silpancho_cochalo.jpg"
        },
        {
          "name": "Sopa de maní",
          "desc": "Cremige Erdnusssuppe mit Fleisch und Kartoffeln, ein Klassiker.",
          "descEn": "A creamy peanut soup with meat and potatoes, a classic.",
          "long": "Sopa de maní ist eine cremige Erdnusssuppe, die zu den bekanntesten Suppen Boliviens zählt. Sie wird aus gemahlenen Erdnüssen mit Fleisch und Gemüse gekocht und traditionell mit knusprigen Pommes frites garniert.",
          "longEn": "Sopa de maní is a creamy peanut soup that's one of Bolivia's best-known soups. It's cooked from ground peanuts with meat and vegetables and traditionally garnished with crispy chips.",
          "ingredients": "Erdnüsse, Rindfleisch, Kartoffeln, Karotten, Erbsen, Pommes frites als Garnitur",
          "ingredientsEn": "Peanuts, beef, potatoes, carrots, peas, chips as a garnish",
          "origin": "Die Suppe ist ein traditionelles Gericht der bolivianischen Anden- und Talregionen.",
          "originEn": "The soup is a traditional dish of the Bolivian Andean and valley regions.",
          "occasions": "Sie wird typischerweise als wärmender erster Gang zum Mittagessen serviert.",
          "occasionsEn": "Typically served as a warming first course at lunch.",
          "order": "Un plato de sopa de maní, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Sopa_de_man%C3%AD_cochabambino%2C_Bolivia.jpg/960px-Sopa_de_man%C3%AD_cochabambino%2C_Bolivia.jpg"
        },
        {
          "name": "Anticuchos",
          "desc": "Gegrillte Rinderherz-Spieße, beliebtes Streetfood am Abend.",
          "descEn": "Grilled beef-heart skewers, a popular evening street food.",
          "long": "Anticuchos sind gegrillte Fleischspieße, die in Bolivien klassisch aus Rinderherz zubereitet werden. Sie werden über Holzkohle gegrillt und meist mit einer Kartoffel und scharfer Erdnusssauce als Straßenessen am Abend angeboten.",
          "longEn": "Anticuchos are grilled meat skewers, classically made in Bolivia from beef heart. They're grilled over charcoal and usually offered with a potato and spicy peanut sauce as an evening street food.",
          "ingredients": "Rinderherz, Knoblauch, Kreuzkümmel, Essig, Kartoffeln, scharfe Erdnusssauce",
          "ingredientsEn": "Beef heart, garlic, cumin, vinegar, potatoes, spicy peanut sauce",
          "origin": "Anticuchos haben ihre Wurzeln in der Andenregion und sind in mehreren südamerikanischen Ländern verbreitet.",
          "originEn": "Anticuchos have their roots in the Andean region and are common in several South American countries.",
          "occasions": "Sie werden vor allem abends als Straßenimbiss gegessen.",
          "occasionsEn": "Eaten above all in the evening as a street snack.",
          "order": "Dos anticuchos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Anticuchos_de_la_Tia_Grima.jpg/960px-Anticuchos_de_la_Tia_Grima.jpg"
        },
        {
          "name": "Api con pastel",
          "desc": "Warmes Getränk aus lila Mais mit frittiertem Käsegebäck zum Frühstück.",
          "descEn": "A warm drink of purple corn with fried cheese pastry for breakfast.",
          "long": "Api con pastel kombiniert ein warmes, dickflüssiges Getränk aus violettem Mais mit einem frittierten, mit Puderzucker bestäubten Teiggebäck. Die Kombination aus süßem, würzigem Getränk und knusprigem Pastel ist ein typisches Frühstück in den kalten Höhenlagen.",
          "longEn": "Api con pastel combines a warm, thick drink of purple corn with a fried pastry dusted with icing sugar. The combination of the sweet, spiced drink and the crisp pastel is a typical breakfast in the cold highlands.",
          "ingredients": "Violetter Mais (api morado), Zimt, Nelken, Zucker, frittierter Teig (pastel)",
          "ingredientsEn": "Purple corn (api morado), cinnamon, cloves, sugar, fried pastry (pastel)",
          "origin": "Api ist ein Getränk mit Wurzeln in der präkolumbischen Andenkultur und wird traditionell mit Pastel kombiniert.",
          "originEn": "Api is a drink with roots in pre-Columbian Andean culture and is traditionally combined with pastel.",
          "occasions": "Es wird vor allem als warmes Frühstück oder an kühlen Morgen gegessen.",
          "occasionsEn": "Eaten above all as a warm breakfast or on cold mornings.",
          "order": "Un api con pastel, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Api_con_cachangas%2C_Per%C3%BA.webp/960px-Api_con_cachangas%2C_Per%C3%BA.webp.png"
        }
      ],
      "drink": [
        {
          "name": "Singani",
          "desc": "Bolivianischer Traubenbranntwein, das Nationaldestillat, oft als 'Chuflay' mit Ginger Ale.",
          "descEn": "A Bolivian grape brandy, the national spirit, often served as a 'Chuflay' with ginger ale.",
          "long": "Singani ist ein bolivianischer Weinbrand, der aus Muskat-Trauben destilliert wird. Er gilt als Nationalspirituose Boliviens und wird pur oder als Basis für Cocktails wie den Chuflay getrunken.",
          "longEn": "Singani is a Bolivian grape brandy distilled from Muscat grapes. It's regarded as Bolivia's national spirit and is drunk neat or as the base for cocktails like the Chuflay.",
          "ingredients": "Destillat aus Muskat-Trauben (Moscatel de Alejandría)",
          "ingredientsEn": "Distillate of Muscat grapes (Moscatel de Alejandría)",
          "origin": "Singani wird seit der Kolonialzeit in den Höhenlagen rund um Tarija hergestellt.",
          "originEn": "Singani has been made in the highlands around Tarija since colonial times.",
          "occasions": "Er wird zu Feiern und geselligen Anlässen pur oder als Cocktail getrunken.",
          "occasionsEn": "Drunk neat or as a cocktail at celebrations and social occasions.",
          "order": "Un singani, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Singani_major_brands.png/960px-Singani_major_brands.png"
        },
        {
          "name": "Chicha",
          "desc": "Vergorenes Maisgetränk mit langer indigener Tradition, leicht alkoholisch.",
          "descEn": "A fermented corn drink with a long indigenous tradition, mildly alcoholic.",
          "long": "Chicha ist ein traditionelles, meist leicht vergorenes Getränk auf Maisbasis. Die bekannte bolivianische Variante Chicha de maíz hat einen säuerlichen Geschmack und wird besonders in der Region Cochabamba in einfachen Lokalen, den Chicherías, ausgeschenkt.",
          "longEn": "Chicha is a traditional, usually lightly fermented corn-based drink. The well-known Bolivian version, chicha de maíz, has a tart flavour and is served especially in the Cochabamba region in simple eateries, the chicherías.",
          "ingredients": "Mais, Wasser, Zucker (je nach Variante vergoren)",
          "ingredientsEn": "Corn, water, sugar (fermented in some versions)",
          "origin": "Chicha ist ein uraltes Getränk der Andenkulturen und geht auf präkolumbische Zeiten zurück.",
          "originEn": "Chicha is an ancient drink of the Andean cultures and dates back to pre-Columbian times.",
          "occasions": "Sie wird bei lokalen Festen und in geselliger Runde getrunken.",
          "occasionsEn": "Drunk at local festivals and in good company.",
          "order": "Un vaso de chicha, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Mate de coca",
          "desc": "Tee aus Kokablättern, hilft gegen Höhenkrankheit (soroche).",
          "descEn": "A tea made from coca leaves, helps with altitude sickness (soroche).",
          "long": "Mate de coca ist ein Aufguss aus getrockneten Kokablättern, der in den Anden alltäglich getrunken wird. Er gilt als hilfreich gegen die Höhenkrankheit und wirkt leicht anregend, ähnlich wie eine milde Tasse Tee.",
          "longEn": "Mate de coca is an infusion of dried coca leaves, drunk every day in the Andes. It's considered helpful against altitude sickness and is mildly stimulating, rather like a gentle cup of tea.",
          "ingredients": "Getrocknete Kokablätter, heißes Wasser",
          "ingredientsEn": "Dried coca leaves, hot water",
          "origin": "Das Getränk hat eine lange Tradition in den Andenregionen Boliviens und der Nachbarländer.",
          "originEn": "The drink has a long tradition in the Andean regions of Bolivia and its neighbouring countries.",
          "occasions": "Es wird oft morgens oder bei Höhenbeschwerden in großen Höhenlagen getrunken.",
          "occasionsEn": "Often drunk in the morning or for altitude troubles at high elevations.",
          "order": "Un mate de coca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Mate_de_coca_boliviano.jpg/960px-Mate_de_coca_boliviano.jpg"
        },
        {
          "name": "Paceña",
          "desc": "Bekannteste bolivianische Biermarke, benannt nach La Paz.",
          "descEn": "The best-known Bolivian beer brand, named after La Paz.",
          "long": "Paceña ist eine der bekanntesten Biermarken Boliviens und ein helles Lagerbier. Es wird landesweit getrunken und ist besonders mit der Stadt La Paz verbunden, von der sich auch der Name ableitet.",
          "longEn": "Paceña is one of Bolivia's best-known beer brands and a pale lager. It's drunk nationwide and is especially associated with the city of La Paz, from which its name also derives.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Die Marke Paceña stammt aus La Paz und ist eine der traditionsreichsten Brauereien Boliviens.",
          "originEn": "The Paceña brand comes from La Paz and is one of Bolivia's most long-established breweries.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "occasionsEn": "Drunk with meals and at social occasions.",
          "order": "Una Paceña bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Logo_Pacena_blanco-01.jpg/960px-Logo_Pacena_blanco-01.jpg"
        }
      ],
      "tip": "Plane bei Ankunft in La Paz oder Uyuni ein bis zwei ruhige Tage zur Höhenanpassung ein und trinke Coca-Tee gegen die Höhenkrankheit.",
      "tipEn": "When you arrive in La Paz or Uyuni, allow a quiet day or two to acclimatise to the altitude and drink coca tea to fend off altitude sickness."
    },
    {
      "id": "chile",
      "sports": {
        "intro": "Fußball ist die große Leidenschaft – die ‚Roja' gewann 2015 und 2016 die Copa América. Auch Tennis hat Chile große Erfolge und sogar Olympiagold beschert.",
        "introEn": "Football is the great passion – the ‘Roja' won the Copa América in 2015 and 2016. Tennis has also brought Chile great success and even Olympic gold.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1; Erzrivalen sind Colo-Colo und Universidad de Chile.", "noteEn": "The number-one sport; the arch-rivals are Colo-Colo and Universidad de Chile." },
          { "name": "Tennis", "nameEn": "Tennis", "note": "Beliebt und international erfolgreich.", "noteEn": "Popular and internationally successful." }
        ],
        "athletes": [
          { "name": "Alexis Sánchez", "sport": "Fußball", "sportEn": "Football", "note": "Rekordtorschütze der Nationalmannschaft, spielte für Arsenal und Inter.", "noteEn": "Record scorer for the national team, who played for Arsenal and Inter." },
          { "name": "Marcelo Ríos", "sport": "Tennis", "sportEn": "Tennis", "note": "Erster Lateinamerikaner auf Platz 1 der Tennis-Weltrangliste.", "noteEn": "The first Latin American to reach number one in the tennis rankings." },
          { "name": "Nicolás Massú", "sport": "Tennis", "sportEn": "Tennis", "note": "Gewann 2004 zweimal Olympiagold an einem einzigen Tag.", "noteEn": "Won two Olympic golds on a single day in 2004." }
        ]
      },
      "name": "Chile",
      "flag": "🇨🇱",
      "region": "Südamerika",
      "capital": "Santiago de Chile",
      "tagline": "Vom Wüstenhimmel der Atacama bis zu Patagoniens Gletschern",
      "taglineEn": "From the desert skies of the Atacama to Patagonia's glaciers",
      "population": "Etwa 19,6 Millionen Einwohner (2025).",
      "populationEn": "About 19.6 million inhabitants (2025).",
      "ageStructure": "Alternde Gesellschaft mit einem Medianalter von rund 37 Jahren und hoher Lebenserwartung.",
      "ageStructureEn": "An ageing society with a median age of around 37 and high life expectancy.",
      "government": "Stabile präsidentielle Demokratie mit friedlichen Machtwechseln; 2022 wählte das Land mit Gabriel Boric einen der jüngsten Präsidenten der Welt.",
      "governmentEn": "A stable presidential democracy with peaceful transfers of power; in 2022 it elected Gabriel Boric, one of the world's youngest presidents.",
      "economy": "Eine der wohlhabendsten und offensten Volkswirtschaften Lateinamerikas.",
      "economyEn": "One of the wealthiest and most open economies in Latin America.",
      "livelihood": "Kupfer (weltgrößter Produzent) und Lithium, Wein, Obst, Lachs und Forstwirtschaft.",
      "livelihoodEn": "Copper (the world's largest producer) and lithium, wine, fruit, salmon and forestry.",
      "about": "Chile ist ein extrem langes, schmales Land, das sich über mehr als 4.000 km entlang des Pazifiks erstreckt. Es reicht von der Atacama-Wüste im Norden über das zentrale Weinland bis zu den Fjorden und Bergen Patagoniens. Highlights für Backpacker sind die Sternenhimmel der Atacama, der Nationalpark Torres del Paine und die Osterinsel.",
      "aboutEn": "Chile is an extremely long, narrow country stretching over more than 4,000 km along the Pacific. It ranges from the Atacama Desert in the north through the central wine country to the fjords and mountains of Patagonia. Highlights for backpackers are the starry skies of the Atacama, Torres del Paine National Park and Easter Island.",
      "history": "Vor der Kolonialzeit lebten im Süden die Mapuche, die der spanischen Eroberung lange erfolgreich Widerstand leisteten. Ab 1541 gründeten die Spanier Santiago, 1818 erlangte Chile seine Unabhängigkeit. Das 20. Jahrhundert war geprägt vom Sturz Salvador Allendes 1973 und der Militärdiktatur unter Pinochet bis 1990. Heute gilt Chile als eines der wirtschaftlich stabilsten Länder der Region.",
      "historyEn": "Before colonial times, the Mapuche lived in the south, long resisting the Spanish conquest successfully. From 1541 the Spanish founded Santiago, and in 1818 Chile gained its independence. The 20th century was marked by the overthrow of Salvador Allende in 1973 and the military dictatorship under Pinochet until 1990. Today Chile is considered one of the most economically stable countries in the region.",
      "language": "Chilenisches Spanisch gilt als eines der schwierigsten Lateinamerikas: sehr schnell, mit verschluckten Endsilben und vielen Slang-Ausdrücken (Chilenismos). Endungen auf '-ado' werden oft zu '-ao' (z.B. 'cansao' statt 'cansado'). Verbreitet ist ein eigenes Voseo in der Verbform ('¿cachái?' statt '¿cachas?'). Im Süden gibt es Mapudungun-Einflüsse, viele Ortsnamen stammen aus dem Mapuche.",
      "languageEn": "Chilean Spanish is considered one of the hardest in Latin America: very fast, with swallowed final syllables and lots of slang (chilenismos). Endings in '-ado' often become '-ao' (e.g. 'cansao' instead of 'cansado'). A distinctive voseo verb form is common ('¿cachái?' instead of '¿cachas?'). In the south there are Mapudungun influences, and many place names come from Mapuche.",
      "words": [
        {
          "es": "cachái",
          "de": "kapierst du? / verstehst du?",
          "en": "get it? / understand?"
        },
        {
          "es": "weón/huevón",
          "de": "Alter/Typ (Anrede unter Freunden, je nach Ton)",
          "en": "mate/bloke (used among friends, depending on tone)"
        },
        {
          "es": "bacán",
          "de": "super, cool, klasse",
          "en": "great, cool, brilliant"
        },
        {
          "es": "po",
          "de": "Füllwort am Satzende (von 'pues')",
          "en": "filler word at the end of a sentence (from 'pues')"
        },
        {
          "es": "la raja",
          "de": "großartig, spitze (umgangssprachlich)",
          "en": "great, top-notch (colloquial)"
        },
        {
          "es": "fome",
          "de": "langweilig, öde",
          "en": "boring, dull"
        }
      ],
      "food": [
        {
          "name": "Empanada de pino",
          "desc": "Gebackene Teigtasche gefüllt mit Hackfleisch, Zwiebel, Ei und Olive.",
          "descEn": "A baked pasty filled with mince, onion, egg and olive.",
          "long": "Die Empanada de pino ist die klassische chilenische Empanada, gefüllt mit einer würzigen Hackfleisch-Zwiebel-Mischung. Sie enthält außerdem Ei, Oliven und Rosinen und wird meist im Ofen gebacken.",
          "longEn": "The empanada de pino is the classic Chilean empanada, filled with a spicy mince-and-onion mixture. It also contains egg, olives and raisins and is usually baked in the oven.",
          "ingredients": "Weizenteig, Rinderhack, Zwiebeln, hartgekochtes Ei, schwarze Oliven, Rosinen, Kreuzkümmel",
          "ingredientsEn": "Wheat dough, minced beef, onions, hard-boiled egg, black olives, raisins, cumin",
          "origin": "Die Empanada hat spanische Wurzeln und ist als Empanada de pino zu einem Symbol der chilenischen Küche geworden.",
          "originEn": "The empanada has Spanish roots and, as the empanada de pino, has become a symbol of Chilean cooking.",
          "occasions": "Sie wird besonders zu den Nationalfeiertagen (Fiestas Patrias) im September und an Festtagen gegessen.",
          "occasionsEn": "Eaten especially for the national holidays (Fiestas Patrias) in September and on feast days.",
          "order": "Una empanada de pino, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Empanada%2C_flaky_pastry_perfection.jpg/960px-Empanada%2C_flaky_pastry_perfection.jpg"
        },
        {
          "name": "Completo",
          "desc": "Chilenischer Hotdog üppig belegt mit Avocado, Tomate und Mayonnaise.",
          "descEn": "A Chilean hot dog piled high with avocado, tomato and mayonnaise.",
          "long": "Der Completo ist ein chilenischer Hot Dog, der deutlich üppiger belegt ist als sein US-Vorbild. In der beliebten Variante Completo italiano wird er mit Avocado, Tomaten und Mayonnaise getoppt, deren Farben an die italienische Flagge erinnern.",
          "longEn": "The completo is a Chilean hot dog, topped far more lavishly than its US model. In the popular completo italiano version it's topped with avocado, tomatoes and mayonnaise, whose colours recall the Italian flag.",
          "ingredients": "Würstchen, Hot-Dog-Brötchen, Avocado, Tomaten, Mayonnaise, Sauerkraut (je nach Variante)",
          "ingredientsEn": "Sausage, hot-dog roll, avocado, tomatoes, mayonnaise, sauerkraut (depending on the version)",
          "origin": "Der Completo entstand im 20. Jahrhundert in Chile und entwickelte sich zu einem festen Bestandteil der Snackkultur.",
          "originEn": "The completo arose in 20th-century Chile and became a fixture of snack culture.",
          "occasions": "Er wird als schneller Imbiss zu jeder Tageszeit gegessen.",
          "occasionsEn": "Eaten as a quick bite at any time of day.",
          "order": "Un completo italiano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/El_tremendo_chilen%C3%ADsimo_COMPLETO.JPG/960px-El_tremendo_chilen%C3%ADsimo_COMPLETO.JPG"
        },
        {
          "name": "Pastel de choclo",
          "desc": "Maispüree-Auflauf über einer Fleischfüllung, im Sommer beliebt.",
          "descEn": "A corn-purée bake over a meat filling, popular in summer.",
          "long": "Pastel de choclo ist ein herzhafter Auflauf mit einer Deckschicht aus pürierten jungen Maiskörnern. Darunter verbirgt sich eine Füllung aus Hackfleisch, Huhn, Ei und Oliven, und die Oberfläche wird leicht karamellisiert gebacken.",
          "longEn": "Pastel de choclo is a hearty bake with a top layer of puréed young corn kernels. Beneath it hides a filling of mince, chicken, egg and olives, and the surface is baked lightly caramelised.",
          "ingredients": "Junger Mais (choclo), Rinderhack, Hühnerfleisch, Zwiebeln, hartgekochtes Ei, Oliven, Basilikum",
          "ingredientsEn": "Young corn (choclo), minced beef, chicken, onions, hard-boiled egg, olives, basil",
          "origin": "Das Gericht ist ein traditioneller Sommerauflauf der chilenischen Küche mit indigenen und kolonialen Einflüssen.",
          "originEn": "The dish is a traditional Chilean summer bake with indigenous and colonial influences.",
          "occasions": "Es wird vor allem im Sommer als Hauptgericht zum Mittag- oder Abendessen serviert.",
          "occasionsEn": "Served above all in summer as a main course for lunch or dinner.",
          "order": "Un pastel de choclo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Pastelchoclo.jpg/960px-Pastelchoclo.jpg"
        },
        {
          "name": "Cazuela",
          "desc": "Herzhafter Eintopf mit Fleisch, Kürbis, Mais und Kartoffel.",
          "descEn": "A hearty stew with meat, squash, corn and potato.",
          "long": "Die Cazuela ist ein klassischer chilenischer Eintopf mit einem großen Stück Fleisch in klarer Brühe. Dazu kommen Gemüsestücke wie Kürbis, Mais, Kartoffeln und Reis, was sie zu einem nahrhaften Komplettgericht macht.",
          "longEn": "The cazuela is a classic Chilean stew with a large piece of meat in a clear broth. Added to it are chunks of vegetables like squash, corn, potatoes and rice, making it a nourishing all-in-one dish.",
          "ingredients": "Rind oder Huhn, Kürbis, Maiskolbenstück, Kartoffeln, Reis, Karotten, Kräuter",
          "ingredientsEn": "Beef or chicken, squash, a piece of corn on the cob, potatoes, rice, carrots, herbs",
          "origin": "Die Cazuela ist ein traditionelles Eintopfgericht mit kolonialen Wurzeln, das in ganz Chile verbreitet ist.",
          "originEn": "The cazuela is a traditional stew with colonial roots, found all over Chile.",
          "occasions": "Sie wird typischerweise als wärmendes Mittagessen, besonders in den kälteren Monaten, gegessen.",
          "occasionsEn": "Typically eaten as a warming lunch, especially in the colder months.",
          "order": "Una cazuela de vacuno, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Cazuela_de_pollo_chilena_%282021%29.jpg/960px-Cazuela_de_pollo_chilena_%282021%29.jpg"
        },
        {
          "name": "Curanto",
          "desc": "Auf der Insel Chiloé in einer Erdgrube gegartes Gericht aus Meeresfrüchten und Fleisch.",
          "descEn": "A dish of seafood and meat cooked in an earth pit on the island of Chiloé.",
          "long": "Curanto ist ein üppiges Gericht aus Meeresfrüchten, Fleisch und Kartoffeln von der Insel Chiloé. Traditionell wird es in einer Erdgrube über heißen Steinen gegart, wobei die Zutaten mit großen Blättern bedeckt werden.",
          "longEn": "Curanto is a lavish dish of seafood, meat and potatoes from the island of Chiloé. Traditionally it's cooked in an earth pit over hot stones, with the ingredients covered with large leaves.",
          "ingredients": "Muscheln, andere Meeresfrüchte, Schweinefleisch, Würstchen, Kartoffelfladen (milcao, chapalele), Kartoffeln",
          "ingredientsEn": "Mussels, other seafood, pork, sausages, potato cakes (milcao, chapalele), potatoes",
          "origin": "Curanto stammt von der Insel Chiloé und gehört zu den ältesten Garmethoden in Südchile.",
          "originEn": "Curanto comes from the island of Chiloé and is one of the oldest cooking methods in southern Chile.",
          "occasions": "Es wird bei besonderen Anlässen und geselligen Zusammenkünften in größeren Runden zubereitet.",
          "occasionsEn": "Prepared for special occasions and social gatherings in larger groups.",
          "order": "Quiero probar el curanto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Curanto_Chilote_-_Flickr_-_Renzo_Disi.jpg/960px-Curanto_Chilote_-_Flickr_-_Renzo_Disi.jpg"
        },
        {
          "name": "Chorrillana",
          "desc": "Berg aus Pommes mit Fleisch, Zwiebeln und Spiegeleiern zum Teilen.",
          "descEn": "A mountain of chips with meat, onions and fried eggs, made for sharing.",
          "long": "Chorrillana ist eine große Platte Pommes frites, die mit Fleisch, gebratenen Zwiebeln und Spiegeleiern bedeckt ist. Sie ist als reichliche Portion zum Teilen gedacht und besonders in Valparaíso beliebt.",
          "longEn": "Chorrillana is a large platter of chips topped with meat, fried onions and fried eggs. It's meant as a generous portion to share and is especially popular in Valparaíso.",
          "ingredients": "Pommes frites, Rindfleisch, Zwiebeln, Spiegeleier, Würstchen (je nach Variante)",
          "ingredientsEn": "Chips, beef, onions, fried eggs, sausages (depending on the version)",
          "origin": "Die Chorrillana wird mit der Hafenstadt Valparaíso in Verbindung gebracht und ist ein typisches Gericht zum Teilen.",
          "originEn": "Chorrillana is associated with the port city of Valparaíso and is a typical dish for sharing.",
          "occasions": "Sie wird gern abends in geselliger Runde, oft zu Bier, geteilt.",
          "occasionsEn": "Happily shared in the evening in good company, often with beer.",
          "order": "Una chorrillana para compartir, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Chorrillana.jpg/960px-Chorrillana.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pisco sour",
          "desc": "Cocktail aus Pisco, Zitrone und Zucker, beliebter Aperitif (auch Peru beansprucht ihn).",
          "descEn": "A cocktail of pisco, lemon and sugar, a popular aperitif (Peru claims it too).",
          "long": "Pisco sour ist ein erfrischender Cocktail aus dem Traubenbrand Pisco, kombiniert mit Zitronensaft und Zucker. Die chilenische Variante wird klassisch ohne Eiweiß zubereitet und gehört zu den bekanntesten Drinks des Landes.",
          "longEn": "Pisco sour is a refreshing cocktail of the grape spirit pisco, combined with lemon juice and sugar. The Chilean version is classically made without egg white and is one of the country's best-known drinks.",
          "ingredients": "Pisco, Zitronen- bzw. Limettensaft, Zucker bzw. Zuckersirup, Eis",
          "ingredientsEn": "Pisco, lemon or lime juice, sugar or sugar syrup, ice",
          "origin": "Pisco wird sowohl in Chile als auch in Peru hergestellt, und der Pisco sour zählt in beiden Ländern zu den wichtigsten Cocktails.",
          "originEn": "Pisco is made in both Chile and Peru, and the pisco sour is one of the most important cocktails in both countries.",
          "occasions": "Er wird gern als Aperitif vor dem Essen und bei Feiern getrunken.",
          "occasionsEn": "Happily drunk as an aperitif before the meal and at celebrations.",
          "order": "Un pisco sour, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pisco_sour_20100613b.JPG/960px-Pisco_sour_20100613b.JPG"
        },
        {
          "name": "Terremoto",
          "desc": "Süßer Mix aus Weißwein, Ananaseis und Grenadine, der es in sich hat.",
          "descEn": "A sweet mix of white wine, pineapple ice cream and grenadine that packs a punch.",
          "long": "Der Terremoto (spanisch für 'Erdbeben') ist ein süßer, starker Drink aus jungem Weißwein, der mit Ananaseis serviert wird. Sein Name spielt auf die berauschende Wirkung an, die einen angeblich wie nach einem Erdbeben wanken lässt.",
          "longEn": "The terremoto (Spanish for 'earthquake') is a sweet, strong drink of young white wine, served with pineapple ice cream. Its name plays on its intoxicating effect, which supposedly leaves you reeling as if after an earthquake.",
          "ingredients": "Junger Weißwein (pipeño), Ananaseis, Grenadine bzw. Fernet (je nach Variante)",
          "ingredientsEn": "Young white wine (pipeño), pineapple ice cream, grenadine or Fernet (depending on the version)",
          "origin": "Der Terremoto entstand in Santiago de Chile und wird traditionell in einfachen Lokalen ausgeschenkt.",
          "originEn": "The terremoto arose in Santiago de Chile and is traditionally served in simple eateries.",
          "occasions": "Er wird besonders zu den Fiestas Patrias und bei feuchtfröhlichen Anlässen getrunken.",
          "occasionsEn": "Drunk especially at the Fiestas Patrias and on boozy occasions.",
          "order": "Un terremoto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Terremotopiojera.jpg/960px-Terremotopiojera.jpg"
        },
        {
          "name": "Vino chileno",
          "desc": "Chilenischer Wein, besonders kräftiger Carménère und Cabernet, weltbekannt.",
          "descEn": "Chilean wine, especially bold Carménère and Cabernet, world-renowned.",
          "long": "Chilenischer Wein genießt international einen sehr guten Ruf, besonders die kräftigen Rotweine. Bekannte Rebsorten sind Cabernet Sauvignon und die für Chile typische Carménère aus den Tälern rund um Santiago.",
          "longEn": "Chilean wine enjoys a very good international reputation, especially the bold reds. Well-known grape varieties are Cabernet Sauvignon and Chile's signature Carménère from the valleys around Santiago.",
          "ingredients": "Trauben (u.a. Cabernet Sauvignon, Carménère, Merlot, Sauvignon Blanc)",
          "ingredientsEn": "Grapes (including Cabernet Sauvignon, Carménère, Merlot, Sauvignon Blanc)",
          "origin": "Der chilenische Weinbau geht auf die spanische Kolonialzeit zurück und ist heute in zahlreichen Tälern verbreitet.",
          "originEn": "Chilean winemaking dates back to the Spanish colonial era and is today found in numerous valleys.",
          "occasions": "Wein wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "occasionsEn": "Wine is drunk with meals and at social occasions.",
          "order": "Una copa de vino tinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Vi%C3%B1edo_Puente_Alto.jpg/960px-Vi%C3%B1edo_Puente_Alto.jpg"
        },
        {
          "name": "Mote con huesillo",
          "desc": "Alkoholfreies Sommergetränk aus getrockneten Pfirsichen und Weizen.",
          "descEn": "A non-alcoholic summer drink of dried peaches and wheat.",
          "long": "Mote con huesillo ist ein traditionelles alkoholfreies Erfrischungsgetränk aus getrockneten Pfirsichen und gekochtem Weizen. Die süßen Pfirsiche schwimmen in einem leicht karamellisierten Zuckerwasser, dazu kommt der gekochte Weizen (mote) auf den Grund des Glases.",
          "longEn": "Mote con huesillo is a traditional non-alcoholic refresher of dried peaches and boiled wheat. The sweet peaches float in lightly caramelised sugar water, with the boiled wheat (mote) settling at the bottom of the glass.",
          "ingredients": "Getrocknete Pfirsiche (huesillos), gekochter Weizen (mote), Zucker, Zimt, Wasser",
          "ingredientsEn": "Dried peaches (huesillos), boiled wheat (mote), sugar, cinnamon, water",
          "origin": "Das Getränk ist ein klassisches sommerliches Straßengetränk mit langer Tradition in Chile.",
          "originEn": "The drink is a classic summer street drink with a long tradition in Chile.",
          "occasions": "Es wird vor allem im Sommer als erfrischender Durstlöscher getrunken.",
          "occasionsEn": "Drunk above all in summer as a refreshing thirst-quencher.",
          "order": "Un mote con huesillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Mote_con_huesillo.jpg/960px-Mote_con_huesillo.jpg"
        }
      ],
      "tip": "Chile ist deutlich teurer als seine Nachbarländer; bargeldlose Zahlung ist weit verbreitet, plane das Budget entsprechend höher ein.",
      "tipEn": "Chile is considerably more expensive than its neighbours; cashless payment is widespread, so budget accordingly higher."
    },
    {
      "id": "argentina",
      "sports": {
        "intro": "Fußball ist nahezu Religion und gipfelte im WM-Titel 2022. Daneben hat Argentinien Weltstars im Basketball, Rugby, Tennis und im Polo hervorgebracht.",
        "introEn": "Football is almost a religion and culminated in the 2022 World Cup title. Argentina has also produced world stars in basketball, rugby, tennis and polo.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Allesüberragende Leidenschaft; Weltmeister 2022.", "noteEn": "An all-consuming passion; world champions in 2022." },
          { "name": "Basketball", "nameEn": "Basketball", "note": "Sehr beliebt; die ‚Generación Dorada' gewann Olympiagold.", "noteEn": "Very popular; the ‘Golden Generation' won Olympic gold." }
        ],
        "athletes": [
          { "name": "Lionel Messi", "sport": "Fußball", "sportEn": "Football", "note": "Achtfacher Weltfußballer und Weltmeister 2022, oft als bester Spieler aller Zeiten bezeichnet.", "noteEn": "Eight-time world player of the year and 2022 world champion, often called the greatest of all time." },
          { "name": "Diego Maradona", "sport": "Fußball", "sportEn": "Football", "note": "Unsterbliche Legende, führte Argentinien 1986 zum WM-Titel.", "noteEn": "An immortal legend who led Argentina to the 1986 World Cup." },
          { "name": "Manu Ginóbili", "sport": "Basketball", "sportEn": "Basketball", "note": "NBA-Champion mit den San Antonio Spurs und Olympiasieger 2004.", "noteEn": "NBA champion with the San Antonio Spurs and Olympic gold medallist in 2004." }
        ]
      },
      "name": "Argentinien",
      "flag": "🇦🇷",
      "region": "Südamerika",
      "capital": "Buenos Aires",
      "tagline": "Tango, Asado und endlose Weiten von Patagonien bis zu den Wasserfällen",
      "taglineEn": "Tango, asado and endless expanses from Patagonia to the waterfalls",
      "population": "Rund 46 Millionen Einwohner (2025).",
      "populationEn": "Around 46 million inhabitants (2025).",
      "ageStructure": "Medianalter von etwa 34 Jahren; überwiegend europäisch geprägte Bevölkerung.",
      "ageStructureEn": "A median age of about 34; a largely European-descended population.",
      "government": "Föderale präsidentielle Republik; seit Ende 2023 mit dem libertären Präsidenten Javier Milei an der Spitze.",
      "governmentEn": "A federal presidential republic; since late 2023 headed by libertarian president Javier Milei.",
      "economy": "Drittgrößte Volkswirtschaft der Region, aber chronisch von hoher Inflation und Schulden geplagt.",
      "economyEn": "The third-largest economy in the region, but chronically plagued by high inflation and debt.",
      "livelihood": "Agrarexporte (Soja, Rind, Mais, Wein), Energie (Vaca-Muerta-Schiefer) und Industrie.",
      "livelihoodEn": "Agricultural exports (soya, beef, maize, wine), energy (Vaca Muerta shale) and industry.",
      "about": "Argentinien ist das zweitgrößte Land Südamerikas und reicht von den subtropischen Iguazú-Wasserfällen bis zum windigen Patagonien und Feuerland im Süden. Buenos Aires gilt als eine der lebendigsten Metropolen des Kontinents. Highlights sind der Perito-Moreno-Gletscher, die Weinregion Mendoza und die bunten Anden im Nordwesten.",
      "aboutEn": "Argentina is the second-largest country in South America, stretching from the subtropical Iguazú Falls to windswept Patagonia and Tierra del Fuego in the south. Buenos Aires is one of the liveliest cities on the continent. Highlights include the Perito Moreno glacier, the Mendoza wine region and the colourful Andes of the north-west.",
      "history": "Vor der Kolonialzeit lebten im Norden Andenvölker, in der Pampa und Patagonien nomadische Gruppen. Die Spanier gründeten ab dem 16. Jahrhundert Siedlungen, 1816 erklärte Argentinien seine Unabhängigkeit. Im späten 19. und frühen 20. Jahrhundert kamen Millionen europäischer Einwanderer, vor allem aus Italien und Spanien. Die jüngere Geschichte ist geprägt vom Peronismus, der Militärdiktatur (1976–1983) und wiederkehrenden Wirtschaftskrisen.",
      "historyEn": "Before colonial times, Andean peoples lived in the north and nomadic groups on the Pampas and in Patagonia. The Spanish established settlements from the 16th century, and in 1816 Argentina declared its independence. In the late 19th and early 20th centuries, millions of European immigrants arrived, above all from Italy and Spain. Recent history has been shaped by Peronism, the military dictatorship (1976–1983) and recurring economic crises.",
      "language": "Das argentinische Spanisch (Rioplatense) ist sofort am Voseo erkennbar: 'vos' ersetzt 'tú' ('vos tenés' statt 'tú tienes'). Auffällig ist die Aussprache von 'll' und 'y' wie ein deutsches 'sch' ('calle' klingt wie 'casche'). Der Tonfall klingt durch italienischen Einfluss fast melodisch-singend. Im Nordwesten und Nordosten gibt es Quechua- bzw. Guaraní-Einflüsse.",
      "languageEn": "Argentine Spanish (Rioplatense) is instantly recognisable by its voseo: 'vos' replaces 'tú' ('vos tenés' instead of 'tú tienes'). Notable is the pronunciation of 'll' and 'y' like an English 'sh' ('calle' sounds like 'cashe'). Italian influence gives the speech an almost sing-song melody. In the north-west and north-east there are Quechua and Guaraní influences respectively.",
      "words": [
        {
          "es": "che",
          "de": "Hey/Du (typische argentinische Anrede)",
          "en": "hey/mate (typical Argentine way of addressing someone)"
        },
        {
          "es": "boludo/a",
          "de": "Trottel, aber unter Freunden auch 'Alter'",
          "en": "idiot, but among friends also 'mate'"
        },
        {
          "es": "laburo",
          "de": "Arbeit, Job (aus dem Italienischen)",
          "en": "work, job (from Italian)"
        },
        {
          "es": "quilombo",
          "de": "Chaos, Durcheinander",
          "en": "chaos, mess"
        },
        {
          "es": "copado",
          "de": "cool, klasse",
          "en": "cool, brilliant"
        },
        {
          "es": "¿qué onda?",
          "de": "Was geht? / Wie läuft's?",
          "en": "What's up? / How's it going?"
        }
      ],
      "food": [
        {
          "name": "Asado",
          "desc": "Traditionelles Grillfest mit verschiedenen Rindfleischstücken, ein gesellschaftliches Ritual.",
          "descEn": "A traditional barbecue of various cuts of beef, a social ritual.",
          "long": "Asado bezeichnet das argentinische Grillfest und das dort zubereitete Fleisch zugleich. Verschiedene Rindfleischstücke und Würste werden langsam über Holzkohle oder offenem Feuer gegart und gemeinsam in geselliger Runde gegessen.",
          "longEn": "Asado refers to both the Argentine barbecue and the meat cooked at it. Various cuts of beef and sausages are cooked slowly over charcoal or an open fire and eaten together in good company.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Morcilla (Blutwurst), Salz, Chimichurri als Beilage",
          "ingredientsEn": "Various cuts of beef, chorizo, morcilla (blood sausage), salt, chimichurri on the side",
          "origin": "Das Asado ist tief in der Gaucho-Kultur der argentinischen Pampa verwurzelt und gilt als kulinarisches Nationalsymbol.",
          "originEn": "The asado is deeply rooted in the gaucho culture of the Argentine Pampas and is regarded as a culinary national symbol.",
          "occasions": "Es ist das klassische Gericht für Wochenenden, Familientreffen und Feiern.",
          "occasionsEn": "It's the classic dish for weekends, family gatherings and celebrations.",
          "order": "Una parrillada para dos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Gefüllte Teigtaschen, je nach Region mit Fleisch, Käse oder Mais.",
          "descEn": "Stuffed pasties, filled with meat, cheese or corn depending on the region.",
          "long": "Empanadas sind gefüllte Teigtaschen, die in Argentinien je nach Region unterschiedlich gefüllt und gebacken oder frittiert werden. Häufige Füllungen sind würziges Hackfleisch, Huhn, Schinken-Käse oder Mais.",
          "longEn": "Empanadas are stuffed pasties, filled differently across Argentina and either baked or fried. Common fillings are spiced mince, chicken, ham-and-cheese or corn.",
          "ingredients": "Weizenteig, Rinderhack oder andere Füllungen, Zwiebeln, hartgekochtes Ei, Oliven, Gewürze",
          "ingredientsEn": "Wheat dough, minced beef or other fillings, onions, hard-boiled egg, olives, spices",
          "origin": "Die Empanada kam über Spanien nach Lateinamerika und hat in Argentinien zahlreiche regionale Varianten entwickelt.",
          "originEn": "The empanada came to Latin America via Spain and has developed numerous regional versions in Argentina.",
          "occasions": "Sie werden als Vorspeise, Snack oder bei Zusammenkünften zu jeder Gelegenheit gegessen.",
          "occasionsEn": "Eaten as a starter, snack or at gatherings on any occasion.",
          "order": "Una docena de empanadas de carne, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, oft als 'napolitana' mit Schinken und Käse überbacken.",
          "descEn": "A breaded escalope, often done 'napolitana' topped with ham and cheese.",
          "long": "Die Milanesa ist ein paniertes, dünnes Schnitzel und eines der beliebtesten Alltagsgerichte Argentiniens. In der Variante Milanesa napolitana wird sie zusätzlich mit Tomatensauce, Schinken und Käse überbacken.",
          "longEn": "The milanesa is a breaded, thin escalope and one of Argentina's most popular everyday dishes. In the milanesa napolitana version it's additionally topped with tomato sauce, ham and cheese and baked.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz (napolitana: Tomatensauce, Schinken, Käse)",
          "ingredientsEn": "Thin beef or chicken, egg, breadcrumbs, salt (napolitana: tomato sauce, ham, cheese)",
          "origin": "Die Milanesa geht auf die norditalienische Cotoletta zurück und kam mit italienischen Einwanderern nach Argentinien.",
          "originEn": "The milanesa traces back to the northern Italian cotoletta and came to Argentina with Italian immigrants.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "occasionsEn": "Eaten as an everyday lunch or dinner.",
          "order": "Una milanesa con papas fritas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Choripán",
          "desc": "Gegrillte Chorizo-Wurst im Brot mit Chimichurri, klassisches Streetfood.",
          "descEn": "A grilled chorizo sausage in bread with chimichurri, a classic street food.",
          "long": "Choripán ist ein Sandwich aus gegrillter Chorizo-Wurst in einem Brötchen. Es wird klassisch mit Chimichurri bestrichen und gilt als beliebtester Imbiss rund um das Asado und bei Veranstaltungen.",
          "longEn": "Choripán is a sandwich of grilled chorizo sausage in a roll. It's classically spread with chimichurri and is the most popular bite around the asado and at events.",
          "ingredients": "Chorizo, Brötchen, Chimichurri, optional Tomaten und Zwiebeln",
          "ingredientsEn": "Chorizo, bread roll, chimichurri, optionally tomatoes and onions",
          "origin": "Der Name setzt sich aus 'chorizo' und 'pan' zusammen, und das Gericht ist fest mit der argentinischen Grillkultur verbunden.",
          "originEn": "The name is a blend of 'chorizo' and 'pan', and the dish is firmly tied to Argentina's barbecue culture.",
          "occasions": "Es wird beim Asado, auf Märkten und bei Fußballspielen als Straßenimbiss gegessen.",
          "occasionsEn": "Eaten as a street snack at the asado, at markets and at football matches.",
          "order": "Un choripán con chimichurri, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/af/Choripan.jpg"
        },
        {
          "name": "Provoleta",
          "desc": "Gegrillter Provolone-Käse mit Oregano, beliebte Vorspeise beim Asado.",
          "descEn": "Grilled provolone cheese with oregano, a popular starter at the asado.",
          "long": "Provoleta ist eine gegrillte Scheibe Provolone-Käse, die außen leicht knusprig und innen geschmolzen ist. Sie wird mit Oregano und Olivenöl gewürzt und typischerweise als Vorspeise beim Asado gereicht.",
          "longEn": "Provoleta is a grilled slice of provolone cheese, lightly crisp outside and melted within. It's seasoned with oregano and olive oil and typically served as a starter at the asado.",
          "ingredients": "Provolone-Käse, Oregano, Olivenöl, optional Chiliflocken",
          "ingredientsEn": "Provolone cheese, oregano, olive oil, optionally chilli flakes",
          "origin": "Die Provoleta wurde in Argentinien aus dem italienischen Provolone-Käse entwickelt und ist Teil der Asado-Tradition.",
          "originEn": "The provoleta was developed in Argentina from the Italian provolone cheese and is part of the asado tradition.",
          "occasions": "Sie wird als Vorspeise zu Beginn eines Asados gegessen.",
          "occasionsEn": "Eaten as a starter at the beginning of an asado.",
          "order": "Una provoleta, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Provoleta_argentina.jpg/960px-Provoleta_argentina.jpg"
        },
        {
          "name": "Dulce de leche",
          "desc": "Karamellige Milchcreme, die in unzähligen Süßspeisen steckt.",
          "descEn": "A caramel milk spread that goes into countless sweets.",
          "long": "Dulce de leche ist eine cremige, karamellartige Masse aus langsam eingekochter, gezuckerter Milch. Sie ist allgegenwärtig in der argentinischen Süßküche und wird auf Brot, in Gebäck und als Füllung verwendet.",
          "longEn": "Dulce de leche is a creamy, caramel-like spread of slowly reduced, sweetened milk. It's everywhere in Argentine baking and is used on bread, in pastries and as a filling.",
          "ingredients": "Milch, Zucker, eine Prise Natron, optional Vanille",
          "ingredientsEn": "Milk, sugar, a pinch of bicarbonate of soda, optionally vanilla",
          "origin": "Dulce de leche ist in mehreren südamerikanischen Ländern verbreitet, und Argentinien gilt als eines seiner Kernländer.",
          "originEn": "Dulce de leche is common in several South American countries, and Argentina is regarded as one of its heartlands.",
          "occasions": "Es wird zum Frühstück, zur Jause und als Dessertzutat gegessen.",
          "occasionsEn": "Eaten for breakfast, as a snack and as a dessert ingredient.",
          "order": "Algo con dulce de leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/DulceDeLeche.jpg/960px-DulceDeLeche.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mate",
          "desc": "Aufguss aus Yerba-Mate-Blättern, getrunken aus dem Kürbis mit Bombilla, ein soziales Ritual.",
          "descEn": "An infusion of yerba mate leaves, drunk from a gourd with a bombilla, a social ritual.",
          "long": "Mate ist das argentinische Nationalgetränk, ein Aufguss aus den getrockneten Blättern der Yerba Mate. Er wird in einem ausgehöhlten Kürbisgefäß mit einem Metallröhrchen (bombilla) getrunken und traditionell in der Gruppe herumgereicht.",
          "longEn": "Mate is Argentina's national drink, an infusion of the dried leaves of yerba mate. It's drunk from a hollowed-out gourd with a metal straw (bombilla) and traditionally passed around the group.",
          "ingredients": "Yerba Mate (getrocknete Blätter), heißes Wasser",
          "ingredientsEn": "Yerba mate (dried leaves), hot water",
          "origin": "Die Mate-Tradition geht auf die indigenen Guaraní zurück und ist heute fester Bestandteil des Alltags am Río de la Plata.",
          "originEn": "The mate tradition goes back to the indigenous Guaraní and is today a fixture of everyday life on the Río de la Plata.",
          "occasions": "Er wird den ganzen Tag über, oft im Kreis von Freunden oder Familie, getrunken.",
          "occasionsEn": "Drunk throughout the day, often among friends or family.",
          "order": "¿Me cebás un mate?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mate_en_calabaza.jpg"
        },
        {
          "name": "Vino Malbec",
          "desc": "Argentiniens charaktervolle Rotweinsorte, vor allem aus Mendoza.",
          "descEn": "Argentina's characterful red wine variety, above all from Mendoza.",
          "long": "Malbec ist die wichtigste Rotweinsorte Argentiniens und international ein Aushängeschild des Landes. Besonders aus der Region Mendoza stammen kräftige, fruchtige Malbec-Weine, die hervorragend zum Asado passen.",
          "longEn": "Malbec is Argentina's most important red wine variety and an international flagship for the country. Bold, fruity Malbec wines come especially from the Mendoza region and go superbly with the asado.",
          "ingredients": "Malbec-Trauben",
          "ingredientsEn": "Malbec grapes",
          "origin": "Die Malbec-Rebe kam aus Frankreich nach Argentinien und fand vor allem in Mendoza ideale Bedingungen.",
          "originEn": "The Malbec vine came from France to Argentina and found ideal conditions above all in Mendoza.",
          "occasions": "Er wird zu Fleischgerichten und bei geselligen Essen getrunken.",
          "occasionsEn": "Drunk with meat dishes and at sociable meals.",
          "order": "Una copa de Malbec, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Malbec_grapes.jpg/960px-Malbec_grapes.jpg"
        },
        {
          "name": "Fernet con Coca",
          "desc": "Bitterlikör mit Cola gemischt, das inoffizielle Nationalgetränk der Jugend.",
          "descEn": "A bitter liqueur mixed with cola, the unofficial national drink of the young.",
          "long": "Fernet con Coca ist die Mischung aus dem bitteren Kräuterlikör Fernet und Cola und gilt als inoffizielles Nationalgetränk Argentiniens. Der kräftig-bittere Geschmack ist gewöhnungsbedürftig, gehört aber fest zur Partykultur des Landes.",
          "longEn": "Fernet con Coca is the mix of the bitter herbal liqueur Fernet with cola and is considered Argentina's unofficial national drink. The strong, bitter taste takes some getting used to, but it's firmly part of the country's party culture.",
          "ingredients": "Fernet (Kräuterlikör), Cola, Eis",
          "ingredientsEn": "Fernet (herbal liqueur), cola, ice",
          "origin": "Fernet stammt ursprünglich aus Italien, wurde in Argentinien aber zu einem überaus populären Mixgetränk, besonders in Córdoba.",
          "originEn": "Fernet originally comes from Italy but became an immensely popular mixed drink in Argentina, especially in Córdoba.",
          "occasions": "Es wird vor allem bei Partys und geselligen Treffen getrunken.",
          "occasionsEn": "Drunk above all at parties and social gatherings.",
          "order": "Un fernet con coca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Fernet_and_Coke_%28Fernet_con_Coca%29.jpg/960px-Fernet_and_Coke_%28Fernet_con_Coca%29.jpg"
        },
        {
          "name": "Quilmes",
          "desc": "Bekannteste argentinische Biermarke, allgegenwärtig bei jedem Asado.",
          "descEn": "Argentina's best-known beer brand, present at every asado.",
          "long": "Quilmes ist die bekannteste Biermarke Argentiniens und ein helles Lagerbier. Es ist landesweit präsent und wird oft in großen Literflaschen zum Teilen bestellt.",
          "longEn": "Quilmes is Argentina's best-known beer brand and a pale lager. It's present nationwide and is often ordered in large litre bottles to share.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Die Brauerei wurde in der Stadt Quilmes bei Buenos Aires gegründet und ist eine nationale Traditionsmarke.",
          "originEn": "The brewery was founded in the town of Quilmes near Buenos Aires and is a long-established national brand.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "occasionsEn": "Drunk with meals and at social occasions.",
          "order": "Una Quilmes bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/01/Quilmes_cerveza_aviso_1967.jpg"
        }
      ],
      "tip": "Wegen der Inflation lohnt sich oft der inoffizielle 'dólar blue'-Wechselkurs; bring US-Dollar in bar mit und informiere dich vor Ort über aktuelle Kurse.",
      "tipEn": "Because of inflation, the unofficial 'dólar blue' exchange rate is often worth it; bring US dollars in cash and check the current rates once you're there."
    },
    {
      "id": "uruguay",
      "sports": {
        "intro": "Für ein so kleines Land ist Uruguay eine Fußball-Großmacht: zwei WM-Titel und der allererste 1930. Fußball ist tief in der nationalen Identität verankert.",
        "introEn": "For such a small country, Uruguay is a football powerhouse: two World Cup titles, including the very first in 1930. Football is deeply woven into the national identity.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Nationalsport und Stolz; Erzrivalen sind Peñarol und Nacional.", "noteEn": "The national sport and a point of pride; the arch-rivals are Peñarol and Nacional." }
        ],
        "athletes": [
          { "name": "Luis Suárez", "sport": "Fußball", "sportEn": "Football", "note": "Rekordtorschütze der ‚Celeste' und einer der besten Stürmer seiner Zeit.", "noteEn": "Record scorer for the ‘Celeste' and one of the best strikers of his era." },
          { "name": "Diego Forlán", "sport": "Fußball", "sportEn": "Football", "note": "Bester Spieler der WM 2010, führte Uruguay ins Halbfinale.", "noteEn": "Best player of the 2010 World Cup, who led Uruguay to the semi-finals." },
          { "name": "Enzo Francescoli", "sport": "Fußball", "sportEn": "Football", "note": "Eleganter Spielmacher und Idol mehrerer Generationen.", "noteEn": "An elegant playmaker and idol of several generations." }
        ]
      },
      "name": "Uruguay",
      "flag": "🇺🇾",
      "region": "Südamerika",
      "capital": "Montevideo",
      "tagline": "Entspannte Strände, Mate-Kultur und Südamerikas ruhigste Ecke",
      "taglineEn": "Laid-back beaches, mate culture and South America's most peaceful corner",
      "population": "Etwa 3,4 Millionen Einwohner (2025).",
      "populationEn": "About 3.4 million inhabitants (2025).",
      "ageStructure": "Alternde Bevölkerung mit einem Medianalter von rund 36 Jahren.",
      "ageStructureEn": "An ageing population with a median age of around 36.",
      "government": "Stabile präsidentielle Demokratie; gilt als eines der am wenigsten korrupten Länder der Region.",
      "governmentEn": "A stable presidential democracy; regarded as one of the least corrupt countries in the region.",
      "economy": "Hohes Pro-Kopf-Einkommen, starke Mittelschicht und solider Sozialstaat.",
      "economyEn": "High per-capita income, a strong middle class and a solid welfare state.",
      "livelihood": "Agrarexporte (Rindfleisch, Soja, Milchprodukte, Wolle), Forstwirtschaft, Software und Tourismus.",
      "livelihoodEn": "Agricultural exports (beef, soya, dairy, wool), forestry, software and tourism.",
      "about": "Uruguay ist das kleinste spanischsprachige Land Südamerikas und liegt zwischen Argentinien und Brasilien am Río de la Plata. Es ist bekannt für seine entspannte Atmosphäre, lange Atlantikstrände und eine ausgeprägte Mate-Kultur. Highlights sind die Altstadt von Colonia del Sacramento, die Strände von Punta del Este und das gemütliche Montevideo.",
      "aboutEn": "Uruguay is the smallest Spanish-speaking country in South America, lying between Argentina and Brazil on the Río de la Plata. It's known for its laid-back atmosphere, long Atlantic beaches and a strong mate culture. Highlights are the old town of Colonia del Sacramento, the beaches of Punta del Este and easy-going Montevideo.",
      "history": "Vor der Kolonialzeit lebte hier das indigene Volk der Charrúa. Spanier und Portugiesen stritten lange um das Gebiet, bis Uruguay 1828 als Pufferstaat zwischen Argentinien und Brasilien unabhängig wurde. Im 20. Jahrhundert galt es dank seines Sozialstaats als 'Schweiz Südamerikas'. Heute ist Uruguay eines der stabilsten und liberalsten Länder der Region.",
      "historyEn": "Before colonial times, the indigenous Charrúa people lived here. The Spanish and Portuguese long fought over the territory until, in 1828, Uruguay became independent as a buffer state between Argentina and Brazil. In the 20th century, thanks to its welfare state, it was known as the 'Switzerland of South America'. Today Uruguay is one of the most stable and liberal countries in the region.",
      "language": "Uruguay teilt mit Argentinien das Rioplatense-Spanisch: Voseo ('vos') und die 'sch'-Aussprache von 'll' und 'y' sind Standard. An der Grenze zu Brasilien wird ein Mischdialekt aus Spanisch und Portugiesisch gesprochen ('Portuñol'). Der Tonfall ähnelt dem von Buenos Aires, gilt aber als etwas ruhiger. Indigene Sprachen sind heute kaum noch präsent.",
      "languageEn": "Uruguay shares Rioplatense Spanish with Argentina: voseo ('vos') and the 'sh' pronunciation of 'll' and 'y' are standard. On the border with Brazil, a mixed dialect of Spanish and Portuguese is spoken ('Portuñol'). The tone is similar to that of Buenos Aires, but is considered a bit calmer. Indigenous languages are barely present today.",
      "words": [
        {
          "es": "ta",
          "de": "okay, passt (Kurzform von 'está')",
          "en": "okay, fine (short for 'está')"
        },
        {
          "es": "bo",
          "de": "Hey/Du (uruguayische Anrede, ähnlich 'che')",
          "en": "hey/mate (Uruguayan form of address, like 'che')"
        },
        {
          "es": "championes",
          "de": "Turnschuhe, Sneakers",
          "en": "trainers, sneakers"
        },
        {
          "es": "de más",
          "de": "super, großartig",
          "en": "great, fantastic"
        },
        {
          "es": "garra charrúa",
          "de": "Kampfgeist, Durchhaltevermögen (Nationalstolz)",
          "en": "fighting spirit, perseverance (a point of national pride)"
        }
      ],
      "food": [
        {
          "name": "Chivito",
          "desc": "Üppiges Sandwich mit Steak, Schinken, Käse, Ei und Salat, das Nationalgericht.",
          "descEn": "A lavish sandwich with steak, ham, cheese, egg and salad, the national dish.",
          "long": "Der Chivito ist das kulinarische Wahrzeichen Uruguays, ein üppig belegtes Sandwich mit dünnem Rindersteak. Dazu kommen Schinken, Käse, Speck, Spiegelei, Salat und Tomaten, und es wird oft mit Pommes frites serviert.",
          "longEn": "The chivito is Uruguay's culinary landmark, a lavishly loaded sandwich with thin beef steak. Added to it are ham, cheese, bacon, fried egg, salad and tomatoes, and it's often served with chips.",
          "ingredients": "Dünnes Rindersteak, Schinken, Käse, Speck, Spiegelei, Salat, Tomaten, Mayonnaise, Brötchen",
          "ingredientsEn": "Thin beef steak, ham, cheese, bacon, fried egg, salad, tomatoes, mayonnaise, bread roll",
          "origin": "Der Chivito entstand in der Küstenstadt Punta del Este und entwickelte sich zum Nationalgericht Uruguays.",
          "originEn": "The chivito arose in the coastal town of Punta del Este and became Uruguay's national dish.",
          "occasions": "Er wird als sättigendes Mittag- oder Abendessen gegessen.",
          "occasionsEn": "Eaten as a filling lunch or dinner.",
          "order": "Un chivito al plato, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Chivito_al_pan_uruguayo.jpg/960px-Chivito_al_pan_uruguayo.jpg"
        },
        {
          "name": "Asado",
          "desc": "Grillfest mit Rindfleisch, in Uruguay mindestens so wichtig wie in Argentinien.",
          "descEn": "A beef barbecue, in Uruguay every bit as important as in Argentina.",
          "long": "Asado ist auch in Uruguay das zentrale Grillgericht und ein wichtiger sozialer Anlass. Verschiedene Fleischstücke und Würste werden über Holzkohle oder Feuer gegrillt, oft auf einem traditionellen Parrilla-Rost.",
          "longEn": "In Uruguay too, asado is the central barbecue dish and an important social occasion. Various cuts of meat and sausages are grilled over charcoal or fire, often on a traditional parrilla grill.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Morcilla, Salz, Kräuter",
          "ingredientsEn": "Various cuts of beef, chorizo, morcilla, salt, herbs",
          "origin": "Wie in Argentinien ist das Asado tief in der Gaucho-Kultur der Region am Río de la Plata verwurzelt.",
          "originEn": "As in Argentina, the asado is deeply rooted in the gaucho culture of the Río de la Plata region.",
          "occasions": "Es wird an Wochenenden, bei Familientreffen und Feiern zubereitet.",
          "occasionsEn": "Prepared at weekends, at family gatherings and celebrations.",
          "order": "Un asado para dos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, beliebt als Sandwich ('milanesa al pan').",
          "descEn": "A breaded escalope, popular as a sandwich ('milanesa al pan').",
          "long": "Die Milanesa ist auch in Uruguay ein beliebtes Alltagsgericht, ein dünnes paniertes Schnitzel. Sie wird häufig als Sandwich (Milanesa al pan) oder mit Beilagen wie Kartoffelpüree und Salat gegessen.",
          "longEn": "In Uruguay too, the milanesa is a popular everyday dish, a thin breaded escalope. It's often eaten as a sandwich (milanesa al pan) or with sides like mashed potato and salad.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz",
          "ingredientsEn": "Thin beef or chicken, egg, breadcrumbs, salt",
          "origin": "Die Milanesa kam mit italienischen Einwanderern an den Río de la Plata und ist dort fester Bestandteil der Alltagsküche.",
          "originEn": "The milanesa came to the Río de la Plata with Italian immigrants and is a fixture of everyday cooking there.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "occasionsEn": "Eaten as an everyday lunch or dinner.",
          "order": "Una milanesa al pan, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Choripán",
          "desc": "Gegrillte Wurst im Brot, klassisches Streetfood beim Grillen.",
          "descEn": "A grilled sausage in bread, the classic street food at a barbecue.",
          "long": "Choripán ist auch in Uruguay ein Sandwich aus gegrillter Chorizo im Brötchen. Es ist ein beliebter Imbiss beim Asado und auf Veranstaltungen und wird oft mit Salsa criolla oder Chimichurri serviert.",
          "longEn": "In Uruguay too, choripán is a sandwich of grilled chorizo in a roll. It's a popular bite at the asado and at events and is often served with salsa criolla or chimichurri.",
          "ingredients": "Chorizo, Brötchen, Salsa criolla oder Chimichurri",
          "ingredientsEn": "Chorizo, bread roll, salsa criolla or chimichurri",
          "origin": "Das Gericht teilt sich die Grilltradition der Region am Río de la Plata mit Argentinien.",
          "originEn": "The dish shares the barbecue tradition of the Río de la Plata region with Argentina.",
          "occasions": "Es wird beim Asado und bei Veranstaltungen als Straßenimbiss gegessen.",
          "occasionsEn": "Eaten as a street snack at the asado and at events.",
          "order": "Un choripán, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/af/Choripan.jpg"
        },
        {
          "name": "Torta frita",
          "desc": "Frittiertes Fettgebäck, traditionell an Regentagen gegessen.",
          "descEn": "A fried dough cake, traditionally eaten on rainy days.",
          "long": "Torta frita ist ein einfaches frittiertes Teiggebäck, das besonders an Regentagen zubereitet wird. Die flachen, leicht gesalzenen oder gezuckerten Fladen werden warm gegessen und oft zum Mate gereicht.",
          "longEn": "Torta frita is a simple fried dough cake, made especially on rainy days. The flat, lightly salted or sugared cakes are eaten warm and often served with mate.",
          "ingredients": "Weizenmehl, Wasser, Fett, Salz, etwas Backtriebmittel, optional Zucker",
          "ingredientsEn": "Wheat flour, water, fat, salt, a little raising agent, optionally sugar",
          "origin": "Die Torta frita ist ein traditionelles, einfaches Gebäck der ländlichen Küche am Río de la Plata.",
          "originEn": "Torta frita is a traditional, simple pastry of the rural cooking of the Río de la Plata.",
          "occasions": "Sie wird traditionell an Regentagen und als Snack zum Mate gegessen.",
          "occasionsEn": "Traditionally eaten on rainy days and as a snack with mate.",
          "order": "Dos tortas fritas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/TortaFrita.jpg/960px-TortaFrita.jpg"
        },
        {
          "name": "Dulce de leche",
          "desc": "Karamellcreme, allgegenwärtig in Desserts und Gebäck.",
          "descEn": "A caramel spread, found everywhere in desserts and pastries.",
          "long": "Dulce de leche ist auch in Uruguay eine beliebte karamellartige Creme aus eingekochter, gezuckerter Milch. Sie wird auf Brot, in Gebäck und als Füllung für Süßspeisen verwendet.",
          "longEn": "In Uruguay too, dulce de leche is a popular caramel-like spread of reduced, sweetened milk. It's used on bread, in pastries and as a filling for sweets.",
          "ingredients": "Milch, Zucker, eine Prise Natron, optional Vanille",
          "ingredientsEn": "Milk, sugar, a pinch of bicarbonate of soda, optionally vanilla",
          "origin": "Dulce de leche gehört zur gemeinsamen Süßküche der Region am Río de la Plata, die sich Uruguay mit Argentinien teilt.",
          "originEn": "Dulce de leche is part of the shared sweet cooking of the Río de la Plata region that Uruguay shares with Argentina.",
          "occasions": "Es wird zum Frühstück, zur Jause und als Dessertzutat gegessen.",
          "occasionsEn": "Eaten for breakfast, as a snack and as a dessert ingredient.",
          "order": "Algo con dulce de leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/DulceDeLeche.jpg/960px-DulceDeLeche.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mate",
          "desc": "Nationalgetränk schlechthin; Uruguayer tragen Thermoskanne und Mate-Kürbis überallhin.",
          "descEn": "The national drink bar none; Uruguayans carry a flask and a mate gourd everywhere.",
          "long": "Mate ist in Uruguay ein allgegenwärtiges Alltagsgetränk, und das Land gilt als Pro-Kopf-Spitzenreiter im Mate-Konsum. Viele Uruguayer tragen Mate-Gefäß und Thermoskanne den ganzen Tag mit sich herum.",
          "longEn": "In Uruguay, mate is an ever-present everyday drink, and the country is regarded as the per-capita leader in mate consumption. Many Uruguayans carry their mate gourd and flask around with them all day.",
          "ingredients": "Yerba Mate (getrocknete Blätter), heißes Wasser",
          "ingredientsEn": "Yerba mate (dried leaves), hot water",
          "origin": "Die Mate-Tradition geht auf die indigenen Guaraní zurück und prägt den Alltag in ganz Uruguay.",
          "originEn": "The mate tradition goes back to the indigenous Guaraní and shapes everyday life all over Uruguay.",
          "occasions": "Er wird den ganzen Tag über, allein oder in geselliger Runde, getrunken.",
          "occasionsEn": "Drunk throughout the day, alone or in good company.",
          "order": "¿Tomás mate?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mate_en_calabaza.jpg"
        },
        {
          "name": "Medio y medio",
          "desc": "Erfrischende Mischung aus Weißwein und Sekt, ein Klassiker aus Montevideo.",
          "descEn": "A refreshing mix of white wine and sparkling wine, a classic from Montevideo.",
          "long": "Medio y medio ist ein erfrischendes Getränk aus einer Mischung zu gleichen Teilen aus stillem Weißwein und Schaumwein. Es ist süffig und leicht prickelnd und besonders mit der Hauptstadt Montevideo verbunden.",
          "longEn": "Medio y medio is a refreshing drink of an equal mix of still white wine and sparkling wine. It's easy-drinking and lightly fizzy and is especially associated with the capital, Montevideo.",
          "ingredients": "Weißwein, Schaumwein bzw. Sekt (zu gleichen Teilen)",
          "ingredientsEn": "White wine, sparkling wine (in equal parts)",
          "origin": "Das Getränk wird traditionell mit der historischen Bodega in Montevideo in Verbindung gebracht und ist eine uruguayische Spezialität.",
          "originEn": "The drink is traditionally associated with the historic bodega in Montevideo and is a Uruguayan speciality.",
          "occasions": "Es wird als Aperitif und zu festlichen Anlässen getrunken.",
          "occasionsEn": "Drunk as an aperitif and on festive occasions.",
          "order": "Un medio y medio, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/2016_esquina_de_Zabala_con_25_de_Mayo_Banco_Popular_del_Uruguay%2C_actual_Ministerio_de_vivienda%2C_Ordenamiento_Territoriak_y_Medio_Ambiente_-_Montevideo_%28Uruguay%29.jpg/960px-thumbnail.jpg"
        },
        {
          "name": "Grappamiel",
          "desc": "Tresterbrand mit Honig, wärmt im Winter.",
          "descEn": "A grappa brandy with honey, warming in winter.",
          "long": "Grappamiel ist ein süßer Likör aus Grappa (Traubentrester-Brand) und Honig. Der wärmende Schnaps wird besonders in der kalten Jahreszeit gern in kleinen Mengen getrunken.",
          "longEn": "Grappamiel is a sweet liqueur of grappa (grape-pomace brandy) and honey. The warming spirit is enjoyed especially in the cold season in small amounts.",
          "ingredients": "Grappa (Traubentrester-Brand), Honig",
          "ingredientsEn": "Grappa (grape-pomace brandy), honey",
          "origin": "Grappamiel geht auf die italienische Grappa-Tradition zurück, die mit Einwanderern nach Uruguay kam.",
          "originEn": "Grappamiel goes back to the Italian grappa tradition that came to Uruguay with immigrants.",
          "occasions": "Er wird vor allem im Winter und als wärmender Digestif getrunken.",
          "occasionsEn": "Drunk above all in winter and as a warming digestif.",
          "order": "Un grappamiel, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Grappa_Storica_Nera_Bottle.jpg/960px-Grappa_Storica_Nera_Bottle.jpg"
        },
        {
          "name": "Tannat",
          "desc": "Kräftiger Rotwein, Uruguays charakteristische Rebsorte.",
          "descEn": "A bold red wine, Uruguay's signature grape variety.",
          "long": "Tannat ist die wichtigste Rotweinsorte Uruguays und gilt als dessen Aushängeschild. Die Weine sind kräftig, tanninreich und passen besonders gut zu gegrilltem Fleisch.",
          "longEn": "Tannat is Uruguay's most important red wine variety and is regarded as its flagship. The wines are bold, rich in tannins and go especially well with grilled meat.",
          "ingredients": "Tannat-Trauben",
          "ingredientsEn": "Tannat grapes",
          "origin": "Die Tannat-Rebe stammt ursprünglich aus Südwestfrankreich und fand in Uruguay ihre zweite Heimat.",
          "originEn": "The Tannat vine originally comes from south-western France and found its second home in Uruguay.",
          "occasions": "Er wird zu Fleischgerichten und bei geselligen Essen getrunken.",
          "occasionsEn": "Drunk with meat dishes and at sociable meals.",
          "order": "Una copa de Tannat, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/VIVC12257_TANNAT_Cluster_in_the_field_8302.jpg/960px-VIVC12257_TANNAT_Cluster_in_the_field_8302.jpg"
        }
      ],
      "tip": "Uruguayer trinken Mate ständig und überall; nimm eine Einladung dazu an, aber rühre die Bombilla (Trinkhalm) nicht um, das gilt als unhöflich.",
      "tipEn": "Uruguayans drink mate all the time and everywhere; do accept an invitation to share it, but don't stir the bombilla (the metal straw), as that's considered rude."
    },
    {
      "id": "paraguay",
      "sports": {
        "intro": "Fußball ist mit Abstand der beliebteste Sport; die ‚Albirroja' ist für ihre kämpferische Spielweise bekannt. In Luque bei Asunción sitzt der südamerikanische Fußballverband CONMEBOL.",
        "introEn": "Football is by far the most popular sport; the ‘Albirroja' is known for its fighting spirit. The South American football confederation CONMEBOL is based in Luque near Asunción.",
        "popular": [
          { "name": "Fußball", "nameEn": "Football", "note": "Volkssport Nr. 1; Erzrivalen sind Olimpia und Cerro Porteño.", "noteEn": "The number-one sport; the arch-rivals are Olimpia and Cerro Porteño." }
        ],
        "athletes": [
          { "name": "José Luis Chilavert", "sport": "Fußball", "sportEn": "Football", "note": "Legendärer Torwart, der selbst Tore aus Freistößen und Elfmetern erzielte.", "noteEn": "A legendary goalkeeper who scored goals himself from free kicks and penalties." },
          { "name": "Roque Santa Cruz", "sport": "Fußball", "sportEn": "Football", "note": "Rekordnationalspieler, glänzte beim FC Bayern und in der Premier League.", "noteEn": "Record cap holder who shone at Bayern Munich and in the Premier League." }
        ]
      },
      "name": "Paraguay",
      "flag": "🇵🇾",
      "region": "Südamerika",
      "capital": "Asunción",
      "tagline": "Südamerikas unentdecktes Herz mit lebendiger Guaraní-Kultur",
      "taglineEn": "South America's undiscovered heart with a vibrant Guaraní culture",
      "population": "Rund 6,9 Millionen Einwohner (2025).",
      "populationEn": "Around 6.9 million inhabitants (2025).",
      "ageStructure": "Junge Bevölkerung mit einem Medianalter von etwa 27 Jahren; Guaraní ist neben Spanisch Amtssprache.",
      "ageStructureEn": "A young population with a median age of about 27; Guaraní is an official language alongside Spanish.",
      "government": "Präsidentielle Republik, lange von der Colorado-Partei dominiert.",
      "governmentEn": "A presidential republic, long dominated by the Colorado Party.",
      "economy": "Wachsende, agrarisch geprägte Volkswirtschaft mit niedrigen Steuern und billiger Energie.",
      "economyEn": "A growing, agriculture-based economy with low taxes and cheap energy.",
      "livelihood": "Soja- und Rindfleischexport, riesige Wasserkraft (Itaipú) und Landwirtschaft.",
      "livelihoodEn": "Soya and beef exports, huge hydropower (Itaipú) and agriculture.",
      "about": "Paraguay ist ein wenig bereister Binnenstaat im Herzen Südamerikas, geteilt durch den Río Paraguay in den feuchten Osten und den trockenen Chaco im Westen. Das Land ist authentisch, günstig und touristisch kaum erschlossen. Highlights sind die jesuitischen Missionsruinen, die weite Chaco-Wildnis und die entspannte Hauptstadt Asunción.",
      "aboutEn": "Paraguay is a little-visited landlocked country in the heart of South America, split by the Río Paraguay into the humid east and the dry Chaco in the west. It's authentic, cheap and barely developed for tourism. Highlights include the Jesuit mission ruins, the vast Chaco wilderness and the laid-back capital Asunción.",
      "history": "Vor der Kolonialzeit war das Gebiet von Guaraní-Völkern besiedelt. Die Spanier gründeten 1537 Asunción, eine der ältesten Städte des Kontinents; berühmt wurden die jesuitischen Reduktionen. 1811 wurde Paraguay unabhängig. Der verheerende Tripel-Allianz-Krieg (1864–1870) gegen Brasilien, Argentinien und Uruguay kostete einen Großteil der männlichen Bevölkerung das Leben.",
      "historyEn": "Before colonial times, the area was settled by Guaraní peoples. In 1537 the Spanish founded Asunción, one of the oldest cities on the continent; the Jesuit reductions became famous. Paraguay became independent in 1811. The devastating War of the Triple Alliance (1864–1870) against Brazil, Argentina and Uruguay cost the lives of a large part of the male population.",
      "language": "Paraguay ist offiziell zweisprachig: Neben Spanisch spricht die große Mehrheit Guaraní, eine indigene Sprache mit eigenem Stolz. Im Alltag mischen viele beide Sprachen zu 'Jopara', einem fließenden Wechsel zwischen Spanisch und Guaraní. Auch das paraguayische Spanisch kennt das Voseo. Wer ein paar Guaraní-Wörter lernt, gewinnt schnell Sympathien.",
      "languageEn": "Paraguay is officially bilingual: alongside Spanish, the vast majority speak Guaraní, an indigenous language they take real pride in. In everyday life many mix the two into 'Jopara', a fluid switching between Spanish and Guaraní. Paraguayan Spanish uses voseo too. Learn a few words of Guaraní and you'll quickly win people over.",
      "words": [
        {
          "es": "mba'éichapa",
          "de": "Wie geht's? (Guaraní-Begrüßung)",
          "en": "How are you? (Guaraní greeting)"
        },
        {
          "es": "argel",
          "de": "unsympathisch, nervig (paraguayischer Slang)",
          "en": "unpleasant, annoying (Paraguayan slang)"
        },
        {
          "es": "nde",
          "de": "Hey/Du (aus dem Guaraní)",
          "en": "hey/mate (from Guaraní)"
        },
        {
          "es": "tranquilopa",
          "de": "ganz entspannt (Mischung Spanisch/Guaraní)",
          "en": "totally relaxed (a mix of Spanish and Guaraní)"
        },
        {
          "es": "purete",
          "de": "super, cool, klasse",
          "en": "great, cool, brilliant"
        },
        {
          "es": "luego",
          "de": "verstärkendes Füllwort am Satzende (eigene Bedeutung in Paraguay)",
          "en": "an intensifying filler word at the end of a sentence (with its own meaning in Paraguay)"
        }
      ],
      "food": [
        {
          "name": "Sopa paraguaya",
          "desc": "Trotz des Namens keine Suppe, sondern ein herzhafter Maisbrot-Kuchen mit Käse.",
          "descEn": "Despite the name not a soup, but a hearty corn-bread cake with cheese.",
          "long": "Sopa paraguaya ist trotz ihres Namens keine Suppe, sondern ein herzhafter, kuchenartiger Maisbrot-Auflauf. Er wird aus Maismehl, Käse, Zwiebeln und Eiern gebacken und hat eine feste, saftige Konsistenz.",
          "longEn": "Despite its name, sopa paraguaya is not a soup but a hearty, cake-like corn-bread bake. It's baked from corn flour, cheese, onions and eggs and has a firm, moist texture.",
          "ingredients": "Maismehl, Frischkäse, Zwiebeln, Eier, Milch, Schmalz oder Öl",
          "ingredientsEn": "Corn flour, fresh cheese, onions, eggs, milk, lard or oil",
          "origin": "Die Sopa paraguaya gilt als Nationalgericht Paraguays und verbindet indigene Guaraní- mit spanischen Einflüssen.",
          "originEn": "Sopa paraguaya is regarded as Paraguay's national dish and combines indigenous Guaraní with Spanish influences.",
          "occasions": "Sie wird als Beilage zu Grillgerichten und bei Festen sowie Familientreffen gegessen.",
          "occasionsEn": "Eaten as a side to barbecue dishes and at festivals and family gatherings.",
          "order": "Una porción de sopa paraguaya, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/5/58/Sopa_Paraguaya_2.jpg"
        },
        {
          "name": "Chipa",
          "desc": "Ringförmiges Gebäck aus Maniokmehl und Käse, überall als Snack verkauft.",
          "descEn": "A ring-shaped bake of cassava flour and cheese, sold everywhere as a snack.",
          "long": "Chipa ist ein kleines Gebäck aus Maniokstärke und Käse, das außen knusprig und innen leicht zäh ist. Es wird oft als ringförmiges Brötchen geformt und überall als Snack verkauft.",
          "longEn": "Chipa is a small bake of cassava starch and cheese, crisp outside and slightly chewy within. It's often shaped into a ring-shaped roll and sold everywhere as a snack.",
          "ingredients": "Maniokstärke (almidón de mandioca), Käse, Eier, Schmalz, Milch oder Anis",
          "ingredientsEn": "Cassava starch (almidón de mandioca), cheese, eggs, lard, milk or anise",
          "origin": "Chipa hat Wurzeln in der Guaraní-Küche und ist in Paraguay und der Region weit verbreitet.",
          "originEn": "Chipa has roots in Guaraní cooking and is common in Paraguay and the region.",
          "occasions": "Sie wird als Snack zwischendurch, zum Frühstück und besonders in der Karwoche gegessen.",
          "occasionsEn": "Eaten as a snack in between, for breakfast and especially during Holy Week.",
          "order": "Dos chipas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Chipa_Paraguay.jpg/960px-Chipa_Paraguay.jpg"
        },
        {
          "name": "Mbejú",
          "desc": "Fladen aus Maniokstärke und Käse, knusprig in der Pfanne gebacken.",
          "descEn": "A flatbread of cassava starch and cheese, cooked crisp in a pan.",
          "long": "Mbejú ist ein flacher, fladenartiger Pfannkuchen aus Maniokstärke und Käse. Er wird in der Pfanne gebacken, ist innen kompakt und wird warm, oft zum Mate oder Tereré, gegessen.",
          "longEn": "Mbejú is a flat, pancake-like flatbread of cassava starch and cheese. It's cooked in a pan, is dense within and is eaten warm, often with mate or tereré.",
          "ingredients": "Maniokstärke, Maismehl, Käse, Schmalz, Milch, Salz",
          "ingredientsEn": "Cassava starch, corn flour, cheese, lard, milk, salt",
          "origin": "Mbejú ist ein traditionelles Gericht der Guaraní-Küche und in Paraguay weit verbreitet.",
          "originEn": "Mbejú is a traditional dish of Guaraní cooking and common in Paraguay.",
          "occasions": "Es wird vor allem zum Frühstück oder zur Jause zusammen mit Mate oder Tereré gegessen.",
          "occasionsEn": "Eaten above all for breakfast or a mid-morning snack together with mate or tereré.",
          "order": "Un mbejú, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/31/Mbey%C3%BA_paraguayo.jpg"
        },
        {
          "name": "Bori bori",
          "desc": "Deftige Suppe mit Mais-Käse-Klößchen, oft mit Hühnchen.",
          "descEn": "A hearty soup with corn-and-cheese dumplings, often with chicken.",
          "long": "Bori bori ist eine kräftige Suppe mit kleinen Klößchen aus Maismehl und Käse. Die Klößchen schwimmen in einer Brühe mit Fleisch und Gemüse und machen das Gericht zu einem wärmenden Komplettessen.",
          "longEn": "Bori bori is a robust soup with little dumplings of corn flour and cheese. The dumplings float in a broth with meat and vegetables, making the dish a warming all-in-one meal.",
          "ingredients": "Maismehl, Käse, Hühner- oder Rindfleisch, Brühe, Gemüse",
          "ingredientsEn": "Corn flour, cheese, chicken or beef, broth, vegetables",
          "origin": "Bori bori ist ein traditionelles Suppengericht der paraguayischen Küche mit Guaraní-Einflüssen.",
          "originEn": "Bori bori is a traditional soup of Paraguayan cooking with Guaraní influences.",
          "occasions": "Sie wird vor allem als wärmendes Mittagessen, gern an kühleren Tagen, gegessen.",
          "occasionsEn": "Eaten above all as a warming lunch, often on cooler days.",
          "order": "Un plato de bori bori, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Vor%C3%AD_vor%C3%AD_paraguay.jpg/960px-Vor%C3%AD_vor%C3%AD_paraguay.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, beliebter Alltagsklassiker.",
          "descEn": "A breaded escalope, a popular everyday classic.",
          "long": "Die Milanesa ist auch in Paraguay ein beliebtes paniertes Schnitzel. Sie wird mit Beilagen oder als Sandwich gegessen und gehört zur alltäglichen Küche des Landes.",
          "longEn": "In Paraguay too, the milanesa is a popular breaded escalope. It's eaten with sides or as a sandwich and is part of the country's everyday cooking.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz",
          "ingredientsEn": "Thin beef or chicken, egg, breadcrumbs, salt",
          "origin": "Die Milanesa geht auf die italienische Cotoletta zurück und ist über die Region nach Paraguay gelangt.",
          "originEn": "The milanesa traces back to the Italian cotoletta and reached Paraguay via the region.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "occasionsEn": "Eaten as an everyday lunch or dinner.",
          "order": "Una milanesa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Asado",
          "desc": "Gegrilltes Rindfleisch, fester Bestandteil geselliger Treffen.",
          "descEn": "Grilled beef, a fixture of social gatherings.",
          "long": "Asado ist auch in Paraguay ein beliebtes Grillgericht und ein geselliger Anlass. Verschiedene Fleischstücke werden über Holzkohle oder Feuer gegrillt und oft mit Sopa paraguaya oder Maniok serviert.",
          "longEn": "In Paraguay too, asado is a popular barbecue dish and a social occasion. Various cuts of meat are grilled over charcoal or fire and often served with sopa paraguaya or cassava.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Salz, Maniok als Beilage",
          "ingredientsEn": "Various cuts of beef, chorizo, salt, cassava on the side",
          "origin": "Die Asado-Tradition ist in der gesamten Region am Río de la Plata und in Paraguay fest verankert.",
          "originEn": "The asado tradition is firmly rooted throughout the Río de la Plata region and in Paraguay.",
          "occasions": "Es wird an Wochenenden, bei Familientreffen und Feiern zubereitet.",
          "occasionsEn": "Prepared at weekends, at family gatherings and celebrations.",
          "order": "Un asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        }
      ],
      "drink": [
        {
          "name": "Tereré",
          "desc": "Eiskalt aufgegossener Mate mit Kräutern, das Nationalgetränk gegen die Hitze.",
          "descEn": "Ice-cold infused mate with herbs, the national drink against the heat.",
          "long": "Tereré ist die kalte Variante des Mate und das Nationalgetränk Paraguays. Yerba Mate wird mit eiskaltem Wasser, oft mit frischen Kräutern (yuyos) aromatisiert, aufgegossen und ist ideal für das heiße Klima.",
          "longEn": "Tereré is the cold version of mate and the national drink of Paraguay. Yerba mate is infused with ice-cold water, often flavoured with fresh herbs (yuyos), and is perfect for the hot climate.",
          "ingredients": "Yerba Mate, eiskaltes Wasser, frische Kräuter (yuyos), optional Zitrone oder Minze",
          "ingredientsEn": "Yerba mate, ice-cold water, fresh herbs (yuyos), optionally lemon or mint",
          "origin": "Tereré hat Wurzeln in der Guaraní-Kultur und gilt als kulturelles Erbe Paraguays.",
          "originEn": "Tereré has roots in Guaraní culture and is regarded as a cultural heritage of Paraguay.",
          "occasions": "Es wird den ganzen Tag über, besonders bei Hitze und in geselliger Runde, getrunken.",
          "occasionsEn": "Drunk throughout the day, especially in the heat and in good company.",
          "order": "¿Tomamos un tereré?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Terer%C3%A9.jpg"
        },
        {
          "name": "Mosto",
          "desc": "Frisch gepresster Zuckerrohrsaft, süß und erfrischend.",
          "descEn": "Freshly pressed sugar-cane juice, sweet and refreshing.",
          "long": "Mosto ist in Paraguay ein süßer Saft aus frisch gepresstem Zuckerrohr. Das erfrischende, alkoholfreie Getränk wird oft mit etwas Zitrone und Eis serviert und an Straßenständen verkauft.",
          "longEn": "In Paraguay, mosto is a sweet juice of freshly pressed sugar cane. The refreshing, non-alcoholic drink is often served with a little lemon and ice and sold at street stalls.",
          "ingredients": "Frisch gepresster Zuckerrohrsaft, optional Zitrone, Eis",
          "ingredientsEn": "Freshly pressed sugar-cane juice, optionally lemon, ice",
          "origin": "Mosto ist eng mit dem Zuckerrohranbau in Paraguay verbunden und ein verbreitetes Straßengetränk.",
          "originEn": "Mosto is closely tied to sugar-cane farming in Paraguay and is a common street drink.",
          "occasions": "Es wird vor allem als erfrischender Durstlöscher bei Hitze getrunken.",
          "occasionsEn": "Drunk above all as a refreshing thirst-quencher in the heat.",
          "order": "Un mosto bien frío, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/15/Mosto.jpg"
        },
        {
          "name": "Caña",
          "desc": "Zuckerrohrschnaps, das verbreitetste lokale Destillat.",
          "descEn": "A cane-sugar spirit, the most common local distillate.",
          "long": "Caña ist ein Branntwein aus Zuckerrohr und die traditionelle Spirituose Paraguays. Der klare, kräftige Schnaps wird pur oder in Mischgetränken getrunken und ist im ganzen Land verbreitet.",
          "longEn": "Caña is a spirit made from sugar cane and the traditional tipple of Paraguay. The clear, strong spirit is drunk neat or in mixed drinks and is found throughout the country.",
          "ingredients": "Destillat aus Zuckerrohr",
          "ingredientsEn": "Distillate of sugar cane",
          "origin": "Caña geht auf den Zuckerrohranbau der Kolonialzeit zurück und ist eine traditionelle Spirituose Paraguays.",
          "originEn": "Caña goes back to the sugar-cane farming of colonial times and is a traditional spirit of Paraguay.",
          "occasions": "Sie wird bei geselligen Anlässen und Feiern getrunken.",
          "occasionsEn": "Drunk at social occasions and celebrations.",
          "order": "Un trago de caña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/TAPA_ROJA.jpeg/960px-TAPA_ROJA.jpeg"
        },
        {
          "name": "Pilsen",
          "desc": "Beliebteste paraguayische Biermarke, eiskalt getrunken.",
          "descEn": "Paraguay's most popular beer brand, drunk ice-cold.",
          "long": "Pilsen ist die bekannteste Biermarke Paraguays und ein helles Lagerbier. Es wird landesweit getrunken und ist besonders bei Hitze und zum Asado beliebt.",
          "longEn": "Pilsen is the best-known beer brand of Paraguay and a pale lager. It's drunk nationwide and is especially popular in the heat and with the asado.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "ingredientsEn": "Water, barley malt, hops, yeast",
          "origin": "Pilsen ist eine traditionsreiche paraguayische Biermarke und im ganzen Land verbreitet.",
          "originEn": "Pilsen is a long-established Paraguayan beer brand, common all over the country.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen, gern gut gekühlt, getrunken.",
          "occasionsEn": "Drunk with meals and at social occasions, ideally well chilled.",
          "order": "Una Pilsen bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/16/Cerveza_Pilsen_Publicidad.jpg"
        }
      ],
      "tip": "Trink wie die Einheimischen eiskalten Tereré gegen die Hitze und lerne ein paar Guaraní-Wörter; das öffnet in Paraguay viele Türen und Herzen.",
      "tipEn": "Drink ice-cold tereré like the locals to beat the heat and learn a few words of Guaraní; in Paraguay that opens plenty of doors and hearts."
    }
  ];

  window.SC = window.SC || {};
  window.SC.countries = { REGIONS, LIST };
})();
