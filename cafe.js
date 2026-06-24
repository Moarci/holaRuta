/*
 * cafe.js  (SC.cafe) – Modul „Café: Anbau & Kultur in der Region“.
 * REINE DATEN, keine Logik (wie salud.js / responsable.js / musica.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderCafe gerendert, das
 * dieselbe Sheet-Darstellung wie ui.renderSalud nutzt (gleiches Schema), mit
 * eingeschaltetem Lesetraining pro Thema (readingPerTopic) und Kopier-Knopf je
 * Satz (copyPhrases) – wie Flirt/Juegos.
 *
 * Idee: Kaffee ist in weiten Teilen Lateinamerikas mehr als ein Getränk – er ist
 * Landschaft, Lebensunterhalt und Stolz. Von Kolumbiens „Eje Cafetero“ über die
 * Hochlandfincas Guatemalas bis zu den Geisha-Lagen Panamas wächst hier ein
 * großer Teil des Arabica-Kaffees der Welt. Das Modul erklärt, wie Kaffee wächst,
 * geerntet, verarbeitet und geröstet wird, welche Anbauregionen es gibt und wie
 * man als Reisende:r eine Finca besucht, guten Kaffee bestellt und Bohnen kauft –
 * jeweils mit den passenden Sätzen auf Spanisch.
 *
 * Schemas (identisch zu salud.js / responsable.js, damit ui sie 1:1 rendert):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title(+En), intro(+En), dos[](+En), donts[](+En),
 *                 es[], vocab[], level }] – aufklappbar; es/vocab = Lesetraining.
 *   PHRASES  : [{ id, icon, title(+En), items:[{ es, de, en }] }] – gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Kaffee & Anbau.
 *   CHECKLIST: [{ icon, item(+En), why(+En) }] – „Finca-Besuch-Kit“.
 */
(function () {
  "use strict";

  const INTRO =
    "In weiten Teilen Lateinamerikas ist Kaffee nicht nur ein Getränk, sondern " +
    "Landschaft, Lebensunterhalt und Stolz. Vom kolumbianischen „Eje Cafetero“ " +
    "über die Hochlandfincas Mittelamerikas bis zu den Geisha-Lagen Panamas wächst " +
    "hier ein großer Teil des besten Arabica-Kaffees der Welt. Erst zeigt das Modul, " +
    "wie Kaffee wächst, geerntet, verarbeitet und geröstet wird, dann die Regionen – " +
    "und schließlich die Sätze, um eine Finca zu besuchen, guten Kaffee zu bestellen " +
    "und Bohnen mit nach Hause zu nehmen.";

  const INTRO_EN =
    "Across much of Latin America coffee isn't just a drink – it's landscape, " +
    "livelihood and pride. From Colombia's „Eje Cafetero“ to the highland farms of " +
    "Central America and the Geisha lots of Panama, a large share of the world's best " +
    "Arabica grows here. First the module shows how coffee grows, is harvested, " +
    "processed and roasted, then the regions – and finally the phrases to visit a " +
    "farm, order good coffee and take beans home with you.";

  // ---------- Themen: Geschichte, Anbau, Schädlinge, Verarbeitung … (aufklappbar) ----------
  const TOPICS = [
    {
      icon: "📜",
      title: "Geschichte: wann der Kaffee kam",
      titleEn: "History: when coffee arrived",
      intro: "Kaffee ist kein heimisches Gewächs: Er kam erst im 18. Jahrhundert über die Kolonialmächte nach Lateinamerika – in Kolumbien überliefert ab den 1730er-Jahren, oft über Missionare. Im 19. Jahrhundert wurde er zum wichtigsten Exportgut: Er besiedelte die Berge (in Kolumbien die „colonización antioqueña“), finanzierte Eisenbahnen, Häfen und ganze Städte und prägte in Mittelamerika die „Kaffeerepubliken“. Heute ist er Identität – das kolumbianische Paisaje Cultural Cafetero ist seit 2011 UNESCO-Welterbe und sichert Hunderttausenden Familien das Einkommen.",
      introEn: "Coffee isn't native: it only arrived in Latin America in the 18th century with the colonial powers – recorded in Colombia from the 1730s, often via missionaries. In the 19th century it became the leading export: it settled the mountains (in Colombia the „colonización antioqueña“), funded railways, ports and whole cities, and shaped the „coffee republics“ of Central America. Today it's identity – Colombia's Paisaje Cultural Cafetero has been a UNESCO World Heritage Site since 2011 and supports hundreds of thousands of families.",
      dos: [
        "Ein Kaffeemuseum oder den Parque del Café (Quindío) besuchen, um die Geschichte zu verstehen.",
        "Nach der Geschichte der Finca fragen – viele sind seit Generationen in Familienhand.",
        "Die Figur „Juan Valdez“ als Marketing der Kaffeebauern-Föderation (seit 1959) einordnen.",
      ],
      dosEn: [
        "Visit a coffee museum or the Parque del Café (Quindío) to understand the history.",
        "Ask about the farm's history – many have been family-owned for generations.",
        "Place the „Juan Valdez“ figure as marketing by the growers' federation (since 1959).",
      ],
      donts: [
        "Die Kaffeegeschichte nicht romantisieren – sie ist auch eine Geschichte ungleicher Landverteilung und harter Arbeit.",
        "Nicht denken, Kaffee sei „schon immer“ hier gewesen – er ist eine koloniale Einführung.",
      ],
      dontsEn: [
        "Don't romanticise the history – it's also one of unequal land ownership and hard labour.",
        "Don't think coffee was „always“ here – it's a colonial introduction.",
      ],
      es: [
        "El café no es nativo: llegó en el siglo *dieciocho* con las potencias *coloniales* y se volvió el principal producto de *exportación*.",
        "En el siglo *diecinueve* el café pobló las *montañas*, financió ferrocarriles y *ciudades*, y hoy es parte de la *identidad* de la región.",
      ],
      vocab: [
        { es: "dieciocho", de: "achtzehn (18.)", en: "eighteen (18th)", take: false },
        { es: "coloniales", de: "kolonial (colonial)", en: "colonial", take: true },
        { es: "exportación", de: "der Export", en: "export", take: true },
        { es: "diecinueve", de: "neunzehn (19.)", en: "nineteen (19th)", take: false },
        { es: "montañas", de: "die Berge (montaña)", en: "mountains (montaña)", take: true },
        { es: "ciudades", de: "die Städte (ciudad)", en: "cities (ciudad)", take: true },
        { es: "identidad", de: "die Identität", en: "identity", take: true },
      ],
      level: "B1",
    },
    {
      icon: "🌱",
      title: "Wie Kaffee wächst",
      titleEn: "How coffee grows",
      intro: "Guter Kaffee braucht Höhe, Schatten und Geduld. Arabica gedeiht im Hochland (rund 1.200–2.000 m), wo kühle Nächte die Bohnen langsam und aromatisch reifen lassen. Ein Kaffeestrauch trägt erst nach drei bis vier Jahren richtig.",
      introEn: "Good coffee needs altitude, shade and patience. Arabica thrives in the highlands (around 1,200–2,000 m), where cool nights ripen the beans slowly and aromatically. A coffee shrub only bears properly after three to four years.",
      dos: [
        "Auf die Höhenlage achten: „de altura“ steht oft für feineren Hochlandkaffee.",
        "Den Unterschied kennen: Arabica = aromatisch & säuerlich, Robusta = kräftig & bitter.",
        "Schattenkaffee (bajo sombra) schätzen – gut für Vögel, Boden und Geschmack.",
      ],
      dosEn: [
        "Watch the altitude: „de altura“ often marks finer highland coffee.",
        "Know the difference: Arabica = aromatic & bright, Robusta = strong & bitter.",
        "Appreciate shade-grown coffee (bajo sombra) – good for birds, soil and flavour.",
      ],
      donts: [
        "Nicht jeden „Bergkaffee“ für hochwertig halten – frag nach Region und Höhe.",
        "Robusta nicht als „schlecht“ abtun – im Espresso sorgt er für Körper und Crema.",
      ],
      dontsEn: [
        "Don't assume every „mountain coffee“ is premium – ask about region and altitude.",
        "Don't dismiss Robusta as „bad“ – in espresso it gives body and crema.",
      ],
      es: [
        "El *café* arábica crece mejor en la *altura*, entre mil y dos mil metros, donde las noches frías maduran el *grano* despacio.",
        "El *cafeto* es un arbusto: da su primera *cosecha* buena después de tres o cuatro años, muchas veces *bajo sombra* de otros árboles.",
      ],
      vocab: [
        { es: "café", de: "der Kaffee", en: "coffee", take: true },
        { es: "altura", de: "die Höhe / Höhenlage", en: "altitude", take: true },
        { es: "grano", de: "die Bohne / das Korn", en: "bean", take: true },
        { es: "cafeto", de: "der Kaffeestrauch", en: "coffee shrub", take: true },
        { es: "cosecha", de: "die Ernte", en: "harvest", take: true },
        { es: "bajo sombra", de: "im Schatten (angebaut)", en: "shade-grown", take: false },
      ],
      level: "A2",
    },
    {
      icon: "🐛",
      title: "Schädlinge & Krankheiten",
      titleEn: "Pests & diseases",
      intro: "Der Anbau ist verletzlich. Der gefürchtetste Schädling ist die „broca del café“ (Kaffeekirschenkäfer) – ein winziger Käfer, der in die Bohne bohrt. Er stammt aus Afrika, tauchte in Amerika zuerst in Brasilien auf (um 1913) und breitete sich von dort über den ganzen Kontinent aus. Dazu kommt der Pilz „la roya“ (Kaffeerost): Sein großer Ausbruch 2012/13 vernichtete in Mittelamerika riesige Ernten. Die Klimaerwärmung lässt beide in immer höhere Lagen vordringen.",
      introEn: "Growing coffee is fragile. The most feared pest is the „broca del café“ (coffee berry borer) – a tiny beetle that bores into the bean. Native to Africa, it first appeared in the Americas in Brazil (around 1913) and spread from there across the continent. On top of that comes the fungus „la roya“ (coffee leaf rust): its big 2012/13 outbreak wiped out huge harvests in Central America. A warming climate lets both climb to ever higher elevations.",
      dos: [
        "Auf der Finca nach broca, roya und resistenten Sorten (z. B. Castillo, Lempira) fragen.",
        "Verstehen, dass Schatten, Fallen und genaues Monitoring helfen, Gift zu sparen.",
      ],
      dosEn: [
        "On the farm, ask about broca, roya and resistant varieties (e.g. Castillo, Lempira).",
        "Understand that shade, traps and close monitoring help cut down on chemicals.",
      ],
      donts: [
        "Schädlinge nicht unterschätzen – ein Befall kann eine ganze Ernte kosten.",
        "Nicht erwarten, dass es „die eine“ Lösung gibt – es ist ein ständiger Kampf, verschärft durchs Klima.",
      ],
      dontsEn: [
        "Don't underestimate the pests – an infestation can cost an entire harvest.",
        "Don't expect „one“ solution – it's a constant fight, made worse by the climate.",
      ],
      es: [
        "La *broca* es un escarabajo que perfora el *grano*; llegó a América por *Brasil* y se extendió por todo el continente.",
        "El hongo de la *roya* arruinó *cosechas* enteras; con el *clima* más cálido, las *plagas* suben a mayor altura.",
      ],
      vocab: [
        { es: "broca", de: "der Kaffeekäfer (broca)", en: "coffee borer beetle (broca)", take: true },
        { es: "grano", de: "die Bohne / das Korn", en: "bean", take: true },
        { es: "Brasil", de: "Brasilien", en: "Brazil", take: false },
        { es: "roya", de: "der Kaffeerost (Pilz)", en: "coffee leaf rust (fungus)", take: true },
        { es: "cosechas", de: "die Ernten (cosecha)", en: "harvests (cosecha)", take: true },
        { es: "clima", de: "das Klima", en: "climate", take: true },
        { es: "plagas", de: "die Schädlinge (plaga)", en: "pests (plaga)", take: true },
      ],
      level: "B2",
    },
    {
      icon: "🍒",
      title: "Die Ernte: la cosecha",
      titleEn: "The harvest: la cosecha",
      intro: "Die Kaffeefrucht heißt wegen ihrer Farbe „cereza“ (Kirsche). Beim besten Kaffee wird von Hand gepflückt – nur die reifen, roten Kirschen. Pflücker:innen werden oft nach Gewicht oder Eimern bezahlt.",
      introEn: "The coffee fruit is called „cereza“ (cherry) for its colour. The best coffee is hand-picked – only the ripe, red cherries. Pickers are often paid by weight or by the bucket.",
      dos: [
        "Auf der Tour fragen, ob von Hand gepflückt wird (a mano) – das Zeichen für Qualität.",
        "Eine reife (rote) von einer unreifen (grünen) Kirsche unterscheiden lernen.",
        "Pflücker:innen mit Respekt begegnen – es ist harte, saisonale Arbeit.",
      ],
      dosEn: [
        "On a tour, ask whether it's hand-picked (a mano) – the sign of quality.",
        "Learn to tell a ripe (red) cherry from an unripe (green) one.",
        "Treat pickers with respect – it's hard, seasonal work.",
      ],
      donts: [
        "Nicht erwarten, dass überall maschinell geerntet wird – im Steilhang geht nur Handarbeit.",
        "Beim Probepflücken keine grünen Kirschen abreißen – sie verderben das Los.",
      ],
      dontsEn: [
        "Don't expect machine harvesting everywhere – on steep slopes it's hand work only.",
        "When trying picking, don't strip green cherries – they ruin the lot.",
      ],
      es: [
        "La fruta del café se llama *cereza*. En la *cosecha* se recoge *a mano*, solo las cerezas *maduras* y rojas.",
        "Los *recolectores* trabajan por temporada y muchas veces cobran por el peso de cada *canasto*.",
      ],
      vocab: [
        { es: "cereza", de: "die Kaffeekirsche", en: "coffee cherry", take: true },
        { es: "cosecha", de: "die Ernte", en: "harvest", take: true },
        { es: "a mano", de: "von Hand", en: "by hand", take: false },
        { es: "maduras", de: "reif (madura)", en: "ripe (madura)", take: true },
        { es: "recolectores", de: "die Pflücker (recolector)", en: "pickers (recolector)", take: true },
        { es: "canasto", de: "der Erntekorb", en: "harvest basket", take: true },
      ],
      level: "A2",
    },
    {
      icon: "💧",
      title: "Verarbeitung: lavado, honey & natural",
      titleEn: "Processing: washed, honey & natural",
      intro: "Wie aus der Kirsche eine grüne Bohne wird, prägt den Geschmack stark. Gewaschen (lavado) schmeckt klar und sauber, natural (sonnengetrocknet mit Fruchtfleisch) fruchtiger, honey liegt dazwischen.",
      introEn: "How a cherry becomes a green bean strongly shapes the flavour. Washed (lavado) tastes clean and clear, natural (sun-dried with the pulp on) fruitier, honey sits in between.",
      dos: [
        "Im Spezialitätencafé nach der Aufbereitung fragen: „¿lavado, honey o natural?“",
        "Gewaschene Kaffees probieren für klare Säure, naturale für fruchtige Süße.",
        "Auf die Trockenbeete (camas africanas) achten – ein Zeichen für Sorgfalt.",
      ],
      dosEn: [
        "In a specialty café, ask about the process: „¿lavado, honey o natural?“",
        "Try washed coffees for clean acidity, naturals for fruity sweetness.",
        "Look for raised drying beds (camas africanas) – a sign of care.",
      ],
      donts: [
        "Nicht denken, „natural“ heiße ungespritzt – es bezeichnet die Trocknung mit Fruchtfleisch.",
        "Frischen Kaffee nicht im Kühlschrank lagern – er zieht Gerüche und Feuchtigkeit.",
      ],
      dontsEn: [
        "Don't think „natural“ means pesticide-free – it refers to drying with the pulp on.",
        "Don't store fresh coffee in the fridge – it absorbs odours and moisture.",
      ],
      es: [
        "Después de la cosecha, el *beneficio* convierte la cereza en *grano verde*: puede ser *lavado*, honey o *natural*.",
        "El café *lavado* es limpio; el *natural* se seca al sol con la pulpa y sabe más a *fruta*.",
      ],
      vocab: [
        { es: "beneficio", de: "die Aufbereitungsanlage", en: "processing mill", take: true },
        { es: "grano verde", de: "die grüne (Roh-)Bohne", en: "green bean", take: false },
        { es: "lavado", de: "gewaschen", en: "washed", take: true },
        { es: "natural", de: "naturbelassen / sonnengetrocknet", en: "natural", take: true },
        { es: "fruta", de: "die Frucht / das Obst", en: "fruit", take: true },
      ],
      level: "B1",
    },
    {
      icon: "🔥",
      title: "Rösten, mahlen & aufbrühen",
      titleEn: "Roasting, grinding & brewing",
      intro: "Erst das Rösten weckt das Aroma. Hell geröstet bleibt mehr Säure und Frucht, dunkel wird kräftig und bitter. Frisch gemahlen schmeckt es am besten – ganze Bohnen halten länger.",
      introEn: "Roasting is what wakes the aroma. A light roast keeps more acidity and fruit, a dark roast turns strong and bitter. Freshly ground tastes best – whole beans keep longer.",
      dos: [
        "Ganze Bohnen kaufen (en grano) und erst kurz vor dem Brühen mahlen.",
        "Nach dem Röstdatum fragen, nicht nur nach dem Verfallsdatum.",
        "Methoden vor Ort probieren: olla (Topf), prensa (French Press), chorreador (Costa Rica).",
      ],
      dosEn: [
        "Buy whole beans (en grano) and grind only just before brewing.",
        "Ask for the roast date, not just the best-before date.",
        "Try local methods: olla (pot), prensa (French press), chorreador (Costa Rica).",
      ],
      donts: [
        "Kaffee nicht mit kochendem Wasser überbrühen – kurz warten (ca. 92–96 °C).",
        "Gemahlenen Kaffee nicht wochenlang offen stehen lassen – das Aroma verfliegt.",
      ],
      dontsEn: [
        "Don't pour boiling water straight on – wait a moment (about 92–96 °C).",
        "Don't leave ground coffee open for weeks – the aroma fades.",
      ],
      es: [
        "El *tueste* despierta el aroma: claro deja más *acidez*, oscuro lo hace fuerte y *amargo*.",
        "Compra el café *en grano* y *muele* justo antes de preparar; así sabe más fresco.",
      ],
      vocab: [
        { es: "tueste", de: "die Röstung", en: "roast", take: true },
        { es: "acidez", de: "die Säure", en: "acidity", take: true },
        { es: "amargo", de: "bitter", en: "bitter", take: true },
        { es: "en grano", de: "als ganze Bohne", en: "whole bean", take: false },
        { es: "muele", de: "mahle (moler)", en: "grind (moler)", take: false },
      ],
      level: "B1",
    },
    {
      icon: "🗺️",
      title: "Die Anbauregionen",
      titleEn: "The growing regions",
      intro: "Fast jedes Land hat seinen Stolz: Kolumbiens „Eje Cafetero“ (Caldas, Quindío, Risaralda) ist UNESCO-Welterbe; Guatemala (Antigua, Huehuetenango), Costa Rica (Tarrazú), Honduras, Mexiko (Chiapas, Veracruz), Peru und Bolivien liefern feine Hochlandkaffees – und Panama ist für seinen teuren Geisha berühmt.",
      introEn: "Almost every country has its pride: Colombia's „Eje Cafetero“ (Caldas, Quindío, Risaralda) is a UNESCO site; Guatemala (Antigua, Huehuetenango), Costa Rica (Tarrazú), Honduras, Mexico (Chiapas, Veracruz), Peru and Bolivia produce fine highland coffees – and Panama is famous for its pricey Geisha.",
      dos: [
        "Vor der Reise schauen, welche Kaffeeregion auf deiner Route liegt.",
        "Regionale Namen merken: Tarrazú (CR), Antigua & Huehue (GT), Eje Cafetero (CO).",
        "Vom kolumbianischen „tinto“ (dünner Filterkaffee) bis zum café de olla (MX) alles kosten.",
      ],
      dosEn: [
        "Before the trip, check which coffee region is on your route.",
        "Remember regional names: Tarrazú (CR), Antigua & Huehue (GT), Eje Cafetero (CO).",
        "Taste everything from Colombian „tinto“ (thin filter coffee) to café de olla (MX).",
      ],
      donts: [
        "Nicht annehmen, der beste Kaffee bliebe im Land – viel Spitzenkaffee wird exportiert.",
        "Den „tinto“ in Kolumbien nicht mit dem spanischen Rotwein „tinto“ verwechseln.",
      ],
      dontsEn: [
        "Don't assume the best coffee stays in the country – much top coffee is exported.",
        "Don't confuse Colombian „tinto“ (black coffee) with Spanish „tinto“ (red wine).",
      ],
      es: [
        "Casi cada país tiene su *región* de café: el *Eje Cafetero* en Colombia es *patrimonio* de la humanidad.",
        "En *Guatemala* destacan Antigua y Huehuetenango; en Costa Rica, Tarrazú; Panamá es famoso por su *Geisha*.",
      ],
      vocab: [
        { es: "región", de: "die Region", en: "region", take: true },
        { es: "Eje Cafetero", de: "die kolumb. Kaffeezone", en: "Colombian coffee belt", take: false },
        { es: "patrimonio", de: "das (Welt-)Erbe", en: "heritage", take: true },
        { es: "Guatemala", de: "Guatemala", en: "Guatemala", take: false },
        { es: "Geisha", de: "die Geisha-Sorte", en: "Geisha variety", take: false },
      ],
      level: "B1",
    },
    {
      icon: "📦",
      title: "Export & was im Land bleibt",
      titleEn: "Export & what stays in the country",
      intro: "Lange galt: Der beste Kaffee geht in den Export, im Land bleibt oft die zweite Wahl. Die aussortierten, beschädigten Bohnen heißen in Kolumbien „pasilla“ – aus ihnen wurde traditionell der einfache, dünne „tinto“, den man mit viel Zucker trank. Genau deshalb schmeckt der Standardkaffee vor Ort manchmal schwächer, als man es vom Ruf des Landes erwartet. Erst die Spezialitätenwelle der letzten Jahre bringt guten Kaffee zunehmend auch in die Cafés der Anbauländer selbst („consumo interno“).",
      introEn: "For a long time the rule was: the best coffee goes to export, while the second choice often stays in the country. The sorted-out, damaged beans are called „pasilla“ in Colombia – traditionally they became the simple, thin „tinto“ people drank with lots of sugar. That's exactly why the standard local coffee can taste weaker than the country's reputation suggests. Only the specialty wave of recent years is bringing good coffee into the cafés of the producing countries themselves („consumo interno“).",
      dos: [
        "In Spezialitätencafés gezielt nach lokalem Spitzenkaffee fragen – er bleibt heute öfter im Land.",
        "Den einfachen „tinto“ an der Straße als Teil der Kultur genießen – aber wissen, woher er kommt.",
      ],
      dosEn: [
        "In specialty cafés, ask specifically for top local coffee – more of it stays in-country today.",
        "Enjoy the simple street „tinto“ as part of the culture – but know where it comes from.",
      ],
      donts: [
        "Nicht überrascht sein, wenn der Standardkaffee schwächer schmeckt – die Top-Lose gehen oft in den Export.",
        "Pasilla nicht mit „schlechtem Land“ gleichsetzen – es ist eine Frage von Sortierung und Markt, nicht von schlechtem Anbau.",
      ],
      dontsEn: [
        "Don't be surprised if the standard coffee tastes weaker – the top lots often go to export.",
        "Don't equate pasilla with „a bad country“ – it's about sorting and markets, not poor growing.",
      ],
      es: [
        "Tradicionalmente, el mejor café se va a la *exportación* y en el país queda la *pasilla*: el grano de segunda.",
        "Con esa pasilla se hacía el *tinto* sencillo con mucha *azúcar*; hoy el café de *especialidad* se queda más en el *país*.",
      ],
      vocab: [
        { es: "exportación", de: "der Export", en: "export", take: true },
        { es: "pasilla", de: "der Ausschuss-/Restkaffee (CO)", en: "off-grade beans (CO)", take: true },
        { es: "tinto", de: "schwarzer Filterkaffee (CO)", en: "black filter coffee (CO)", take: true },
        { es: "azúcar", de: "der Zucker", en: "sugar", take: true },
        { es: "especialidad", de: "die Spezialität", en: "specialty", take: true },
        { es: "país", de: "das Land", en: "country", take: true },
      ],
      level: "B1",
    },
    {
      icon: "🧑‍🌾",
      title: "Eine Finca besuchen",
      titleEn: "Visiting a coffee farm",
      intro: "Eine Kaffeetour (tour del café) auf einer Finca ist eines der schönsten Erlebnisse der Region: vom Strauch über das beneficio bis zur Tasse – oft mit Verkostung (cata) und Bohnen zum Mitnehmen.",
      introEn: "A coffee tour (tour del café) on a finca is one of the region's loveliest experiences: from shrub to mill to cup – often with a tasting (cata) and beans to take home.",
      dos: [
        "Vorab nach Sprache (Spanisch/Englisch), Dauer und Preis fragen.",
        "Kleine, familiengeführte Fincas wählen – das Geld bleibt direkt vor Ort.",
        "Bei der cata (Verkostung) ruhig laut schlürfen – so verteilt sich das Aroma.",
        "Bohnen direkt auf der Finca kaufen – frischer und fairer geht es kaum.",
      ],
      dosEn: [
        "Ask in advance about language (Spanish/English), duration and price.",
        "Choose small, family-run farms – the money stays right there.",
        "At the cata (tasting), slurp out loud – it spreads the aroma.",
        "Buy beans straight from the farm – hardly anything is fresher or fairer.",
      ],
      donts: [
        "Nicht ohne festes Schuhwerk kommen – die Hänge sind steil und oft matschig.",
        "Nicht nur fotografieren – frag, mach mit, pflücke eine Kirsche.",
        "Trinkgeld und Lob nicht vergessen, wenn die Familie selbst führt.",
      ],
      dontsEn: [
        "Don't come without sturdy shoes – the slopes are steep and often muddy.",
        "Don't just take photos – ask, join in, pick a cherry.",
        "Don't forget a tip and praise if the family guides you themselves.",
      ],
      es: [
        "En la *finca* puedes hacer un *tour del café*: ves el cafeto, el beneficio y terminas con una *cata*.",
        "Pregunta el *precio* y la duración, y compra el café directamente al *productor*.",
      ],
      vocab: [
        { es: "finca", de: "die (Kaffee-)Farm", en: "farm / estate", take: true },
        { es: "tour del café", de: "die Kaffeetour", en: "coffee tour", take: false },
        { es: "cata", de: "die Verkostung", en: "tasting", take: true },
        { es: "precio", de: "der Preis", en: "price", take: true },
        { es: "productor", de: "der Produzent / Bauer", en: "producer / farmer", take: true },
      ],
      level: "A2",
    },
    {
      icon: "⚖️",
      title: "Fairer Handel & Spezialitätenkaffee",
      titleEn: "Fair trade & specialty coffee",
      intro: "Hinter der schönen Landschaft steht harte Arbeit zu oft niedrigen Weltmarktpreisen. Direkt auf der Finca oder bei Kooperativen zu kaufen und auf Siegel wie Fairtrade oder „comercio justo“ zu achten, lässt mehr Geld bei den Bäuer:innen.",
      introEn: "Behind the pretty landscape lies hard work at often low world-market prices. Buying directly on the farm or from cooperatives and looking for labels like Fairtrade or „comercio justo“ leaves more money with the farmers.",
      dos: [
        "Bei Kooperativen (cooperativas) und kleinen Röstern kaufen.",
        "Auf „comercio justo“ / Fairtrade und Bio (orgánico) achten.",
        "Einen fairen Preis zahlen – beim Spezialitätenkaffee nicht auf den letzten Peso feilschen.",
      ],
      dosEn: [
        "Buy from cooperatives (cooperativas) and small roasters.",
        "Look for „comercio justo“ / Fairtrade and organic (orgánico).",
        "Pay a fair price – don't haggle specialty coffee down to the last peso.",
      ],
      donts: [
        "Nicht nur auf den billigsten Supermarktkaffee schauen, wenn lokal fair geht.",
        "Spitzenkaffee nicht herunterhandeln – die Arbeit dahinter ist enorm.",
      ],
      dontsEn: [
        "Don't go only for the cheapest supermarket coffee when fair-local is an option.",
        "Don't beat down top coffee – the work behind it is enormous.",
      ],
      es: [
        "Mucho café se vende barato. Comprar en una *cooperativa* o con *comercio justo* deja más dinero al *campesino*.",
        "El café de *especialidad* cuesta más porque la *calidad* y el trabajo son altos: paga un *precio* justo.",
      ],
      vocab: [
        { es: "cooperativa", de: "die Genossenschaft", en: "cooperative", take: true },
        { es: "comercio justo", de: "der faire Handel", en: "fair trade", take: false },
        { es: "campesino", de: "der Kleinbauer", en: "small farmer", take: true },
        { es: "especialidad", de: "die Spezialität", en: "specialty", take: true },
        { es: "calidad", de: "die Qualität", en: "quality", take: true },
        { es: "precio", de: "der Preis", en: "price", take: true },
      ],
      level: "B1",
    },
  ];

  // ---------- Wichtige Sätze, nach Situation gruppiert ----------
  const PHRASES = [
    {
      id: "pedir",
      icon: "☕",
      title: "Kaffee bestellen",
      titleEn: "Ordering coffee",
      items: [
        { es: "Un café, por favor.", de: "Einen Kaffee, bitte.", en: "A coffee, please." },
        { es: "Un tinto, por favor.", de: "Einen (schwarzen Filter-)Kaffee, bitte. (CO)", en: "A black coffee, please. (CO)" },
        { es: "Un café con leche.", de: "Einen Milchkaffee.", en: "A coffee with milk." },
        { es: "Un café americano / un espresso.", de: "Einen Americano / einen Espresso.", en: "An americano / an espresso." },
        { es: "¿Tienen café de la región?", de: "Habt ihr Kaffee aus der Region?", en: "Do you have local/regional coffee?" },
        { es: "Sin azúcar, por favor.", de: "Ohne Zucker, bitte.", en: "No sugar, please." },
      ],
    },
    {
      id: "tour",
      icon: "🧑‍🌾",
      title: "Auf der Finca / Kaffeetour",
      titleEn: "On the farm / coffee tour",
      items: [
        { es: "¿Hacen tours del café?", de: "Bietet ihr Kaffeetouren an?", en: "Do you run coffee tours?" },
        { es: "¿Cuánto cuesta el tour y cuánto dura?", de: "Was kostet die Tour und wie lange dauert sie?", en: "How much is the tour and how long is it?" },
        { es: "¿El tour es en español o en inglés?", de: "Ist die Tour auf Spanisch oder Englisch?", en: "Is the tour in Spanish or English?" },
        { es: "¿Podemos ver cómo se recoge el café?", de: "Können wir sehen, wie der Kaffee gepflückt wird?", en: "Can we see how the coffee is picked?" },
        { es: "¿Incluye una cata?", de: "Ist eine Verkostung dabei?", en: "Does it include a tasting?" },
      ],
    },
    {
      id: "sabor",
      icon: "👅",
      title: "Über Geschmack reden",
      titleEn: "Talking about taste",
      items: [
        { es: "¿Es suave o fuerte?", de: "Ist er mild oder kräftig?", en: "Is it mild or strong?" },
        { es: "¿Es lavado, honey o natural?", de: "Ist er gewaschen, honey oder natural?", en: "Is it washed, honey or natural?" },
        { es: "Me gusta con más acidez y notas a fruta.", de: "Ich mag ihn mit mehr Säure und Fruchtnoten.", en: "I like it with more acidity and fruit notes." },
        { es: "¿De qué región es este café?", de: "Aus welcher Region ist dieser Kaffee?", en: "Which region is this coffee from?" },
        { es: "¿A qué altura se cultiva?", de: "Auf welcher Höhe wird er angebaut?", en: "At what altitude is it grown?" },
      ],
    },
    {
      id: "comprar",
      icon: "🛍️",
      title: "Bohnen kaufen & mitnehmen",
      titleEn: "Buying & taking beans home",
      items: [
        { es: "Quiero comprar café en grano.", de: "Ich möchte ganze Bohnen kaufen.", en: "I'd like to buy whole beans." },
        { es: "¿Lo pueden moler o lo prefiero en grano?", de: "Könnt ihr ihn mahlen, oder lieber als ganze Bohne?", en: "Can you grind it, or shall I keep it whole?" },
        { es: "¿Cuándo se tostó este café?", de: "Wann wurde dieser Kaffee geröstet?", en: "When was this coffee roasted?" },
        { es: "¿Tienen café de comercio justo?", de: "Habt ihr Kaffee aus fairem Handel?", en: "Do you have fair-trade coffee?" },
        { es: "Me llevo una libra, por favor.", de: "Ich nehme ein Pfund, bitte.", en: "I'll take a pound, please." },
      ],
    },
    {
      id: "historia",
      icon: "📜",
      title: "Geschichte, Schädlinge & Qualität",
      titleEn: "History, pests & quality",
      items: [
        { es: "¿Desde cuándo cultiva café esta finca?", de: "Seit wann baut diese Finca Kaffee an?", en: "How long has this farm grown coffee?" },
        { es: "¿La finca es de la familia desde hace generaciones?", de: "Ist die Finca seit Generationen in Familienhand?", en: "Has the farm been in the family for generations?" },
        { es: "¿Han tenido problemas con la broca o la roya?", de: "Hattet ihr Probleme mit dem Käfer (broca) oder dem Rost (roya)?", en: "Have you had problems with the borer (broca) or rust (roya)?" },
        { es: "¿Este café es de exportación o se queda en el país?", de: "Ist das Exportkaffee oder bleibt er im Land?", en: "Is this export coffee or does it stay in the country?" },
        { es: "¿Qué le pasa al café que no se exporta?", de: "Was passiert mit dem Kaffee, der nicht exportiert wird?", en: "What happens to the coffee that isn't exported?" },
      ],
    },
  ];

  // ---------- Schlüsselwörter rund um Kaffee & Anbau ----------
  const GLOSSARY = [
    { es: "el café", de: "der Kaffee", en: "the coffee" },
    { es: "el tinto", de: "schwarzer Filterkaffee (CO)", en: "black filter coffee (CO)" },
    { es: "el grano", de: "die Bohne / das Korn", en: "the bean" },
    { es: "el cafeto", de: "der Kaffeestrauch", en: "the coffee shrub" },
    { es: "la cereza", de: "die Kaffeekirsche", en: "the coffee cherry" },
    { es: "la cosecha", de: "die Ernte", en: "the harvest" },
    { es: "la finca", de: "die (Kaffee-)Farm", en: "the farm / estate" },
    { es: "el beneficio", de: "die Aufbereitungsanlage", en: "the processing mill" },
    { es: "lavado", de: "gewaschen (aufbereitet)", en: "washed (process)" },
    { es: "natural", de: "naturbelassen (sonnengetrocknet)", en: "natural (sun-dried)" },
    { es: "el tueste", de: "die Röstung", en: "the roast" },
    { es: "tostar", de: "rösten", en: "to roast" },
    { es: "moler", de: "mahlen", en: "to grind" },
    { es: "la acidez", de: "die Säure", en: "the acidity" },
    { es: "el cuerpo", de: "der Körper (im Geschmack)", en: "the body (in taste)" },
    { es: "la cata", de: "die Verkostung", en: "the tasting / cupping" },
    { es: "el catador", de: "der Verkoster", en: "the cupper / taster" },
    { es: "la altura", de: "die Höhenlage", en: "the altitude" },
    { es: "de altura", de: "aus Höhenlagen", en: "high-grown" },
    { es: "arábica", de: "Arabica (Sorte)", en: "Arabica (variety)" },
    { es: "robusta", de: "Robusta (Sorte)", en: "Robusta (variety)" },
    { es: "el productor", de: "der Produzent / Kaffeebauer", en: "the producer / farmer" },
    { es: "el campesino", de: "der Kleinbauer", en: "the small farmer" },
    { es: "la cooperativa", de: "die Genossenschaft", en: "the cooperative" },
    { es: "el comercio justo", de: "der faire Handel", en: "fair trade" },
    { es: "en grano", de: "als ganze Bohne", en: "whole bean" },
    { es: "molido", de: "gemahlen", en: "ground" },
    { es: "la exportación", de: "der Export", en: "the export" },
    { es: "la pasilla", de: "der Ausschuss-/Restkaffee (CO)", en: "off-grade / reject beans (CO)" },
    { es: "el consumo interno", de: "der Inlandsverbrauch", en: "domestic consumption" },
    { es: "la broca", de: "der Kaffeekirschenkäfer", en: "the coffee berry borer" },
    { es: "la roya", de: "der Kaffeerost (Pilzkrankheit)", en: "coffee leaf rust (fungal disease)" },
    { es: "la plaga", de: "der Schädling / die Plage", en: "the pest / plague" },
    { es: "el patrimonio cafetero", de: "das Kaffee-Kulturerbe", en: "coffee cultural heritage" },
  ];

  // ---------- „Finca-Besuch-Kit“ (Packliste für die Kaffeetour) ----------
  const CHECKLIST = [
    {
      icon: "🥾",
      item: "Festes Schuhwerk",
      itemEn: "Sturdy shoes",
      why: "Die Hänge der Fincas sind steil und nach Regen rutschig.",
      whyEn: "The farm slopes are steep and slippery after rain.",
    },
    {
      icon: "🧥",
      item: "Leichte Regenjacke",
      itemEn: "Light rain jacket",
      why: "Im Kaffee-Hochland regnet es oft kurz und kräftig.",
      whyEn: "In the coffee highlands it often rains briefly and hard.",
    },
    {
      icon: "💵",
      item: "Bargeld in kleinen Scheinen",
      itemEn: "Cash in small notes",
      why: "Kleine Fincas nehmen selten Karte – für Tour und Bohnen.",
      whyEn: "Small farms rarely take cards – for the tour and beans.",
    },
    {
      icon: "🧴",
      item: "Sonnenschutz & Mückenmittel",
      itemEn: "Sun protection & insect repellent",
      why: "Höhensonne und Mücken zwischen den Sträuchern unterschätzt man leicht.",
      whyEn: "High-altitude sun and mosquitoes among the shrubs are easy to underestimate.",
    },
    {
      icon: "🫙",
      item: "Wiederverschließbare Tüte/Dose",
      itemEn: "Resealable bag/tin",
      why: "Hält frisch gekaufte Bohnen aromadicht für den Heimweg.",
      whyEn: "Keeps freshly bought beans aroma-tight for the journey home.",
    },
    {
      icon: "📒",
      item: "Notizen zu Geschmack & Region",
      itemEn: "Notes on taste & region",
      why: "So findest du deinen Lieblingskaffee zu Hause wieder.",
      whyEn: "So you can find your favourite coffee again back home.",
    },
  ];

  window.SC = window.SC || {};
  window.SC.cafe = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
