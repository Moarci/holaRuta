/*
 * i18n.strings.es.js  – Spanische UI-Strings (Muttersprache des Locals-Tracks).
 *
 * Trägt NACH i18n.strings.js die spanischen Bereiche bei – über
 * SC.i18n.registerLang("es", "bereich", {…}), damit die große de/en-Datei
 * unangetastet bleibt. Bewusst auf die KERN-Oberfläche fokussiert (geteilte
 * Buttons/Labels, Lern-Sitzung, Startseiten-Reiter); nicht übersetzte Schlüssel
 * fallen über die Kette es→en→de zurück (i18n.js → t()).
 *
 * Wichtig für den Locals-Track (Spanisch lernt Englisch): die „input"-Hinweise der
 * Schreib-/Hör-Modi heißen hier korrekt „en español" (Muttersprache) bzw.
 * „en inglés" (Lernsprache) – das Pendant zur Reise-Datei, nur gespiegelt.
 */
(function () {
  "use strict";
  var i18n = window.SC && window.SC.i18n;
  if (!i18n || !i18n.registerLang) return;
  var reg = function (area, obj) { i18n.registerLang("es", area, obj); };

  // ---------- common: geteilte Buttons, Labels, Toasts ----------
  reg("common", {
    dueNow: "pendiente",
    today: "hoy",
    tomorrow: "mañana",
    inNDays: function (p) { return "en " + p.n + " días"; },
    dayStreak: function (p) { return p.n + " " + (p.n === 1 ? "día" : "días"); },
    askHave: "¿Tiene esto?",
    askFind: "¿Dónde encuentro esto?",
    back: "Atrás",
    check: "Comprobar",
    next: "Siguiente",
    showResult: "Ver resultado",
    delete: "Eliminar",
    close: "Cerrar",
    share: "Compartir",
    shareImage: "Compartir como imagen",
    shareProgress: "Compartir progreso",
    cardWord: "Tarjeta",
    cardNotFound: "Tarjeta no encontrada.",
    imageFormat: "Formato de imagen",
    themeLight: "Activar modo claro",
    themeDark: "Activar modo oscuro",
    themeLightTitle: "Modo claro",
    themeDarkTitle: "Modo oscuro 🌙",
    themeCap: "Apariencia",
    themeAmTitle: "Buenos días",
    themeAmText: "Modo claro. El día apenas comienza.",
    themePmTitle: "Buenas noches",
    themePmText: "Modo oscuro. La jornada terminó, el día puede descansar.",
    themeAmDrink: function (p) { return "Modo claro. " + p.drink + " para empezar el día."; },
    themePmDrink: function (p) { return "Modo oscuro. " + p.drink + ", la noche es tuya."; },
    correct: "✓ ¡Correcto!",
    listenAgain: "🔊 Escuchar otra vez",
    listen: "Escuchar",
    // zweiter common-Block
    backShort: "Atrás",
    overview: "Volver al resumen",
    statsView: "📊 Ver estadísticas",
    deleteTitle: "Eliminar",
    cancel: "Cancelar",
    progress: "Progreso",
    notQuiteInput: function (p) { return "✗ Casi – escribiste: «" + p.input + "»"; },
    correctShort: "✓ ¡Correcto!",
    correctHeard: "✓ ¡Bien escuchado!",
  });

  // ---------- study: la sesión de aprendizaje (la pantalla más usada) ----------
  reg("study", {
    studyProgress: "Progreso de aprendizaje",
    cardBack: "La tarjeta está volteada",
    cardFlip: "Voltear la tarjeta",
    flipHint: "Toca o desliza ↑ para voltear 🔄",
    skip: "Saltar",
    skipLabel: "Saltar esta tarjeta",
    speakAnswer: "Escuchar la respuesta",
    contextShow: "Mostrar el contexto",
    contextTitle: "🧭 Cómo usarlo en el trabajo",
    contextSituation: "Situación",
    contextNote: "Consejo",
    contextHide: "🧭 Ocultar contexto",
    context: "🧭 Contexto",
    // Locals: la respuesta nativa es español, la aprendida es inglés.
    inputDe: "Escribe tu respuesta en español",
    inputEs: "Escribe tu respuesta en inglés",
    placeholderDe: "Escribe la respuesta en español …",
    placeholderEs: "Escribe la respuesta en inglés …",
    listenHint: "Escucha y escribe en inglés lo que oyes",
    listenPlaceholder: "Escribe lo que oíste …",
    ratePromptDe: "¿Qué tan bien te salió?",
    rateAgainLabel: "Otra vez – practicar de nuevo",
    rateGoodLabel: "Bien – salió bastante bien",
    rateEasyLabel: "¡Fácil! – sin esfuerzo",
    shareCard: "Compartir",
    shareCardLabel: "Compartir esta tarjeta como imagen",
    favSave: "Guardar",
    favSaved: "Guardado",
    backPretrip: "Volver al plan",
    backTask: "Volver a la tarea",
    backFavorites: "Volver a Mi léxico",
  });

  // ---------- home: pestañas y etiquetas de la pantalla de inicio ----------
  reg("home", {
    tabsAreas: "Áreas",
    tabStart: "Inicio",
    tabLearn: "Aprender",
    tabDiscover: "Descubrir",
    tabTask: "Tarea",
    tabProfile: "Perfil",
    tileDue: function (p) { return p.n + " pendientes"; },
    tileDone: "hecho",
    tileCards: function (p) { return p.n + " tarjetas"; },
    sectionTopics: "Temas",
    catGroupLocals: "Inglés para el trabajo",
    topicNavAria: "Ir al grupo de temas",
    tripSection: "Para tu día a día",
    startProgressCap: "Tu progreso",
    lexSection: "Tu léxico",
    lexTitle: "Mi léxico",
    lexLast: function (p) { return "Último guardado: «" + p.es + "»"; },
    lexHint: "Tus palabras y frases guardadas, a mano",
    // Richtungs-/Sprach-Umschalter
    dirLabel: "Dirección",
    dirAria: "Elegir dirección de práctica",
    uiLanguage: "Idioma",
    modeFlip: "Tarjeta",
    modeType: "Escribir",
    modeListen: "Escuchar",
  });

  // ---------- app: etiquetas de alcance y controles frecuentes ----------
  reg("app", {
    allTopics: "Todos los temas",
    all: "Todos",
    mixed: "Mezclado",
    contextShow: "🧭 Contexto",
    contextHide: "🧭 Ocultar contexto",
    cardFlip: "Voltear la tarjeta",
    cardFlipped: "La tarjeta está volteada – toca para volver",
    statAnswered: "Respondidas", statHard: "Difíciles", statMastered: "Dominadas", statNew: "Nuevas",
  });

  // ---------- favorites: Mi léxico ----------
  reg("favorites", {
    title: "Mi léxico",
  });

  // ---------- profile: encabezados frecuentes ----------
  reg("profile", {
    progressTitle: "Tu progreso",
  });
})();
