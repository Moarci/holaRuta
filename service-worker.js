/*
 * service-worker.js – macht HolaRuta offline-tauglich (PWA).
 * Strategie: "Cache zuerst" für die App-Dateien, damit sie unterwegs ohne
 * Internet startet. Bei jeder Version CACHE_VERSION hochzählen -> alte Caches
 * werden beim Aktivieren entfernt und die App lädt frisch.
 * Hinweis: kein skipWaiting/clients.claim – die neue Version übernimmt erst
 * beim nächsten Start. So mischen sich nie alte und neue Dateien in einer
 * laufenden Sitzung (Mixed-Version-Load).
 */
const CACHE_VERSION = "holaruta-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./contextdata.js",
  "./data.js",
  "./context.js",
  "./countries.js",
  "./frases.js",
  "./srs.js",
  "./store.js",
  "./usercards.js",
  "./matcher.js",
  "./stats.js",
  "./badges.js",
  "./speech.js",
  "./share.js",
  "./install.js",
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

// Installieren: alle App-Dateien in den Cache legen.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
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
