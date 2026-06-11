/*
 * service-worker.js – macht HolaRuta offline-tauglich (PWA).
 * Strategie: "Cache zuerst" für die App-Dateien, damit sie unterwegs ohne
 * Internet startet. Bei jeder Version CACHE_VERSION hochzählen -> alte Caches
 * werden beim Aktivieren entfernt und die App lädt frisch.
 */
const CACHE_VERSION = "holaruta-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./contextdata.js",
  "./data.js",
  "./context.js",
  "./srs.js",
  "./store.js",
  "./usercards.js",
  "./matcher.js",
  "./stats.js",
  "./speech.js",
  "./share.js",
  "./ui.js",
  "./app.js",
  "./icon.svg",
  "./manifest.webmanifest",
];

// Installieren: alle App-Dateien in den Cache legen.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivieren: veraltete Caches früherer Versionen wegräumen.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Abrufen: erst Cache, dann Netz. Erfolgreiche Netz-Antworten nachladen (für Updates).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
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
