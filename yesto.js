/*
 * yesto.js  (SC.yesto) – „¿Y esto?“: Bild-Vokabel-Modus mit Countdown-Auflösung.
 *
 * Inspiriert vom TikTok-Format „¿Y esto?“: ein Motiv erscheint groß, ein kurzer
 * 3-2-1-Countdown läuft – „Wie heißt das auf Spanisch?“ – dann wird das spanische
 * Wort samt Übersetzung aufgelöst. Statt Fotos (HolaRuta bleibt zero-dependency &
 * offline) trägt ein großes Emoji das Motiv, genau im Stil der übrigen Module.
 *
 * REINE DATEN + REINE FUNKTIONEN, kein Browser/DOM nötig (Tests laden es per
 * window-Shim, wie conjug.js/numbers.js). Logik (Countdown, Screens) lebt in
 * app.js/ui.js; hier nur das kuratierte Wortmaterial und der Runden-Aufbau.
 *
 * Ein Thema:  { id, icon, label, labelEn, items:[ { emoji, es, de, en } ] }
 *   es = spanisches Wort MIT Artikel (lehrt nebenbei das Genus, z. B. „la carne“)
 *   de/en = Übersetzung (nativeText wählt die aktive Sprache)
 *
 * Ein Runden-Item ist genau ein solches { emoji, es, de, en }.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // Jedes Thema hat ≥ 8 bildhafte Nomen, damit eine volle Runde (YESTO_ROUND)
  // ohne Wiederholung gefüllt werden kann. Artikel sind reisetauglich-LatAm
  // (z. B. „el boleto“ statt „el billete“).
  const THEMES = [
    {
      id: "comida", icon: "🍽️", label: "Comida", labelEn: "Food",
      items: [
        { emoji: "🍗", es: "el pollo", de: "das Hähnchen", en: "chicken" },
        { emoji: "🥩", es: "la carne", de: "das Fleisch", en: "meat" },
        { emoji: "🐟", es: "el pescado", de: "der Fisch", en: "fish" },
        { emoji: "🍚", es: "el arroz", de: "der Reis", en: "rice" },
        { emoji: "🍞", es: "el pan", de: "das Brot", en: "bread" },
        { emoji: "🧀", es: "el queso", de: "der Käse", en: "cheese" },
        { emoji: "🥚", es: "el huevo", de: "das Ei", en: "egg" },
        { emoji: "🍎", es: "la manzana", de: "der Apfel", en: "apple" },
        { emoji: "🍌", es: "el plátano", de: "die Banane", en: "banana" },
        { emoji: "🥑", es: "el aguacate", de: "die Avocado", en: "avocado" },
      ],
    },
    {
      id: "bebidas", icon: "🥤", label: "Bebidas", labelEn: "Drinks",
      items: [
        { emoji: "💧", es: "el agua", de: "das Wasser", en: "water" },
        { emoji: "☕", es: "el café", de: "der Kaffee", en: "coffee" },
        { emoji: "🍺", es: "la cerveza", de: "das Bier", en: "beer" },
        { emoji: "🍷", es: "el vino", de: "der Wein", en: "wine" },
        { emoji: "🥛", es: "la leche", de: "die Milch", en: "milk" },
        { emoji: "🧃", es: "el jugo", de: "der Saft", en: "juice" },
        { emoji: "🍵", es: "el té", de: "der Tee", en: "tea" },
        { emoji: "🧉", es: "el mate", de: "der Mate", en: "mate" },
      ],
    },
    {
      id: "animales", icon: "🐾", label: "Animales", labelEn: "Animals",
      items: [
        { emoji: "🐶", es: "el perro", de: "der Hund", en: "dog" },
        { emoji: "🐱", es: "el gato", de: "die Katze", en: "cat" },
        { emoji: "🐴", es: "el caballo", de: "das Pferd", en: "horse" },
        { emoji: "🐮", es: "la vaca", de: "die Kuh", en: "cow" },
        { emoji: "🐦", es: "el pájaro", de: "der Vogel", en: "bird" },
        { emoji: "🐒", es: "el mono", de: "der Affe", en: "monkey" },
        { emoji: "🐍", es: "la serpiente", de: "die Schlange", en: "snake" },
        { emoji: "🦙", es: "la llama", de: "das Lama", en: "llama" },
        { emoji: "🐢", es: "la tortuga", de: "die Schildkröte", en: "turtle" },
      ],
    },
    {
      id: "viaje", icon: "🧳", label: "De viaje", labelEn: "Travel gear",
      items: [
        { emoji: "🧳", es: "la maleta", de: "der Koffer", en: "suitcase" },
        { emoji: "🎒", es: "la mochila", de: "der Rucksack", en: "backpack" },
        { emoji: "🛂", es: "el pasaporte", de: "der Reisepass", en: "passport" },
        { emoji: "🔑", es: "la llave", de: "der Schlüssel", en: "key" },
        { emoji: "🗺️", es: "el mapa", de: "die Karte", en: "map" },
        { emoji: "🎫", es: "el boleto", de: "das Ticket", en: "ticket" },
        { emoji: "📷", es: "la cámara", de: "die Kamera", en: "camera" },
        { emoji: "🕶️", es: "las gafas de sol", de: "die Sonnenbrille", en: "sunglasses" },
      ],
    },
    {
      id: "naturaleza", icon: "🌴", label: "Naturaleza", labelEn: "Nature",
      items: [
        { emoji: "☀️", es: "el sol", de: "die Sonne", en: "sun" },
        { emoji: "🌙", es: "la luna", de: "der Mond", en: "moon" },
        { emoji: "🏖️", es: "la playa", de: "der Strand", en: "beach" },
        { emoji: "⛰️", es: "la montaña", de: "der Berg", en: "mountain" },
        { emoji: "🌳", es: "el árbol", de: "der Baum", en: "tree" },
        { emoji: "🌺", es: "la flor", de: "die Blume", en: "flower" },
        { emoji: "🌊", es: "el mar", de: "das Meer", en: "sea" },
        { emoji: "🌧️", es: "la lluvia", de: "der Regen", en: "rain" },
      ],
    },
    {
      id: "casa", icon: "🏠", label: "En casa", labelEn: "At home",
      items: [
        { emoji: "🛏️", es: "la cama", de: "das Bett", en: "bed" },
        { emoji: "🪑", es: "la silla", de: "der Stuhl", en: "chair" },
        { emoji: "🛋️", es: "el sofá", de: "das Sofa", en: "sofa" },
        { emoji: "🚪", es: "la puerta", de: "die Tür", en: "door" },
        { emoji: "🪟", es: "la ventana", de: "das Fenster", en: "window" },
        { emoji: "📱", es: "el teléfono", de: "das Telefon", en: "phone" },
        { emoji: "📖", es: "el libro", de: "das Buch", en: "book" },
        { emoji: "⏰", es: "el reloj", de: "die Uhr", en: "clock" },
      ],
    },
  ];

  // Fisher-Yates auf einer Kopie (rein, ohne die Quelle zu verändern).
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function themeById(id) {
    return THEMES.find((t) => t.id === id) || null;
  }

  // Leichte Themenliste für den Auswahl-Screen (ohne die items mitzuschleppen).
  function themeList() {
    return THEMES.map((t) => ({ id: t.id, icon: t.icon, label: t.label, labelEn: t.labelEn, count: t.items.length }));
  }

  // Eine Runde: bis zu count Motive eines Themas, gemischt, OHNE Wiederholung
  // (jedes Thema hat genug Motive). Unbekanntes/leeres Thema -> leere Runde.
  function buildRound(themeId, count) {
    const t = themeById(themeId);
    if (!t || !t.items.length) return [];
    const n = Math.max(1, Number(count) || t.items.length);
    return shuffle(t.items).slice(0, Math.min(n, t.items.length));
  }

  window.SC.yesto = { THEMES, themeList, themeById, buildRound, shuffle };
})();
