/*
 * service-worker.js – macht HolaRuta offline-tauglich (PWA).
 * Strategie: "Cache zuerst" für die App-Dateien, damit sie unterwegs ohne
 * Internet startet. Ändert sich der Cache-Name, werden alte Caches beim
 * Aktivieren entfernt und die App lädt frisch.
 *
 * CACHE_VERSION wird NICHT von Hand gepflegt: `node build.js` stempelt hier
 * automatisch einen Inhalts-Hash über alle precachten Assets (siehe
 * swversion.js). Sobald sich eine ausgelieferte Datei ändert, ändert sich der
 * Name -> der alte Cache wird verworfen. (Früher musste man von Hand
 * hochzählen; wurde das vergessen, blieben installierte PWAs auf alten Dateien.)
 *
 * Update-Übernahme: standardmäßig kein automatisches skipWaiting – eine neue
 * Version wartet, bis die App neu startet. Die App bietet dem Nutzer aber ein
 * "Neue Version – jetzt laden"-Banner an; tippt er es, schickt sie SKIP_WAITING
 * (siehe message-Handler unten). Der neue Worker wird dann sofort aktiv, und die
 * App lädt bei "controllerchange" genau einmal neu. So mischen sich nie alte und
 * neue Dateien in einer laufenden Sitzung (Mixed-Version-Load): das Aktivieren
 * ist immer an ein vollständiges Reload gekoppelt.
 */
const CACHE_VERSION = "holaruta-84d4fc574bc9"; // von build.js gestempelt – nicht von Hand ändern
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./editions/registry.js",
  "./config.js",
  "./i18n.js",
  "./i18n.strings.js",
  "./contextdata.js",
  "./data.js",
  "./numbers.js",
  "./context.js",
  "./countries.js",
  "./historia.js",
  "./historiaCentro.js",
  "./knigge.js",
  "./frases.js",
  "./dialogos.js",
  "./conjug.js",
  "./regatear.js",
  "./logistica.js",
  "./salud.js",
  "./bebidas.js",
  "./srs.js",
  "./store.js",
  "./sync.js",
  "./usercards.js",
  "./matcher.js",
  "./placement.js",
  "./search.js",
  "./stats.js",
  "./badges.js",
  "./speech.js",
  "./share.js",
  "./qr.js",
  "./install.js",
  "./changelog.js",
  "./ui.js",
  "./app.js",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./fonts/bricolage-grotesque-600-800-latin.woff2",
  "./fonts/instrument-sans-400-700-latin.woff2",
  "./fonts/instrument-sans-italic-400-latin.woff2",
  "./manifest.webmanifest",
];

// Absolute URLs der bekannten Assets – nur diese werden zur Laufzeit
// (nach-)gecacht. Verhindert, dass der Cache durch beliebige Requests
// (z. B. URLs mit Query-Parametern) unbegrenzt wächst.
const ASSET_URLS = new Set(ASSETS.map((p) => new URL(p, self.location.href).href));

// Installieren: alle App-Dateien in den Cache legen. Jede Datei wird mit
// cache:"reload" geholt, damit der Precache am Browser-HTTP-Cache vorbei frisch
// aus dem Netz lädt. Sonst kann ein neuer Worker (neue CACHE_VERSION) versehentlich
// noch HTTP-gecachte alte Dateien einlagern – dann zeigt die App trotz Update die
// alte Version, bis der HTTP-Cache abläuft.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
});

// Auf Wunsch der App (Nutzer tippt "jetzt laden") sofort aktiv werden, statt erst
// beim nächsten Start. Der dadurch ausgelöste controllerchange lässt die App
// kontrolliert neu laden – kein Mixed-Version-Load.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Aktivieren: veraltete Caches früherer Versionen wegräumen.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
});

// Abrufen: erst Cache, dann Netz. Erfolgreiche Netz-Antworten bekannter
// Assets nachladen (für Updates) – fremde/unerwartete URLs nie cachen.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic" && ASSET_URLS.has(req.url)) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline: Cache reicht. Für Seitenaufrufe (Navigation) ohne Treffer
          // die App-Shell als Fallback liefern, statt Netzwerkfehler zu zeigen.
          if (cached) return cached;
          if (req.mode === "navigate") return caches.match("./index.html");
          return undefined;
        });
      return cached || fromNet;
    })
  );
});
