/*
 * countries.js  (SC.countries) – Modell für die Infoseite "Länderkunde".
 * REINE DATEN, keine Logik (wie data.js). Wird von ui.renderInfo gerendert,
 * der Controller (app.js) wählt per Dropdown ein Land aus.
 *
 * Region:  einer von REGIONS (Reihenfolge im Dropdown = Reihenfolge hier).
 * Land:    { id, name, flag, region, capital, tagline,
 *            about, history, language, words:[{es,de}],
 *            food:[Gericht], drink:[Gericht], tip }
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
      "name": "Mexiko",
      "flag": "🇲🇽",
      "region": "Mittelamerika",
      "capital": "Mexiko-Stadt",
      "tagline": "Tacos, Maya-Ruinen und endlose Karibikstrände",
      "about": "Mexiko ist das nördlichste Land Lateinamerikas mit über 9.000 km Küste an Pazifik und Karibik. Backpacker zieht es zu den Maya-Ruinen von Yucatán, den Cenoten, kolonialen Städten wie Oaxaca und dem pulsierenden Mexiko-Stadt. Wüsten, Vulkane und Dschungel machen die Geografie extrem vielfältig.",
      "history": "Vor der Eroberung blühten hier die Hochkulturen der Olmeken, Maya und Azteken. 1521 unterwarf Hernán Cortés das Aztekenreich, woraufhin drei Jahrhunderte spanische Kolonialherrschaft folgten. 1810 begann der Unabhängigkeitskampf, 1821 wurde Mexiko unabhängig. Die Revolution von 1910 prägt bis heute das nationale Selbstverständnis.",
      "language": "Das mexikanische Spanisch gilt als klar und gut verständlich, mit weichem Tonfall. Voseo gibt es nicht – man verwendet 'tú'. Typisch sind viele Nahuatl-Lehnwörter wie 'chocolate', 'tomate' oder 'aguacate'. Neben Spanisch werden noch rund 68 indigene Sprachen gesprochen, vor allem Nahuatl und Maya.",
      "words": [
        {
          "es": "¿Qué onda?",
          "de": "Was geht? (lockere Begrüßung)"
        },
        {
          "es": "¡Órale!",
          "de": "Wow! / Los geht's! (vielseitiger Ausruf)"
        },
        {
          "es": "chido",
          "de": "cool, super"
        },
        {
          "es": "güey",
          "de": "Alter, Kumpel (sehr umgangssprachlich)"
        },
        {
          "es": "ahorita",
          "de": "gleich / sofort (oft eher vage)"
        },
        {
          "es": "no manches",
          "de": "echt jetzt? / krass!"
        }
      ],
      "food": [
        {
          "name": "Tacos al pastor",
          "desc": "Mariniertes Schweinefleisch vom Drehspieß mit Ananas, auf Maistortilla.",
          "long": "Dünn geschnittenes, mariniertes Schweinefleisch, das auf einem vertikalen Drehspieß (trompo) gegart und mit einem Stück Ananas gekrönt wird. Serviert auf kleinen Maistortillas mit Koriander, Zwiebeln und Salsa, oft direkt vom Stand. Saftig, leicht süßlich-würzig und unwiderstehlich aromatisch.",
          "ingredients": "Maistortilla, mariniertes Schweinefleisch, Ananas, Koriander, Zwiebeln, Salsa, Limette",
          "origin": "Entstanden im 20. Jahrhundert durch libanesische Einwanderer, die das Drehspieß-Prinzip des Shawarma nach Mexiko brachten und an lokale Zutaten anpassten.",
          "occasions": "Klassisches Streetfood, das man vor allem abends und nachts an Taquerías genießt.",
          "order": "Una orden de tacos al pastor, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/%28El_Flaco%29_Al_Pastor_Tacos.jpg/960px-%28El_Flaco%29_Al_Pastor_Tacos.jpg"
        },
        {
          "name": "Mole poblano",
          "desc": "Komplexe Sauce aus Chili und Schokolade, meist über Hähnchen.",
          "long": "Eine dunkle, komplexe Sauce aus Dutzenden Zutaten, darunter Chilischoten und Schokolade, traditionell über Hühnchen oder Truthahn serviert. Sie schmeckt vielschichtig: würzig, leicht bitter, süßlich und tiefgründig. Gilt als eines der Nationalgerichte Mexikos.",
          "ingredients": "Verschiedene Chilis, Schokolade, Gewürze, Nüsse und Samen, Tomaten, Brot, Hühnchen oder Truthahn",
          "origin": "Stammt aus dem Bundesstaat Puebla; der Legende nach in einem Kloster erfunden, vereint die Sauce indigene und spanische Einflüsse.",
          "occasions": "Festtagsgericht zu besonderen Anlässen wie Hochzeiten, Taufen und religiösen Feiern.",
          "order": "Quisiera el pollo con mole poblano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Mole_in_Puebla.JPG/960px-Mole_in_Puebla.JPG"
        },
        {
          "name": "Tamales",
          "desc": "Gedämpfter Maisteig mit Füllung, in Maisblättern gegart.",
          "long": "In Mais- oder Bananenblätter gewickelte und gedämpfte Maisteigtaschen, gefüllt mit Fleisch, Käse, Chili oder süßen Zutaten. Die Hülle wird vor dem Essen abgelöst. Weich, herzhaft oder süß und wunderbar sättigend.",
          "ingredients": "Maisteig (masa), Schmalz, Füllung (Fleisch, Chili, Käse oder Süßes), Mais- oder Bananenblätter",
          "origin": "Ein präkolumbisches Gericht mit Jahrtausende alter Tradition, das in ganz Mesoamerika verbreitet war.",
          "occasions": "Beliebtes Frühstück und Festessen, besonders zum Día de la Candelaria und an Weihnachten.",
          "order": "Me da dos tamales, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Tamales_mexicanos.jpg"
        },
        {
          "name": "Chiles en nogada",
          "desc": "Gefüllte Paprika mit Walnusssauce und Granatapfel in Nationalfarben.",
          "long": "Gefüllte Poblano-Chilis mit einer cremigen Walnusssauce und Granatapfelkernen, die die Farben der mexikanischen Flagge zeigen. Die Füllung aus Hackfleisch und Früchten macht das Gericht süß-herzhaft. Optisch beeindruckend und festlich.",
          "ingredients": "Poblano-Chilis, Hackfleisch mit Früchten (picadillo), Walnusssauce (nogada), Granatapfelkerne, Petersilie",
          "origin": "Stammt aus Puebla und wird mit der Feier der mexikanischen Unabhängigkeit in Verbindung gebracht; die Farben symbolisieren die Nationalflagge.",
          "occasions": "Saisongericht, das vor allem im Spätsommer rund um den Unabhängigkeitstag im September gegessen wird.",
          "order": "Quisiera unos chiles en nogada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Chile_relleno_en_nogada_con_granada.jpg/960px-Chile_relleno_en_nogada_con_granada.jpg"
        },
        {
          "name": "Pozole",
          "desc": "Herzhafter Eintopf aus Hominy-Mais und Fleisch.",
          "long": "Ein herzhafter Eintopf aus großen Maiskörnern (Hominy) und Fleisch, meist Schwein, in würziger Brühe. Wird mit Salat, Rettich, Zwiebeln, Limette und Chili am Tisch garniert. Wärmend, sättigend und sehr aromatisch.",
          "ingredients": "Hominy-Mais, Schweine- oder Hühnerfleisch, Chili, Garnituren (Salat, Rettich, Zwiebeln, Limette, Oregano)",
          "origin": "Ein Gericht mit präkolumbischen Wurzeln, das einst rituelle Bedeutung hatte und bis heute zur mexikanischen Festkultur gehört.",
          "occasions": "Typisches Wochenend- und Feiertagsessen, oft an Nationalfeiertagen und zu Familienfeiern.",
          "order": "Un pozole rojo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Pozole_rojo_%282017%29.jpg"
        },
        {
          "name": "Cochinita pibil",
          "desc": "Langsam gegartes, in Achiote mariniertes Schweinefleisch aus Yucatán.",
          "long": "Langsam gegartes Schweinefleisch, mariniert in Achiote und Bitterorangensaft, traditionell in Bananenblättern gegart. Das Fleisch wird butterzart und intensiv würzig mit erdig-säuerlicher Note. Serviert mit eingelegten roten Zwiebeln und Tortillas.",
          "ingredients": "Schweinefleisch, Achiote (Annatto), Bitterorangensaft, Bananenblätter, eingelegte rote Zwiebeln, Habanero",
          "origin": "Ein traditionelles Gericht der Halbinsel Yucatán mit Maya-Wurzeln; 'pibil' verweist auf das Garen in einer Erdgrube.",
          "occasions": "Beliebtes Sonntagsgericht und Festessen, oft als Taco-Füllung serviert.",
          "order": "Unos tacos de cochinita pibil, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Cochinita_pibil_2.jpg/960px-Cochinita_pibil_2.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mezcal",
          "desc": "Rauchiger Agavenbrand, traditionell pur mit Orange und Wurmsalz getrunken.",
          "long": "Eine destillierte Spirituose aus dem Herzen der Agave, bekannt für ihren charakteristisch rauchigen Geschmack. Wird oft pur in kleinen Schlucken mit Orangenscheiben und Wurmsalz (sal de gusano) getrunken. Komplex, erdig und kräftig.",
          "ingredients": "Agave (oft Espadín), Wasser; traditionell begleitet von Orange und sal de gusano",
          "origin": "Stammt überwiegend aus dem Bundesstaat Oaxaca, wo die Agave in Erdöfen geröstet wird, was den rauchigen Charakter erzeugt.",
          "occasions": "Getränk für gesellige Abende und Feiern, oft langsam genippt statt geschossen.",
          "order": "Un mezcal, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Mezcal_bottles_.jpg/960px-Mezcal_bottles_.jpg"
        },
        {
          "name": "Tequila",
          "desc": "Berühmter Agavenbrand aus der Region Jalisco.",
          "long": "Eine Spirituose aus der blauen Agave, je nach Reifung von klar (blanco) bis goldbraun (añejo). Wird pur, als Shot mit Salz und Limette oder in Cocktails wie der Margarita getrunken. Kräftig und je nach Sorte mild bis komplex.",
          "ingredients": "Blaue Agave, Wasser; klassisch begleitet von Salz und Limette",
          "origin": "Benannt nach der Stadt Tequila im Bundesstaat Jalisco und durch eine geschützte Herkunftsbezeichnung definiert.",
          "occasions": "Beliebt bei Feiern und Partys, sowohl als Shot als auch in Cocktails.",
          "order": "Un tequila, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/15-09-26-RalfR-WLC-0244.jpg/960px-15-09-26-RalfR-WLC-0244.jpg"
        },
        {
          "name": "Horchata",
          "desc": "Süßes, erfrischendes Reisgetränk mit Zimt.",
          "long": "Ein erfrischendes, milchig-weißes Getränk aus eingeweichtem Reis, gesüßt und mit Zimt verfeinert. Wird gut gekühlt serviert und schmeckt cremig-süß. In Mexiko eines der klassischen aguas frescas.",
          "ingredients": "Reis, Zucker, Zimt, Wasser, manchmal Vanille oder Milch",
          "origin": "Geht auf ein spanisches Getränk zurück, das in Mexiko in einer Reisvariante populär wurde.",
          "occasions": "Erfrischung zu herzhaften Speisen und an heißen Tagen.",
          "order": "Un agua de horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Agua de Jamaica",
          "desc": "Erfrischender Eistee aus Hibiskusblüten.",
          "long": "Ein leuchtend rotes, erfrischendes Getränk aus getrockneten Hibiskusblüten, gesüßt und gekühlt serviert. Schmeckt angenehm säuerlich-fruchtig, ähnlich wie Cranberry. Eines der beliebtesten aguas frescas Mexikos.",
          "ingredients": "Getrocknete Hibiskusblüten (Jamaica), Zucker, Wasser",
          "origin": "Die Hibiskuspflanze gelangte über Handelswege nach Mexiko, wo das Getränk zu einem festen Bestandteil der aguas frescas wurde.",
          "occasions": "Erfrischung zum Essen, besonders an warmen Tagen und in Fondas.",
          "order": "Un agua de Jamaica, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/A_glass_of_hibiscus_tea_01.jpg/960px-A_glass_of_hibiscus_tea_01.jpg"
        }
      ],
      "tip": "Trinke nur abgefülltes oder gefiltertes Wasser – auch beim Zähneputzen."
    },
    {
      "id": "guatemala",
      "name": "Guatemala",
      "flag": "🇬🇹",
      "region": "Mittelamerika",
      "capital": "Guatemala-Stadt",
      "tagline": "Vulkane, Maya-Kultur und der türkisfarbene Atitlán-See",
      "about": "Guatemala ist das Herz der Maya-Welt mit über 30 Vulkanen, dichtem Regenwald und dem kolonialen Juwel Antigua. Backpacker lieben den Atitlán-See, die Ruinen von Tikal und die Vulkanwanderung zum aktiven Acatenango. Das Hochland ist kühl, die Küsten tropisch-heiß.",
      "history": "Guatemala war Zentrum der klassischen Maya-Zivilisation, deren größte Stadt Tikal war. 1524 eroberte Pedro de Alvarado die Region für Spanien. 1821 wurde das Land unabhängig, später folgte ein brutaler Bürgerkrieg (1960–1996). Die indigene Maya-Bevölkerung macht bis heute einen großen Teil der Gesellschaft aus.",
      "language": "Das guatemaltekische Spanisch wird langsam und deutlich gesprochen, ideal für Lernende. Voseo ist verbreitet – statt 'tú' hört man oft 'vos'. Daneben werden über 20 Maya-Sprachen wie K'iche', Kaqchikel und Mam gesprochen. Viele Indigene sprechen Spanisch als Zweitsprache.",
      "words": [
        {
          "es": "¡Qué chilero!",
          "de": "Wie cool! / Super!"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú', sehr verbreitet)"
        },
        {
          "es": "cerote",
          "de": "Kumpel (derb-freundschaftlich)"
        },
        {
          "es": "chapín",
          "de": "Guatemalteke/in (Spitzname)"
        },
        {
          "es": "patojo",
          "de": "Kind, junger Mensch"
        },
        {
          "es": "¡Púchica!",
          "de": "Mensch! / Verflixt! (milder Ausruf)"
        }
      ],
      "food": [
        {
          "name": "Pepián",
          "desc": "Würziger Eintopf aus Fleisch, Gemüse und gerösteten Samen, ein Nationalgericht.",
          "long": "Ein dicker, würziger Eintopf aus Fleisch in einer Sauce aus gerösteten Samen, Gewürzen und Chilis. Die Röstung verleiht ihm eine tiefe, erdige Note. Wird meist mit Reis und Tortillas serviert.",
          "ingredients": "Hühner- oder Rindfleisch, Kürbis- und Sesamsamen, Tomaten, Chilis, Gewürze, Reis",
          "origin": "Gilt als eines der ältesten Gerichte Guatemalas mit Maya-Wurzeln und vereint indigene und spanische Einflüsse.",
          "occasions": "Festliches Gericht zu besonderen Anlässen und Familienfeiern.",
          "order": "Un pepián de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cocinando_El_Pepian.jpg/960px-Cocinando_El_Pepian.jpg"
        },
        {
          "name": "Tamales colorados",
          "desc": "Maisteig mit Fleisch und roter Sauce, in Bananenblättern gegart.",
          "long": "In Bananenblätter gewickelte, gedämpfte Maisteigtaschen mit roter, leicht würziger Sauce und einer Füllung aus Fleisch. Die Farbe stammt von Tomaten und Achiote. Weich, herzhaft und festlich.",
          "ingredients": "Maisteig (masa), rote Sauce mit Tomaten und Achiote, Hühner- oder Schweinefleisch, Paprika, Oliven, Bananenblätter",
          "origin": "Eine guatemaltekische Variante der mesoamerikanischen Tamal-Tradition mit präkolumbischen Wurzeln.",
          "occasions": "Typisch für Wochenenden, Weihnachten und besondere Feiertage.",
          "order": "Dos tamales colorados, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Tamales_mexicanos.jpg"
        },
        {
          "name": "Kak'ik",
          "desc": "Würzige Truthahnsuppe der Q'eqchi'-Maya mit Achiote und Koriander.",
          "long": "Eine würzige Truthahnsuppe in einer roten Brühe aus Tomaten, Chilis und Gewürzen. Sie schmeckt kräftig, leicht scharf und aromatisch. Wird mit Reis und Tamalitos serviert.",
          "ingredients": "Truthahn, Tomaten, Chilis, Koriander, Minze, Achiote, Gewürze",
          "origin": "Ein traditionelles Gericht der Q'eqchi'-Maya aus dem Hochland von Alta Verapaz mit langer indigener Geschichte.",
          "occasions": "Festtagsgericht zu zeremoniellen und besonderen Anlässen.",
          "order": "Un kak'ik, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/2010.05.13.141849_Kac-iq_Fonda_Calle_Real_Antigua_Guatemala.jpg/960px-2010.05.13.141849_Kac-iq_Fonda_Calle_Real_Antigua_Guatemala.jpg"
        },
        {
          "name": "Hilachas",
          "desc": "Zerzupftes Rindfleisch in Tomaten-Chili-Sauce.",
          "long": "Zerzupftes Rindfleisch in einer Tomatensauce mit Gemüse, deren Name 'Fäden' bedeutet, weil das Fleisch faserig gezupft wird. Schmeckt herzhaft und mild würzig. Wird mit Reis und Tortillas gegessen.",
          "ingredients": "Zerzupftes Rindfleisch, Tomaten, Kartoffeln, Karotten, Chilis, Gewürze, Reis",
          "origin": "Ein traditionelles guatemaltekisches Hausmannsgericht, das spanische und indigene Kocheinflüsse verbindet.",
          "occasions": "Beliebtes Mittagessen für Familienanlässe und Wochenenden.",
          "order": "Unas hilachas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Hilacha.jpg/960px-Hilacha.jpg"
        },
        {
          "name": "Jocón",
          "desc": "Hähnchen in grüner Tomatillo-Koriander-Sauce.",
          "long": "Ein grüner Eintopf aus Hühnchen in einer Sauce aus Tomatillos, grünem Koriander und Kürbissamen. Die Sauce ist frisch, leicht säuerlich und aromatisch. Serviert mit Reis und Tortillas.",
          "ingredients": "Hühnchen, Tomatillos, grüne Tomaten, Koriander, Frühlingszwiebeln, Kürbissamen, Reis",
          "origin": "Eines der traditionellen Maya-Gerichte des guatemaltekischen Hochlands.",
          "occasions": "Gericht für Familienessen und besondere Gelegenheiten.",
          "order": "Un jocón de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/07/Jocon.jpg"
        },
        {
          "name": "Rellenitos",
          "desc": "Frittierte Kochbananen-Bällchen mit süßer Bohnenfüllung.",
          "long": "Süße Bällchen aus Kochbananenteig, gefüllt mit gesüßten schwarzen Bohnen und frittiert. Außen knusprig, innen süß und cremig. Werden mit Zucker bestreut als Dessert oder Snack genossen.",
          "ingredients": "Reife Kochbananen, schwarze Bohnen, Zucker, Zimt, Öl zum Frittieren",
          "origin": "Eine traditionelle guatemaltekische Süßspeise, die die Kombination aus Kochbananen und Bohnen kreativ nutzt.",
          "occasions": "Beliebtes Dessert und Nachmittagssnack.",
          "order": "Unos rellenitos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Pl%C3%A1tanos_rellenos_en_Para%C3%ADso%2C_Tabasco.jpg/960px-Pl%C3%A1tanos_rellenos_en_Para%C3%ADso%2C_Tabasco.jpg"
        }
      ],
      "drink": [
        {
          "name": "Café guatemalteco",
          "desc": "Weltberühmter Hochlandkaffee mit ausgeprägtem Aroma.",
          "long": "Hochwertiger Hochlandkaffee, bekannt für sein ausgewogenes Aroma mit fruchtigen und schokoladigen Noten. Wird meist schwarz oder mit etwas Zucker getrunken. Gilt international als Spitzenkaffee.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "origin": "Guatemala zählt zu den renommiertesten Kaffeeanbauländern der Welt, mit Anbaugebieten wie Antigua und Huehuetenango.",
          "occasions": "Getränk für den Morgen und gesellige Pausen.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Espresso_Coffee_01.jpg/960px-Espresso_Coffee_01.jpg"
        },
        {
          "name": "Atol de elote",
          "desc": "Warmes, süßes Getränk aus frischem Mais.",
          "long": "Ein warmes, cremiges Getränk aus frischem Mais, Milch und Zucker mit Zimt. Es ist dickflüssig, süß und sättigend. Wird oft an Straßenständen heiß serviert.",
          "ingredients": "Frischer Mais (elote), Milch, Zucker, Zimt",
          "origin": "Eine guatemaltekische Variante des präkolumbischen Atoles, eines traditionellen Maisgetränks Mesoamerikas.",
          "occasions": "Warmes Getränk für kühle Abende und als Frühstück oder Snack.",
          "order": "Un atol de elote, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Atole_de_guayaba.jpg/960px-Atole_de_guayaba.jpg"
        },
        {
          "name": "Ron Zacapa",
          "desc": "Preisgekrönter, im Hochland gereifter Premium-Rum.",
          "long": "Ein preisgekrönter Premium-Rum, der in der Höhe gereift wird und für seine seidige, komplexe Note mit Karamell- und Vanillearomen bekannt ist. Wird pur oder auf Eis genossen. Gilt als einer der besten Rums der Welt.",
          "ingredients": "Erster Zuckerrohrhonig, gereift in Fässern",
          "origin": "Hergestellt in Guatemala und benannt nach der Stadt Zacapa; gereift im Hochland mittels Solera-Verfahren.",
          "occasions": "Genussgetränk für besondere Anlässe und entspannte Abende.",
          "order": "Un Ron Zacapa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ron_Zacapa_Centenario_23_anos.jpg"
        },
        {
          "name": "Rosa de Jamaica",
          "desc": "Erfrischender Hibiskus-Eistee.",
          "long": "Ein erfrischendes rotes Getränk aus Hibiskusblüten, gesüßt und gekühlt serviert. Schmeckt angenehm säuerlich und fruchtig. Eine beliebte natürliche Erfrischung.",
          "ingredients": "Getrocknete Hibiskusblüten, Zucker, Wasser",
          "origin": "Die Hibiskuspflanze wird in Guatemala für dieses traditionelle Erfrischungsgetränk verwendet.",
          "occasions": "Erfrischung zum Essen und an warmen Tagen.",
          "order": "Un fresco de rosa de Jamaica, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/A_glass_of_hibiscus_tea_01.jpg/960px-A_glass_of_hibiscus_tea_01.jpg"
        }
      ],
      "tip": "Den Vulkan Acatenango nur mit Guide und warmer Kleidung besteigen – nachts wird es eiskalt."
    },
    {
      "id": "honduras",
      "name": "Honduras",
      "flag": "🇭🇳",
      "region": "Mittelamerika",
      "capital": "Tegucigalpa",
      "tagline": "Karibische Tauchparadiese und Maya-Ruinen",
      "about": "Honduras lockt mit den Bay Islands Roatán und Utila, einem der günstigsten Tauchreviere der Welt am zweitgrößten Riff der Erde. Im Landesinneren liegen die Maya-Ruinen von Copán und üppige Bergnebelwälder. Die Karibikküste ist tropisch, das Hochland angenehm mild.",
      "history": "In Copán blühte eine bedeutende Maya-Stadt mit kunstvollen Stelen. 1502 erreichte Kolumbus die Küste, danach kam das Gebiet unter spanische Herrschaft. 1821 wurde Honduras unabhängig und war kurz Teil der Zentralamerikanischen Föderation. Im 20. Jahrhundert prägten Bananenkonzerne die Wirtschaft – daher der Begriff 'Bananenrepublik'.",
      "language": "Das honduranische Spanisch nutzt den Voseo, 'vos' ersetzt oft 'tú'. Die Aussprache ist eher schnell, Endsilben werden manchmal verschluckt. Typisch ist der Ausdruck 'catracho' für Honduraner. Indigene Sprachen wie Garífuna an der Küste und Miskito im Osten sind noch lebendig.",
      "words": [
        {
          "es": "catracho",
          "de": "Honduraner/in (Spitzname)"
        },
        {
          "es": "¡Qué tuanis!",
          "de": "Wie cool! / Super!"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')"
        },
        {
          "es": "pisto",
          "de": "Geld"
        },
        {
          "es": "macanudo",
          "de": "großartig, klasse"
        },
        {
          "es": "cipote",
          "de": "Kind, Junge"
        }
      ],
      "food": [
        {
          "name": "Baleada",
          "desc": "Dicke Weizentortilla mit Bohnen, Käse und Sahne, der Streetfood-Klassiker.",
          "long": "Eine dicke Weizentortilla, gefaltet und gefüllt mit zerdrückten Bohnen, saurer Sahne und Käse. Optional kommen Ei, Avocado oder Fleisch hinzu. Einfach, sättigend und das beliebteste Streetfood des Landes.",
          "ingredients": "Weizentortilla, gebratene Bohnen, saure Sahne (mantequilla), Trockenkäse, optional Ei oder Avocado",
          "origin": "Ein typisch honduranisches Gericht, das vor allem an der Nordküste populär wurde.",
          "occasions": "Allgegenwärtiges Streetfood zum Frühstück oder als schneller Snack zu jeder Tageszeit.",
          "order": "Una baleada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Baleada.jpg"
        },
        {
          "name": "Sopa de caracol",
          "desc": "Cremige Meeresschnecken-Suppe mit Kokosmilch.",
          "long": "Eine cremige Meeresschneckensuppe in Kokosmilch mit Yuca, Kochbananen und Gewürzen. Sie schmeckt reichhaltig, leicht süßlich und aromatisch nach Meer. Ein Festessen der Karibikküste.",
          "ingredients": "Meeresschnecken (caracol), Kokosmilch, Yuca, Kochbananen, Koriander, Gewürze",
          "origin": "Ein Gericht der Garífuna-Kultur an der honduranischen Karibikküste, durch ein bekanntes Lied auch international berühmt geworden.",
          "occasions": "Festliches Wochenend- und Feiergericht, besonders an der Küste.",
          "order": "Una sopa de caracol, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/3b/%22Sopa_de_Caracol%22.jpg"
        },
        {
          "name": "Plato típico",
          "desc": "Teller mit Fleisch, Bohnen, Reis, Kochbanane und Käse.",
          "long": "Ein üppiger Teller mit einer Auswahl typischer Speisen: gegrilltes Fleisch, Bohnen, Reis, gebratene Kochbananen, Käse und saure Sahne. Eine komplette, herzhafte Mahlzeit. Spiegelt die ganze Bandbreite der honduranischen Küche wider.",
          "ingredients": "Gegrilltes Fleisch, Bohnen, Reis, gebratene Kochbananen, Käse, saure Sahne, Avocado, Tortillas",
          "origin": "Eine Zusammenstellung klassischer honduranischer Grundnahrungsmittel zu einem repräsentativen Nationalteller.",
          "occasions": "Reichhaltiges Mittag- oder Wochenendessen für Familien und Besucher.",
          "order": "Un plato típico, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Honduran_food_breakfast.jpg/960px-Honduran_food_breakfast.jpg"
        },
        {
          "name": "Tajadas",
          "desc": "Frittierte grüne Kochbananenscheiben, oft mit Fleisch.",
          "long": "Dünn geschnittene, frittierte grüne Kochbananen, knusprig und leicht salzig. Werden oft als Beilage oder mit Fleisch und Salat als Hauptgericht (con todo) serviert. Ein beliebter, knuspriger Snack.",
          "ingredients": "Grüne Kochbananen, Öl zum Frittieren, Salz, optional Fleisch und Krautsalat",
          "origin": "Ein in ganz Mittelamerika verbreitetes Kochbananengericht, das in Honduras zum Alltag gehört.",
          "occasions": "Beliebte Beilage und Streetfood-Snack zu jeder Gelegenheit.",
          "order": "Unas tajadas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Platanas_fritas.jpg/960px-Platanas_fritas.jpg"
        },
        {
          "name": "Pastelitos",
          "desc": "Frittierte Teigtaschen mit Fleisch- oder Kartoffelfüllung.",
          "long": "Frittierte Maisteigtaschen, gefüllt mit gewürztem Fleisch, Kartoffeln und Reis. Außen knusprig, innen herzhaft. Werden oft mit Salsa und Krautsalat serviert.",
          "ingredients": "Maisteig, Hackfleisch, Kartoffeln, Reis, Gewürze, Krautsalat, Salsa",
          "origin": "Ein traditioneller honduranischer Snack, der zur Familie der frittierten Teigtaschen Mittelamerikas gehört.",
          "occasions": "Snack und Imbiss, beliebt an Ständen und bei Feiern.",
          "order": "Unos pastelitos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/9/92/Pastelitos_criollos_argentinos.jpg"
        },
        {
          "name": "Yuca con chicharrón",
          "desc": "Gekochter Maniok mit knusprigem Schweinefleisch.",
          "long": "Gekochte oder frittierte Yuca, serviert mit knusprigem Schweinefleisch und eingelegtem Krautsalat. Die Kombination ist herzhaft, knusprig und säuerlich-frisch. Ein populäres Gericht von Straßenständen.",
          "ingredients": "Yuca, knuspriges Schweinefleisch (chicharrón), eingelegter Krautsalat (curtido), Limette",
          "origin": "Ein traditionelles Gericht Mittelamerikas, das die Stärkeknolle Yuca mit frittiertem Schwein verbindet.",
          "occasions": "Beliebtes Streetfood, oft am Nachmittag oder bei Festen.",
          "order": "Una yuca con chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Chicharrones_Cerdo_Salamanca_02.jpg/960px-Chicharrones_Cerdo_Salamanca_02.jpg"
        }
      ],
      "drink": [
        {
          "name": "Horchata",
          "desc": "Süßes Reis- oder Samengetränk mit Zimt.",
          "long": "Ein süßes, erfrischendes Getränk, das in Honduras oft aus Samen, Reis oder Morro-Kernen mit Zimt und Zucker zubereitet wird. Cremig-mild und gut gekühlt serviert. Eine klassische Erfrischung zum Essen.",
          "ingredients": "Morro- oder Reissamen, Zucker, Zimt, Wasser oder Milch",
          "origin": "Eine mittelamerikanische Variante der Horchata, regional mit unterschiedlichen Samen zubereitet.",
          "occasions": "Erfrischung zum Essen und an heißen Tagen.",
          "order": "Una horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Café hondureño",
          "desc": "Hochwertiger Hochlandkaffee, ein wichtiges Exportgut.",
          "long": "Honduranischer Hochlandkaffee mit mildem, ausgewogenem Aroma und sanften fruchtigen Noten. Wird meist schwarz oder leicht gesüßt getrunken. Honduras ist ein bedeutender Kaffeeexporteur.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "origin": "Honduras gehört zu den größten Kaffeeproduzenten Mittelamerikas mit Anbau in mehreren Hochlandregionen.",
          "occasions": "Getränk für den Morgen und Pausen.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Coffeebeansorting.jpg"
        },
        {
          "name": "Cerveza Salva Vida",
          "desc": "Beliebtes lokales Lagerbier.",
          "long": "Ein traditionelles honduranisches Lagerbier, mild und süffig. Wird gut gekühlt getrunken und ist im ganzen Land verbreitet. Eine der bekanntesten Biermarken des Landes.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Eine in Honduras gebraute, traditionsreiche Biermarke.",
          "occasions": "Erfrischung für gesellige Anlässe und zum Essen.",
          "order": "Una Salva Vida bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Beer_wuerzburger_hofbraue_v.jpg/960px-Beer_wuerzburger_hofbraue_v.jpg"
        },
        {
          "name": "Licuado",
          "desc": "Frischer Fruchtshake mit Milch oder Wasser.",
          "long": "Ein erfrischendes Mixgetränk aus frischen Früchten, gemixt mit Milch oder Wasser und Zucker. Cremig, fruchtig und sättigend. Beliebte Sorten sind Banane, Papaya und Erdbeere.",
          "ingredients": "Frische Früchte, Milch oder Wasser, Zucker, Eis",
          "origin": "Ein in ganz Lateinamerika verbreitetes Fruchtmixgetränk.",
          "occasions": "Erfrischung zum Frühstück oder als Snack zwischendurch.",
          "order": "Un licuado de banano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/37/2011.09_smoothie2.JPG"
        }
      ],
      "tip": "Roatán und Utila sind sicher und entspannt – in Großstädten wie San Pedro Sula dagegen Vorsicht walten lassen."
    },
    {
      "id": "elsalvador",
      "name": "El Salvador",
      "flag": "🇸🇻",
      "region": "Mittelamerika",
      "capital": "San Salvador",
      "tagline": "Surfer-Wellen, Vulkane und Bitcoin-Pionier",
      "about": "El Salvador ist das kleinste Land Mittelamerikas, aber ein Surf-Mekka mit erstklassigen Pazifikwellen bei El Tunco und El Zonte. Die 'Ruta de las Flores' führt durch Kaffeedörfer und Vulkanlandschaften. Das Land hat als erstes der Welt Bitcoin als gesetzliches Zahlungsmittel eingeführt.",
      "history": "Vor der Eroberung lebten hier die Pipil, ein Nahua-Volk. 1524 begann die spanische Eroberung durch Pedro de Alvarado. 1821 wurde El Salvador unabhängig. Nach einem blutigen Bürgerkrieg (1980–1992) kämpfte das Land lange mit Bandengewalt, gilt heute aber als deutlich sicherer.",
      "language": "Das salvadorianische Spanisch verwendet stark den Voseo mit 'vos'. Gesprochen wird oft schnell, mit verschluckten Silben am Wortende. Salvadorianer nennen sich selbst 'guanacos'. Nawat (Pipil) ist eine fast ausgestorbene indigene Sprache, die wiederbelebt wird.",
      "words": [
        {
          "es": "¡Qué chivo!",
          "de": "Wie cool! / Geil!"
        },
        {
          "es": "guanaco",
          "de": "Salvadorianer/in (Spitzname)"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')"
        },
        {
          "es": "cipote",
          "de": "Kind, Junge"
        },
        {
          "es": "bicho",
          "de": "Kind / Jugendlicher (umgangssprachlich)"
        },
        {
          "es": "¡Púchica!",
          "de": "Mensch! / Verflixt!"
        }
      ],
      "food": [
        {
          "name": "Pupusas",
          "desc": "Gefüllte Maisfladen mit Käse, Bohnen oder Chicharrón, das Nationalgericht.",
          "long": "Dicke, handgeformte Maisfladen, gefüllt mit Käse, Bohnen, Schweinefleisch (chicharrón) oder einer Kombination, und auf der Platte gebacken. Werden mit Krautsalat (curtido) und Tomatensauce serviert. Das absolute Nationalgericht El Salvadors.",
          "ingredients": "Maisteig, Käse, Bohnen, Schweinefleisch (chicharrón), Loroco, Krautsalat, Tomatensauce",
          "origin": "Ein Gericht mit präkolumbischen Wurzeln, das zum kulinarischen Wahrzeichen El Salvadors wurde und sogar einen eigenen Nationaltag hat.",
          "occasions": "Beliebt zum Frühstück oder Abendessen, an jedem Tag und besonders am nationalen Pupusa-Tag.",
          "order": "Dos pupusas de queso con frijoles, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Pupusas_olocuilta_el_salvador_2012.jpg/960px-Pupusas_olocuilta_el_salvador_2012.jpg"
        },
        {
          "name": "Curtido",
          "desc": "Eingelegter Krautsalat, der klassische Begleiter zu Pupusas.",
          "long": "Ein leicht fermentierter, säuerlicher Krautsalat aus Weißkohl, Karotten und Zwiebeln mit Essig und Oregano. Knackig, frisch und säuerlich. Unverzichtbare Beilage zu Pupusas.",
          "ingredients": "Weißkohl, Karotten, Zwiebeln, Essig, Oregano, Chili",
          "origin": "Eine traditionelle salvadorianische Beilage, die als fermentierter Begleiter zu Maisgerichten dient.",
          "occasions": "Wird ständig als Beilage zu Pupusas und frittierten Speisen gereicht.",
          "order": "Un poco de curtido, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Pupusas_El_Salvador_Centro_America.JPG/960px-Pupusas_El_Salvador_Centro_America.JPG"
        },
        {
          "name": "Yuca frita",
          "desc": "Frittierter Maniok mit Schweinefleisch und Salat.",
          "long": "Frittierte Yuca-Stücke, außen knusprig und innen weich, oft mit Schweinefleisch oder Fisch und Krautsalat serviert. Herzhaft und sättigend. Ein klassisches Straßengericht.",
          "ingredients": "Yuca, Öl zum Frittieren, Schweinefleisch oder Fisch, Krautsalat (curtido), Salsa",
          "origin": "Ein traditionelles Gericht El Salvadors auf Basis der für die Region wichtigen Yuca-Knolle.",
          "occasions": "Beliebter Snack am Nachmittag und Abend an Ständen.",
          "order": "Una yuca frita con chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Yuca_frita_in_Bolivia.jpg/960px-Yuca_frita_in_Bolivia.jpg"
        },
        {
          "name": "Panes con pollo",
          "desc": "Mariniertes Hähnchen-Sandwich mit Gemüse und Sauce.",
          "long": "Ein gefülltes Sandwich mit mariniertem Hühnchen, Gemüse und einer würzigen Sauce. Saftig, würzig und reichhaltig. Beliebt bei Feiern und Versammlungen.",
          "ingredients": "Brötchen, mariniertes Hühnchen, Tomaten, Salat, Gurke, Rettich, würzige Sauce",
          "origin": "Ein traditionelles salvadorianisches Festsandwich, das oft bei Familien- und Gemeindefeiern serviert wird.",
          "occasions": "Typisch für Feiern, Festtage und gesellige Abende.",
          "order": "Un pan con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Subway_Monterey_Chicken_Melt_wRoasted_Chicken_%2816235266571%29.jpg"
        },
        {
          "name": "Tamales de elote",
          "desc": "Süße Tamales aus frischem Mais.",
          "long": "Süße bis milde Tamales aus frischem, jungem Mais, in Maisblättern gedämpft. Cremig, leicht süß und zart. Werden oft mit saurer Sahne gegessen.",
          "ingredients": "Frischer junger Mais (elote), Zucker oder Salz, Butter oder Sahne, Maisblätter",
          "origin": "Eine salvadorianische Variante der mesoamerikanischen Tamal-Tradition, die jungen Mais nutzt.",
          "occasions": "Snack und Beilage, beliebt zur Erntezeit und am Nachmittag mit Kaffee.",
          "order": "Unos tamales de elote, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tamales_Mexicanos_sweet_corn_tamales_01.jpg/960px-Tamales_Mexicanos_sweet_corn_tamales_01.jpg"
        },
        {
          "name": "Sopa de pata",
          "desc": "Herzhafte Suppe aus Rinderfuß und Gemüse.",
          "long": "Eine herzhafte Suppe aus Rinderfuß und Kutteln mit Gemüse, Yuca und Kochbananen in würziger Brühe. Reichhaltig, sättigend und kräftig. Ein traditionelles Wohlfühlgericht.",
          "ingredients": "Rinderfuß, Kutteln, Yuca, Kochbananen, Mais, Gemüse, Gewürze",
          "origin": "Ein traditionelles salvadorianisches Gericht, das günstige Fleischteile zu einer sättigenden Suppe verarbeitet.",
          "occasions": "Wärmendes Wochenend- und Familiengericht.",
          "order": "Una sopa de pata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sopa_de_pata.jpg/960px-Sopa_de_pata.jpg"
        }
      ],
      "drink": [
        {
          "name": "Horchata",
          "desc": "Hier aus Morro-Samen gemacht, würzig und cremig.",
          "long": "Die salvadorianische Horchata wird typisch aus Morro-Samen mit weiteren Samen und Gewürzen zubereitet und schmeckt nussig und würzig. Cremig-mild und gut gekühlt. Eine der beliebtesten Erfrischungen des Landes.",
          "ingredients": "Morro-Samen, weitere Samen und Nüsse, Zimt, Zucker, Wasser oder Milch",
          "origin": "Eine charakteristische salvadorianische Variante der Horchata auf Basis von Morro-Samen.",
          "occasions": "Erfrischung zum Essen, besonders zu Pupusas.",
          "order": "Una horchata, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/7/79/Horchata_con_fartons.jpg"
        },
        {
          "name": "Kolashanpan",
          "desc": "Süße, leuchtend orange Limonade, eine lokale Ikone.",
          "long": "Eine süße, leuchtend rote Limonade mit fruchtigem Geschmack, eine bekannte salvadorianische Erfrischungsmarke. Sehr süß und sprudelnd. Beliebt im ganzen Land.",
          "ingredients": "Karbonisiertes Wasser, Zucker, Fruchtaroma",
          "origin": "Eine traditionsreiche salvadorianische Erfrischungsmarke.",
          "occasions": "Beliebt zum Essen und bei Feiern.",
          "order": "Una Kolashanpan, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Cola_champagne_%28639468787%29.jpg/960px-Cola_champagne_%28639468787%29.jpg"
        },
        {
          "name": "Café salvadoreño",
          "desc": "Aromatischer Hochlandkaffee von den Vulkanhängen.",
          "long": "Salvadorianischer Hochlandkaffee mit ausgewogenem, sanftem Aroma und süßlichen Noten. Wird meist schwarz oder leicht gesüßt getrunken. Kaffee hat eine lange Geschichte in der Wirtschaft des Landes.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "origin": "El Salvador ist ein traditionsreiches Kaffeeanbauland mit Anbaugebieten in den Vulkanregionen.",
          "occasions": "Getränk für den Morgen und Pausen.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/960px-A_small_cup_of_coffee.JPG"
        },
        {
          "name": "Cerveza Pilsener",
          "desc": "Das bekannteste lokale Bier.",
          "long": "Ein klassisches salvadorianisches Lagerbier im Pilsener-Stil, mild und erfrischend. Wird gut gekühlt getrunken und ist landesweit verbreitet. Eine der ältesten Biermarken des Landes.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Eine traditionsreiche, in El Salvador gebraute Biermarke.",
          "occasions": "Erfrischung für gesellige Anlässe und zum Essen.",
          "order": "Una Pilsener bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/11/Logo_Pilsener.jpg"
        }
      ],
      "tip": "El Zonte ('Bitcoin Beach') akzeptiert vielerorts Bitcoin – aber Bargeld ist überall sicherer."
    },
    {
      "id": "nicaragua",
      "name": "Nicaragua",
      "flag": "🇳🇮",
      "region": "Mittelamerika",
      "capital": "Managua",
      "tagline": "Vulkane, Seen und koloniale Farbenpracht",
      "about": "Nicaragua ist das größte Land Mittelamerikas und bekannt für die kolonialen Schmuckstädte Granada und León sowie den riesigen Nicaragua-See. Backpacker surfen in San Juan del Sur, fahren Vulkan-Boarding am Cerro Negro und erkunden die Insel Ometepe mit ihren zwei Vulkanen. Preise sind niedrig, die Natur spektakulär.",
      "history": "Vor der Eroberung lebten hier Völker wie die Nicarao und Chorotega. 1524 gründete Spanien Granada und León. 1821 wurde Nicaragua unabhängig. Das 20. Jahrhundert war geprägt von der Somoza-Diktatur und der Sandinistischen Revolution 1979, deren Folgen die Politik bis heute bestimmen.",
      "language": "Das nicaraguanische Spanisch nutzt durchgängig den Voseo mit 'vos'. Das 's' am Silbenende wird oft zu einem behauchten 'h'. Nicaraguaner nennen sich liebevoll 'nicas' oder 'pinoleros'. An der Karibikküste werden Englisch-Kreol und indigene Sprachen wie Miskito gesprochen.",
      "words": [
        {
          "es": "¡Qué tuani!",
          "de": "Wie cool! / Super!"
        },
        {
          "es": "nica",
          "de": "Nicaraguaner/in (Spitzname)"
        },
        {
          "es": "vos",
          "de": "du (statt 'tú')"
        },
        {
          "es": "dale pues",
          "de": "okay / alles klar / los"
        },
        {
          "es": "maje",
          "de": "Kumpel, Alter"
        },
        {
          "es": "chunche",
          "de": "Dings, Ding (für irgendeinen Gegenstand)"
        }
      ],
      "food": [
        {
          "name": "Gallo pinto",
          "desc": "Gebratener Reis mit Bohnen, das tägliche Grundgericht.",
          "long": "Eine herzhafte Mischung aus Reis und roten Bohnen, zusammen angebraten und gewürzt. Bildet die Basis vieler Mahlzeiten und wird oft zum Frühstück gegessen. Einfach, sättigend und allgegenwärtig.",
          "ingredients": "Reis, rote Bohnen, Zwiebeln, Paprika, Öl, Gewürze",
          "origin": "Ein Grundnahrungsmittel Nicaraguas und Costa Ricas; beide Länder beanspruchen seinen Ursprung.",
          "occasions": "Klassisches Frühstück, oft mit Ei, Käse oder Tortilla begleitet.",
          "order": "Un gallo pinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Gallo_pinto-IMG_0672.JPG/960px-Gallo_pinto-IMG_0672.JPG"
        },
        {
          "name": "Nacatamal",
          "desc": "Großer, gefüllter Maisteig-Tamale in Bananenblättern.",
          "long": "Ein großer, in Bananenblätter gewickelter und gedämpfter Maistamal, gefüllt mit Schweinefleisch, Reis, Kartoffeln und Gemüse. Reichhaltig, herzhaft und sättigend. Ein traditionelles Wochenendgericht.",
          "ingredients": "Maisteig, Schweinefleisch, Reis, Kartoffeln, Tomaten, Paprika, Minze, Bananenblätter",
          "origin": "Eine nicaraguanische Variante des Tamales mit präkolumbischen Wurzeln und besonders üppiger Füllung.",
          "occasions": "Typisches Wochenend- und Festtagsgericht, oft zum Sonntagsfrühstück.",
          "order": "Un nacatamal, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/091223_tamales.jpg/960px-091223_tamales.jpg"
        },
        {
          "name": "Vigorón",
          "desc": "Maniok mit Schweinekruste und Krautsalat auf Bananenblatt.",
          "long": "Gekochte Yuca, belegt mit knusprigem Schweinefleisch und säuerlichem Krautsalat, serviert auf einem Bananenblatt. Die Kombination ist knusprig, frisch und herzhaft. Ein populäres Straßengericht aus Granada.",
          "ingredients": "Yuca, knuspriges Schweinefleisch (chicharrón), Krautsalat (curtido), Tomaten, Chili, Bananenblatt",
          "origin": "Stammt aus der Stadt Granada und gilt als eines der bekanntesten Streetfoods Nicaraguas.",
          "occasions": "Beliebter Snack und Imbiss, oft auf Märkten und bei Festen.",
          "order": "Un vigorón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/VIGORON.JPG/960px-VIGORON.JPG"
        },
        {
          "name": "Quesillo",
          "desc": "Tortilla mit Käse, Zwiebeln und saurer Sahne.",
          "long": "Eine weiche Tortilla, gefüllt mit weichem Käse, eingelegten Zwiebeln und saurer Sahne, gerollt und serviert. Cremig, säuerlich und herzhaft. Ein beliebter Snack, traditionell aus der Region um Nagarote.",
          "ingredients": "Tortilla, weicher Käse (quesillo), eingelegte Zwiebeln, saure Sahne, Salz",
          "origin": "Ein typisch nicaraguanisches Gericht, besonders verbreitet in den Städten Nagarote und La Paz Centro.",
          "occasions": "Beliebter Snack zwischendurch und auf Reisen.",
          "order": "Un quesillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Quesillo_con_dulce_de_cayote%2C_nueces_y_miel_de_ca%C3%B1a_%28Postre_t%C3%ADpico_de_Salta%29.jpg/960px-Quesillo_con_dulce_de_cayote%2C_nueces_y_miel_de_ca%C3%B1a_%28Postre_t%C3%ADpico_de_Salta%29.jpg"
        },
        {
          "name": "Indio viejo",
          "desc": "Deftiger Maiseintopf mit zerzupftem Fleisch.",
          "long": "Ein traditioneller, dicker Eintopf aus zerzupftem Fleisch und Maisteig in einer würzigen Sauce mit Tomaten und Gewürzen. Aromatisch, herzhaft und sämig. Ein indigenes Wohlfühlgericht.",
          "ingredients": "Zerzupftes Rindfleisch, Maismehl, Tomaten, Zwiebeln, Paprika, Minze, Achiote",
          "origin": "Ein Gericht mit indigenen Wurzeln, dessen Name 'alter Indianer' bedeutet und auf eine alte Legende verweist.",
          "occasions": "Traditionelles Mittagessen für Familien- und Festanlässe.",
          "order": "Un indio viejo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ropa_vieja_Canarian_style_in_Fataga%2C_Gran_Canaria%2C_the_Canary_Islands.JPG/960px-Ropa_vieja_Canarian_style_in_Fataga%2C_Gran_Canaria%2C_the_Canary_Islands.JPG"
        },
        {
          "name": "Baho",
          "desc": "Gedämpftes Gericht aus Fleisch, Kochbanane und Maniok.",
          "long": "Ein gedämpftes Gericht aus Rindfleisch, grünen und reifen Kochbananen und Yuca, langsam in Bananenblättern gegart. Saftig, herzhaft und sättigend. Ein beliebtes Wochenendgericht zum Teilen.",
          "ingredients": "Rindfleisch, grüne und reife Kochbananen, Yuca, Krautsalat, Bananenblätter",
          "origin": "Ein traditionelles nicaraguanisches Gericht, dessen Name vom Dämpfen ('vaho') abgeleitet ist.",
          "occasions": "Großes Wochenend- und Familiengericht zum gemeinsamen Essen.",
          "order": "Un baho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Baho.jpg/960px-Baho.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pinolillo",
          "desc": "Traditionelles Getränk aus geröstetem Mais und Kakao.",
          "long": "Ein traditionelles Getränk aus geröstetem Maismehl und Kakao mit Zimt, gemixt mit Wasser oder Milch. Es schmeckt erdig, leicht süß und schokoladig. Gilt als Nationalgetränk Nicaraguas.",
          "ingredients": "Geröstetes Maismehl, Kakao, Zimt, Zucker, Wasser oder Milch",
          "origin": "Ein Getränk mit präkolumbischen Wurzeln, das so prägend ist, dass Nicaraguaner sich selbst als 'pinoleros' bezeichnen.",
          "occasions": "Erfrischung zu jeder Tageszeit und bei Festen.",
          "order": "Un pinolillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Pinolillo.jpg"
        },
        {
          "name": "Flor de Caña",
          "desc": "Weltbekannter, vulkanisch gereifter Premium-Rum.",
          "long": "Ein international ausgezeichneter nicaraguanischer Rum, der am Fuß eines Vulkans gereift wird und für seine sanfte, ausgewogene Note bekannt ist. Wird pur, auf Eis oder in Cocktails getrunken. Ein Stolz des Landes.",
          "ingredients": "Zuckerrohr, gereift in Eichenfässern",
          "origin": "Hergestellt in Nicaragua und seit dem 19. Jahrhundert in der Nähe des Vulkans San Cristóbal gereift.",
          "occasions": "Genussgetränk für Feiern und besondere Anlässe.",
          "order": "Un Flor de Caña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Old_Rum_bottles%2C_2014.jpg/960px-Old_Rum_bottles%2C_2014.jpg"
        },
        {
          "name": "Cerveza Toña",
          "desc": "Beliebtes lokales Lagerbier.",
          "long": "Ein leichtes, erfrischendes nicaraguanisches Lagerbier. Wird gut gekühlt getrunken und ist landesweit beliebt. Eine der bekanntesten Biermarken des Landes.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Eine traditionsreiche, in Nicaragua gebraute Biermarke.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "order": "Una Toña bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/To%C3%B1a_Beer.jpg/960px-To%C3%B1a_Beer.jpg"
        },
        {
          "name": "Cacao",
          "desc": "Erfrischendes kaltes Kakaogetränk mit Maismehl.",
          "long": "Ein erfrischendes Getränk aus gerösteten Kakaobohnen, gemixt mit Reis, Milch oder Wasser, Zucker und Zimt. Schokoladig, cremig und mild süß. Eine traditionelle, kalte Erfrischung.",
          "ingredients": "Geröstete Kakaobohnen, Reis, Zimt, Zucker, Milch oder Wasser",
          "origin": "Ein Getränk mit präkolumbischen Wurzeln, da Kakao in Mesoamerika seit jeher geschätzt wurde.",
          "occasions": "Erfrischung an heißen Tagen und bei Festen.",
          "order": "Un cacao, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Theobroma_cacao_Blanco_clean.jpg/960px-Theobroma_cacao_Blanco_clean.jpg"
        }
      ],
      "tip": "Vulkan-Boarding am Cerro Negro bei León ist ein einzigartiges Abenteuer – Schutzanzug nicht vergessen."
    },
    {
      "id": "costarica",
      "name": "Costa Rica",
      "flag": "🇨🇷",
      "region": "Mittelamerika",
      "capital": "San José",
      "tagline": "Pura Vida: Regenwald, Wildtiere und Traumstrände",
      "about": "Costa Rica ist ein Öko-Tourismus-Paradies mit Nebelwäldern, Vulkanen und Stränden an Pazifik und Karibik. Rund ein Viertel des Landes steht unter Naturschutz – ideal für Faultiere, Tukane und Zip-Lining. Die entspannte 'Pura Vida'-Lebenshaltung ist überall spürbar.",
      "history": "Die Region war dünn besiedelt von indigenen Völkern, ohne große Hochkultur. 1502 landete Kolumbus an der Karibikküste. Nach der spanischen Kolonialzeit wurde Costa Rica 1821 unabhängig. 1948 schaffte das Land sein Militär ab und investierte stattdessen in Bildung und Naturschutz.",
      "language": "Das costa-ricanische Spanisch verwendet überwiegend 'usted', aber auch Voseo mit 'vos'. Es klingt weich und höflich, mit eigenem Slang. Das Markenzeichen ist 'Pura Vida' – Begrüßung, Dank und Lebensgefühl zugleich. Costa-Ricaner nennen sich selbst 'ticos'.",
      "words": [
        {
          "es": "¡Pura vida!",
          "de": "Alles super! (Gruß, Dank, Lebensgefühl)"
        },
        {
          "es": "tico/tica",
          "de": "Costa-Ricaner/in (Spitzname)"
        },
        {
          "es": "mae",
          "de": "Alter, Kumpel"
        },
        {
          "es": "tuanis",
          "de": "cool, super"
        },
        {
          "es": "¡Qué chiva!",
          "de": "Wie cool! / Klasse!"
        },
        {
          "es": "soda",
          "de": "kleines, einfaches Lokal mit Hausmannskost"
        }
      ],
      "food": [
        {
          "name": "Gallo pinto",
          "desc": "Reis mit Bohnen, das klassische Frühstück.",
          "long": "Die costa-ricanische Version aus Reis und schwarzen oder roten Bohnen, oft mit der typischen Würzsauce Salsa Lizano verfeinert. Herzhaft, leicht würzig und sättigend. Das klassische Frühstück des Landes.",
          "ingredients": "Reis, Bohnen, Zwiebeln, Paprika, Koriander, Salsa Lizano",
          "origin": "Grundnahrungsmittel Costa Ricas; das Land teilt sich die Tradition mit Nicaragua und verwendet typischerweise Salsa Lizano.",
          "occasions": "Traditionelles Frühstück, oft mit Ei, Käse oder Tortilla.",
          "order": "Un gallo pinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Gallo_pinto-IMG_0672.JPG/960px-Gallo_pinto-IMG_0672.JPG"
        },
        {
          "name": "Casado",
          "desc": "Tellergericht mit Reis, Bohnen, Salat, Kochbanane und Fleisch.",
          "long": "Ein ausgewogener Teller mit Reis, Bohnen, Salat, Kochbananen und einer Proteinwahl wie Fleisch, Huhn oder Fisch. Eine vollständige, herzhafte Mahlzeit. Das typische Mittagessen Costa Ricas.",
          "ingredients": "Reis, Bohnen, Salat, gebratene Kochbananen, Fleisch oder Fisch, manchmal Ei oder Käse",
          "origin": "Der Name bedeutet 'verheiratet' und verweist scherzhaft auf die feste Kombination der Komponenten auf einem Teller.",
          "occasions": "Klassisches Mittagessen in Sodas (kleinen Lokalen) im ganzen Land.",
          "order": "Un casado con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Casado_Tico.jpg/960px-Casado_Tico.jpg"
        },
        {
          "name": "Olla de carne",
          "desc": "Herzhafter Rindfleischeintopf mit Knollengemüse.",
          "long": "Ein herzhafter Rindfleischeintopf mit viel Wurzelgemüse wie Yuca, Kochbananen, Mais und Kürbis. Reichhaltig, sättigend und wärmend. Ein traditionelles Sonntagsgericht.",
          "ingredients": "Rindfleisch, Yuca, Kochbananen, Mais, Chayote, Kürbis, Karotten, Gewürze",
          "origin": "Ein traditionelles costa-ricanisches Eintopfgericht, das die heimischen Wurzelgemüse zur Geltung bringt.",
          "occasions": "Typisches Sonntags- und Familiengericht.",
          "order": "Una olla de carne, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Olla_de_carne_2.png/960px-Olla_de_carne_2.png"
        },
        {
          "name": "Ceviche",
          "desc": "In Limette marinierter roher Fisch mit Koriander.",
          "long": "Roher Fisch, mariniert in Limettensaft mit Koriander, Zwiebeln und Paprika. Frisch, säuerlich und leicht. Wird kalt serviert, oft mit Crackern oder Kochbananenchips.",
          "ingredients": "Frischer Fisch, Limettensaft, Koriander, Zwiebeln, Paprika, Salz",
          "origin": "Eine costa-ricanische Variante des in ganz Lateinamerika beliebten Ceviches, meist mit lokalem Weißfisch.",
          "occasions": "Erfrischende Vorspeise oder Snack, besonders an der Küste und an heißen Tagen.",
          "order": "Un ceviche de pescado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Chifrijo",
          "desc": "Schichtgericht aus Reis, Bohnen, Chicharrón und Pico de Gallo.",
          "long": "Ein Schichtgericht aus Reis, Bohnen, knusprigem Schweinefleisch und Pico de Gallo, serviert mit Tortillachips. Herzhaft, knusprig und frisch zugleich. Ein beliebter Bar-Snack.",
          "ingredients": "Reis, Bohnen, knuspriges Schweinefleisch (chicharrón), Pico de Gallo, Avocado, Tortillachips",
          "origin": "Ein relativ modernes costa-ricanisches Gericht, dessen Name sich aus chicharrón und frijoles zusammensetzt.",
          "occasions": "Beliebter Snack zu Bier in Bars und bei geselligen Anlässen.",
          "order": "Un chifrijo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Chifrijo.jpg/960px-Chifrijo.jpg"
        },
        {
          "name": "Arroz con pollo",
          "desc": "Würziger Reis mit Hähnchen, ein Party-Klassiker.",
          "long": "Gewürzter Reis, gemischt mit zerzupftem Hühnchen und Gemüse, oft mit Salsa Lizano abgeschmeckt. Herzhaft, aromatisch und sättigend. Ein Klassiker für Feiern.",
          "ingredients": "Reis, Hühnchen, Paprika, Erbsen, Karotten, Mais, Koriander, Salsa Lizano",
          "origin": "Eine costa-ricanische Variante des in ganz Lateinamerika verbreiteten Reis-mit-Huhn-Gerichts.",
          "occasions": "Beliebt bei Geburtstagen, Feiern und Familienanlässen.",
          "order": "Un arroz con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Arroz-con-Pollo.jpg/960px-Arroz-con-Pollo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Café costarricense",
          "desc": "Hochwertiger Hochlandkaffee, oft im 'Chorreador' gebrüht.",
          "long": "Hochwertiger costa-ricanischer Kaffee mit klarem, ausgewogenem Aroma und hellen, fruchtigen Noten. Wird traditionell durch einen Stofffilter (chorreador) zubereitet. Gilt als einer der besten der Welt.",
          "ingredients": "Geröstete Arabica-Kaffeebohnen, Wasser",
          "origin": "Costa Rica hat eine lange Kaffeetradition; das Land erlaubt per Gesetz nur den Anbau von hochwertigem Arabica.",
          "occasions": "Getränk für den Morgen und gesellige Pausen.",
          "order": "Un café, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/La_flor_del_cafe_Costa_Rica.JPG/960px-La_flor_del_cafe_Costa_Rica.JPG"
        },
        {
          "name": "Agua dulce",
          "desc": "Heißes Getränk aus aufgelöstem Rohrzucker.",
          "long": "Ein warmes, süßes Getränk aus aufgelöstem Rohrzucker (tapa de dulce) in Wasser oder Milch. Mild, süß und wärmend. Ein traditionelles ländliches Getränk.",
          "ingredients": "Rohrzucker (tapa de dulce), Wasser oder Milch",
          "origin": "Ein traditionelles costa-ricanisches Getränk aus unraffiniertem Zuckerrohr, besonders auf dem Land verbreitet.",
          "occasions": "Warmes Getränk zum Frühstück und an kühlen Tagen.",
          "order": "Un agua dulce, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Panela_en_cuadros.JPG/960px-Panela_en_cuadros.JPG"
        },
        {
          "name": "Imperial",
          "desc": "Das ikonische lokale Bier mit dem Adler-Logo.",
          "long": "Das bekannteste Lagerbier Costa Ricas, mild und erfrischend, erkennbar am Adler-Logo. Wird gut gekühlt getrunken und gilt als nationales Symbol. Allgegenwärtig im ganzen Land.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Eine traditionsreiche, in Costa Rica gebraute Biermarke und ein nationales Wahrzeichen.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "order": "Una Imperial bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Cerveza_Imperial.JPG/960px-Cerveza_Imperial.JPG"
        },
        {
          "name": "Guaro",
          "desc": "Klarer Zuckerrohrschnaps, der Nationalschnaps.",
          "long": "Eine klare Spirituose auf Zuckerrohrbasis, mild im Geschmack und vielseitig einsetzbar. Wird pur, als Shot oder in Cocktails wie dem Guaro Sour getrunken. Die nationale Spirituose Costa Ricas.",
          "ingredients": "Zuckerrohr, Wasser",
          "origin": "Die bekannteste Marke wird staatlich reguliert hergestellt und gilt als Nationalschnaps Costa Ricas.",
          "occasions": "Beliebt bei Partys und Feiern, oft als Shot oder Cocktail.",
          "order": "Un guaro, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Guaro_%28M%C3%A1laga%29.jpg"
        }
      ],
      "tip": "Die Trockenzeit (Dezember bis April) ist ideal – in der Regenzeit sind viele Pisten matschig."
    },
    {
      "id": "panama",
      "name": "Panama",
      "flag": "🇵🇦",
      "region": "Mittelamerika",
      "capital": "Panama-Stadt",
      "tagline": "Kanal, Karibikinseln und Großstadt-Skyline",
      "about": "Panama verbindet als Landbrücke Nord- und Südamerika und beherbergt den weltberühmten Panamakanal. Backpacker zieht es zu den paradiesischen San-Blas-Inseln der Guna, zum Surferort Bocas del Toro und in die moderne Hauptstadt mit kolonialer Altstadt. Pazifik und Karibik liegen nur Stunden auseinander.",
      "history": "Vor der Eroberung lebten hier Völker wie die Guna, Emberá und Ngäbe. 1501 kamen die Spanier, Panama wurde wichtiger Umschlagplatz für Silber. 1821 löste sich das Land von Spanien und schloss sich Großkolumbien an. 1903 wurde Panama mit US-Hilfe von Kolumbien unabhängig; der Kanal wurde 1914 eröffnet und 1999 an Panama übergeben.",
      "language": "Das panamaische Spanisch klingt karibisch: schnell, mit verschlucktem 's' und weichen Endungen. Voseo ist unüblich, man nutzt 'tú'. Durch die Kanalgeschichte gibt es viele Anglizismen. Indigene Sprachen wie Guna und Ngäbere sowie Englisch-Kreol an der Karibikküste sind verbreitet.",
      "words": [
        {
          "es": "¿Qué xopá?",
          "de": "Was geht? (typische Begrüßung)"
        },
        {
          "es": "chuleta",
          "de": "Mann! / Verflixt! (Ausruf)"
        },
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "buena leche",
          "de": "Glück / Glückspilz"
        },
        {
          "es": "fren",
          "de": "Freund, Kumpel (von engl. 'friend')"
        },
        {
          "es": "pelao/pelá",
          "de": "Kind / junger Mensch"
        }
      ],
      "food": [
        {
          "name": "Sancocho",
          "desc": "Würzige Hähnchensuppe mit Yam und Koriander, das Nationalgericht.",
          "long": "Eine herzhafte Hühnersuppe mit Yuca, Mais und der typischen Kräuterwürze Culantro. Kräftig, wärmend und aromatisch. Gilt als das tröstende Nationalgericht Panamas.",
          "ingredients": "Hühnchen, Yuca, Mais, Culantro (Langer Koriander), Zwiebeln, Gewürze",
          "origin": "Eine panamaische Variante des in der Karibik und Lateinamerika verbreiteten Sancocho-Eintopfs.",
          "occasions": "Beliebt als Wohlfühlgericht, oft am Wochenende oder gegen Kater.",
          "order": "Un sancocho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Ropa vieja",
          "desc": "Zerzupftes Rindfleisch in Tomatensauce mit Reis.",
          "long": "Zerzupftes Rindfleisch, geschmort in einer Tomatensauce mit Paprika und Zwiebeln. Der Name bedeutet 'alte Kleider' wegen der faserigen Optik. Herzhaft und aromatisch, serviert mit Reis.",
          "ingredients": "Zerzupftes Rindfleisch, Tomaten, Paprika, Zwiebeln, Knoblauch, Gewürze, Reis",
          "origin": "Ein Gericht mit spanisch-karibischen Wurzeln, das in mehreren Ländern der Region verbreitet ist.",
          "occasions": "Beliebtes Mittagessen für Familien- und Alltagsanlässe.",
          "order": "Una ropa vieja, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ropa_vieja_plato_cubano_por_excelencia_2.jpg/960px-Ropa_vieja_plato_cubano_por_excelencia_2.jpg"
        },
        {
          "name": "Patacones",
          "desc": "Frittierte, platt gedrückte grüne Kochbananen.",
          "long": "Zweimal frittierte, flach gedrückte Scheiben grüner Kochbananen, außen knusprig und innen weich. Werden gesalzen als Beilage oder Snack serviert. Knusprig und herzhaft.",
          "ingredients": "Grüne Kochbananen, Öl zum Frittieren, Salz",
          "origin": "Ein in der Karibik und Mittelamerika verbreitetes Kochbananengericht, fester Bestandteil der panamaischen Küche.",
          "occasions": "Allgegenwärtige Beilage zu Fleisch und Fisch sowie als Snack.",
          "order": "Unos patacones, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Arroz con pollo",
          "desc": "Würziger Reis mit Hähnchen, ein Alltagsklassiker.",
          "long": "Gewürzter Reis mit zerzupftem Hühnchen und Gemüse, eine sättigende Alltagsmahlzeit. Herzhaft, aromatisch und farbenfroh. Beliebt bei Familienanlässen.",
          "ingredients": "Reis, Hühnchen, Paprika, Erbsen, Karotten, Mais, Koriander, Gewürze",
          "origin": "Eine panamaische Variante des in ganz Lateinamerika beliebten Reis-mit-Huhn-Gerichts.",
          "occasions": "Beliebt bei Feiern, Geburtstagen und als Mittagessen.",
          "order": "Un arroz con pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Arroz-con-Pollo.jpg/960px-Arroz-con-Pollo.jpg"
        },
        {
          "name": "Carimañola",
          "desc": "Frittierte Maniok-Rolle mit Fleischfüllung.",
          "long": "Eine längliche, frittierte Teigtasche aus Yuca-Teig, gefüllt mit gewürztem Fleisch oder Käse. Außen knusprig, innen weich und herzhaft. Ein beliebter Frühstücks- und Snackklassiker.",
          "ingredients": "Yuca, Hackfleisch oder Käse, Zwiebeln, Gewürze, Öl zum Frittieren",
          "origin": "Ein traditionelles Gericht der panamaischen und kolumbianischen Karibikküste auf Yuca-Basis.",
          "occasions": "Beliebtes Frühstück und Snack an Ständen.",
          "order": "Una carimañola, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Barranquilla_-_Carima%C3%B1olas.jpg/960px-Barranquilla_-_Carima%C3%B1olas.jpg"
        },
        {
          "name": "Hojaldre",
          "desc": "Frittiertes Fladenbrot, beliebt zum Frühstück.",
          "long": "Ein frittiertes, luftiges Weizengebäck, ähnlich einem Fettkuchen, außen knusprig und innen weich. Wird oft salzig oder mit etwas Zucker zum Frühstück gegessen. Begleitet typischerweise herzhafte Speisen und Kaffee.",
          "ingredients": "Weizenmehl, Backpulver, Salz, Zucker, Öl zum Frittieren",
          "origin": "Ein traditionelles panamaisches Frühstücksgebäck, das zur Familie der frittierten Brote gehört.",
          "occasions": "Klassische Frühstücksbeilage, oft zu Fleisch, Ei oder Kaffee.",
          "order": "Un hojaldre, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/CocinaPalentina-Tarta_Hojaldre_y_Yema_001.JPG/960px-CocinaPalentina-Tarta_Hojaldre_y_Yema_001.JPG"
        }
      ],
      "drink": [
        {
          "name": "Chicha",
          "desc": "Erfrischender Saft aus frischen Früchten wie Tamarinde oder Maracuja.",
          "long": "Ein erfrischendes Getränk aus frischen Früchten oder Mais, gemixt mit Wasser und Zucker. Fruchtig, süß und gut gekühlt. In Panama meist als alkoholfreies Fruchtgetränk gemeint.",
          "ingredients": "Frische Früchte oder Mais, Wasser, Zucker",
          "origin": "Der Begriff hat in Lateinamerika viele Bedeutungen; in Panama bezeichnet er meist erfrischende Fruchtsäfte.",
          "occasions": "Erfrischung zum Essen und an heißen Tagen.",
          "order": "Una chicha de maracuyá, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Seco Herrerano",
          "desc": "Klarer Zuckerrohrschnaps, der Nationalschnaps Panamas.",
          "long": "Eine klare Spirituose auf Zuckerrohrbasis, die als Nationalschnaps Panamas gilt. Wird pur, mit Milch (seco con leche) oder in Cocktails getrunken. Mild und vielseitig.",
          "ingredients": "Zuckerrohr, Wasser",
          "origin": "Hergestellt in der Provinz Herrera und seit Langem als Nationalspirituose Panamas etabliert.",
          "occasions": "Beliebt bei Festen und Feiern, oft als Cocktail.",
          "order": "Un seco con leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Whiskey_sour.jpg/960px-Whiskey_sour.jpg"
        },
        {
          "name": "Cerveza Balboa",
          "desc": "Beliebtes lokales Lagerbier.",
          "long": "Ein traditionelles panamaisches Lagerbier, mild und erfrischend, benannt nach dem Entdecker Vasco Núñez de Balboa. Wird gut gekühlt getrunken. Eine der bekanntesten Biermarken des Landes.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Eine traditionsreiche, in Panama gebraute Biermarke.",
          "occasions": "Erfrischung für gesellige Anlässe und heiße Tage.",
          "order": "Una Balboa bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cerveza_Balboa_-_Erik_Cleves_Kristensen.jpg/960px-Cerveza_Balboa_-_Erik_Cleves_Kristensen.jpg"
        },
        {
          "name": "Raspado",
          "desc": "Geschabtes Eis mit Sirup und Kondensmilch.",
          "long": "Ein erfrischendes Dessertgetränk aus geschabtem Eis, übergossen mit buntem Fruchtsirup und oft gesüßter Kondensmilch. Süß, kalt und farbenfroh. Ein beliebter Straßensnack bei Hitze.",
          "ingredients": "Geschabtes Eis, Fruchtsirup, gesüßte Kondensmilch",
          "origin": "Eine in Lateinamerika weit verbreitete Eis-Spezialität, in Panama von Straßenverkäufern angeboten.",
          "occasions": "Erfrischender Snack an heißen Tagen, besonders beliebt bei Kindern.",
          "order": "Un raspado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Sno_cone.jpg/960px-Sno_cone.jpg"
        }
      ],
      "tip": "Für die San-Blas-Inseln Bargeld in kleinen Scheinen mitnehmen – die Guna nehmen keine Karten."
    },
    {
      "id": "cuba",
      "name": "Kuba",
      "flag": "🇨🇺",
      "region": "Karibik",
      "capital": "Havanna",
      "tagline": "Oldtimer, Rum und Salsa zwischen Verfall und Charme",
      "about": "Kuba ist die größte Insel der Karibik und besticht durch koloniale Altstädte, Tabakfelder im Viñales-Tal und kilometerlange Strände wie Varadero. Backpacker reisen oft per Colectivo und übernachten in privaten Casas Particulares, die einen authentischen Einblick ins Alltagsleben geben.",
      "history": "Vor der Ankunft von Kolumbus 1492 lebten Taíno und Ciboney auf der Insel, bevor Spanien Kuba als Kolonie und Sklavenhalter-Zentrum für Zuckerrohr ausbeutete. 1898 endete die spanische Herrschaft, doch erst die Revolution von 1959 unter Fidel Castro und Che Guevara machte Kuba zum sozialistischen Staat. Nach Jahrzehnten unter US-Embargo öffnet sich das Land langsam, bleibt politisch aber ein Einparteienstaat.",
      "language": "Das kubanische Spanisch ist schnell und melodisch, wobei das S am Silbenende oft verschluckt oder zu einem Hauch wird (z.B. 'ehtá' statt 'está'). Auch das R wird häufig zu L abgeschwächt und Endsilben verschwinden. Typisch sind viele afrokubanische Einflüsse und ein lebhafter, von Diminutiven geprägter Tonfall.",
      "words": [
        {
          "es": "asere",
          "de": "Kumpel, Alter (kubanischer Slang)"
        },
        {
          "es": "guagua",
          "de": "Bus"
        },
        {
          "es": "jamar",
          "de": "essen (umgangssprachlich)"
        },
        {
          "es": "pinchar",
          "de": "arbeiten"
        },
        {
          "es": "yuma",
          "de": "Ausländer, Tourist (oft US-Amerikaner)"
        },
        {
          "es": "¿qué bolá?",
          "de": "Was geht? / Wie läuft's?"
        }
      ],
      "food": [
        {
          "name": "Ropa vieja",
          "desc": "Geschmortes, zerfasertes Rindfleisch in würziger Tomatensauce.",
          "long": "Ropa vieja (wörtlich 'alte Kleider') ist eines der Nationalgerichte Kubas und besteht aus zartem, in Streifen gezupftem Rindfleisch, das in einer würzigen Tomatensauce geschmort wird. Es schmeckt herzhaft und leicht süßlich und wird meist mit weißem Reis und Kochbananen serviert.",
          "ingredients": "Rindfleisch (Flankensteak), Tomaten, Paprika, Zwiebeln, Knoblauch, Wein, Kreuzkümmel",
          "origin": "Das Gericht hat seine Wurzeln in der spanischen Küche, vermutlich den Kanarischen Inseln und Andalusien, und gelangte über die spanische Kolonialzeit in die Karibik.",
          "occasions": "Ein klassisches Mittagsgericht, das gerne bei Familienessen und Sonntagsmahlzeiten aufgetischt wird.",
          "order": "Quisiera una ropa vieja con arroz blanco, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ropa_vieja_plato_cubano_por_excelencia_2.jpg/960px-Ropa_vieja_plato_cubano_por_excelencia_2.jpg"
        },
        {
          "name": "Moros y cristianos",
          "desc": "Schwarze Bohnen mit Reis zusammen gekocht.",
          "long": "Moros y cristianos ('Mauren und Christen') ist ein Gericht aus schwarzen Bohnen und weißem Reis, die zusammen gekocht werden, sodass sich die Aromen verbinden. Der Name spielt auf den Farbkontrast von dunklen Bohnen und hellem Reis an; das Gericht ist herzhaft und dient meist als Beilage.",
          "ingredients": "Schwarze Bohnen, weißer Reis, Knoblauch, Zwiebeln, Paprika, Kreuzkümmel, Lorbeer",
          "origin": "Der Name verweist auf die maurische Herrschaft auf der iberischen Halbinsel und kam mit den spanischen Siedlern nach Kuba.",
          "occasions": "Wird als alltägliche Beilage zu fast jedem Hauptgericht gereicht.",
          "order": "Para mí, moros y cristianos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Ropa_viecha_2.jpg/960px-Ropa_viecha_2.jpg"
        },
        {
          "name": "Lechón asado",
          "desc": "Langsam gegrilltes Spanferkel, oft zu Festen.",
          "long": "Lechón asado ist ein langsam gegartes, knusprig gebratenes Spanferkel, das in der kubanischen Küche besonders geschätzt wird. Das Fleisch wird vorher in einer Marinade aus Bitterorange und Knoblauch eingelegt, was ihm einen säuerlich-würzigen Geschmack und zarte Konsistenz verleiht.",
          "ingredients": "Schweinefleisch (ganzes Ferkel), Bitterorange (naranja agria), Knoblauch, Oregano, Kreuzkümmel, Salz",
          "origin": "Das Braten von ganzem Schwein hat spanische Wurzeln und ist in der gesamten Karibik verbreitet.",
          "occasions": "Das festliche Hauptgericht zu Weihnachten (Nochebuena) und großen Familienfeiern.",
          "order": "Me gustaría probar el lechón asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/GEDC0117_%2815057625722%29.jpg/960px-GEDC0117_%2815057625722%29.jpg"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "long": "Tostones sind zweimal frittierte Scheiben grüner Kochbananen, die nach dem ersten Frittieren plattgedrückt und erneut goldbraun ausgebacken werden. Sie sind außen knusprig, innen weich und werden gesalzen oft als Beilage oder Snack gegessen.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz, optional Knoblauch",
          "origin": "Tostones sind in der gesamten Karibik und Lateinamerika verbreitet und gehen auf die Verwendung von Kochbananen aus Afrika zurück.",
          "occasions": "Beliebt als Beilage oder Knabberei zu jeder Tageszeit.",
          "order": "¿Me pone una ración de tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Yuca con mojo",
          "desc": "Maniok mit einer Knoblauch-Zitrus-Sauce.",
          "long": "Yuca con mojo besteht aus weich gekochter Maniokwurzel, die mit einer Sauce aus Knoblauch, Bitterorange und Olivenöl übergossen wird. Das Gericht schmeckt knoblauchig-säuerlich und hat eine zart-stärkehaltige Konsistenz.",
          "ingredients": "Maniok (yuca), Knoblauch, Bitterorange, Olivenöl, Zwiebeln, Salz",
          "origin": "Maniok ist ein Grundnahrungsmittel der indigenen Taíno-Bevölkerung der Karibik, kombiniert mit dem spanisch geprägten Mojo.",
          "occasions": "Eine typische Beilage zu Schweinefleisch und bei Festessen.",
          "order": "Quisiera yuca con mojo de acompañamiento.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Mandioca_%28yuca%29_hervida_como_acompa%C3%B1amiento_para_un_asado_como_plato_principal.jpg/960px-Mandioca_%28yuca%29_hervida_como_acompa%C3%B1amiento_para_un_asado_como_plato_principal.jpg"
        },
        {
          "name": "Picadillo",
          "desc": "Hackfleisch mit Oliven, Rosinen und Gewürzen.",
          "long": "Picadillo ist ein herzhaftes Hackfleischgericht in einer würzigen Tomatensauce, das mit Oliven und Rosinen eine charakteristische süß-salzige Note erhält. Es wird typischerweise mit weißem Reis und manchmal mit gebratenen Kochbananen serviert.",
          "ingredients": "Rinderhackfleisch, Tomaten, Zwiebeln, Knoblauch, Oliven, Rosinen, Kapern, Kreuzkümmel",
          "origin": "Picadillo ist in vielen spanischsprachigen Ländern verbreitet und kam über die spanische Küche nach Kuba.",
          "occasions": "Ein häufiges, einfaches Mittag- oder Abendessen im Alltag.",
          "order": "Para mí un picadillo con arroz, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mexican_picadillo.jpg/960px-Mexican_picadillo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mojito",
          "desc": "Cocktail aus Rum, Minze, Limette, Zucker und Soda.",
          "long": "Der Mojito ist ein erfrischender kubanischer Cocktail aus weißem Rum, frischer Minze, Limette, Zucker und Sodawasser. Er schmeckt spritzig, minzig-frisch und ist eines der bekanntesten Getränke Kubas.",
          "ingredients": "Weißer Rum, Minze (hierbabuena), Limette, Zucker, Sodawasser, Eis",
          "origin": "Der Mojito hat seine Wurzeln in Havanna und war ein Lieblingsgetränk von Ernest Hemingway.",
          "occasions": "Wird gerne als erfrischender Aperitif an heißen Tagen und in Bars getrunken.",
          "order": "Un mojito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Mojito98775.jpeg/960px-Mojito98775.jpeg"
        },
        {
          "name": "Cuba Libre",
          "desc": "Rum mit Cola und Limette.",
          "long": "Cuba Libre ist ein einfacher, aber populärer Longdrink aus Rum, Cola und einem Spritzer Limette. Er schmeckt süß-spritzig mit der frischen Säure der Limette.",
          "ingredients": "Rum, Cola, Limette, Eis",
          "origin": "Der Drink entstand Anfang des 20. Jahrhunderts in Kuba, als Cola auf die Insel kam, und sein Name bedeutet 'Freies Kuba'.",
          "occasions": "Ein Klassiker für gesellige Abende und Partys.",
          "order": "Me pone un Cuba Libre, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/15-09-26-RalfR-WLC-0056.jpg/960px-15-09-26-RalfR-WLC-0056.jpg"
        },
        {
          "name": "Daiquirí",
          "desc": "Gemixter Cocktail aus Rum, Limette und Zucker.",
          "long": "Der Daiquirí ist ein klassischer kubanischer Cocktail aus weißem Rum, Limettensaft und Zucker, der eiskalt serviert wird. Er schmeckt frisch, herb-süß und ausgewogen sauer.",
          "ingredients": "Weißer Rum, Limettensaft, Zucker, Eis",
          "origin": "Benannt nach dem Bergwerksort Daiquirí bei Santiago de Cuba und ebenfalls durch Hemingway berühmt geworden.",
          "occasions": "Ein eleganter Cocktail für den Abend oder zum Anstoßen.",
          "order": "Quisiera un daiquirí, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Classic_Daiquiri_in_Cocktail_Glass.jpg/960px-Classic_Daiquiri_in_Cocktail_Glass.jpg"
        },
        {
          "name": "Café cubano",
          "desc": "Starker, stark gezuckerter Espresso.",
          "long": "Café cubano ist ein stark gesüßter Espresso, bei dem der Zucker bereits während des Brühens zu einer schaumigen Crema (espuma) aufgeschlagen wird. Er ist intensiv, süß und wird in kleinen Tassen getrunken.",
          "ingredients": "Espresso (dunkel geröstet), Zucker",
          "origin": "Der Café cubano entwickelte sich nach der Einführung italienischer Espressomaschinen in Kuba.",
          "occasions": "Wird über den ganzen Tag, besonders nach dem Essen, getrunken.",
          "order": "Un café cubano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cuban_coffee-_2013-04-05_14-30.jpg/960px-Cuban_coffee-_2013-04-05_14-30.jpg"
        }
      ],
      "tip": "Tausche Geld nur an offiziellen Stellen und bringe genug Bargeld mit, da ausländische Kreditkarten oft nicht funktionieren."
    },
    {
      "id": "republica-dominicana",
      "name": "Dominikanische Republik",
      "flag": "🇩🇴",
      "region": "Karibik",
      "capital": "Santo Domingo",
      "tagline": "Traumstrände, Merengue und der älteste Kolonialkern Amerikas",
      "about": "Die Dominikanische Republik teilt sich die Insel Hispaniola mit Haiti und lockt mit Palmenstränden, dem Bergmassiv Pico Duarte und der historischen Zona Colonial von Santo Domingo. Backpacker finden neben den Pauschalresorts auch authentische Orte wie Las Terrenas oder die Wasserfälle von Damajagua.",
      "history": "Die Insel war von Taíno besiedelt, als Kolumbus 1492 landete und Santo Domingo zur ältesten dauerhaften europäischen Siedlung Amerikas wurde. Nach spanischer und kurzer haitianischer Herrschaft erlangte das Land 1844 seine Unabhängigkeit von Haiti. Das 20. Jahrhundert war von der brutalen Diktatur Trujillos geprägt, bevor sich eine Demokratie und ein tourismusgetriebener Aufschwung entwickelten.",
      "language": "Das dominikanische Spanisch ist schnell und stark vom karibischen Akzent geprägt, mit verschlucktem S am Silbenende (z.B. 'lo niño' statt 'los niños'). Das R wird oft zu I oder L (z.B. 'puelta' statt 'puerta'), und viele Wörter werden stark verkürzt. Es gibt zahlreiche Taíno- und afrikanische Lehnwörter.",
      "words": [
        {
          "es": "¿qué lo que?",
          "de": "Was geht? (Begrüßung, oft 'klo ke')"
        },
        {
          "es": "chin",
          "de": "ein bisschen, eine kleine Menge"
        },
        {
          "es": "guagua",
          "de": "Bus"
        },
        {
          "es": "vaina",
          "de": "Ding, Sache (Allzweckwort)"
        },
        {
          "es": "tíguere",
          "de": "schlauer, gewiefter Typ"
        },
        {
          "es": "concho",
          "de": "Sammeltaxi"
        }
      ],
      "food": [
        {
          "name": "La bandera",
          "desc": "Nationalgericht aus Reis, roten Bohnen und Fleisch.",
          "long": "La bandera ('die Flagge') ist das Nationalgericht der Dominikanischen Republik und besteht aus weißem Reis, roten Bohnen und geschmortem Fleisch, oft begleitet von Salat oder gebratenen Kochbananen. Die Farben erinnern an die Landesflagge, und es ist eine herzhafte, ausgewogene Mahlzeit.",
          "ingredients": "Weißer Reis, rote Bohnen (habichuelas), Fleisch (Huhn oder Rind), Salat, Kochbananen",
          "origin": "Das Gericht ist seit Generationen das tägliche Mittagessen der Dominikaner und symbolisiert die nationale Identität.",
          "occasions": "Das klassische, tägliche Mittagessen (almuerzo) in fast jedem Haushalt.",
          "order": "Quiero la bandera dominicana, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sancocho_dominican.jpg/960px-Sancocho_dominican.jpg"
        },
        {
          "name": "Mangú",
          "desc": "Püree aus Kochbananen, oft zum Frühstück mit Zwiebeln.",
          "long": "Mangú ist ein cremiges Püree aus gekochten grünen Kochbananen, das mit etwas Öl und Zwiebeln verfeinert wird. Es ist sättigend und mild im Geschmack und wird klassisch zum Frühstück gereicht.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, in Essig geschmorte Zwiebeln, Salz",
          "origin": "Mangú hat afrikanische Wurzeln und kam über versklavte Westafrikaner in die Dominikanische Republik.",
          "occasions": "Ein typisches Frühstück, besonders als 'Los Tres Golpes' mit Käse, Salami und Ei.",
          "order": "Me da un mangú con los tres golpes, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/be/Mangu_dominicano_--Contenido-_-Lonjas_de_salami_fritas_-Lonjas_de_queso_blanco_-Mangu_o_pur%C3%A9_de_pl%C3%A1tano_verde_-Mantequilla_--Este_es_un_plato_t%C3%ADpico_en_el_desayuno_dominicano_--Rep%C3%BAblica_Dominicana_-_2013-10-08_14-28.jpg"
        },
        {
          "name": "Sancocho",
          "desc": "Deftiger Eintopf mit verschiedenen Fleischsorten und Knollen.",
          "long": "Sancocho ist ein deftiger Eintopf aus verschiedenen Fleischsorten und Wurzelgemüse, der lange geköchelt wird. Er ist reichhaltig, würzig und gilt als Festtagsgericht, das wärmt und sättigt.",
          "ingredients": "Verschiedene Fleischsorten, Maniok (yuca), Yautía, Kochbananen, Kürbis (auyama), Koriander",
          "origin": "Der Sancocho hat spanische und indigene Wurzeln und existiert in vielen lateinamerikanischen Varianten.",
          "occasions": "Ein Festgericht für Familienfeiern, Regentage und besondere Anlässe.",
          "order": "Quisiera un plato de sancocho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "long": "Tostones sind zweimal frittierte Scheiben grüner Kochbananen, die nach dem ersten Frittieren plattgedrückt und erneut ausgebacken werden. Sie sind knusprig und werden gesalzen als Beilage oder Snack gegessen.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz",
          "origin": "Tostones sind in der gesamten Karibik verbreitet und auch in der Dominikanischen Republik ein fester Bestandteil der Küche.",
          "occasions": "Beliebt als Beilage zu Fleisch und Fisch oder als Snack.",
          "order": "¿Me trae unos tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Chicharrón",
          "desc": "Knusprig frittiertes Schweinefleisch oder -bauch.",
          "long": "Chicharrón besteht aus frittierten, knusprigen Schweinefleisch- oder Schwartenstücken, die außen kross und innen saftig sind. Es wird oft mit Yuca oder Tostones und einem Spritzer Limette serviert.",
          "ingredients": "Schweinefleisch mit Schwarte, Knoblauch, Bitterorange, Salz, Öl",
          "origin": "Chicharrón ist in der spanischsprachigen Welt weit verbreitet und stammt aus der spanischen Küche.",
          "occasions": "Ein beliebter Snack auf Straßenfesten und am Wochenende.",
          "order": "Me pone un poco de chicharrón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Chicharrones_Cerdo_Salamanca_02.jpg/960px-Chicharrones_Cerdo_Salamanca_02.jpg"
        },
        {
          "name": "Mofongo",
          "desc": "Stampf aus frittierten Kochbananen mit Knoblauch und Schwarte.",
          "long": "Mofongo ist ein herzhafter Klops aus zerstampften, frittierten grünen Kochbananen, der mit Knoblauch und Schweinegrieben (chicharrón) vermengt wird. Es ist sättigend, knoblauchig und wird oft mit Brühe oder Fleisch gefüllt serviert.",
          "ingredients": "Grüne Kochbananen, Knoblauch, Schweinegrieben (chicharrón), Olivenöl, Salz",
          "origin": "Mofongo hat westafrikanische Wurzeln (verwandt mit Fufu) und ist in der gesamten Karibik beliebt.",
          "occasions": "Ein deftiges Hauptgericht zum Mittag- oder Abendessen.",
          "order": "Quisiera un mofongo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mofongo.jpg/960px-Mofongo.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mamajuana",
          "desc": "Würziger Kräuterschnaps aus Rum, Rotwein und Honig auf Rinden und Kräutern.",
          "long": "Mamajuana ist ein traditionelles dominikanisches Getränk aus Rum, Rotwein und Honig, das in einer Flasche mit Kräutern und Baumrinden zieht. Es schmeckt würzig-süß und kräuterig und gilt als Tonikum mit angeblich belebender Wirkung.",
          "ingredients": "Rum, Rotwein, Honig, Kräuter, Baumrinden, Wurzeln",
          "origin": "Die Rezeptur geht auf Heilgetränke der indigenen Taíno zurück, später mit Alkohol verfeinert.",
          "occasions": "Wird gerne als Aperitif oder gesundheitsförderndes Getränk in Gesellschaft getrunken.",
          "order": "Quiero probar la mamajuana, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Mamajuana.jpg"
        },
        {
          "name": "Morir soñando",
          "desc": "Erfrischender Mix aus Orangensaft, Milch und Zucker.",
          "long": "Morir soñando ('Sterben im Träumen') ist ein erfrischendes, cremiges Getränk aus Orangensaft, Milch, Zucker und Eis. Der Name spielt auf den himmlischen Geschmack an; es ist süß, fruchtig und sehr erfrischend.",
          "ingredients": "Orangensaft, Milch (oder Kondensmilch), Zucker, Eis",
          "origin": "Das Getränk ist eine dominikanische Erfindung und ein beliebter Klassiker des Landes.",
          "occasions": "Eine erfrischende Abkühlung an heißen Nachmittagen.",
          "order": "Me da un morir soñando, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Orange_Julius-SG.JPG/960px-Orange_Julius-SG.JPG"
        },
        {
          "name": "Presidente",
          "desc": "Das beliebteste dominikanische Lagerbier, eiskalt serviert.",
          "long": "Presidente ist die bekannteste Biermarke der Dominikanischen Republik, ein helles, leichtes Lagerbier, das eiskalt ('vestida de novia', in beschlagener Flasche) getrunken wird. Es ist erfrischend und mild im Geschmack.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "origin": "Presidente wird seit 1935 gebraut und ist zum nationalen Bier der Dominikanischen Republik geworden.",
          "occasions": "Das gesellige Bier für Strand, Feiern und gemütliche Abende.",
          "order": "Una Presidente bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Presidente-Bier.jpg/960px-Presidente-Bier.jpg"
        },
        {
          "name": "Ron dominicano",
          "desc": "Dominikanischer Rum, z.B. Brugal oder Barceló.",
          "long": "Ron dominicano ist der lokale Rum der Dominikanischen Republik, bekannt für seine Qualität und vielfältigen Sorten von hell bis dunkel gealtert. Er schmeckt je nach Reifung mild bis komplex mit Noten von Karamell und Vanille und wird pur oder im Cocktail genossen.",
          "ingredients": "Zuckerrohr (Melasse), Wasser, Hefe",
          "origin": "Die Dominikanische Republik ist eine der großen Rum-Nationen der Karibik mit Marken wie Brugal, Barceló und Bermúdez.",
          "occasions": "Wird pur, auf Eis oder in Cocktails zu geselligen Anlässen getrunken.",
          "order": "Quisiera un ron dominicano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Barcel%C3%B2_Boat.jpeg/960px-Barcel%C3%B2_Boat.jpeg"
        }
      ],
      "tip": "Nutze für Kurzstrecken die günstigen Conchos und Guaguas, aber vereinbare den Preis am besten vorher."
    },
    {
      "id": "puerto-rico",
      "name": "Puerto Rico",
      "flag": "🇵🇷",
      "region": "Karibik",
      "capital": "San Juan",
      "tagline": "US-Karibik mit Regenwald, Altstadtcharme und Reggaetón",
      "about": "Puerto Rico ist ein US-Außengebiet mit karibischem Flair, vom kopfsteingepflasterten Old San Juan über den Regenwald El Yunque bis zu den biolumineszenten Buchten. Als Backpacker reist du ohne Visum (für US-Einreiseberechtigte) und zahlst bequem in US-Dollar.",
      "history": "Die Taíno nannten die Insel Borikén, bevor Spanien sie ab 1493 kolonisierte und San Juan stark befestigte. 1898 trat Spanien Puerto Rico nach dem Spanisch-Amerikanischen Krieg an die USA ab, deren Bürger die Puertoricaner seit 1917 sind. Heute ist die Insel ein nicht inkorporiertes US-Territorium mit eigener Kultur und anhaltender Debatte über ihren politischen Status.",
      "language": "Das puerto-ricanische Spanisch ist karibisch geprägt, mit verschlucktem S und dem typischen Wandel von R zu L am Silbenende (z.B. 'puelto' statt 'puerto'). Häufig wird das R am Wortanfang auch velar, fast wie ein deutsches Rachen-R, ausgesprochen. Durch die US-Bindung gibt es viele englische Lehnwörter (Spanglish).",
      "words": [
        {
          "es": "wepa",
          "de": "Ausruf der Freude / 'geil!'"
        },
        {
          "es": "boricua",
          "de": "Puertoricaner/in (Selbstbezeichnung)"
        },
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "guagua",
          "de": "Bus"
        },
        {
          "es": "janguear",
          "de": "abhängen, ausgehen (von engl. 'hang out')"
        },
        {
          "es": "bregar",
          "de": "sich mit etwas abmühen, etwas regeln"
        }
      ],
      "food": [
        {
          "name": "Mofongo",
          "desc": "Stampf aus frittierten Kochbananen mit Knoblauch und Schweineschwarte.",
          "long": "Mofongo ist das ikonische Gericht Puerto Ricos: zerstampfte, frittierte grüne Kochbananen, vermengt mit Knoblauch und Schweinegrieben, oft zu einer Kuppel geformt. Es ist knoblauchig, sättigend und wird häufig mit einer Füllung aus Fleisch, Meeresfrüchten oder Brühe serviert.",
          "ingredients": "Grüne Kochbananen, Knoblauch, Schweinegrieben (chicharrón), Olivenöl, Brühe, Salz",
          "origin": "Mofongo hat westafrikanische Wurzeln (verwandt mit Fufu) und entwickelte sich in Puerto Rico zum Nationalgericht.",
          "occasions": "Ein beliebtes Hauptgericht in Restaurants und bei Familienessen.",
          "order": "Quiero un mofongo relleno, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Shrimp_mofongo_from_Rompeolas_restaurant_in_Aguadilla%2C_Puerto_Rico.jpg/960px-Shrimp_mofongo_from_Rompeolas_restaurant_in_Aguadilla%2C_Puerto_Rico.jpg"
        },
        {
          "name": "Arroz con gandules",
          "desc": "Reis mit Taubenerbsen und Sofrito, das Nationalgericht.",
          "long": "Arroz con gandules ist das Nationalgericht Puerto Ricos und besteht aus Reis, der mit Taubenerbsen und der würzigen Basis Sofrito gekocht wird. Es schmeckt herzhaft-würzig und wird oft mit Schweinebraten (pernil) serviert.",
          "ingredients": "Reis, Taubenerbsen (gandules), Sofrito, Schweinefleisch oder Speck, Sazón, Oliven",
          "origin": "Das Gericht vereint spanische, afrikanische und indigene Einflüsse und ist Sinnbild der puerto-ricanischen Küche.",
          "occasions": "Das unverzichtbare Festgericht zu Weihnachten und besonderen Anlässen.",
          "order": "Para mí, arroz con gandules, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Arroz_con_gandules.jpg/960px-Arroz_con_gandules.jpg"
        },
        {
          "name": "Lechón asado",
          "desc": "Am Spieß gegrilltes Spanferkel, Spezialität der Bergregion Guavate.",
          "long": "Lechón asado ist langsam am Spieß gebratenes Spanferkel mit knuspriger Haut und saftigem Fleisch. In Puerto Rico wird es traditionell über Holzkohle gegart und mit Adobo und Knoblauch gewürzt.",
          "ingredients": "Schweinefleisch (ganzes Ferkel), Knoblauch, Adobo, Oregano, Bitterorange, Salz",
          "origin": "Das Spießbraten ist tief in der puerto-ricanischen Tradition verwurzelt, besonders entlang der 'Ruta del Lechón' in Guavate.",
          "occasions": "Das Herzstück festlicher Mahlzeiten, vor allem zu Weihnachten.",
          "order": "Quisiera probar el lechón asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/GEDC0117_%2815057625722%29.jpg/960px-GEDC0117_%2815057625722%29.jpg"
        },
        {
          "name": "Tostones",
          "desc": "Frittierte, plattgedrückte grüne Kochbananen.",
          "long": "Tostones sind zweimal frittierte, plattgedrückte Scheiben grüner Kochbananen, die außen knusprig und innen weich sind. Sie werden gesalzen und oft mit einer Knoblauchsauce (mojo) oder Ketchup-Mayo-Dip gegessen.",
          "ingredients": "Grüne Kochbananen (plátanos verdes), Öl, Salz, Knoblauch",
          "origin": "Tostones sind in ganz Puerto Rico und der Karibik eine allgegenwärtige Beilage.",
          "occasions": "Beliebt als Beilage oder Snack zu jeder Tageszeit.",
          "order": "¿Me pone unos tostones, por favor?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Patacones.JPG/960px-Patacones.JPG"
        },
        {
          "name": "Alcapurrias",
          "desc": "Frittierte Teigtaschen aus Kochbanane und Taro, gefüllt mit Fleisch.",
          "long": "Alcapurrias sind frittierte Teigtaschen aus einem Teig von grünen Kochbananen und Taro (yautía), gefüllt mit gewürztem Hackfleisch. Sie sind außen knusprig, innen weich und ein klassischer Straßen- und Strandimbiss.",
          "ingredients": "Grüne Kochbananen, Taro (yautía), Rinder- oder Schweinehackfleisch, Sofrito, Sazón, Öl",
          "origin": "Alcapurrias gehören zu den 'frituras' Puerto Ricos und verbinden indigene und afrikanische Einflüsse.",
          "occasions": "Ein typischer Snack an Strandständen (kioskos) und auf Festen.",
          "order": "Me da dos alcapurrias, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Alcapurrias-many.jpg/960px-Alcapurrias-many.jpg"
        },
        {
          "name": "Pernil",
          "desc": "Langsam geschmorte, gewürzte Schweineschulter.",
          "long": "Pernil ist eine langsam gebratene Schweineschulter, die zuvor mit Adobo, Knoblauch und Kräutern mariniert wird, bis das Fleisch zart zerfällt und die Haut (cuerito) knusprig wird. Es ist saftig, würzig und ein Festtagsklassiker.",
          "ingredients": "Schweineschulter, Knoblauch, Adobo, Oregano, Bitterorange, Olivenöl, Salz",
          "origin": "Pernil ist ein zentrales Gericht der puerto-ricanischen Festtagsküche, vor allem zur Weihnachtszeit.",
          "occasions": "Das traditionelle Hauptgericht zu Weihnachten und Familienfeiern.",
          "order": "Quisiera un plato de pernil, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Pernil.1.jpg/960px-Pernil.1.jpg"
        }
      ],
      "drink": [
        {
          "name": "Piña colada",
          "desc": "In San Juan erfundener Cocktail aus Rum, Kokoscreme und Ananassaft.",
          "long": "Die Piña colada ist ein cremiger Cocktail aus Rum, Kokoscreme und Ananassaft, der eiskalt und oft mit zerstoßenem Eis serviert wird. Sie schmeckt süß, tropisch-fruchtig und cremig.",
          "ingredients": "Weißer Rum, Kokoscreme (crema de coco), Ananassaft, Eis",
          "origin": "Die Piña colada wurde in San Juan, Puerto Rico, erfunden und ist das offizielle Nationalgetränk der Insel.",
          "occasions": "Der klassische Strand- und Urlaubscocktail für entspannte Stunden.",
          "order": "Una piña colada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pina_Colada_with_key_ingredients.jpg/960px-Pina_Colada_with_key_ingredients.jpg"
        },
        {
          "name": "Coquito",
          "desc": "Cremiger Kokos-Rum-Likör, typisch zur Weihnachtszeit.",
          "long": "Coquito ist ein cremiges Kokos-Getränk auf Rum-Basis, das oft als 'puerto-ricanischer Eierlikör' bezeichnet wird. Es schmeckt süß, kokosnussig und würzig nach Zimt und wird eisgekühlt in kleinen Gläsern serviert.",
          "ingredients": "Weißer Rum, Kokosmilch, Kokoscreme, Kondensmilch, Zimt, Vanille",
          "origin": "Coquito ist ein traditionelles Weihnachtsgetränk Puerto Ricos mit spanischen Wurzeln.",
          "occasions": "Das festliche Getränk zur Weihnachtszeit und auf Familienfeiern.",
          "order": "Me da un coquito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Coquito_in_a_glass.jpg/960px-Coquito_in_a_glass.jpg"
        },
        {
          "name": "Medalla Light",
          "desc": "Das lokale, leichte Inselbier.",
          "long": "Medalla Light ist das bekannteste Bier Puerto Ricos, ein leichtes, helles Lagerbier mit niedrigem Alkoholgehalt. Es ist erfrischend, mild und ideal für das tropische Klima.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "origin": "Medalla wird seit 1979 auf Puerto Rico gebraut und ist zum lokalen Kultbier geworden.",
          "occasions": "Das Strand- und Partybier der Insel für heiße Tage.",
          "order": "Una Medalla bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Medalla_truck_%2802%29.jpg/960px-Medalla_truck_%2802%29.jpg"
        },
        {
          "name": "Ron del Barrilito",
          "desc": "Renommierter, gereifter puerto-ricanischer Rum.",
          "long": "Ron del Barrilito ist ein traditionsreicher, gereifter puerto-ricanischer Rum, der für seinen vollmundigen, komplexen Geschmack geschätzt wird. Er weist Noten von Karamell, Trockenfrüchten und Gewürzen auf und wird gerne pur genossen.",
          "ingredients": "Zuckerrohr (Melasse), Wasser, Hefe",
          "origin": "Ron del Barrilito wird seit 1880 auf der Hacienda Santa Ana in Bayamón hergestellt und gehört zu den ältesten Rummarken Puerto Ricos.",
          "occasions": "Ein edler Rum für besondere Momente, pur oder auf Eis genossen.",
          "order": "Quisiera un Ron del Barrilito, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Old_Rum_bottles%2C_2014.jpg/960px-Old_Rum_bottles%2C_2014.jpg"
        }
      ],
      "tip": "Miete für Ausflüge ein Auto, da der öffentliche Nahverkehr außerhalb San Juans kaum ausgebaut ist."
    },
    {
      "id": "colombia",
      "name": "Kolumbien",
      "flag": "🇨🇴",
      "region": "Südamerika",
      "capital": "Bogotá",
      "tagline": "Karibikküste, Anden, Kaffeezone und überschwängliche Herzlichkeit",
      "about": "Kolumbien reicht von Karibikstränden über die dreigeteilten Anden bis zum Amazonas. Backpacker-Highlights sind die Kolonialstadt Cartagena, das Kaffee-Dreieck um Salento, Medellín und die Karibikküste rund um Tayrona. Das Land bietet enorme landschaftliche und kulturelle Vielfalt.",
      "history": "Vor der Kolonialzeit lebten hier u. a. die Muisca, bekannt für ihren Goldreichtum (El-Dorado-Legende). Ab dem 16. Jahrhundert wurde das Gebiet von Spanien kolonialisiert, 1819 erkämpfte Simón Bolívar die Unabhängigkeit von Großkolumbien. Das 20. Jahrhundert war von Bürgerkrieg, Guerillas (FARC) und Drogenkartellen geprägt. Seit dem Friedensabkommen von 2016 hat sich die Sicherheitslage in vielen Regionen deutlich verbessert.",
      "language": "Kolumbianisches Spanisch, besonders aus Bogotá, gilt als sehr klar und gut verständlich. Auffällig ist das verbreitete höfliche 'usted' auch unter Freunden sowie 'su merced' im Andenland. An der Karibikküste wird schneller gesprochen und das 's' oft verschluckt. Indigene Sprachen wie Wayuunaiki existieren, im Alltag dominiert aber Spanisch.",
      "words": [
        {
          "es": "parcero/parce",
          "de": "Kumpel, Freund"
        },
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "bacano",
          "de": "toll, klasse"
        },
        {
          "es": "¡qué nota!",
          "de": "wie geil! / klasse!"
        },
        {
          "es": "tinto",
          "de": "schwarzer Filterkaffee"
        },
        {
          "es": "berraco",
          "de": "draufgängerisch / krass gut"
        }
      ],
      "food": [
        {
          "name": "Bandeja paisa",
          "desc": "Üppiger Teller mit Bohnen, Reis, Hackfleisch, Chicharrón, Ei, Kochbanane und Avocado.",
          "long": "Eine üppige Riesenplatte aus der Region Antioquia, die mehrere Komponenten auf einem Teller vereint. Sie gilt als deftigstes Sattmacher-Gericht Kolumbiens und ist für viele Reisende die ultimative Mahlzeit nach einem langen Wandertag.",
          "ingredients": "Rote Bohnen, Reis, Hackfleisch, Chicharrón (frittierter Schweinebauch), Bratwurst, Spiegelei, Kochbanane, Avocado, Arepa",
          "origin": "Stammt von den Bauern (paisas) der Bergregion Antioquia rund um Medellín, wo die kalorienreiche Kost die harte Feldarbeit ausgleichen sollte.",
          "occasions": "Wird meist mittags als Hauptmahlzeit gegessen, oft am Wochenende oder wenn man richtig hungrig ist.",
          "order": "Una bandeja paisa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bandepaisabog.JPG/960px-Bandepaisabog.JPG"
        },
        {
          "name": "Arepa",
          "desc": "Gegrillte oder gebratene Maisfladen, oft mit Käse oder Ei gefüllt.",
          "long": "Ein flacher, runder Maisfladen, der gegrillt, gebacken oder frittiert wird und in Kolumbien zu fast jeder Mahlzeit gehört. Je nach Region wird sie pur, mit Käse oder gefüllt gegessen und ist ein günstiger, allgegenwärtiger Snack.",
          "ingredients": "Maismehl (oft weiß), Wasser, Salz, je nach Variante Käse oder Butter",
          "origin": "Eine vorkolumbianische Speise indigener Völker, die heute in Kolumbien und Venezuela als Grundnahrungsmittel gilt.",
          "occasions": "Wird zum Frühstück, als Beilage oder als Snack zu jeder Tageszeit gegessen.",
          "order": "Una arepa con queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Arepitas_Food_Macro.jpg/960px-Arepitas_Food_Macro.jpg"
        },
        {
          "name": "Ajiaco",
          "desc": "Herzhafte Hühnersuppe aus Bogotá mit drei Kartoffelsorten, Mais und Guascas-Kraut.",
          "long": "Eine dicke, cremige Kartoffelsuppe aus Bogotá, die mit Hähnchen und dem typischen Kraut Guascas gewürzt wird. Sie wird traditionell mit Sahne, Kapern und Avocado serviert, die man nach Geschmack hineingibt.",
          "ingredients": "Drei Kartoffelsorten, Hähnchen, Mais am Kolben, Guascas-Kraut, Sahne, Kapern, Avocado",
          "origin": "Das Gericht ist eng mit der Hauptstadt Bogotá und dem kühlen Hochland der Anden verbunden.",
          "occasions": "Wird gern mittags und besonders an kühlen, regnerischen Tagen gegessen.",
          "order": "Un ajiaco santafereño, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ajiaco.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Frittierte Maistaschen, gefüllt mit Fleisch und Kartoffeln.",
          "long": "Frittierte, halbmondförmige Maisteigtaschen mit herzhafter Füllung, die in Kolumbien als beliebter Straßensnack verkauft werden. Sie werden meist mit scharfer Ají-Sauce serviert und sind günstig sowie überall erhältlich.",
          "ingredients": "Maismehlteig, Füllung aus Kartoffel und Fleisch (Rind oder Schwein), Ají-Sauce zum Dippen",
          "origin": "Empanadas verbreiteten sich über die spanische Kolonialzeit in ganz Lateinamerika, mit eigener regionaler Ausprägung in Kolumbien.",
          "occasions": "Werden als schneller Snack zwischendurch oder zum Aperitif gegessen.",
          "order": "Dos empanadas con ají, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        },
        {
          "name": "Sancocho",
          "desc": "Deftiger Eintopf mit Fleisch oder Fisch, Kochbanane und Knollengemüse.",
          "long": "Ein herzhafter Eintopf mit Fleisch und kräftigem Wurzelgemüse, der in vielen regionalen Varianten existiert. Er gilt als typisches Familien- und Wochenendgericht und wird oft in großen Töpfen für viele Personen gekocht.",
          "ingredients": "Fleisch (Huhn, Rind oder Fisch), Yuca, Kochbanane, Kartoffel, Mais, Koriander",
          "origin": "Der Sancocho ist in vielen Ländern Lateinamerikas und der Karibik verbreitet und in Kolumbien je nach Region unterschiedlich ausgeprägt.",
          "occasions": "Wird gern am Wochenende, bei Familientreffen und Feiern gegessen.",
          "order": "Un sancocho de gallina, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sancocho-hueso.JPG/960px-Sancocho-hueso.JPG"
        },
        {
          "name": "Lechona",
          "desc": "Im Ganzen gefülltes und gebackenes Spanferkel mit Reis und Erbsen.",
          "long": "Ein ganzes Spanferkel, das mit Reis, Erbsen und Gewürzen gefüllt und stundenlang im Ofen geröstet wird. Die knusprige Haut ist besonders begehrt, und das Gericht wird portionsweise mit Arepa serviert.",
          "ingredients": "Ganzes Schwein, Reis, gelbe Erbsen, Zwiebeln, Gewürze",
          "origin": "Die Lechona stammt aus der Region Tolima im Zentrum Kolumbiens und ist dort ein traditionelles Festgericht.",
          "occasions": "Wird vor allem bei Festen, Feiern und besonderen Anlässen serviert.",
          "order": "Una porción de lechona, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/LEchona_%28Spain%29.JPG/960px-LEchona_%28Spain%29.JPG"
        }
      ],
      "drink": [
        {
          "name": "Aguardiente",
          "desc": "Anisbetonter Schnaps aus Zuckerrohr, das kolumbianische Nationalgetränk.",
          "long": "Ein klarer, anisaromatisierter Schnaps aus Zuckerrohr, der als kolumbianisches Nationalgetränk gilt. Er wird meist pur in kleinen Gläsern getrunken und ist auf Feiern und beim Feiern allgegenwärtig.",
          "ingredients": "Zuckerrohrdestillat, Anis, Zucker",
          "origin": "Aguardiente wird in Kolumbien seit der Kolonialzeit hergestellt, wobei jede Region ihre eigene Marke hat.",
          "occasions": "Wird auf Partys, Festen und in geselliger Runde getrunken.",
          "order": "Un aguardiente, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/TAPA_ROJA.jpeg/960px-TAPA_ROJA.jpeg"
        },
        {
          "name": "Tinto",
          "desc": "Kleiner, oft süßer schwarzer Kaffee, überall an Straßenständen erhältlich.",
          "long": "Ein kleiner, schwarzer Filterkaffee, der in Kolumbien überall und zu jeder Tageszeit getrunken wird. Trotz des Namens (tinto heißt eigentlich rot) bezeichnet er den schwarzen Kaffee und wird oft von Straßenverkäufern angeboten.",
          "ingredients": "Kaffee, Wasser, oft viel Zucker",
          "origin": "Als eines der größten Kaffeeanbauländer der Welt hat Kolumbien eine tief verwurzelte Kaffeekultur.",
          "occasions": "Wird den ganzen Tag über getrunken, oft als kurze Pause oder beim Plausch.",
          "order": "Un tinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/960px-A_small_cup_of_coffee.JPG"
        },
        {
          "name": "Lulada",
          "desc": "Erfrischendes Getränk aus der sauren Lulo-Frucht, beliebt in Cali.",
          "long": "Ein erfrischendes Getränk aus der zerdrückten Lulo-Frucht mit Limette, Zucker und Eis, typisch für die Stadt Cali. Die säuerlich-fruchtige Mischung wird mit Fruchtstücken serviert und kühlt an heißen Tagen angenehm ab.",
          "ingredients": "Lulo-Frucht, Limette, Zucker, Wasser, Eis",
          "origin": "Die Lulada stammt aus der Region Valle del Cauca im Südwesten Kolumbiens, besonders aus Cali.",
          "occasions": "Wird als erfrischendes Getränk an heißen Nachmittagen getrunken.",
          "order": "Una lulada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/4/43/Champ%C3%BAs_Titular.jpg"
        },
        {
          "name": "Refajo",
          "desc": "Mischung aus Bier und der roten Limonade Colombiana.",
          "long": "Eine Mischung aus hellem Bier und der roten Limonade Colombiana, die süß und leicht trinkbar ist. Sie wird gern auf Feiern in geselliger Runde getrunken und ist weniger stark als reines Bier.",
          "ingredients": "Helles Lagerbier, rote Limonade (Colombiana), oft Eis",
          "origin": "Das Mischgetränk ist in ganz Kolumbien als geselliges Partygetränk verbreitet.",
          "occasions": "Wird bei Feiern, Grillabenden und in geselliger Runde getrunken.",
          "order": "Un refajo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Shandy_beer.jpg/960px-Shandy_beer.jpg"
        }
      ],
      "tip": "Sag '¿me regalas...?' statt 'quiero' beim Bestellen oder Bezahlen, das ist in Kolumbien die übliche höfliche Formel."
    },
    {
      "id": "venezuela",
      "name": "Venezuela",
      "flag": "🇻🇪",
      "region": "Südamerika",
      "capital": "Caracas",
      "tagline": "Karibikstrände, Tafelberge und der höchste Wasserfall der Welt",
      "about": "Venezuela liegt an der Karibikküste und reicht von Stränden über die Anden bis zum Amazonas und der Gran Sabana mit ihren Tafelbergen (Tepuis). Hier stürzt der Salto Ángel, der höchste Wasserfall der Erde, in die Tiefe. Wegen der politischen und wirtschaftlichen Krise ist Reisen aktuell schwierig und erfordert gute Vorbereitung.",
      "history": "Vor der Kolonialzeit lebten hier indigene Völker wie Caribe und Arawak. Spanien kolonialisierte das Gebiet ab dem 16. Jahrhundert; 1811 begann unter Simón Bolívar, hier geboren, der Unabhängigkeitskampf. Im 20. Jahrhundert machte Erdöl Venezuela zeitweise reich. Seit den 2000er-Jahren führten Misswirtschaft und Hyperinflation zu einer schweren Krise und massiver Auswanderung.",
      "language": "Venezolanisches Spanisch klingt karibisch: schnell, melodisch und mit oft verschlucktem 's' am Silbenende. Verbreitet sind Verkleinerungsformen auf '-ico' statt '-ito' (z. B. 'ahorita' wird zu 'ahoritica'). Das Land ist berühmt für seinen lockeren Slang und Spitznamen für fast jeden. Indigene Sprachen wie Wayuunaiki und Warao werden regional noch gesprochen.",
      "words": [
        {
          "es": "chamo/chama",
          "de": "Typ / Mädel, Kumpel"
        },
        {
          "es": "pana",
          "de": "Kumpel, guter Freund"
        },
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "vaina",
          "de": "Ding, Sache (Allzweckwort)"
        },
        {
          "es": "arrecho",
          "de": "sauer/wütend oder krass (je nach Kontext)"
        },
        {
          "es": "burda",
          "de": "sehr, voll (Verstärkung)"
        }
      ],
      "food": [
        {
          "name": "Arepa",
          "desc": "Gefüllter Maisfladen, das venezolanische Grundnahrungsmittel schlechthin.",
          "long": "In Venezuela ist die Arepa ein dicker Maisfladen, der aufgeschnitten und großzügig gefüllt wird, fast wie ein Sandwich. Die zahlreichen Füllvarianten haben eigene Namen, etwa die Reina Pepiada mit Avocado und Hähnchen.",
          "ingredients": "Maismehl (Harina P.A.N.), Wasser, Salz, Füllungen wie Käse, schwarze Bohnen, Avocado, Hähnchen",
          "origin": "Eine vorkolumbianische Maisspeise, die in Venezuela als tägliches Grundnahrungsmittel und nationales Symbol gilt.",
          "occasions": "Wird zum Frühstück, Abendessen oder als gefüllte Hauptmahlzeit gegessen.",
          "order": "Una arepa reina pepiada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Arepitas_Food_Macro.jpg/960px-Arepitas_Food_Macro.jpg"
        },
        {
          "name": "Pabellón criollo",
          "desc": "Nationalgericht aus geschmortem Zupffleisch, schwarzen Bohnen, Reis und Kochbanane.",
          "long": "Das Nationalgericht Venezuelas vereint geschmortes, zerzupftes Rindfleisch mit Reis, schwarzen Bohnen und gebratener Kochbanane auf einem Teller. Die Kombination gilt als ausgewogenes, sättigendes Mittagsgericht und spiegelt die kulturelle Vielfalt des Landes wider.",
          "ingredients": "Zerzupftes Rindfleisch (carne mechada), weißer Reis, schwarze Bohnen (caraotas), gebratene Kochbanane",
          "origin": "Das Gericht entstand aus der Mischung indigener, afrikanischer und europäischer Einflüsse und gilt als kulinarisches Sinnbild Venezuelas.",
          "occasions": "Wird vor allem mittags als klassische Hauptmahlzeit gegessen.",
          "order": "Un pabellón criollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pabell%C3%B3n_Criollo_Venezolano.jpg/960px-Pabell%C3%B3n_Criollo_Venezolano.jpg"
        },
        {
          "name": "Cachapa",
          "desc": "Süßlicher Pfannkuchen aus frischem Mais, oft mit Käse gefüllt.",
          "long": "Ein dicker, leicht süßlicher Pfannkuchen aus frischem, jungem Mais, der goldgelb gebacken wird. Er wird meist mit dem weichen Käse Queso de mano gefüllt oder belegt und ist ein beliebtes Straßen- und Frühstücksgericht.",
          "ingredients": "Frischer junger Mais, etwas Zucker, Salz, Queso de mano (Frischkäse)",
          "origin": "Die Cachapa ist eine traditionelle Maisspeise Venezuelas mit vorkolumbianischen Wurzeln.",
          "occasions": "Wird zum Frühstück oder als herzhafter Snack gegessen.",
          "order": "Una cachapa con queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Cachapas_from_Venezuela.jpg/960px-Cachapas_from_Venezuela.jpg"
        },
        {
          "name": "Hallaca",
          "desc": "Weihnachtsgericht aus Maisteig mit Schmorfüllung, in Bananenblättern gegart.",
          "long": "Ein gefülltes Maisteig-Päckchen, das in Bananenblättern gegart wird und als venezolanisches Weihnachtsgericht gilt. Die aufwendige Zubereitung der würzigen Fleischfüllung ist traditionell ein gemeinsames Familienereignis.",
          "ingredients": "Maisteig, Schmorfleisch (Rind, Schwein, Huhn), Oliven, Rosinen, Kapern, Paprika, Bananenblätter",
          "origin": "Die Hallaca entstand in der Kolonialzeit und vereint indigene, afrikanische und europäische Zutaten zu einem Festgericht.",
          "occasions": "Wird vor allem zur Weihnachtszeit und an Festtagen gegessen.",
          "order": "Una hallaca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hallacas_con_pan_de_jamon%2C_plato_Venezuelano.jpg/960px-Hallacas_con_pan_de_jamon%2C_plato_Venezuelano.jpg"
        },
        {
          "name": "Tequeños",
          "desc": "Frittierte Teigstangen mit geschmolzenem Käse, der beliebteste Snack.",
          "long": "Frittierte Teigstangen, die mit weißem Käse gefüllt und außen knusprig sind. Sie gelten als der beliebteste Party- und Fingerfood-Snack Venezuelas und werden oft mit Dip-Saucen serviert.",
          "ingredients": "Weizenmehlteig, weißer Käse (queso blanco), Öl zum Frittieren",
          "origin": "Die Tequeños sollen aus dem Ort Los Teques nahe Caracas stammen und tragen daher ihren Namen.",
          "occasions": "Werden auf Feiern, Partys und als Vorspeise gereicht.",
          "order": "Una orden de tequeños, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Teque%C3%B1os_v%C3%A9n%C3%A9zu%C3%A9liens_%C3%A0_Arepado_%28Lyon%29%2C_avril_2019_%282%29.jpg/960px-Teque%C3%B1os_v%C3%A9n%C3%A9zu%C3%A9liens_%C3%A0_Arepado_%28Lyon%29%2C_avril_2019_%282%29.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Frittierte Maistaschen, oft mit Käse, Fleisch oder Bohnen gefüllt.",
          "long": "In Venezuela werden Empanadas aus Maisteig hergestellt und frittiert, mit Füllungen von Käse über Fleisch bis Fisch. Sie sind ein klassischer Frühstücks- und Strandsnack und werden warm gegessen.",
          "ingredients": "Maismehlteig, Füllung aus Käse, Hackfleisch, Hähnchen oder Fisch",
          "origin": "Die frittierte Maisteig-Empanada ist eine venezolanische Variante der in ganz Lateinamerika verbreiteten Teigtasche.",
          "occasions": "Werden zum Frühstück oder als Snack, oft am Strand, gegessen.",
          "order": "Una empanada de queso, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        }
      ],
      "drink": [
        {
          "name": "Ron venezolano",
          "desc": "Hochwertiger Rum, weltweit für seine Qualität geschätzt.",
          "long": "Venezolanischer Rum aus Zuckerrohr gilt als einer der besten der Welt und wird oft pur oder auf Eis genossen. Mehrere venezolanische Marken sind international für ihre langgereiften Sorten bekannt.",
          "ingredients": "Zuckerrohrmelasse, gereift in Eichenfässern",
          "origin": "Venezuela hat eine lange Rumtradition und unterliegt einer geschützten Herkunftsbezeichnung für Rum.",
          "occasions": "Wird abends, auf Feiern oder als Genussgetränk getrunken.",
          "order": "Un ron en las rocas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Botella_de_Ron_Cacique.JPG"
        },
        {
          "name": "Papelón con limón",
          "desc": "Erfrischung aus Rohrzucker (Papelón) und Limette.",
          "long": "Ein erfrischendes Getränk aus unraffiniertem Rohrzucker (Papelón), Limette und Wasser. Es ist günstig, allgegenwärtig und löscht an heißen Tagen den Durst besonders gut.",
          "ingredients": "Papelón (Rohrzuckerblock), Limette, Wasser, Eis",
          "origin": "Das Getränk ist ein traditioneller, alltäglicher Durstlöscher in ganz Venezuela.",
          "occasions": "Wird zu Mahlzeiten oder als Erfrischung an heißen Tagen getrunken.",
          "order": "Un papelón con limón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Papel%C3%B3n_con_lim%C3%B3n_2.jpg/960px-Papel%C3%B3n_con_lim%C3%B3n_2.jpg"
        },
        {
          "name": "Chicha",
          "desc": "Süßes, sämiges Getränk auf Reisbasis mit Zimt.",
          "long": "In Venezuela ist Chicha ein dickflüssiges, süßes Getränk auf Reisbasis, das mit Milch, Zimt und Zucker zubereitet wird. Es wird kalt serviert und oft von Straßenverkäufern angeboten.",
          "ingredients": "Reis, Milch, Zucker, Zimt, manchmal Kondensmilch",
          "origin": "Die venezolanische Reis-Chicha unterscheidet sich von den fermentierten Mais-Chichas anderer Andenländer.",
          "occasions": "Wird als süße Erfrischung oder kleiner Snack zwischendurch getrunken.",
          "order": "Una chicha, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Malta",
          "desc": "Alkoholfreies, dunkles Malzgetränk, sehr beliebt zum Essen.",
          "long": "Ein dunkles, alkoholfreies Malzgetränk, das süß und vollmundig schmeckt. Es ist in ganz Venezuela beliebt und wird oft gekühlt oder zusammen mit Kondensmilch getrunken.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Zucker (alkoholfrei)",
          "origin": "Malzgetränke wie die Malta sind in der gesamten Karibik und in Venezuela weit verbreitet.",
          "occasions": "Wird zu Mahlzeiten oder als süße Erfrischung getrunken.",
          "order": "Una malta bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Maltin_polar_-_green_spot.jpg"
        }
      ],
      "tip": "Informiere dich vor der Reise gründlich über die aktuelle Sicherheits- und Versorgungslage und nimm ausreichend Bargeld (US-Dollar) mit, da Karten oft nicht funktionieren."
    },
    {
      "id": "ecuador",
      "name": "Ecuador",
      "flag": "🇪🇨",
      "region": "Südamerika",
      "capital": "Quito",
      "tagline": "Galápagos, Vulkane und der Äquator auf kleinstem Raum",
      "about": "Ecuador ist eines der kleinsten, aber vielfältigsten Länder Südamerikas: Küste, Anden mit Vulkanen, Amazonas und die einzigartigen Galápagos-Inseln. Backpacker lieben Quitos Altstadt, die Vulkanstraße ('Avenida de los Volcanes') und Baños als Abenteuer-Hub. Dank kompakter Größe sind die Regionen schnell erreichbar.",
      "history": "Vor der spanischen Eroberung war das Andenhochland Teil des Inkareichs, mit Quito als wichtigem Zentrum. Spanien kolonialisierte das Gebiet ab dem 16. Jahrhundert; 1822 wurde es nach der Schlacht von Pichincha unabhängig und gehörte zunächst zu Großkolumbien. 1830 entstand der eigenständige Staat Ecuador. Seit 2000 ist der US-Dollar offizielle Währung.",
      "language": "Das Andenspanisch Ecuadors gilt als langsam und klar, ideal zum Spanischlernen. Quechua (lokal 'Kichwa') ist als indigene Sprache weit verbreitet und hat viele Wörter beigesteuert. Höflich wird oft das Verkleinerungssuffix '-ito/-ita' benutzt, sogar bei 'ahorita' oder 'despacito'. An der Küste wird schneller und karibischer gesprochen als im Hochland.",
      "words": [
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "pana",
          "de": "Kumpel, Freund"
        },
        {
          "es": "chuta",
          "de": "Mist! / verflixt! (mild)"
        },
        {
          "es": "ñaño/ñaña",
          "de": "Bruder / Schwester (auch enger Freund)"
        },
        {
          "es": "bacán",
          "de": "klasse, toll"
        },
        {
          "es": "guagua",
          "de": "Kleinkind (aus dem Quechua)"
        }
      ],
      "food": [
        {
          "name": "Ceviche",
          "desc": "Ecuadorianisches Ceviche, oft mit Garnelen und in einer tomatigen Marinade.",
          "long": "Das ecuadorianische Ceviche wird oft mit Garnelen zubereitet und in einer tomatigen, leicht süßlichen Marinade serviert. Anders als die peruanische Variante schwimmt es in mehr Flüssigkeit und wird gern mit Popcorn, gerösteten Maiskörnern oder Kochbananenchips gegessen.",
          "ingredients": "Garnelen (oder Fisch), Limette, Tomate, Zwiebel, Koriander, dazu Canguil (Popcorn) oder Chifles",
          "origin": "Ceviche ist an der ecuadorianischen Küste weit verbreitet und unterscheidet sich durch seinen tomatigen Sud von anderen Ländern.",
          "occasions": "Wird gern mittags und als erfrischendes Gericht an warmen Tagen gegessen.",
          "order": "Un ceviche de camarón, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Encebollado",
          "desc": "Herzhafte Fischsuppe mit Thunfisch, Yuca und Zwiebeln, gilt als Katerfrühstück.",
          "long": "Eine herzhafte Fischsuppe mit Thunfisch, Yuca und viel mariniertem Zwiebelsalat, die als Klassiker der ecuadorianischen Küste gilt. Sie wird oft mit Chifles und Popcorn serviert und gilt als beliebtes Katermittel am Morgen.",
          "ingredients": "Albacora-Thunfisch, Yuca, rote Zwiebeln, Tomate, Koriander, Limette, Chifles",
          "origin": "Das Encebollado stammt von der Pazifikküste Ecuadors und gilt vielen als inoffizielles Nationalgericht.",
          "occasions": "Wird besonders morgens und vormittags gegessen, gern auch gegen den Kater.",
          "order": "Un encebollado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Semifinal_del_Campeonato_del_Encebollado_en_Esmeraldas_2015_%2818062294436%29.jpg/960px-Semifinal_del_Campeonato_del_Encebollado_en_Esmeraldas_2015_%2818062294436%29.jpg"
        },
        {
          "name": "Llapingachos",
          "desc": "Gebratene Kartoffel-Käse-Puffer, meist mit Erdnusssauce serviert.",
          "long": "Gebratene Kartoffelpuffer, die mit Käse gefüllt und goldbraun angebraten werden. Sie werden meist mit Erdnusssauce, Wurst, Ei und Avocado serviert und sind ein typisches Gericht des Hochlands.",
          "ingredients": "Kartoffeln, Käse, Zwiebeln, Achiote, Erdnusssauce als Beilage",
          "origin": "Die Llapingachos stammen aus dem Andenhochland Ecuadors, besonders aus der Region Ambato.",
          "occasions": "Werden zum Frühstück, Mittag- oder Abendessen gegessen.",
          "order": "Unos llapingachos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Llapingachos._%2840491622163%29.jpg/960px-Llapingachos._%2840491622163%29.jpg"
        },
        {
          "name": "Hornado",
          "desc": "Langsam gebratenes, knuspriges Schweinefleisch aus dem Hochland.",
          "long": "Ein im Ganzen langsam geröstetes Schwein mit knuspriger Haut, das auf Märkten frisch portioniert verkauft wird. Es wird typischerweise mit Llapingachos, Mais und mariniertem Zwiebelsalat serviert.",
          "ingredients": "Ganzes Schwein, Knoblauch, Kreuzkümmel, Achiote, Bier oder Chicha zum Marinieren",
          "origin": "Der Hornado ist ein traditionelles Gericht des ecuadorianischen Andenhochlands und ein Markt-Klassiker.",
          "occasions": "Wird mittags, besonders an Markttagen und bei Feiern, gegessen.",
          "order": "Un plato de hornado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ama_la_Vida_-_Flickr_-_Imbabura_Hornado_%2823%29_%2814294973591%29.jpg/960px-Ama_la_Vida_-_Flickr_-_Imbabura_Hornado_%2823%29_%2814294973591%29.jpg"
        },
        {
          "name": "Locro de papa",
          "desc": "Cremige Kartoffelsuppe mit Käse und Avocado.",
          "long": "Eine cremige Kartoffelsuppe mit Käse, die im kühlen Andenhochland besonders wärmt. Sie wird traditionell mit Avocado und manchmal mit Mais serviert und gilt als wohltuendes Hausmannskost-Gericht.",
          "ingredients": "Kartoffeln, Käse, Milch, Zwiebeln, Achiote, Avocado",
          "origin": "Der Locro de papa ist ein traditionelles Gericht der ecuadorianischen Anden.",
          "occasions": "Wird gern mittags und an kühlen Tagen gegessen.",
          "order": "Un locro de papa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Locro_de_papa.jpg/960px-Locro_de_papa.jpg"
        },
        {
          "name": "Cuy",
          "desc": "Gegrilltes Meerschweinchen, ein traditionelles Andengericht.",
          "long": "Cuy ist gegrilltes oder geröstetes Meerschweinchen, eine Delikatesse des Andenhochlands mit langer Tradition. Das Tier wird im Ganzen über offenem Feuer gegart und mit Kartoffeln und Erdnusssauce serviert.",
          "ingredients": "Meerschweinchen, Knoblauch, Kreuzkümmel, Salz, Beilage aus Kartoffeln",
          "origin": "Cuy wird in den Anden seit vorkolumbianischer Zeit gegessen und gilt als Festtagsspeise indigener Kulturen.",
          "occasions": "Wird vor allem bei Festen, Feiern und besonderen Anlässen gegessen.",
          "order": "Un cuy asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Caviaklein.jpg"
        }
      ],
      "drink": [
        {
          "name": "Canelazo",
          "desc": "Heißes Getränk aus Zuckerrohrschnaps, Zimt und Naranjilla, ideal gegen die Andenkälte.",
          "long": "Ein heißes, alkoholisches Getränk aus Zimt, Wasser, Zucker und Zuckerrohrschnaps (Aguardiente). Es wärmt im kühlen Andenhochland und wird besonders abends und an Feiertagen getrunken.",
          "ingredients": "Aguardiente, Zimt, Panela (Rohrzucker), Wasser, oft Naranjilla",
          "origin": "Der Canelazo ist ein traditionelles Heißgetränk der Anden Ecuadors und Kolumbiens.",
          "occasions": "Wird an kühlen Abenden und bei Festen getrunken.",
          "order": "Un canelazo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Canelazo.jpg/960px-Canelazo.jpg"
        },
        {
          "name": "Pilsener",
          "desc": "Das populärste einheimische Lagerbier Ecuadors.",
          "long": "Das meistgetrunkene Bier Ecuadors, ein helles Lagerbier, das überall erhältlich ist. Es wird gern eiskalt zu geselligen Anlässen und am Strand getrunken.",
          "ingredients": "Gerstenmalz, Hopfen, Wasser, Hefe",
          "origin": "Pilsener ist die bekannteste einheimische Biermarke Ecuadors mit langer Geschichte.",
          "occasions": "Wird in geselliger Runde, auf Feiern und am Strand getrunken.",
          "order": "Una Pilsener bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Pilsener.png"
        },
        {
          "name": "Colada morada",
          "desc": "Dickflüssiges, gewürztes Beerengetränk, traditionell zum Allerseelenfest.",
          "long": "Ein warmes, dickflüssiges, dunkelviolettes Getränk aus violettem Mais und verschiedenen Früchten. Es wird traditionell zum Allerseelentag zusammen mit dem Gebäck Guaguas de pan getrunken.",
          "ingredients": "Violettes Maismehl, Brombeeren, Heidelbeeren, Naranjilla, Gewürze wie Zimt und Nelken",
          "origin": "Die Colada morada hat indigene Wurzeln und ist eng mit dem Día de los Difuntos verbunden.",
          "occasions": "Wird vor allem Anfang November zum Allerseelentag getrunken.",
          "order": "Una colada morada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/COLADA_MORADA_Y_GUAGUAS_DE_PAN_%2838016386062%29.jpg/960px-COLADA_MORADA_Y_GUAGUAS_DE_PAN_%2838016386062%29.jpg"
        },
        {
          "name": "Jugo de naranjilla",
          "desc": "Erfrischender Saft aus der säuerlichen Naranjilla-Frucht.",
          "long": "Ein erfrischender Saft aus der Naranjilla, einer säuerlichen grünen Frucht der Anden. Der spritzig-saure Geschmack macht ihn zu einem beliebten Durstlöscher an warmen Tagen.",
          "ingredients": "Naranjilla (Lulo), Wasser, Zucker, Eis",
          "origin": "Die Naranjilla wächst in den Andenregionen Ecuadors und ist dort eine verbreitete Saftfrucht.",
          "occasions": "Wird zu Mahlzeiten oder als Erfrischung getrunken.",
          "order": "Un jugo de naranjilla, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Oranges_-_whole-halved-segment.jpg/960px-Oranges_-_whole-halved-segment.jpg"
        }
      ],
      "tip": "Nutze die kompakte Größe des Landes: Mit dem Bus erreichst du von Quito aus Küste, Anden und Dschungel jeweils in wenigen Stunden."
    },
    {
      "id": "peru",
      "name": "Peru",
      "flag": "🇵🇪",
      "region": "Südamerika",
      "capital": "Lima",
      "tagline": "Machu Picchu, Inka-Erbe und eine der besten Küchen der Welt",
      "about": "Peru vereint Wüstenküste, hohe Anden und Amazonasregenwald. Das absolute Highlight ist Machu Picchu, dazu kommen Cusco, das Heilige Tal, der Titicacasee und der Canyon von Colca. Lima gilt zudem als kulinarische Hauptstadt Lateinamerikas.",
      "history": "Peru war das Kernland des Inkareichs mit Cusco als Hauptstadt, dem ältere Hochkulturen wie Nazca, Moche und Chimú vorausgingen. 1532 eroberte Francisco Pizarro das Reich für Spanien, das daraufhin das mächtige Vizekönigreich Peru errichtete. 1821 erklärte José de San Martín die Unabhängigkeit. Heute ist Peru ein Zentrum andiner Kultur, in der Quechua-Tradition bis heute lebendig ist.",
      "language": "Das peruanische Andenspanisch ist meist klar und gut verständlich. Quechua ist zweite Amtssprache und vor allem rund um Cusco im Alltag präsent; auch Aymara wird am Titicacasee gesprochen. Viele Alltagswörter stammen aus dem Quechua, etwa 'wawa' (Baby) oder 'chacra' (Acker). An der Küste und in Lima wird schneller gesprochen als im Hochland.",
      "words": [
        {
          "es": "pata",
          "de": "Kumpel, Freund"
        },
        {
          "es": "chévere",
          "de": "cool, super"
        },
        {
          "es": "bacán",
          "de": "klasse, toll"
        },
        {
          "es": "causa",
          "de": "Kumpel (auch ein Kartoffelgericht)"
        },
        {
          "es": "jato",
          "de": "Haus, Bude"
        },
        {
          "es": "al toque",
          "de": "sofort, ruckzuck"
        }
      ],
      "food": [
        {
          "name": "Ceviche",
          "desc": "In Limettensaft marinierter roher Fisch mit Zwiebeln, Chili und Süßkartoffel, das Nationalgericht.",
          "long": "Das peruanische Ceviche ist das Nationalgericht und besteht aus rohem Fisch, der in frischem Limettensaft gegart wird. Es wird klassisch mit roten Zwiebeln, Chili, Koriander, Süßkartoffel und Mais serviert, wobei die scharf-saure Marinade Leche de tigre besonders geschätzt wird.",
          "ingredients": "Roher Weißfisch, Limette, rote Zwiebeln, Ají (Chili), Koriander, Süßkartoffel, Choclo (Mais)",
          "origin": "Ceviche hat in Peru vorkolumbianische Wurzeln und gilt als kulinarisches Nationalsymbol mit eigenem Feiertag.",
          "occasions": "Wird traditionell mittags und besonders frisch zubereitet gegessen.",
          "order": "Un ceviche de pescado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ceviche_at_Peru.jpg/960px-Ceviche_at_Peru.jpg"
        },
        {
          "name": "Lomo saltado",
          "desc": "Pfannengebratenes Rindfleisch mit Zwiebeln, Tomaten und Pommes, chinesisch beeinflusst.",
          "long": "Ein Pfannengericht aus mariniertem Rindfleisch, das mit Zwiebeln und Tomaten im Wok scharf angebraten wird. Es vereint chinesische und peruanische Küche und wird typischerweise mit Pommes frites und Reis zugleich serviert.",
          "ingredients": "Rindfleischstreifen, Zwiebeln, Tomaten, Sojasauce, Ají amarillo, Pommes frites, Reis",
          "origin": "Lomo saltado entstand aus der chinesisch-peruanischen Chifa-Küche im 19. Jahrhundert.",
          "occasions": "Wird als sättigende Hauptmahlzeit mittags oder abends gegessen.",
          "order": "Un lomo saltado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Lomo-saltado-perudelights.jpg/960px-Lomo-saltado-perudelights.jpg"
        },
        {
          "name": "Ají de gallina",
          "desc": "Cremiges Hühnerragout mit gelbem Chili (Ají amarillo).",
          "long": "Ein cremiges Gericht aus zerzupftem Hähnchen in einer würzigen, leicht scharfen gelben Sauce auf Basis von Ají amarillo. Es wird mit Reis, Kartoffeln, Oliven und Ei serviert und ist mild-pikant im Geschmack.",
          "ingredients": "Hähnchen, Ají amarillo, Brot oder Cracker, Milch, Walnüsse, Parmesan, Kartoffeln",
          "origin": "Das Gericht hat Wurzeln in der spanischen Kolonialküche und gilt als peruanischer Klassiker.",
          "occasions": "Wird als wärmende Hauptmahlzeit mittags oder abends gegessen.",
          "order": "Un ají de gallina, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Aj%C3%AD_de_gallina_-_Tradicional.jpg/960px-Aj%C3%AD_de_gallina_-_Tradicional.jpg"
        },
        {
          "name": "Causa limeña",
          "desc": "Geschichteter, kalter Kartoffelstock mit Limette und herzhafter Füllung.",
          "long": "Eine kalte Vorspeise aus gewürztem Kartoffelpüree, das mit Ají amarillo und Limette abgeschmeckt und geschichtet wird. Zwischen den Schichten befindet sich meist eine Füllung aus Thunfisch, Hähnchen oder Avocado.",
          "ingredients": "Gelbe Kartoffeln, Ají amarillo, Limette, Füllung aus Thunfisch oder Hähnchen, Avocado, Mayonnaise",
          "origin": "Die Causa stammt aus Lima und hat ihren Ursprung vermutlich in der Zeit des Unabhängigkeitskriegs.",
          "occasions": "Wird als kalte Vorspeise oder leichtes Gericht gegessen.",
          "order": "Una causa limeña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Causa_Rellena.jpg/960px-Causa_Rellena.jpg"
        },
        {
          "name": "Anticuchos",
          "desc": "Gegrillte Spieße, klassisch aus mariniertem Rinderherz.",
          "long": "Gegrillte Fleischspieße, die traditionell aus mariniertem Rinderherz bestehen und über Holzkohle gebraten werden. Sie sind ein beliebter Straßensnack und werden mit Kartoffeln und Maiskolben serviert.",
          "ingredients": "Rinderherz, Ají panca, Knoblauch, Essig, Kreuzkümmel, dazu Kartoffeln und Choclo",
          "origin": "Anticuchos haben afrikanisch-peruanische Wurzeln und gehen auf die Kolonialzeit zurück.",
          "occasions": "Werden abends als Straßensnack und bei Festen gegessen.",
          "order": "Unos anticuchos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Anticuchos_de_la_Tia_Grima.jpg/960px-Anticuchos_de_la_Tia_Grima.jpg"
        },
        {
          "name": "Cuy",
          "desc": "Gegrilltes oder gebratenes Meerschweinchen, eine Andendelikatesse.",
          "long": "Cuy ist geröstetes oder frittiertes Meerschweinchen und gilt im peruanischen Andenhochland als traditionelle Delikatesse. Es wird im Ganzen serviert, oft mit Kartoffeln und scharfer Sauce.",
          "ingredients": "Meerschweinchen, Knoblauch, Kreuzkümmel, Huacatay-Kraut, Kartoffeln",
          "origin": "Cuy wird in den peruanischen Anden seit vorkolumbianischer Zeit gegessen und ist Teil der Festkultur.",
          "occasions": "Wird vor allem bei Festen und besonderen Anlässen gegessen.",
          "order": "Un cuy chactado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Caviaklein.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pisco Sour",
          "desc": "Cocktail aus Pisco, Limette, Eiweiß und Zuckersirup, der Nationalcocktail.",
          "long": "Der berühmteste Cocktail Perus aus dem Traubenbrand Pisco, Limette, Zuckersirup, Eiweiß und einem Spritzer Angostura. Er schmeckt frisch-säuerlich mit schaumiger Krone und gilt als Nationalcocktail.",
          "ingredients": "Pisco, Limette, Zuckersirup, Eiweiß, Angostura-Bitter, Eis",
          "origin": "Der Pisco Sour wurde Anfang des 20. Jahrhunderts in Lima erfunden, wobei Peru und Chile über die Herkunft des Pisco streiten.",
          "occasions": "Wird als Aperitif, abends und zu Feiern getrunken.",
          "order": "Un pisco sour, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pisco_sour_20100613b.JPG/960px-Pisco_sour_20100613b.JPG"
        },
        {
          "name": "Inca Kola",
          "desc": "Knallgelbe, sehr süße Kultlimonade mit Kaugummigeschmack.",
          "long": "Eine knallgelbe Limonade mit süßem Kaugummi-Geschmack, die in Peru beliebter ist als Cola. Sie gilt als nationales Kultgetränk und wird zu fast jeder Mahlzeit getrunken.",
          "ingredients": "Wasser, Zucker, Kohlensäure, Zitronenverbenen-Aroma (Hierbaluisa)",
          "origin": "Inca Kola wurde 1935 in Lima entwickelt und ist seither ein Symbol nationalen Stolzes.",
          "occasions": "Wird zu Mahlzeiten und als alltägliche Erfrischung getrunken.",
          "order": "Una Inca Kola, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/IncaKolaBottleGlass.jpg/960px-IncaKolaBottleGlass.jpg"
        },
        {
          "name": "Chicha morada",
          "desc": "Süßes, alkoholfreies Getränk aus violettem Mais mit Gewürzen.",
          "long": "Ein alkoholfreies, tiefviolettes Getränk aus violettem Mais, das mit Ananas, Limette und Gewürzen gekocht wird. Es schmeckt fruchtig-süß und wird kalt zu vielen Mahlzeiten serviert.",
          "ingredients": "Violetter Mais (maíz morado), Ananas, Limette, Zimt, Nelken, Zucker",
          "origin": "Die Chicha morada hat vorkolumbianische Wurzeln und ist in ganz Peru verbreitet.",
          "occasions": "Wird zu Mahlzeiten und als erfrischendes Alltagsgetränk getrunken.",
          "order": "Una chicha morada, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chicha_Morada_2017.jpg/960px-Chicha_Morada_2017.jpg"
        },
        {
          "name": "Chicha de jora",
          "desc": "Traditionelles, leicht alkoholisches Getränk aus fermentiertem Mais.",
          "long": "Ein leicht alkoholisches, fermentiertes Getränk aus gekeimtem Mais mit langer Tradition. Es schmeckt herb-säuerlich und wird oft in einfachen, mit roter Fahne markierten Lokalen (Chicherías) ausgeschenkt.",
          "ingredients": "Gekeimter Mais (Jora), Wasser, Zucker, natürliche Fermentation",
          "origin": "Die Chicha de jora war schon im Inkareich ein bedeutendes zeremonielles Getränk.",
          "occasions": "Wird in traditionellen Chicherías und bei ländlichen Festen getrunken.",
          "order": "Una chicha de jora, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Chicha_de_jora_en_vaso.JPG/960px-Chicha_de_jora_en_vaso.JPG"
        }
      ],
      "tip": "Plane in Cusco (3.400 m) ein bis zwei Tage zur Höhenanpassung ein und trinke Mate de Coca gegen die Höhenkrankheit."
    },
    {
      "id": "bolivia",
      "name": "Bolivien",
      "flag": "🇧🇴",
      "region": "Südamerika",
      "capital": "Sucre (konstitutionell), La Paz (Regierungssitz)",
      "tagline": "Anden, Altiplano und der größte Salzsee der Welt",
      "about": "Bolivien ist ein Binnenstaat im Herzen der Anden mit enormer Höhenlage: La Paz liegt auf rund 3.600 m, El Alto noch höher. Backpacker-Highlights sind der Salar de Uyuni, der Titicacasee und die Todesstraße bei La Paz. Das Land gehört zu den günstigsten Reisezielen Südamerikas.",
      "history": "Vor der Kolonialzeit war das Hochland Teil des Inkareichs, davor blühte die Tiwanaku-Kultur am Titicacasee. Ab dem 16. Jahrhundert beuteten die Spanier die Silberminen von Potosí aus, die den Kolonialreichtum trugen. 1825 wurde Bolivien unabhängig und nach Simón Bolívar benannt. Heute hat das Land einen der höchsten indigenen Bevölkerungsanteile Südamerikas und versteht sich als plurinationaler Staat.",
      "language": "Gesprochen wird ein andines Spanisch, das relativ klar und langsam klingt und für Lernende gut verständlich ist. Neben Spanisch sind Quechua und Aymara offizielle Sprachen und im Hochland weit verbreitet. Viele Alltagswörter stammen aus dem Quechua/Aymara, etwa 'wawa' (Baby/Kind). Das Voseo ist hier kaum verbreitet, man nutzt überwiegend 'tú'.",
      "words": [
        {
          "es": "wawa",
          "de": "Baby/Kleinkind (aus Quechua/Aymara)"
        },
        {
          "es": "chango/a",
          "de": "Junge/Mädchen, junger Mensch"
        },
        {
          "es": "¡qué macana!",
          "de": "wie ärgerlich! / so ein Mist!"
        },
        {
          "es": "cholita",
          "de": "indigene Frau in traditioneller Tracht"
        },
        {
          "es": "yapa",
          "de": "kostenlose Zugabe beim Einkauf"
        },
        {
          "es": "ch'aki",
          "de": "Kater (nach Alkohol, aus Quechua)"
        }
      ],
      "food": [
        {
          "name": "Salteña",
          "desc": "Saftige gefüllte Teigtasche mit Fleisch, Ei und Brühe, typischer Vormittagssnack.",
          "long": "Die Salteña ist eine gebackene Teigtasche mit einer saftigen, leicht süßlich-würzigen Füllung, die fast wie ein Eintopf im Teigmantel schmeckt. Sie wird typischerweise am Vormittag als Snack gegessen und ist innen so saftig, dass man sie geschickt halten muss, um die Brühe nicht zu verlieren.",
          "ingredients": "Weizenmehlteig, Rind- oder Hühnerfleisch, Kartoffeln, Erbsen, Oliven, hartgekochtes Ei, würzige Brühe",
          "origin": "Die Salteña wird mit aus dem argentinischen Salta zugewanderten Familien im 19. Jahrhundert in Verbindung gebracht und gilt heute als bolivianisches Nationalgebäck.",
          "occasions": "Sie wird klassisch als Vormittagssnack zwischen Frühstück und Mittagessen gegessen.",
          "order": "Una salteña de pollo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Salte%C3%B1as_%28Plaza_Mayor%29-2011.JPG/960px-Salte%C3%B1as_%28Plaza_Mayor%29-2011.JPG"
        },
        {
          "name": "Pique a lo macho",
          "desc": "Deftiger Teller aus Rindfleisch, Würstchen, Pommes, Zwiebeln und scharfer Soße.",
          "long": "Pique a lo macho ist ein deftiges Gericht aus klein geschnittenem Rindfleisch und Würstchen auf einem Berg Pommes frites. Es wird mit Zwiebeln, Tomaten und scharfen Locoto-Schoten getoppt und ist als üppige Portion zum Teilen gedacht.",
          "ingredients": "Rindfleisch, Würstchen, Pommes frites, Zwiebeln, Tomaten, Locoto (Chili), hartgekochtes Ei",
          "origin": "Das Gericht entstand in der Region Cochabamba und gilt als moderne bolivianische Spezialität.",
          "occasions": "Es wird gern beim gemeinsamen Mittag- oder Abendessen sowie bei geselligen Anlässen geteilt.",
          "order": "Un pique a lo macho para compartir, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Pique_Macho_cochabanbino.jpg/960px-Pique_Macho_cochabanbino.jpg"
        },
        {
          "name": "Silpancho",
          "desc": "Dünn geklopftes paniertes Fleisch auf Reis und Kartoffeln, mit Spiegelei.",
          "long": "Silpancho besteht aus einem dünn geklopften, panierten Schnitzel, das auf Reis und Kartoffeln serviert wird. Obenauf liegen ein Spiegelei sowie ein frischer Salat aus Tomaten und Zwiebeln, was es zu einer sehr sättigenden Mahlzeit macht.",
          "ingredients": "Dünn geklopftes Rindfleisch, Semmelbrösel, Reis, Kartoffeln, Spiegelei, Tomaten, Zwiebeln",
          "origin": "Silpancho stammt ebenfalls aus Cochabamba und ist dort ein klassisches Alltagsgericht.",
          "occasions": "Es wird vor allem als kräftiges Mittagessen gegessen.",
          "order": "Un silpancho, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Silpancho_cochalo.jpg/960px-Silpancho_cochalo.jpg"
        },
        {
          "name": "Sopa de maní",
          "desc": "Cremige Erdnusssuppe mit Fleisch und Kartoffeln, ein Klassiker.",
          "long": "Sopa de maní ist eine cremige Erdnusssuppe, die zu den bekanntesten Suppen Boliviens zählt. Sie wird aus gemahlenen Erdnüssen mit Fleisch und Gemüse gekocht und traditionell mit knusprigen Pommes frites garniert.",
          "ingredients": "Erdnüsse, Rindfleisch, Kartoffeln, Karotten, Erbsen, Pommes frites als Garnitur",
          "origin": "Die Suppe ist ein traditionelles Gericht der bolivianischen Anden- und Talregionen.",
          "occasions": "Sie wird typischerweise als wärmender erster Gang zum Mittagessen serviert.",
          "order": "Un plato de sopa de maní, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Sopa_de_man%C3%AD_cochabambino%2C_Bolivia.jpg/960px-Sopa_de_man%C3%AD_cochabambino%2C_Bolivia.jpg"
        },
        {
          "name": "Anticuchos",
          "desc": "Gegrillte Rinderherz-Spieße, beliebtes Streetfood am Abend.",
          "long": "Anticuchos sind gegrillte Fleischspieße, die in Bolivien klassisch aus Rinderherz zubereitet werden. Sie werden über Holzkohle gegrillt und meist mit einer Kartoffel und scharfer Erdnusssauce als Straßenessen am Abend angeboten.",
          "ingredients": "Rinderherz, Knoblauch, Kreuzkümmel, Essig, Kartoffeln, scharfe Erdnusssauce",
          "origin": "Anticuchos haben ihre Wurzeln in der Andenregion und sind in mehreren südamerikanischen Ländern verbreitet.",
          "occasions": "Sie werden vor allem abends als Straßenimbiss gegessen.",
          "order": "Dos anticuchos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Anticuchos_de_la_Tia_Grima.jpg/960px-Anticuchos_de_la_Tia_Grima.jpg"
        },
        {
          "name": "Api con pastel",
          "desc": "Warmes Getränk aus lila Mais mit frittiertem Käsegebäck zum Frühstück.",
          "long": "Api con pastel kombiniert ein warmes, dickflüssiges Getränk aus violettem Mais mit einem frittierten, mit Puderzucker bestäubten Teiggebäck. Die Kombination aus süßem, würzigem Getränk und knusprigem Pastel ist ein typisches Frühstück in den kalten Höhenlagen.",
          "ingredients": "Violetter Mais (api morado), Zimt, Nelken, Zucker, frittierter Teig (pastel)",
          "origin": "Api ist ein Getränk mit Wurzeln in der präkolumbischen Andenkultur und wird traditionell mit Pastel kombiniert.",
          "occasions": "Es wird vor allem als warmes Frühstück oder an kühlen Morgen gegessen.",
          "order": "Un api con pastel, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Api_con_cachangas%2C_Per%C3%BA.webp/960px-Api_con_cachangas%2C_Per%C3%BA.webp.png"
        }
      ],
      "drink": [
        {
          "name": "Singani",
          "desc": "Bolivianischer Traubenbranntwein, das Nationaldestillat, oft als 'Chuflay' mit Ginger Ale.",
          "long": "Singani ist ein bolivianischer Weinbrand, der aus Muskat-Trauben destilliert wird. Er gilt als Nationalspirituose Boliviens und wird pur oder als Basis für Cocktails wie den Chuflay getrunken.",
          "ingredients": "Destillat aus Muskat-Trauben (Moscatel de Alejandría)",
          "origin": "Singani wird seit der Kolonialzeit in den Höhenlagen rund um Tarija hergestellt.",
          "occasions": "Er wird zu Feiern und geselligen Anlässen pur oder als Cocktail getrunken.",
          "order": "Un singani, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Singani_major_brands.png/960px-Singani_major_brands.png"
        },
        {
          "name": "Chicha",
          "desc": "Vergorenes Maisgetränk mit langer indigener Tradition, leicht alkoholisch.",
          "long": "Chicha ist ein traditionelles, meist leicht vergorenes Getränk auf Maisbasis. Die bekannte bolivianische Variante Chicha de maíz hat einen säuerlichen Geschmack und wird besonders in der Region Cochabamba in einfachen Lokalen, den Chicherías, ausgeschenkt.",
          "ingredients": "Mais, Wasser, Zucker (je nach Variante vergoren)",
          "origin": "Chicha ist ein uraltes Getränk der Andenkulturen und geht auf präkolumbische Zeiten zurück.",
          "occasions": "Sie wird bei lokalen Festen und in geselliger Runde getrunken.",
          "order": "Un vaso de chicha, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Chicha_de_Jora.JPG"
        },
        {
          "name": "Mate de coca",
          "desc": "Tee aus Kokablättern, hilft gegen Höhenkrankheit (soroche).",
          "long": "Mate de coca ist ein Aufguss aus getrockneten Kokablättern, der in den Anden alltäglich getrunken wird. Er gilt als hilfreich gegen die Höhenkrankheit und wirkt leicht anregend, ähnlich wie eine milde Tasse Tee.",
          "ingredients": "Getrocknete Kokablätter, heißes Wasser",
          "origin": "Das Getränk hat eine lange Tradition in den Andenregionen Boliviens und der Nachbarländer.",
          "occasions": "Es wird oft morgens oder bei Höhenbeschwerden in großen Höhenlagen getrunken.",
          "order": "Un mate de coca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Mate_de_coca_boliviano.jpg/960px-Mate_de_coca_boliviano.jpg"
        },
        {
          "name": "Paceña",
          "desc": "Bekannteste bolivianische Biermarke, benannt nach La Paz.",
          "long": "Paceña ist eine der bekanntesten Biermarken Boliviens und ein helles Lagerbier. Es wird landesweit getrunken und ist besonders mit der Stadt La Paz verbunden, von der sich auch der Name ableitet.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Die Marke Paceña stammt aus La Paz und ist eine der traditionsreichsten Brauereien Boliviens.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "order": "Una Paceña bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Logo_Pacena_blanco-01.jpg/960px-Logo_Pacena_blanco-01.jpg"
        }
      ],
      "tip": "Plane bei Ankunft in La Paz oder Uyuni ein bis zwei ruhige Tage zur Höhenanpassung ein und trinke Coca-Tee gegen die Höhenkrankheit."
    },
    {
      "id": "chile",
      "name": "Chile",
      "flag": "🇨🇱",
      "region": "Südamerika",
      "capital": "Santiago de Chile",
      "tagline": "Vom Wüstenhimmel der Atacama bis zu Patagoniens Gletschern",
      "about": "Chile ist ein extrem langes, schmales Land, das sich über mehr als 4.000 km entlang des Pazifiks erstreckt. Es reicht von der Atacama-Wüste im Norden über das zentrale Weinland bis zu den Fjorden und Bergen Patagoniens. Highlights für Backpacker sind die Sternenhimmel der Atacama, der Nationalpark Torres del Paine und die Osterinsel.",
      "history": "Vor der Kolonialzeit lebten im Süden die Mapuche, die der spanischen Eroberung lange erfolgreich Widerstand leisteten. Ab 1541 gründeten die Spanier Santiago, 1818 erlangte Chile seine Unabhängigkeit. Das 20. Jahrhundert war geprägt vom Sturz Salvador Allendes 1973 und der Militärdiktatur unter Pinochet bis 1990. Heute gilt Chile als eines der wirtschaftlich stabilsten Länder der Region.",
      "language": "Chilenisches Spanisch gilt als eines der schwierigsten Lateinamerikas: sehr schnell, mit verschluckten Endsilben und vielen Slang-Ausdrücken (Chilenismos). Endungen auf '-ado' werden oft zu '-ao' (z.B. 'cansao' statt 'cansado'). Verbreitet ist ein eigenes Voseo in der Verbform ('¿cachái?' statt '¿cachas?'). Im Süden gibt es Mapudungun-Einflüsse, viele Ortsnamen stammen aus dem Mapuche.",
      "words": [
        {
          "es": "cachái",
          "de": "kapierst du? / verstehst du?"
        },
        {
          "es": "weón/huevón",
          "de": "Alter/Typ (Anrede unter Freunden, je nach Ton)"
        },
        {
          "es": "bacán",
          "de": "super, cool, klasse"
        },
        {
          "es": "po",
          "de": "Füllwort am Satzende (von 'pues')"
        },
        {
          "es": "la raja",
          "de": "großartig, spitze (umgangssprachlich)"
        },
        {
          "es": "fome",
          "de": "langweilig, öde"
        }
      ],
      "food": [
        {
          "name": "Empanada de pino",
          "desc": "Gebackene Teigtasche gefüllt mit Hackfleisch, Zwiebel, Ei und Olive.",
          "long": "Die Empanada de pino ist die klassische chilenische Empanada, gefüllt mit einer würzigen Hackfleisch-Zwiebel-Mischung. Sie enthält außerdem Ei, Oliven und Rosinen und wird meist im Ofen gebacken.",
          "ingredients": "Weizenteig, Rinderhack, Zwiebeln, hartgekochtes Ei, schwarze Oliven, Rosinen, Kreuzkümmel",
          "origin": "Die Empanada hat spanische Wurzeln und ist als Empanada de pino zu einem Symbol der chilenischen Küche geworden.",
          "occasions": "Sie wird besonders zu den Nationalfeiertagen (Fiestas Patrias) im September und an Festtagen gegessen.",
          "order": "Una empanada de pino, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Empanada%2C_flaky_pastry_perfection.jpg/960px-Empanada%2C_flaky_pastry_perfection.jpg"
        },
        {
          "name": "Completo",
          "desc": "Chilenischer Hotdog üppig belegt mit Avocado, Tomate und Mayonnaise.",
          "long": "Der Completo ist ein chilenischer Hot Dog, der deutlich üppiger belegt ist als sein US-Vorbild. In der beliebten Variante Completo italiano wird er mit Avocado, Tomaten und Mayonnaise getoppt, deren Farben an die italienische Flagge erinnern.",
          "ingredients": "Würstchen, Hot-Dog-Brötchen, Avocado, Tomaten, Mayonnaise, Sauerkraut (je nach Variante)",
          "origin": "Der Completo entstand im 20. Jahrhundert in Chile und entwickelte sich zu einem festen Bestandteil der Snackkultur.",
          "occasions": "Er wird als schneller Imbiss zu jeder Tageszeit gegessen.",
          "order": "Un completo italiano, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/El_tremendo_chilen%C3%ADsimo_COMPLETO.JPG/960px-El_tremendo_chilen%C3%ADsimo_COMPLETO.JPG"
        },
        {
          "name": "Pastel de choclo",
          "desc": "Maispüree-Auflauf über einer Fleischfüllung, im Sommer beliebt.",
          "long": "Pastel de choclo ist ein herzhafter Auflauf mit einer Deckschicht aus pürierten jungen Maiskörnern. Darunter verbirgt sich eine Füllung aus Hackfleisch, Huhn, Ei und Oliven, und die Oberfläche wird leicht karamellisiert gebacken.",
          "ingredients": "Junger Mais (choclo), Rinderhack, Hühnerfleisch, Zwiebeln, hartgekochtes Ei, Oliven, Basilikum",
          "origin": "Das Gericht ist ein traditioneller Sommerauflauf der chilenischen Küche mit indigenen und kolonialen Einflüssen.",
          "occasions": "Es wird vor allem im Sommer als Hauptgericht zum Mittag- oder Abendessen serviert.",
          "order": "Un pastel de choclo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Pastelchoclo.jpg/960px-Pastelchoclo.jpg"
        },
        {
          "name": "Cazuela",
          "desc": "Herzhafter Eintopf mit Fleisch, Kürbis, Mais und Kartoffel.",
          "long": "Die Cazuela ist ein klassischer chilenischer Eintopf mit einem großen Stück Fleisch in klarer Brühe. Dazu kommen Gemüsestücke wie Kürbis, Mais, Kartoffeln und Reis, was sie zu einem nahrhaften Komplettgericht macht.",
          "ingredients": "Rind oder Huhn, Kürbis, Maiskolbenstück, Kartoffeln, Reis, Karotten, Kräuter",
          "origin": "Die Cazuela ist ein traditionelles Eintopfgericht mit kolonialen Wurzeln, das in ganz Chile verbreitet ist.",
          "occasions": "Sie wird typischerweise als wärmendes Mittagessen, besonders in den kälteren Monaten, gegessen.",
          "order": "Una cazuela de vacuno, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Cazuela_de_pollo_chilena_%282021%29.jpg/960px-Cazuela_de_pollo_chilena_%282021%29.jpg"
        },
        {
          "name": "Curanto",
          "desc": "Auf der Insel Chiloé in einer Erdgrube gegartes Gericht aus Meeresfrüchten und Fleisch.",
          "long": "Curanto ist ein üppiges Gericht aus Meeresfrüchten, Fleisch und Kartoffeln von der Insel Chiloé. Traditionell wird es in einer Erdgrube über heißen Steinen gegart, wobei die Zutaten mit großen Blättern bedeckt werden.",
          "ingredients": "Muscheln, andere Meeresfrüchte, Schweinefleisch, Würstchen, Kartoffelfladen (milcao, chapalele), Kartoffeln",
          "origin": "Curanto stammt von der Insel Chiloé und gehört zu den ältesten Garmethoden in Südchile.",
          "occasions": "Es wird bei besonderen Anlässen und geselligen Zusammenkünften in größeren Runden zubereitet.",
          "order": "Quiero probar el curanto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Curanto_Chilote_-_Flickr_-_Renzo_Disi.jpg/960px-Curanto_Chilote_-_Flickr_-_Renzo_Disi.jpg"
        },
        {
          "name": "Chorrillana",
          "desc": "Berg aus Pommes mit Fleisch, Zwiebeln und Spiegeleiern zum Teilen.",
          "long": "Chorrillana ist eine große Platte Pommes frites, die mit Fleisch, gebratenen Zwiebeln und Spiegeleiern bedeckt ist. Sie ist als reichliche Portion zum Teilen gedacht und besonders in Valparaíso beliebt.",
          "ingredients": "Pommes frites, Rindfleisch, Zwiebeln, Spiegeleier, Würstchen (je nach Variante)",
          "origin": "Die Chorrillana wird mit der Hafenstadt Valparaíso in Verbindung gebracht und ist ein typisches Gericht zum Teilen.",
          "occasions": "Sie wird gern abends in geselliger Runde, oft zu Bier, geteilt.",
          "order": "Una chorrillana para compartir, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Chorrillana.jpg/960px-Chorrillana.jpg"
        }
      ],
      "drink": [
        {
          "name": "Pisco sour",
          "desc": "Cocktail aus Pisco, Zitrone und Zucker, beliebter Aperitif (auch Peru beansprucht ihn).",
          "long": "Pisco sour ist ein erfrischender Cocktail aus dem Traubenbrand Pisco, kombiniert mit Zitronensaft und Zucker. Die chilenische Variante wird klassisch ohne Eiweiß zubereitet und gehört zu den bekanntesten Drinks des Landes.",
          "ingredients": "Pisco, Zitronen- bzw. Limettensaft, Zucker bzw. Zuckersirup, Eis",
          "origin": "Pisco wird sowohl in Chile als auch in Peru hergestellt, und der Pisco sour zählt in beiden Ländern zu den wichtigsten Cocktails.",
          "occasions": "Er wird gern als Aperitif vor dem Essen und bei Feiern getrunken.",
          "order": "Un pisco sour, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pisco_sour_20100613b.JPG/960px-Pisco_sour_20100613b.JPG"
        },
        {
          "name": "Terremoto",
          "desc": "Süßer Mix aus Weißwein, Ananaseis und Grenadine, der es in sich hat.",
          "long": "Der Terremoto (spanisch für 'Erdbeben') ist ein süßer, starker Drink aus jungem Weißwein, der mit Ananaseis serviert wird. Sein Name spielt auf die berauschende Wirkung an, die einen angeblich wie nach einem Erdbeben wanken lässt.",
          "ingredients": "Junger Weißwein (pipeño), Ananaseis, Grenadine bzw. Fernet (je nach Variante)",
          "origin": "Der Terremoto entstand in Santiago de Chile und wird traditionell in einfachen Lokalen ausgeschenkt.",
          "occasions": "Er wird besonders zu den Fiestas Patrias und bei feuchtfröhlichen Anlässen getrunken.",
          "order": "Un terremoto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Terremotopiojera.jpg/960px-Terremotopiojera.jpg"
        },
        {
          "name": "Vino chileno",
          "desc": "Chilenischer Wein, besonders kräftiger Carménère und Cabernet, weltbekannt.",
          "long": "Chilenischer Wein genießt international einen sehr guten Ruf, besonders die kräftigen Rotweine. Bekannte Rebsorten sind Cabernet Sauvignon und die für Chile typische Carménère aus den Tälern rund um Santiago.",
          "ingredients": "Trauben (u.a. Cabernet Sauvignon, Carménère, Merlot, Sauvignon Blanc)",
          "origin": "Der chilenische Weinbau geht auf die spanische Kolonialzeit zurück und ist heute in zahlreichen Tälern verbreitet.",
          "occasions": "Wein wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "order": "Una copa de vino tinto, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Vi%C3%B1edo_Puente_Alto.jpg/960px-Vi%C3%B1edo_Puente_Alto.jpg"
        },
        {
          "name": "Mote con huesillo",
          "desc": "Alkoholfreies Sommergetränk aus getrockneten Pfirsichen und Weizen.",
          "long": "Mote con huesillo ist ein traditionelles alkoholfreies Erfrischungsgetränk aus getrockneten Pfirsichen und gekochtem Weizen. Die süßen Pfirsiche schwimmen in einem leicht karamellisierten Zuckerwasser, dazu kommt der gekochte Weizen (mote) auf den Grund des Glases.",
          "ingredients": "Getrocknete Pfirsiche (huesillos), gekochter Weizen (mote), Zucker, Zimt, Wasser",
          "origin": "Das Getränk ist ein klassisches sommerliches Straßengetränk mit langer Tradition in Chile.",
          "occasions": "Es wird vor allem im Sommer als erfrischender Durstlöscher getrunken.",
          "order": "Un mote con huesillo, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Mote_con_huesillo.jpg/960px-Mote_con_huesillo.jpg"
        }
      ],
      "tip": "Chile ist deutlich teurer als seine Nachbarländer; bargeldlose Zahlung ist weit verbreitet, plane das Budget entsprechend höher ein."
    },
    {
      "id": "argentina",
      "name": "Argentinien",
      "flag": "🇦🇷",
      "region": "Südamerika",
      "capital": "Buenos Aires",
      "tagline": "Tango, Asado und endlose Weiten von Patagonien bis zu den Wasserfällen",
      "about": "Argentinien ist das zweitgrößte Land Südamerikas und reicht von den subtropischen Iguazú-Wasserfällen bis zum windigen Patagonien und Feuerland im Süden. Buenos Aires gilt als eine der lebendigsten Metropolen des Kontinents. Highlights sind der Perito-Moreno-Gletscher, die Weinregion Mendoza und die bunten Anden im Nordwesten.",
      "history": "Vor der Kolonialzeit lebten im Norden Andenvölker, in der Pampa und Patagonien nomadische Gruppen. Die Spanier gründeten ab dem 16. Jahrhundert Siedlungen, 1816 erklärte Argentinien seine Unabhängigkeit. Im späten 19. und frühen 20. Jahrhundert kamen Millionen europäischer Einwanderer, vor allem aus Italien und Spanien. Die jüngere Geschichte ist geprägt vom Peronismus, der Militärdiktatur (1976–1983) und wiederkehrenden Wirtschaftskrisen.",
      "language": "Das argentinische Spanisch (Rioplatense) ist sofort am Voseo erkennbar: 'vos' ersetzt 'tú' ('vos tenés' statt 'tú tienes'). Auffällig ist die Aussprache von 'll' und 'y' wie ein deutsches 'sch' ('calle' klingt wie 'casche'). Der Tonfall klingt durch italienischen Einfluss fast melodisch-singend. Im Nordwesten und Nordosten gibt es Quechua- bzw. Guaraní-Einflüsse.",
      "words": [
        {
          "es": "che",
          "de": "Hey/Du (typische argentinische Anrede)"
        },
        {
          "es": "boludo/a",
          "de": "Trottel, aber unter Freunden auch 'Alter'"
        },
        {
          "es": "laburo",
          "de": "Arbeit, Job (aus dem Italienischen)"
        },
        {
          "es": "quilombo",
          "de": "Chaos, Durcheinander"
        },
        {
          "es": "copado",
          "de": "cool, klasse"
        },
        {
          "es": "¿qué onda?",
          "de": "Was geht? / Wie läuft's?"
        }
      ],
      "food": [
        {
          "name": "Asado",
          "desc": "Traditionelles Grillfest mit verschiedenen Rindfleischstücken, ein gesellschaftliches Ritual.",
          "long": "Asado bezeichnet das argentinische Grillfest und das dort zubereitete Fleisch zugleich. Verschiedene Rindfleischstücke und Würste werden langsam über Holzkohle oder offenem Feuer gegart und gemeinsam in geselliger Runde gegessen.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Morcilla (Blutwurst), Salz, Chimichurri als Beilage",
          "origin": "Das Asado ist tief in der Gaucho-Kultur der argentinischen Pampa verwurzelt und gilt als kulinarisches Nationalsymbol.",
          "occasions": "Es ist das klassische Gericht für Wochenenden, Familientreffen und Feiern.",
          "order": "Una parrillada para dos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        },
        {
          "name": "Empanadas",
          "desc": "Gefüllte Teigtaschen, je nach Region mit Fleisch, Käse oder Mais.",
          "long": "Empanadas sind gefüllte Teigtaschen, die in Argentinien je nach Region unterschiedlich gefüllt und gebacken oder frittiert werden. Häufige Füllungen sind würziges Hackfleisch, Huhn, Schinken-Käse oder Mais.",
          "ingredients": "Weizenteig, Rinderhack oder andere Füllungen, Zwiebeln, hartgekochtes Ei, Oliven, Gewürze",
          "origin": "Die Empanada kam über Spanien nach Lateinamerika und hat in Argentinien zahlreiche regionale Varianten entwickelt.",
          "occasions": "Sie werden als Vorspeise, Snack oder bei Zusammenkünften zu jeder Gelegenheit gegessen.",
          "order": "Una docena de empanadas de carne, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Empanadas_de_carne%2C_2006.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, oft als 'napolitana' mit Schinken und Käse überbacken.",
          "long": "Die Milanesa ist ein paniertes, dünnes Schnitzel und eines der beliebtesten Alltagsgerichte Argentiniens. In der Variante Milanesa napolitana wird sie zusätzlich mit Tomatensauce, Schinken und Käse überbacken.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz (napolitana: Tomatensauce, Schinken, Käse)",
          "origin": "Die Milanesa geht auf die norditalienische Cotoletta zurück und kam mit italienischen Einwanderern nach Argentinien.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "order": "Una milanesa con papas fritas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Choripán",
          "desc": "Gegrillte Chorizo-Wurst im Brot mit Chimichurri, klassisches Streetfood.",
          "long": "Choripán ist ein Sandwich aus gegrillter Chorizo-Wurst in einem Brötchen. Es wird klassisch mit Chimichurri bestrichen und gilt als beliebtester Imbiss rund um das Asado und bei Veranstaltungen.",
          "ingredients": "Chorizo, Brötchen, Chimichurri, optional Tomaten und Zwiebeln",
          "origin": "Der Name setzt sich aus 'chorizo' und 'pan' zusammen, und das Gericht ist fest mit der argentinischen Grillkultur verbunden.",
          "occasions": "Es wird beim Asado, auf Märkten und bei Fußballspielen als Straßenimbiss gegessen.",
          "order": "Un choripán con chimichurri, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/af/Choripan.jpg"
        },
        {
          "name": "Provoleta",
          "desc": "Gegrillter Provolone-Käse mit Oregano, beliebte Vorspeise beim Asado.",
          "long": "Provoleta ist eine gegrillte Scheibe Provolone-Käse, die außen leicht knusprig und innen geschmolzen ist. Sie wird mit Oregano und Olivenöl gewürzt und typischerweise als Vorspeise beim Asado gereicht.",
          "ingredients": "Provolone-Käse, Oregano, Olivenöl, optional Chiliflocken",
          "origin": "Die Provoleta wurde in Argentinien aus dem italienischen Provolone-Käse entwickelt und ist Teil der Asado-Tradition.",
          "occasions": "Sie wird als Vorspeise zu Beginn eines Asados gegessen.",
          "order": "Una provoleta, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Provoleta_argentina.jpg/960px-Provoleta_argentina.jpg"
        },
        {
          "name": "Dulce de leche",
          "desc": "Karamellige Milchcreme, die in unzähligen Süßspeisen steckt.",
          "long": "Dulce de leche ist eine cremige, karamellartige Masse aus langsam eingekochter, gezuckerter Milch. Sie ist allgegenwärtig in der argentinischen Süßküche und wird auf Brot, in Gebäck und als Füllung verwendet.",
          "ingredients": "Milch, Zucker, eine Prise Natron, optional Vanille",
          "origin": "Dulce de leche ist in mehreren südamerikanischen Ländern verbreitet, und Argentinien gilt als eines seiner Kernländer.",
          "occasions": "Es wird zum Frühstück, zur Jause und als Dessertzutat gegessen.",
          "order": "Algo con dulce de leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/DulceDeLeche.jpg/960px-DulceDeLeche.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mate",
          "desc": "Aufguss aus Yerba-Mate-Blättern, getrunken aus dem Kürbis mit Bombilla, ein soziales Ritual.",
          "long": "Mate ist das argentinische Nationalgetränk, ein Aufguss aus den getrockneten Blättern der Yerba Mate. Er wird in einem ausgehöhlten Kürbisgefäß mit einem Metallröhrchen (bombilla) getrunken und traditionell in der Gruppe herumgereicht.",
          "ingredients": "Yerba Mate (getrocknete Blätter), heißes Wasser",
          "origin": "Die Mate-Tradition geht auf die indigenen Guaraní zurück und ist heute fester Bestandteil des Alltags am Río de la Plata.",
          "occasions": "Er wird den ganzen Tag über, oft im Kreis von Freunden oder Familie, getrunken.",
          "order": "¿Me cebás un mate?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mate_en_calabaza.jpg"
        },
        {
          "name": "Vino Malbec",
          "desc": "Argentiniens charaktervolle Rotweinsorte, vor allem aus Mendoza.",
          "long": "Malbec ist die wichtigste Rotweinsorte Argentiniens und international ein Aushängeschild des Landes. Besonders aus der Region Mendoza stammen kräftige, fruchtige Malbec-Weine, die hervorragend zum Asado passen.",
          "ingredients": "Malbec-Trauben",
          "origin": "Die Malbec-Rebe kam aus Frankreich nach Argentinien und fand vor allem in Mendoza ideale Bedingungen.",
          "occasions": "Er wird zu Fleischgerichten und bei geselligen Essen getrunken.",
          "order": "Una copa de Malbec, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Malbec_grapes.jpg/960px-Malbec_grapes.jpg"
        },
        {
          "name": "Fernet con Coca",
          "desc": "Bitterlikör mit Cola gemischt, das inoffizielle Nationalgetränk der Jugend.",
          "long": "Fernet con Coca ist die Mischung aus dem bitteren Kräuterlikör Fernet und Cola und gilt als inoffizielles Nationalgetränk Argentiniens. Der kräftig-bittere Geschmack ist gewöhnungsbedürftig, gehört aber fest zur Partykultur des Landes.",
          "ingredients": "Fernet (Kräuterlikör), Cola, Eis",
          "origin": "Fernet stammt ursprünglich aus Italien, wurde in Argentinien aber zu einem überaus populären Mixgetränk, besonders in Córdoba.",
          "occasions": "Es wird vor allem bei Partys und geselligen Treffen getrunken.",
          "order": "Un fernet con coca, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Fernet_and_Coke_%28Fernet_con_Coca%29.jpg/960px-Fernet_and_Coke_%28Fernet_con_Coca%29.jpg"
        },
        {
          "name": "Quilmes",
          "desc": "Bekannteste argentinische Biermarke, allgegenwärtig bei jedem Asado.",
          "long": "Quilmes ist die bekannteste Biermarke Argentiniens und ein helles Lagerbier. Es ist landesweit präsent und wird oft in großen Literflaschen zum Teilen bestellt.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Die Brauerei wurde in der Stadt Quilmes bei Buenos Aires gegründet und ist eine nationale Traditionsmarke.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen getrunken.",
          "order": "Una Quilmes bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/0/01/Quilmes_cerveza_aviso_1967.jpg"
        }
      ],
      "tip": "Wegen der Inflation lohnt sich oft der inoffizielle 'dólar blue'-Wechselkurs; bring US-Dollar in bar mit und informiere dich vor Ort über aktuelle Kurse."
    },
    {
      "id": "uruguay",
      "name": "Uruguay",
      "flag": "🇺🇾",
      "region": "Südamerika",
      "capital": "Montevideo",
      "tagline": "Entspannte Strände, Mate-Kultur und Südamerikas ruhigste Ecke",
      "about": "Uruguay ist das kleinste spanischsprachige Land Südamerikas und liegt zwischen Argentinien und Brasilien am Río de la Plata. Es ist bekannt für seine entspannte Atmosphäre, lange Atlantikstrände und eine ausgeprägte Mate-Kultur. Highlights sind die Altstadt von Colonia del Sacramento, die Strände von Punta del Este und das gemütliche Montevideo.",
      "history": "Vor der Kolonialzeit lebte hier das indigene Volk der Charrúa. Spanier und Portugiesen stritten lange um das Gebiet, bis Uruguay 1828 als Pufferstaat zwischen Argentinien und Brasilien unabhängig wurde. Im 20. Jahrhundert galt es dank seines Sozialstaats als 'Schweiz Südamerikas'. Heute ist Uruguay eines der stabilsten und liberalsten Länder der Region.",
      "language": "Uruguay teilt mit Argentinien das Rioplatense-Spanisch: Voseo ('vos') und die 'sch'-Aussprache von 'll' und 'y' sind Standard. An der Grenze zu Brasilien wird ein Mischdialekt aus Spanisch und Portugiesisch gesprochen ('Portuñol'). Der Tonfall ähnelt dem von Buenos Aires, gilt aber als etwas ruhiger. Indigene Sprachen sind heute kaum noch präsent.",
      "words": [
        {
          "es": "ta",
          "de": "okay, passt (Kurzform von 'está')"
        },
        {
          "es": "bo",
          "de": "Hey/Du (uruguayische Anrede, ähnlich 'che')"
        },
        {
          "es": "championes",
          "de": "Turnschuhe, Sneakers"
        },
        {
          "es": "de más",
          "de": "super, großartig"
        },
        {
          "es": "garra charrúa",
          "de": "Kampfgeist, Durchhaltevermögen (Nationalstolz)"
        }
      ],
      "food": [
        {
          "name": "Chivito",
          "desc": "Üppiges Sandwich mit Steak, Schinken, Käse, Ei und Salat, das Nationalgericht.",
          "long": "Der Chivito ist das kulinarische Wahrzeichen Uruguays, ein üppig belegtes Sandwich mit dünnem Rindersteak. Dazu kommen Schinken, Käse, Speck, Spiegelei, Salat und Tomaten, und es wird oft mit Pommes frites serviert.",
          "ingredients": "Dünnes Rindersteak, Schinken, Käse, Speck, Spiegelei, Salat, Tomaten, Mayonnaise, Brötchen",
          "origin": "Der Chivito entstand in der Küstenstadt Punta del Este und entwickelte sich zum Nationalgericht Uruguays.",
          "occasions": "Er wird als sättigendes Mittag- oder Abendessen gegessen.",
          "order": "Un chivito al plato, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Chivito_al_pan_uruguayo.jpg/960px-Chivito_al_pan_uruguayo.jpg"
        },
        {
          "name": "Asado",
          "desc": "Grillfest mit Rindfleisch, in Uruguay mindestens so wichtig wie in Argentinien.",
          "long": "Asado ist auch in Uruguay das zentrale Grillgericht und ein wichtiger sozialer Anlass. Verschiedene Fleischstücke und Würste werden über Holzkohle oder Feuer gegrillt, oft auf einem traditionellen Parrilla-Rost.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Morcilla, Salz, Kräuter",
          "origin": "Wie in Argentinien ist das Asado tief in der Gaucho-Kultur der Region am Río de la Plata verwurzelt.",
          "occasions": "Es wird an Wochenenden, bei Familientreffen und Feiern zubereitet.",
          "order": "Un asado para dos, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, beliebt als Sandwich ('milanesa al pan').",
          "long": "Die Milanesa ist auch in Uruguay ein beliebtes Alltagsgericht, ein dünnes paniertes Schnitzel. Sie wird häufig als Sandwich (Milanesa al pan) oder mit Beilagen wie Kartoffelpüree und Salat gegessen.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz",
          "origin": "Die Milanesa kam mit italienischen Einwanderern an den Río de la Plata und ist dort fester Bestandteil der Alltagsküche.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "order": "Una milanesa al pan, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Choripán",
          "desc": "Gegrillte Wurst im Brot, klassisches Streetfood beim Grillen.",
          "long": "Choripán ist auch in Uruguay ein Sandwich aus gegrillter Chorizo im Brötchen. Es ist ein beliebter Imbiss beim Asado und auf Veranstaltungen und wird oft mit Salsa criolla oder Chimichurri serviert.",
          "ingredients": "Chorizo, Brötchen, Salsa criolla oder Chimichurri",
          "origin": "Das Gericht teilt sich die Grilltradition der Region am Río de la Plata mit Argentinien.",
          "occasions": "Es wird beim Asado und bei Veranstaltungen als Straßenimbiss gegessen.",
          "order": "Un choripán, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/af/Choripan.jpg"
        },
        {
          "name": "Torta frita",
          "desc": "Frittiertes Fettgebäck, traditionell an Regentagen gegessen.",
          "long": "Torta frita ist ein einfaches frittiertes Teiggebäck, das besonders an Regentagen zubereitet wird. Die flachen, leicht gesalzenen oder gezuckerten Fladen werden warm gegessen und oft zum Mate gereicht.",
          "ingredients": "Weizenmehl, Wasser, Fett, Salz, etwas Backtriebmittel, optional Zucker",
          "origin": "Die Torta frita ist ein traditionelles, einfaches Gebäck der ländlichen Küche am Río de la Plata.",
          "occasions": "Sie wird traditionell an Regentagen und als Snack zum Mate gegessen.",
          "order": "Dos tortas fritas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/TortaFrita.jpg/960px-TortaFrita.jpg"
        },
        {
          "name": "Dulce de leche",
          "desc": "Karamellcreme, allgegenwärtig in Desserts und Gebäck.",
          "long": "Dulce de leche ist auch in Uruguay eine beliebte karamellartige Creme aus eingekochter, gezuckerter Milch. Sie wird auf Brot, in Gebäck und als Füllung für Süßspeisen verwendet.",
          "ingredients": "Milch, Zucker, eine Prise Natron, optional Vanille",
          "origin": "Dulce de leche gehört zur gemeinsamen Süßküche der Region am Río de la Plata, die sich Uruguay mit Argentinien teilt.",
          "occasions": "Es wird zum Frühstück, zur Jause und als Dessertzutat gegessen.",
          "order": "Algo con dulce de leche, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/DulceDeLeche.jpg/960px-DulceDeLeche.jpg"
        }
      ],
      "drink": [
        {
          "name": "Mate",
          "desc": "Nationalgetränk schlechthin; Uruguayer tragen Thermoskanne und Mate-Kürbis überallhin.",
          "long": "Mate ist in Uruguay ein allgegenwärtiges Alltagsgetränk, und das Land gilt als Pro-Kopf-Spitzenreiter im Mate-Konsum. Viele Uruguayer tragen Mate-Gefäß und Thermoskanne den ganzen Tag mit sich herum.",
          "ingredients": "Yerba Mate (getrocknete Blätter), heißes Wasser",
          "origin": "Die Mate-Tradition geht auf die indigenen Guaraní zurück und prägt den Alltag in ganz Uruguay.",
          "occasions": "Er wird den ganzen Tag über, allein oder in geselliger Runde, getrunken.",
          "order": "¿Tomás mate?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mate_en_calabaza.jpg"
        },
        {
          "name": "Medio y medio",
          "desc": "Erfrischende Mischung aus Weißwein und Sekt, ein Klassiker aus Montevideo.",
          "long": "Medio y medio ist ein erfrischendes Getränk aus einer Mischung zu gleichen Teilen aus stillem Weißwein und Schaumwein. Es ist süffig und leicht prickelnd und besonders mit der Hauptstadt Montevideo verbunden.",
          "ingredients": "Weißwein, Schaumwein bzw. Sekt (zu gleichen Teilen)",
          "origin": "Das Getränk wird traditionell mit der historischen Bodega in Montevideo in Verbindung gebracht und ist eine uruguayische Spezialität.",
          "occasions": "Es wird als Aperitif und zu festlichen Anlässen getrunken.",
          "order": "Un medio y medio, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/2016_esquina_de_Zabala_con_25_de_Mayo_Banco_Popular_del_Uruguay%2C_actual_Ministerio_de_vivienda%2C_Ordenamiento_Territoriak_y_Medio_Ambiente_-_Montevideo_%28Uruguay%29.jpg/960px-thumbnail.jpg"
        },
        {
          "name": "Grappamiel",
          "desc": "Tresterbrand mit Honig, wärmt im Winter.",
          "long": "Grappamiel ist ein süßer Likör aus Grappa (Traubentrester-Brand) und Honig. Der wärmende Schnaps wird besonders in der kalten Jahreszeit gern in kleinen Mengen getrunken.",
          "ingredients": "Grappa (Traubentrester-Brand), Honig",
          "origin": "Grappamiel geht auf die italienische Grappa-Tradition zurück, die mit Einwanderern nach Uruguay kam.",
          "occasions": "Er wird vor allem im Winter und als wärmender Digestif getrunken.",
          "order": "Un grappamiel, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Grappa_Storica_Nera_Bottle.jpg/960px-Grappa_Storica_Nera_Bottle.jpg"
        },
        {
          "name": "Tannat",
          "desc": "Kräftiger Rotwein, Uruguays charakteristische Rebsorte.",
          "long": "Tannat ist die wichtigste Rotweinsorte Uruguays und gilt als dessen Aushängeschild. Die Weine sind kräftig, tanninreich und passen besonders gut zu gegrilltem Fleisch.",
          "ingredients": "Tannat-Trauben",
          "origin": "Die Tannat-Rebe stammt ursprünglich aus Südwestfrankreich und fand in Uruguay ihre zweite Heimat.",
          "occasions": "Er wird zu Fleischgerichten und bei geselligen Essen getrunken.",
          "order": "Una copa de Tannat, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/VIVC12257_TANNAT_Cluster_in_the_field_8302.jpg/960px-VIVC12257_TANNAT_Cluster_in_the_field_8302.jpg"
        }
      ],
      "tip": "Uruguayer trinken Mate ständig und überall; nimm eine Einladung dazu an, aber rühre die Bombilla (Trinkhalm) nicht um, das gilt als unhöflich."
    },
    {
      "id": "paraguay",
      "name": "Paraguay",
      "flag": "🇵🇾",
      "region": "Südamerika",
      "capital": "Asunción",
      "tagline": "Südamerikas unentdecktes Herz mit lebendiger Guaraní-Kultur",
      "about": "Paraguay ist ein wenig bereister Binnenstaat im Herzen Südamerikas, geteilt durch den Río Paraguay in den feuchten Osten und den trockenen Chaco im Westen. Das Land ist authentisch, günstig und touristisch kaum erschlossen. Highlights sind die jesuitischen Missionsruinen, die weite Chaco-Wildnis und die entspannte Hauptstadt Asunción.",
      "history": "Vor der Kolonialzeit war das Gebiet von Guaraní-Völkern besiedelt. Die Spanier gründeten 1537 Asunción, eine der ältesten Städte des Kontinents; berühmt wurden die jesuitischen Reduktionen. 1811 wurde Paraguay unabhängig. Der verheerende Tripel-Allianz-Krieg (1864–1870) gegen Brasilien, Argentinien und Uruguay kostete einen Großteil der männlichen Bevölkerung das Leben.",
      "language": "Paraguay ist offiziell zweisprachig: Neben Spanisch spricht die große Mehrheit Guaraní, eine indigene Sprache mit eigenem Stolz. Im Alltag mischen viele beide Sprachen zu 'Jopara', einem fließenden Wechsel zwischen Spanisch und Guaraní. Auch das paraguayische Spanisch kennt das Voseo. Wer ein paar Guaraní-Wörter lernt, gewinnt schnell Sympathien.",
      "words": [
        {
          "es": "mba'éichapa",
          "de": "Wie geht's? (Guaraní-Begrüßung)"
        },
        {
          "es": "argel",
          "de": "unsympathisch, nervig (paraguayischer Slang)"
        },
        {
          "es": "nde",
          "de": "Hey/Du (aus dem Guaraní)"
        },
        {
          "es": "tranquilopa",
          "de": "ganz entspannt (Mischung Spanisch/Guaraní)"
        },
        {
          "es": "purete",
          "de": "super, cool, klasse"
        },
        {
          "es": "luego",
          "de": "verstärkendes Füllwort am Satzende (eigene Bedeutung in Paraguay)"
        }
      ],
      "food": [
        {
          "name": "Sopa paraguaya",
          "desc": "Trotz des Namens keine Suppe, sondern ein herzhafter Maisbrot-Kuchen mit Käse.",
          "long": "Sopa paraguaya ist trotz ihres Namens keine Suppe, sondern ein herzhafter, kuchenartiger Maisbrot-Auflauf. Er wird aus Maismehl, Käse, Zwiebeln und Eiern gebacken und hat eine feste, saftige Konsistenz.",
          "ingredients": "Maismehl, Frischkäse, Zwiebeln, Eier, Milch, Schmalz oder Öl",
          "origin": "Die Sopa paraguaya gilt als Nationalgericht Paraguays und verbindet indigene Guaraní- mit spanischen Einflüssen.",
          "occasions": "Sie wird als Beilage zu Grillgerichten und bei Festen sowie Familientreffen gegessen.",
          "order": "Una porción de sopa paraguaya, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/5/58/Sopa_Paraguaya_2.jpg"
        },
        {
          "name": "Chipa",
          "desc": "Ringförmiges Gebäck aus Maniokmehl und Käse, überall als Snack verkauft.",
          "long": "Chipa ist ein kleines Gebäck aus Maniokstärke und Käse, das außen knusprig und innen leicht zäh ist. Es wird oft als ringförmiges Brötchen geformt und überall als Snack verkauft.",
          "ingredients": "Maniokstärke (almidón de mandioca), Käse, Eier, Schmalz, Milch oder Anis",
          "origin": "Chipa hat Wurzeln in der Guaraní-Küche und ist in Paraguay und der Region weit verbreitet.",
          "occasions": "Sie wird als Snack zwischendurch, zum Frühstück und besonders in der Karwoche gegessen.",
          "order": "Dos chipas, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Chipa_Paraguay.jpg/960px-Chipa_Paraguay.jpg"
        },
        {
          "name": "Mbejú",
          "desc": "Fladen aus Maniokstärke und Käse, knusprig in der Pfanne gebacken.",
          "long": "Mbejú ist ein flacher, fladenartiger Pfannkuchen aus Maniokstärke und Käse. Er wird in der Pfanne gebacken, ist innen kompakt und wird warm, oft zum Mate oder Tereré, gegessen.",
          "ingredients": "Maniokstärke, Maismehl, Käse, Schmalz, Milch, Salz",
          "origin": "Mbejú ist ein traditionelles Gericht der Guaraní-Küche und in Paraguay weit verbreitet.",
          "occasions": "Es wird vor allem zum Frühstück oder zur Jause zusammen mit Mate oder Tereré gegessen.",
          "order": "Un mbejú, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/3/31/Mbey%C3%BA_paraguayo.jpg"
        },
        {
          "name": "Bori bori",
          "desc": "Deftige Suppe mit Mais-Käse-Klößchen, oft mit Hühnchen.",
          "long": "Bori bori ist eine kräftige Suppe mit kleinen Klößchen aus Maismehl und Käse. Die Klößchen schwimmen in einer Brühe mit Fleisch und Gemüse und machen das Gericht zu einem wärmenden Komplettessen.",
          "ingredients": "Maismehl, Käse, Hühner- oder Rindfleisch, Brühe, Gemüse",
          "origin": "Bori bori ist ein traditionelles Suppengericht der paraguayischen Küche mit Guaraní-Einflüssen.",
          "occasions": "Sie wird vor allem als wärmendes Mittagessen, gern an kühleren Tagen, gegessen.",
          "order": "Un plato de bori bori, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Vor%C3%AD_vor%C3%AD_paraguay.jpg/960px-Vor%C3%AD_vor%C3%AD_paraguay.jpg"
        },
        {
          "name": "Milanesa",
          "desc": "Paniertes Schnitzel, beliebter Alltagsklassiker.",
          "long": "Die Milanesa ist auch in Paraguay ein beliebtes paniertes Schnitzel. Sie wird mit Beilagen oder als Sandwich gegessen und gehört zur alltäglichen Küche des Landes.",
          "ingredients": "Dünnes Rind- oder Hühnerfleisch, Ei, Semmelbrösel, Salz",
          "origin": "Die Milanesa geht auf die italienische Cotoletta zurück und ist über die Region nach Paraguay gelangt.",
          "occasions": "Sie wird als alltägliches Mittag- oder Abendessen gegessen.",
          "order": "Una milanesa, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ingredientes_para_hacer_una_milanesa.png"
        },
        {
          "name": "Asado",
          "desc": "Gegrilltes Rindfleisch, fester Bestandteil geselliger Treffen.",
          "long": "Asado ist auch in Paraguay ein beliebtes Grillgericht und ein geselliger Anlass. Verschiedene Fleischstücke werden über Holzkohle oder Feuer gegrillt und oft mit Sopa paraguaya oder Maniok serviert.",
          "ingredients": "Verschiedene Rindfleischstücke, Chorizo, Salz, Maniok als Beilage",
          "origin": "Die Asado-Tradition ist in der gesamten Region am Río de la Plata und in Paraguay fest verankert.",
          "occasions": "Es wird an Wochenenden, bei Familientreffen und Feiern zubereitet.",
          "order": "Un asado, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/6/65/Asado_2005.jpg"
        }
      ],
      "drink": [
        {
          "name": "Tereré",
          "desc": "Eiskalt aufgegossener Mate mit Kräutern, das Nationalgetränk gegen die Hitze.",
          "long": "Tereré ist die kalte Variante des Mate und das Nationalgetränk Paraguays. Yerba Mate wird mit eiskaltem Wasser, oft mit frischen Kräutern (yuyos) aromatisiert, aufgegossen und ist ideal für das heiße Klima.",
          "ingredients": "Yerba Mate, eiskaltes Wasser, frische Kräuter (yuyos), optional Zitrone oder Minze",
          "origin": "Tereré hat Wurzeln in der Guaraní-Kultur und gilt als kulturelles Erbe Paraguays.",
          "occasions": "Es wird den ganzen Tag über, besonders bei Hitze und in geselliger Runde, getrunken.",
          "order": "¿Tomamos un tereré?",
          "img": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Terer%C3%A9.jpg"
        },
        {
          "name": "Mosto",
          "desc": "Frisch gepresster Zuckerrohrsaft, süß und erfrischend.",
          "long": "Mosto ist in Paraguay ein süßer Saft aus frisch gepresstem Zuckerrohr. Das erfrischende, alkoholfreie Getränk wird oft mit etwas Zitrone und Eis serviert und an Straßenständen verkauft.",
          "ingredients": "Frisch gepresster Zuckerrohrsaft, optional Zitrone, Eis",
          "origin": "Mosto ist eng mit dem Zuckerrohranbau in Paraguay verbunden und ein verbreitetes Straßengetränk.",
          "occasions": "Es wird vor allem als erfrischender Durstlöscher bei Hitze getrunken.",
          "order": "Un mosto bien frío, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/15/Mosto.jpg"
        },
        {
          "name": "Caña",
          "desc": "Zuckerrohrschnaps, das verbreitetste lokale Destillat.",
          "long": "Caña ist ein Branntwein aus Zuckerrohr und die traditionelle Spirituose Paraguays. Der klare, kräftige Schnaps wird pur oder in Mischgetränken getrunken und ist im ganzen Land verbreitet.",
          "ingredients": "Destillat aus Zuckerrohr",
          "origin": "Caña geht auf den Zuckerrohranbau der Kolonialzeit zurück und ist eine traditionelle Spirituose Paraguays.",
          "occasions": "Sie wird bei geselligen Anlässen und Feiern getrunken.",
          "order": "Un trago de caña, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/TAPA_ROJA.jpeg/960px-TAPA_ROJA.jpeg"
        },
        {
          "name": "Pilsen",
          "desc": "Beliebteste paraguayische Biermarke, eiskalt getrunken.",
          "long": "Pilsen ist die bekannteste Biermarke Paraguays und ein helles Lagerbier. Es wird landesweit getrunken und ist besonders bei Hitze und zum Asado beliebt.",
          "ingredients": "Wasser, Gerstenmalz, Hopfen, Hefe",
          "origin": "Pilsen ist eine traditionsreiche paraguayische Biermarke und im ganzen Land verbreitet.",
          "occasions": "Es wird zu Mahlzeiten und bei geselligen Anlässen, gern gut gekühlt, getrunken.",
          "order": "Una Pilsen bien fría, por favor.",
          "img": "https://upload.wikimedia.org/wikipedia/commons/1/16/Cerveza_Pilsen_Publicidad.jpg"
        }
      ],
      "tip": "Trink wie die Einheimischen eiskalten Tereré gegen die Hitze und lerne ein paar Guaraní-Wörter; das öffnet in Paraguay viele Türen und Herzen."
    }
  ];

  window.SC = window.SC || {};
  window.SC.countries = { REGIONS, LIST };
})();
