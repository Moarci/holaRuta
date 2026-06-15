/*
 * historia.js  (SC.historia) – Modell für die Erklärseite "Historia de
 * Sudamérica". REINE DATEN, keine Logik (wie countries.js / data.js). Wird von
 * ui.renderHistoria gerendert; der Controller (app.js) reicht die Daten per
 * localizeDeep für die aktive Sprache durch (deutsche Felder + …En-Pendants).
 *
 * Aufbau:
 *   INTRO     { de, en }                       – Einleitungstext (Hero)
 *   ERAS      [ Epoche ]                        – der interaktive Zeitstrahl
 *   FIGURES   [ Person ]                        – die Protagonisten (Galerie)
 *   TENSIONS  [ Spannung ]                      – "Heute": Lage & Konflikte
 *   FACTS     [ { de, en } ]                    – "¿Sabías que…?"-Häppchen
 *
 * Epoche:   { id, icon, period, title, lead, body:[Absatz], points:[Punkt],
 *             img, imgCaption }  (+ …En-Pendants für die Übersetzung)
 * Person:   { id, name, role, years, flag, img, text, quote }  (+ …En)
 * Spannung: { id, icon, title, where, tone, status, text }  (+ …En)
 *   tone = "crisis" | "tense" | "shift" | "progress"  (Farbe der Status-Plakette)
 *
 * img = nur der Wikimedia-Commons-Dateiname (z. B. "Bolivar Arturo Michelena.jpg").
 *       ui.js baut daraus eine Special:FilePath-URL (kein Hash-Raten nötig).
 *       Offline/bei Fehler wird das Bild ausgeblendet (onerror in ui.js).
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // ---------- Einleitung ----------
  const INTRO = {
    de: "Ein Kontinent, eine bewegte Geschichte: In wenigen Jahrzehnten wurde aus uralten Hochkulturen ein spanisches Kolonialreich – und daraus, im Feuer eines gemeinsamen Freiheitskampfes, ein Dutzend junger Republiken. Hier ist die große Linie: wie es war, wie aus einem Traum von Einheit viele Nationen wurden, und wie es heute weitergeht.",
    en: "One continent, one turbulent story: in just a few decades, ancient civilisations became a Spanish colonial empire – and out of that, in the fire of a shared struggle for freedom, came a dozen young republics. Here's the big picture: how it was, how a dream of unity turned into many nations, and where it all stands today.",
  };

  // ---------- Zeitstrahl: die Epochen ----------
  const ERAS = [
    {
      id: "precolombino",
      icon: "🏔️",
      period: "bis 1492",
      periodEn: "before 1492",
      title: "Vor den Spaniern – die Hochkulturen",
      titleEn: "Before the Spanish – the great civilisations",
      lead: "Lange vor Kolumbus blühten in den Anden und im Amazonas hochentwickelte Reiche.",
      leadEn: "Long before Columbus, sophisticated empires flourished in the Andes and the Amazon.",
      body: [
        "Das größte war das Reich der Inka, Tawantinsuyu, „Land der vier Teile“. Von ihrer Hauptstadt Cusco aus beherrschten die Inka im 15. Jahrhundert ein Gebiet von Kolumbien bis Chile – über 4.000 Kilometer Anden, verbunden durch ein gigantisches Straßennetz (Qhapaq Ñan) mit Hängebrücken und Läuferstaffeten (chasquis).",
        "Ohne Schrift im klassischen Sinn verwalteten sie alles über Knotenschnüre (quipus); ohne Eisen und Rad bauten sie Terrassen, Bewässerung und steinerne Festungen wie Machu Picchu oder Sacsayhuamán, deren fugenlose Mauern bis heute Erdbeben überstehen.",
        "Daneben gab es viele weitere Kulturen: die Muisca im Hochland von Kolumbien (deren Goldritual die El-Dorado-Legende auslöste), die kriegerischen Mapuche im Süden Chiles, die nie ganz unterworfen wurden, und unzählige Völker im Amazonasbecken.",
      ],
      bodyEn: [
        "The largest was the empire of the Inca, Tawantinsuyu, \"the land of the four parts\". From their capital Cusco, the Inca ruled in the 15th century over a territory stretching from Colombia to Chile – more than 4,000 kilometres of Andes, linked by a vast road network (Qhapaq Ñan) with rope bridges and relay runners (chasquis).",
        "Without writing in the classic sense, they administered everything through knotted cords (quipus); without iron or the wheel, they built terraces, irrigation and stone fortresses such as Machu Picchu and Sacsayhuamán, whose seamless walls still survive earthquakes today.",
        "Alongside them were many other cultures: the Muisca in the highlands of Colombia (whose gold ritual sparked the legend of El Dorado), the warlike Mapuche in southern Chile, who were never fully subdued, and countless peoples of the Amazon basin.",
      ],
      points: [
        "Inka-Reich: ~12 Mio. Menschen, von Kolumbien bis Chile",
        "Quechua, die Sprache der Inka, sprechen bis heute Millionen",
        "Machu Picchu wurde erst 1911 weltweit bekannt",
      ],
      pointsEn: [
        "Inca Empire: ~12 million people, from Colombia to Chile",
        "Quechua, the language of the Inca, is still spoken by millions",
        "Machu Picchu only became world-famous in 1911",
      ],
      img: "Machu Picchu, Peru.jpg",
      imgCaption: "Machu Picchu – Inka-Stadt in den Anden Perus",
      imgCaptionEn: "Machu Picchu – Inca city in the Peruvian Andes",
    },
    {
      id: "conquista",
      icon: "⚔️",
      period: "1492–1572",
      title: "Die Conquista – die Eroberung",
      titleEn: "The Conquista – the conquest",
      lead: "Wenige hundert Spanier brachten in einer Generation ganze Reiche zu Fall.",
      leadEn: "A few hundred Spaniards brought entire empires down in a single generation.",
      body: [
        "1492 erreichte Kolumbus die Karibik. Innerhalb weniger Jahrzehnte stießen die conquistadores aufs Festland vor. In Südamerika nutzte Francisco Pizarro 1532 einen blutigen Inka-Bürgerkrieg aus: In Cajamarca nahm er den Herrscher Atahualpa gefangen, ließ ihn ein riesiges Lösegeld an Gold zahlen – und hinrichten.",
        "Der eigentliche Verbündete der Eroberer waren jedoch eingeschleppte Krankheiten. Pocken, Masern und Grippe töteten Schätzungen zufolge bis zu 90 Prozent der indigenen Bevölkerung – ein demografischer Zusammenbruch, der den Widerstand brach, bevor die meisten je einen Spanier sahen.",
        "Mit Schwert, Pferd, Feuerwaffen und einheimischen Bündnispartnern unterwarfen die Spanier bis 1572 (Fall des letzten Inka-Rückzugsorts Vilcabamba) den Kontinent. Begründet wurde das mit Kreuz und Krone: Mission und Reichtum gingen Hand in Hand.",
      ],
      bodyEn: [
        "In 1492 Columbus reached the Caribbean. Within a few decades the conquistadors pushed onto the mainland. In South America, Francisco Pizarro exploited a bloody Inca civil war in 1532: at Cajamarca he captured the ruler Atahualpa, had him pay an enormous ransom in gold – and then executed him.",
        "The conquerors' real ally, however, was imported disease. Smallpox, measles and influenza killed up to 90 per cent of the indigenous population by some estimates – a demographic collapse that broke resistance before most people ever saw a Spaniard.",
        "With swords, horses, firearms and native allies, the Spanish subjugated the continent by 1572 (the fall of the last Inca refuge of Vilcabamba). It was all justified by cross and crown: mission and riches went hand in hand.",
      ],
      points: [
        "Pizarro nahm Atahualpa mit nur ~170 Mann gefangen",
        "Krankheiten töteten weit mehr Menschen als Waffen",
        "1572 fiel Vilcabamba, der letzte Inka-Widerstand",
      ],
      pointsEn: [
        "Pizarro captured Atahualpa with only ~170 men",
        "Disease killed far more people than weapons did",
        "In 1572 Vilcabamba fell, the last Inca resistance",
      ],
      img: "John Everett Millais - Pizarro seizing the Inca of Peru.jpg",
      imgCaption: "Pizarro nimmt den Inka gefangen (J. E. Millais, 1846)",
      imgCaptionEn: "Pizarro seizing the Inca (J. E. Millais, 1846)",
    },
    {
      id: "colonial",
      icon: "👑",
      period: "1542–1808",
      title: "Die Kolonialzeit – Vizekönige & Silber",
      titleEn: "The colonial era – viceroys & silver",
      lead: "Fast drei Jahrhunderte regierte Spanien von Lima und Bogotá aus – getragen vom Silber.",
      leadEn: "For almost three centuries Spain ruled from Lima and Bogotá – carried by silver.",
      body: [
        "Südamerika wurde in Vizekönigreiche (virreinatos) gegliedert. Lange war das Virreinato del Perú mit Hauptstadt Lima das Herzstück; später kamen Nueva Granada (Bogotá, 1717) und Río de la Plata (Buenos Aires, 1776) hinzu. Ein Vizekönig vertrat den spanischen König direkt.",
        "Den Motor bildete der Silberberg Cerro Rico in Potosí (heute Bolivien): Über zwei Jahrhunderte kam von hier ein großer Teil des Weltsilbers – geschürft in der mita, einer Zwangsarbeit, die unzählige indigene und versklavte afrikanische Menschen das Leben kostete.",
        "Die Gesellschaft war streng nach Herkunft geschichtet: oben die in Spanien geborenen peninsulares, darunter die im Land geborenen Weißen (criollos), dann mestizos, indígenas und versklavte Afrikaner. Genau dieser Riss – reiche, gebildete criollos ohne politische Macht – sollte später den Freiheitskampf entzünden.",
      ],
      bodyEn: [
        "South America was organised into viceroyalties (virreinatos). For a long time the Viceroyalty of Peru, with its capital Lima, was the heart of it; later came New Granada (Bogotá, 1717) and Río de la Plata (Buenos Aires, 1776). A viceroy represented the Spanish king directly.",
        "The engine was the silver mountain Cerro Rico at Potosí (in today's Bolivia): for over two centuries a large share of the world's silver came from here – mined under the mita, a forced-labour system that cost countless indigenous and enslaved African people their lives.",
        "Society was strictly layered by origin: at the top the Spanish-born peninsulares, below them the locally born whites (criollos), then mestizos, indígenas and enslaved Africans. It was precisely this fault line – wealthy, educated criollos with no political power – that would later ignite the struggle for freedom.",
      ],
      points: [
        "Potosí war um 1600 eine der größten Städte der Welt",
        "Drei Vizekönigreiche: Perú, Nueva Granada, Río de la Plata",
        "Die Kirche prägte Sprache, Bildung und Alltag tief",
      ],
      pointsEn: [
        "Around 1600 Potosí was one of the largest cities in the world",
        "Three viceroyalties: Peru, New Granada, Río de la Plata",
        "The Church deeply shaped language, education and daily life",
      ],
      img: "Virreinato del Perú en el mapa de la América del Sur de Agustín Ibáñez y Bojons, 1800.jpg",
      imgCaption: "Südamerika unter spanischer Herrschaft (Karte, 1800)",
      imgCaptionEn: "South America under Spanish rule (map, 1800)",
    },
    {
      id: "chispa",
      icon: "🔥",
      period: "1780–1810",
      title: "Der Funke – Aufklärung, Napoleon & die ersten Junten",
      titleEn: "The spark – Enlightenment, Napoleon & the first juntas",
      lead: "Neue Ideen und eine Krise in Europa öffneten plötzlich das Fenster zur Freiheit.",
      leadEn: "New ideas and a crisis in Europe suddenly opened a window to freedom.",
      body: [
        "Schon 1780 erhob sich im Hochland Perus Túpac Amaru II., Nachfahre der Inka, gegen die Ausbeutung – ein gewaltiger indigener Aufstand, blutig niedergeschlagen, aber unvergessen. Gleichzeitig sickerten die Ideen der Aufklärung und das Vorbild der US-amerikanischen und der Französischen Revolution ins Land.",
        "Den entscheidenden Stoß gab Europa selbst: 1808 besetzte Napoleon Spanien und setzte König Fernando VII. ab. Damit fehlte plötzlich die Legitimität – in wessen Namen sollten die Kolonien regiert werden?",
        "Die Antwort der criollos: 1810 bildeten sie eigene Regierungsräte (juntas) – in Caracas, Buenos Aires, Bogotá und Santiago. Offiziell „bis zur Rückkehr des Königs“, in Wahrheit der erste Schritt in die Unabhängigkeit.",
      ],
      bodyEn: [
        "As early as 1780, Túpac Amaru II, a descendant of the Inca, rose up in the Peruvian highlands against exploitation – a massive indigenous revolt, brutally crushed but never forgotten. At the same time, the ideas of the Enlightenment and the example of the American and French Revolutions seeped into the land.",
        "The decisive push came from Europe itself: in 1808 Napoleon occupied Spain and deposed King Ferdinand VII. Suddenly legitimacy was gone – in whose name were the colonies to be governed?",
        "The criollos' answer: in 1810 they formed their own governing councils (juntas) – in Caracas, Buenos Aires, Bogotá and Santiago. Officially \"until the king returns\", but in truth the first step towards independence.",
      ],
      points: [
        "1780: Aufstand des Túpac Amaru II. in Peru",
        "1808: Napoleon besetzt Spanien – Machtvakuum",
        "1810: die ersten Junten von Caracas bis Santiago",
      ],
      pointsEn: [
        "1780: revolt of Túpac Amaru II in Peru",
        "1808: Napoleon occupies Spain – a power vacuum",
        "1810: the first juntas from Caracas to Santiago",
      ],
      img: "Túpac Amaru II.JPG",
      imgCaption: "Túpac Amaru II. – früher Aufstand gegen die Kolonialmacht",
      imgCaptionEn: "Túpac Amaru II – an early revolt against colonial power",
    },
    {
      id: "independencia",
      icon: "🗡️",
      period: "1810–1825",
      title: "Der Freiheitskampf – Bolívar & San Martín",
      titleEn: "The fight for freedom – Bolívar & San Martín",
      lead: "Zwei große Befreiungszüge – aus dem Norden und dem Süden – trafen sich in der Mitte.",
      leadEn: "Two great campaigns of liberation – from the north and the south – met in the middle.",
      body: [
        "Aus dem Norden kämpfte Simón Bolívar, „El Libertador“. Nach Jahren der Niederlagen gelang ihm 1819 ein kühner Marsch über die eisigen Anden und der Sieg bei Boyacá – Kolumbien war frei. 1821 entschied Carabobo Venezuela, 1822 Pichincha Ecuador.",
        "Aus dem Süden zog José de San Martín. Argentinien hatte sich 1816 in Tucumán für unabhängig erklärt. San Martín überquerte mit seiner Armee die Anden, befreite 1818 mit Bernardo O'Higgins Chile (Schlacht von Maipú) und landete 1821 in Peru, wo er die Unabhängigkeit ausrief.",
        "1822 trafen sich die beiden Befreier in Guayaquil. Was genau besprochen wurde, ist bis heute ein Rätsel – doch San Martín zog sich danach zurück und überließ Bolívar das Feld. Dessen General Antonio José de Sucre besiegte 1824 bei Ayacucho die letzte große spanische Armee. 1825 war ganz Südamerika frei; das neue Land Bolivien trug Bolívars Namen.",
      ],
      bodyEn: [
        "From the north fought Simón Bolívar, \"El Libertador\". After years of defeats, in 1819 he pulled off a daring march across the icy Andes and won at Boyacá – Colombia was free. In 1821 Carabobo decided Venezuela, in 1822 Pichincha decided Ecuador.",
        "From the south came José de San Martín. Argentina had declared independence at Tucumán in 1816. San Martín led his army across the Andes, liberated Chile with Bernardo O'Higgins in 1818 (Battle of Maipú) and landed in Peru in 1821, where he proclaimed independence.",
        "In 1822 the two liberators met in Guayaquil. Exactly what was said remains a mystery to this day – but San Martín then withdrew and left the field to Bolívar. Bolívar's general Antonio José de Sucre defeated the last great Spanish army at Ayacucho in 1824. By 1825 all of South America was free; the new country of Bolivia bore Bolívar's name.",
      ],
      points: [
        "1819 Boyacá · 1821 Carabobo · 1822 Pichincha · 1824 Ayacucho",
        "San Martín & Bolívar trafen sich 1822 in Guayaquil",
        "1825: Bolivien entsteht – benannt nach Bolívar",
      ],
      pointsEn: [
        "1819 Boyacá · 1821 Carabobo · 1822 Pichincha · 1824 Ayacucho",
        "San Martín & Bolívar met in Guayaquil in 1822",
        "1825: Bolivia is founded – named after Bolívar",
      ],
      img: "Batalla de Ayacucho by Martín Tovar y Tovar (1827 - 1902).jpg",
      imgCaption: "Schlacht von Ayacucho 1824 – das Ende der Kolonialherrschaft",
      imgCaptionEn: "Battle of Ayacucho 1824 – the end of colonial rule",
    },
    {
      id: "naciones",
      icon: "🗺️",
      period: "1819–1860",
      title: "Die Abspaltung – vom Traum zu vielen Nationen",
      titleEn: "The break-up – from one dream to many nations",
      lead: "Bolívars Vision eines geeinten Südamerika zerbrach an Entfernungen und Rivalitäten.",
      leadEn: "Bolívar's vision of a united South America shattered on distance and rivalry.",
      body: [
        "Bolívar träumte von einem großen, geeinten Staat. Aus dem Norden formte er Gran Colombia – das heutige Venezuela, Kolumbien, Ecuador und Panama in einem Land. Doch das Reich war riesig, die Regionen eigensinnig, und lokale Anführer (caudillos) wollten selbst herrschen.",
        "Schon 1830 zerfiel Gran Colombia in Venezuela, Kolumbien und Ecuador. Im selben Jahr starb Bolívar verbittert und mittellos. Sein berühmter Satz: „Wer einer Revolution dient, pflügt im Meer.“ Auch im Süden splitterten die Vereinigten Provinzen des Río de la Plata in Argentinien, Uruguay, Paraguay und Bolivien.",
        "Brasilien ging einen ganz eigenen Weg: portugiesisch statt spanisch, und zunächst ein Kaiserreich statt einer Republik. Überall folgten Jahrzehnte der Bürgerkriege zwischen Zentralisten und Föderalisten – die Landkarte Südamerikas, wie wir sie heute kennen, war geboren.",
      ],
      bodyEn: [
        "Bolívar dreamed of one great, united state. In the north he forged Gran Colombia – today's Venezuela, Colombia, Ecuador and Panama in a single country. But the realm was vast, the regions headstrong, and local strongmen (caudillos) wanted to rule themselves.",
        "By 1830 Gran Colombia had already broken apart into Venezuela, Colombia and Ecuador. That same year Bolívar died, bitter and penniless. His famous line: \"He who serves a revolution ploughs the sea.\" In the south, too, the United Provinces of the Río de la Plata splintered into Argentina, Uruguay, Paraguay and Bolivia.",
        "Brazil took an entirely separate path: Portuguese rather than Spanish, and at first an empire rather than a republic. Everywhere there followed decades of civil war between centralists and federalists – and the map of South America as we know it today was born.",
      ],
      points: [
        "Gran Colombia: Venezuela + Kolumbien + Ecuador + Panama",
        "1830: Zerfall – und Bolívars Tod",
        "Brasilien blieb portugiesisch und war erst ein Kaiserreich",
      ],
      pointsEn: [
        "Gran Colombia: Venezuela + Colombia + Ecuador + Panama",
        "1830: the break-up – and Bolívar's death",
        "Brazil stayed Portuguese and was at first an empire",
      ],
      img: "Gran Colombia in 1824.svg",
      imgCaption: "Gran Colombia 1824 – Bolívars Traum von der Einheit",
      imgCaptionEn: "Gran Colombia in 1824 – Bolívar's dream of unity",
    },
    {
      id: "moderno",
      icon: "⏳",
      period: "1860–heute",
      periodEn: "1860–today",
      title: "Bis heute – Kriege, Diktaturen, Demokratie",
      titleEn: "Up to today – wars, dictatorships, democracy",
      lead: "Grenzkriege, ein dunkles Jahrhundert der Militärregime – und die Rückkehr der Demokratie.",
      leadEn: "Border wars, a dark century of military regimes – and the return of democracy.",
      body: [
        "Die jungen Staaten stritten um Grenzen. Im Salpeterkrieg (1879–1883) verlor Bolivien seinen Zugang zum Meer an Chile – ein Trauma bis heute. Im Krieg der Tripel-Allianz (1864–1870) wurde Paraguay verheert und verlor einen großen Teil seiner Bevölkerung.",
        "Das 20. Jahrhundert brachte Populismus (etwa Juan Perón in Argentinien) und im Kalten Krieg eine Welle von Militärdiktaturen: Chile unter Pinochet ab 1973, die argentinische Junta mit ihren „Verschwundenen“, dazu Brasilien, Uruguay und andere – grenzüberschreitend vernetzt in der „Operación Cóndor“.",
        "In den 1980er- und 90er-Jahren kehrten fast überall Demokratie und Wahlen zurück. Heute ist Südamerika ein Kontinent demokratischer Republiken – mit lebendiger Kultur und großem Reichtum, aber auch mit Ungleichheit, Korruption und politischen Erschütterungen, die bis in die Gegenwart reichen.",
      ],
      bodyEn: [
        "The young states fought over borders. In the War of the Pacific (1879–1883) Bolivia lost its access to the sea to Chile – a trauma to this day. In the War of the Triple Alliance (1864–1870) Paraguay was devastated and lost a huge share of its population.",
        "The 20th century brought populism (such as Juan Perón in Argentina) and, during the Cold War, a wave of military dictatorships: Chile under Pinochet from 1973, the Argentine junta with its \"disappeared\", along with Brazil, Uruguay and others – networked across borders in \"Operation Condor\".",
        "In the 1980s and 90s, democracy and elections returned almost everywhere. Today South America is a continent of democratic republics – with vibrant culture and great wealth, but also with inequality, corruption and political upheavals that reach into the present.",
      ],
      points: [
        "1879–83 Salpeterkrieg: Bolivien verliert die Küste",
        "1973–1990: Militärdiktaturen & „Operación Cóndor“",
        "Ab ~1985: Rückkehr zu Demokratie und Wahlen",
      ],
      pointsEn: [
        "1879–83 War of the Pacific: Bolivia loses its coast",
        "1973–1990: military dictatorships & \"Operation Condor\"",
        "From ~1985: a return to democracy and elections",
      ],
      img: "",
      imgCaption: "",
    },
  ];

  // ---------- Die Protagonisten (Galerie) ----------
  const FIGURES = [
    {
      id: "bolivar",
      name: "Simón Bolívar",
      role: "„El Libertador“ – befreite sechs Länder",
      roleEn: "\"El Libertador\" – liberated six countries",
      years: "1783–1830",
      flag: "🇻🇪",
      img: "Bolivar Arturo Michelena.jpg",
      text: "Der wohl größte Name des Kontinents. Der reiche criollo aus Caracas führte den Freiheitskampf im Norden, befreite das heutige Venezuela, Kolumbien, Ecuador, Peru und Bolivien und träumte von einem geeinten Südamerika. Er starb desillusioniert, als sein Traum zerbrach – heute ehren ihn gleich mehrere Länder als Nationalhelden.",
      textEn: "Probably the greatest name on the continent. The wealthy criollo from Caracas led the fight for freedom in the north, liberated today's Venezuela, Colombia, Ecuador, Peru and Bolivia, and dreamed of a united South America. He died disillusioned as his dream fell apart – today several countries honour him as a national hero.",
      quote: "„Die Kunst des Siegens lernt man in Niederlagen.“",
      quoteEn: "\"The art of victory is learned in defeat.\"",
    },
    {
      id: "sanmartin",
      name: "José de San Martín",
      role: "Befreier des Südens",
      roleEn: "Liberator of the south",
      years: "1778–1850",
      flag: "🇦🇷",
      img: "José de San Martín (retrato, c.1828).jpg",
      text: "Der nüchterne Stratege des Südens. Er machte Argentinien frei, überquerte mit einer ganzen Armee die Anden, befreite Chile und Peru. Nach dem geheimnisvollen Treffen mit Bolívar in Guayaquil 1822 trat er freiwillig zurück, um einen Machtkampf zu vermeiden, und ging ins Exil nach Frankreich – ein seltener Fall von Verzicht aus Staatsräson.",
      textEn: "The sober strategist of the south. He freed Argentina, crossed the Andes with an entire army, and liberated Chile and Peru. After the mysterious meeting with Bolívar in Guayaquil in 1822, he voluntarily stepped down to avoid a power struggle and went into exile in France – a rare case of renunciation for reasons of state.",
      quote: "„Du wirst sein, was du sein musst, oder du wirst nichts sein.“",
      quoteEn: "\"You shall be what you must be, or you shall be nothing.\"",
    },
    {
      id: "sucre",
      name: "Antonio José de Sucre",
      role: "Der Sieger von Ayacucho",
      roleEn: "The victor of Ayacucho",
      years: "1795–1830",
      flag: "🇧🇴",
      img: "Jose Antonio de Sucre.JPG",
      text: "Bolívars genialer junger General. In der Schlacht von Ayacucho 1824 zerschlug er die letzte große spanische Armee und besiegelte damit die Unabhängigkeit ganz Südamerikas. Als Präsident regierte er das neue Bolivien, dessen Hauptstadt Sucre bis heute seinen Namen trägt. Mit nur 35 Jahren wurde er aus dem Hinterhalt ermordet.",
      textEn: "Bolívar's brilliant young general. At the Battle of Ayacucho in 1824 he smashed the last great Spanish army and thereby sealed the independence of all South America. As president he governed the new Bolivia, whose capital Sucre still bears his name today. At just 35 he was assassinated in an ambush.",
      quote: "",
      quoteEn: "",
    },
    {
      id: "ohiggins",
      name: "Bernardo O'Higgins",
      role: "Vater des unabhängigen Chile",
      roleEn: "Father of independent Chile",
      years: "1778–1842",
      flag: "🇨🇱",
      img: "Retrato de Don Bernardo O'Higgins (José Gil de Castro, 1820).jpg",
      text: "Sohn eines irischstämmigen Vizekönigs, wurde er zum Helden Chiles. Gemeinsam mit San Martín gewann er die Schlacht von Maipú 1818 und führte Chile in die Unabhängigkeit. Als erster Regierungschef („Director Supremo“) modernisierte er das Land – musste aber bald ins Exil nach Peru, wo er starb.",
      textEn: "Son of a viceroy of Irish descent, he became the hero of Chile. Together with San Martín he won the Battle of Maipú in 1818 and led Chile to independence. As the first head of government (\"Supreme Director\") he modernised the country – but soon had to go into exile in Peru, where he died.",
      quote: "",
      quoteEn: "",
    },
    {
      id: "manuela",
      name: "Manuela Sáenz",
      role: "„Libertadora del Libertador“",
      roleEn: "\"Liberator of the Liberator\"",
      years: "1797–1856",
      flag: "🇪🇨",
      img: "Manuela Saenz 1825.jpg",
      text: "Revolutionärin, Spionin und Bolívars Gefährtin. Sie rettete ihm 1828 in Bogotá das Leben, indem sie einen Mordanschlag vereitelte – daher ihr Beiname. Lange als bloße Geliebte abgetan, gilt sie heute als eigenständige Heldin der Unabhängigkeit und Ikone für die Rolle der Frauen im Freiheitskampf.",
      textEn: "Revolutionary, spy and Bolívar's companion. She saved his life in Bogotá in 1828 by foiling an assassination attempt – hence her nickname. Long dismissed as a mere lover, she is today regarded as an independence heroine in her own right and an icon for the role of women in the struggle for freedom.",
      quote: "",
      quoteEn: "",
    },
    {
      id: "atahualpa",
      name: "Atahualpa",
      role: "Der letzte Herrscher der Inka",
      roleEn: "The last Inca ruler",
      years: "≈1500–1533",
      flag: "🇵🇪",
      img: "Brooklyn Museum - Atahualpa, Fourteenth Inca, 1 of 14 Portraits of Inca Kings - overall.jpg",
      text: "Hatte gerade einen Bürgerkrieg um den Inka-Thron gewonnen, als die Spanier kamen. In Cajamarca von Pizarro überrumpelt und gefangen genommen, füllte er einen ganzen Raum mit Gold als Lösegeld – und wurde dennoch hingerichtet. Sein Sturz steht für das jähe Ende einer ganzen Welt.",
      textEn: "He had just won a civil war for the Inca throne when the Spanish arrived. Ambushed and captured by Pizarro at Cajamarca, he filled an entire room with gold as ransom – and was executed anyway. His downfall stands for the abrupt end of a whole world.",
      quote: "",
      quoteEn: "",
    },
  ];

  // ---------- Heute: Lage & Spannungen ----------
  const TENSIONS = [
    {
      id: "venezuela",
      icon: "🇻🇪",
      title: "Venezuela: Krise & Massenflucht",
      titleEn: "Venezuela: crisis & mass exodus",
      where: "Venezuela → ganz Lateinamerika",
      whereEn: "Venezuela → all of Latin America",
      tone: "crisis",
      status: "Krise",
      statusEn: "Crisis",
      text: "Das ölreichste Land der Welt steckt in einem wirtschaftlichen und politischen Kollaps. Unter Hugo Chávez und seinem Nachfolger Nicolás Maduro brachen Wirtschaft und Versorgung zusammen; nach der umstrittenen Wahl 2024 hält Maduro trotz breiter Zweifel an der Macht fest. Rund 8 Millionen Venezolaner sind geflohen – die größte Fluchtbewegung der Region.",
      textEn: "The most oil-rich country in the world is mired in economic and political collapse. Under Hugo Chávez and his successor Nicolás Maduro, the economy and basic supplies broke down; after the disputed 2024 election Maduro is clinging to power despite widespread doubts. Around 8 million Venezuelans have fled – the largest displacement in the region.",
    },
    {
      id: "essequibo",
      icon: "🛢️",
      title: "Essequibo: Grenzstreit mit Guyana",
      titleEn: "Essequibo: border dispute with Guyana",
      where: "Venezuela ↔ Guyana",
      whereEn: "Venezuela ↔ Guyana",
      tone: "tense",
      status: "Spannung",
      statusEn: "Tension",
      text: "Seit riesige Ölfunde das kleine Guyana reich machen, beansprucht Venezuela wieder lautstark die Region Essequibo – zwei Drittel des Nachbarlandes. 2023 ließ Maduro darüber abstimmen und drohte mit Annexion. Der Internationale Gerichtshof mahnt zur Ruhe; die Lage bleibt einer der heißesten Grenzkonflikte des Kontinents.",
      textEn: "Ever since huge oil discoveries made tiny Guyana rich, Venezuela has again loudly claimed the Essequibo region – two thirds of its neighbour. In 2023 Maduro held a vote on it and threatened annexation. The International Court of Justice urges calm; the situation remains one of the hottest border conflicts on the continent.",
    },
    {
      id: "salida-al-mar",
      icon: "🌊",
      title: "Bolivien ohne Meer",
      titleEn: "Bolivia without a coast",
      where: "Bolivien ↔ Chile",
      whereEn: "Bolivia ↔ Chile",
      tone: "tense",
      status: "Altlast",
      statusEn: "Old wound",
      text: "Im Salpeterkrieg (1879–1883) verlor Bolivien seine Pazifikküste an Chile und ist seither ein Binnenland. Die „salida al mar“, die Rückkehr zum Meer, ist bis heute nationale Herzensangelegenheit. 2018 wies der Internationale Gerichtshof Boliviens Klage ab – Chile muss nicht verhandeln. Das Thema vergiftet die Beziehung weiter.",
      textEn: "In the War of the Pacific (1879–1883) Bolivia lost its Pacific coast to Chile and has been landlocked ever since. The \"salida al mar\", the return to the sea, remains a deeply emotional national cause. In 2018 the International Court of Justice rejected Bolivia's claim – Chile is not obliged to negotiate. The issue keeps poisoning the relationship.",
    },
    {
      id: "colombia-paz",
      icon: "🕊️",
      title: "Kolumbien: ein fragiler Frieden",
      titleEn: "Colombia: a fragile peace",
      where: "Kolumbien",
      whereEn: "Colombia",
      tone: "shift",
      status: "Wandel",
      statusEn: "In flux",
      text: "2016 beendete ein historisches Friedensabkommen den über 50 Jahre währenden Krieg mit der FARC-Guerilla – ein Erfolg, der mit dem Friedensnobelpreis geehrt wurde. Doch abtrünnige Gruppen, die ELN und Drogenkartelle bleiben aktiv. Unter Präsident Gustavo Petro, dem ersten linken Staatschef des Landes, ringt Kolumbien um eine „paz total“, einen vollständigen Frieden.",
      textEn: "In 2016 a historic peace deal ended the more than 50-year war with the FARC guerrillas – a success honoured with the Nobel Peace Prize. But splinter groups, the ELN and drug cartels remain active. Under President Gustavo Petro, the country's first left-wing leader, Colombia is striving for a \"paz total\", a complete peace.",
    },
    {
      id: "peru-politica",
      icon: "🏛️",
      title: "Peru: politische Dauerkrise",
      titleEn: "Peru: permanent political crisis",
      where: "Peru",
      whereEn: "Peru",
      tone: "tense",
      status: "Instabil",
      statusEn: "Unstable",
      text: "Kaum ein Land wechselt seine Präsidenten so schnell: Allein zwischen 2016 und 2023 erlebte Peru rund ein halbes Dutzend Staatschefs, Amtsenthebungen und Skandale. 2022 wurde Präsident Pedro Castillo nach einem Selbstputsch-Versuch abgesetzt und verhaftet; die folgenden Proteste forderten Dutzende Tote. Das Vertrauen in die Politik ist tief erschüttert.",
      textEn: "Few countries change presidents so quickly: between 2016 and 2023 alone, Peru went through roughly half a dozen heads of state, impeachments and scandals. In 2022 President Pedro Castillo was removed and arrested after an attempted self-coup; the protests that followed cost dozens of lives. Trust in politics is deeply shaken.",
    },
    {
      id: "argentina-economia",
      icon: "💸",
      title: "Argentinien: Inflation & Kurswechsel",
      titleEn: "Argentina: inflation & a sharp turn",
      where: "Argentinien",
      whereEn: "Argentina",
      tone: "shift",
      status: "Wandel",
      statusEn: "In flux",
      text: "Einst eines der reichsten Länder der Welt, kämpft Argentinien seit Jahrzehnten mit Staatspleiten und galoppierender Inflation. 2023 wählte das Land den radikalen Liberalen Javier Milei, der mit drastischen Sparmaßnahmen („la motosierra“, die Kettensäge) das Defizit bekämpft. Ob die schmerzhafte Schocktherapie aufgeht, entscheidet sich gerade.",
      textEn: "Once one of the richest countries in the world, Argentina has struggled for decades with debt defaults and runaway inflation. In 2023 the country elected the radical libertarian Javier Milei, who is fighting the deficit with drastic austerity (\"la motosierra\", the chainsaw). Whether the painful shock therapy works is being decided right now.",
    },
    {
      id: "amazonia",
      icon: "🌳",
      title: "Amazonas & indigene Rechte",
      titleEn: "The Amazon & indigenous rights",
      where: "Brasilien, Peru, Bolivien, Ecuador …",
      whereEn: "Brazil, Peru, Bolivia, Ecuador …",
      tone: "shift",
      status: "Wandel",
      statusEn: "In flux",
      text: "Der Amazonas-Regenwald – die „grüne Lunge“ und Heimat hunderter indigener Völker – steht unter Druck durch Abholzung, Goldsuche und Viehzucht. Zugleich erkämpfen sich indigene Bewegungen mehr Mitsprache, Landrechte und politische Sichtbarkeit. Klimaschutz und Entwicklung gegeneinander auszubalancieren ist eine der großen Zukunftsfragen des Kontinents.",
      textEn: "The Amazon rainforest – the \"green lung\" and home to hundreds of indigenous peoples – is under pressure from deforestation, gold mining and cattle ranching. At the same time, indigenous movements are winning more of a voice, land rights and political visibility. Balancing climate protection against development is one of the continent's great questions for the future.",
    },
    {
      id: "migracion",
      icon: "🚶",
      title: "Migration & der Darién",
      titleEn: "Migration & the Darién Gap",
      where: "Kolumbien ↔ Panama (Richtung Norden)",
      whereEn: "Colombia ↔ Panama (heading north)",
      tone: "crisis",
      status: "Krise",
      statusEn: "Crisis",
      text: "Hunderttausende Menschen – viele aus Venezuela – ziehen Richtung Norden und durchqueren dabei den Darién-Dschungel zwischen Kolumbien und Panama, eine der gefährlichsten Migrationsrouten der Welt. Die Wanderungsbewegungen belasten die Aufnahmeländer und prägen die Politik von Santiago bis an die US-Grenze.",
      textEn: "Hundreds of thousands of people – many from Venezuela – are moving north, crossing the Darién jungle between Colombia and Panama, one of the most dangerous migration routes in the world. These movements strain the receiving countries and shape politics from Santiago all the way to the US border.",
    },
  ];

  // ---------- ¿Sabías que…? (kurze Häppchen) ----------
  const FACTS = [
    {
      de: "Bolivien und Kolumbien sind nach Menschen benannt: nach Bolívar und Christoph Kolumbus.",
      en: "Bolivia and Colombia are named after people: after Bolívar and Christopher Columbus.",
    },
    {
      de: "San Martíns Marsch über die Anden wird oft mit Hannibals Alpenüberquerung verglichen.",
      en: "San Martín's march across the Andes is often compared to Hannibal crossing the Alps.",
    },
    {
      de: "Quechua, die Sprache der Inka, ist bis heute in mehreren Ländern Amtssprache.",
      en: "Quechua, the language of the Inca, is still an official language in several countries today.",
    },
    {
      de: "Das Silber aus Potosí finanzierte über zwei Jahrhunderte das spanische Weltreich.",
      en: "The silver from Potosí financed the Spanish world empire for over two centuries.",
    },
    {
      de: "Brasilien spricht Portugiesisch und war bis 1889 ein Kaiserreich – ein Sonderweg in Südamerika.",
      en: "Brazil speaks Portuguese and was an empire until 1889 – a path all its own in South America.",
    },
    {
      de: "Bolívar und San Martín trafen sich nur ein einziges Mal: 1822 in Guayaquil, hinter verschlossenen Türen.",
      en: "Bolívar and San Martín met only once: in Guayaquil in 1822, behind closed doors.",
    },
  ];

  window.SC.historia = { INTRO, ERAS, FIGURES, TENSIONS, FACTS };
})();
