// Shred service worker — offline-ready app shell with network-first HTML updates.
// AI calls always hit the network; app pages update faster after redeploys.
const CACHE = "shred-v4-plan-food-sync";
const ASSETS = [
  "./",
  "./index.html",
  "./engine.js",
  "./ai.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache AI provider calls.
  if (/api\.groq\.com|generativelanguage\.googleapis\.com|openrouter|together|api\.openai\.com/.test(url.host)) return;

  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  const isHtml = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

  if (isHtml) {
    // Network-first for the app shell so GitHub Pages redeploys appear quickly.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for static assets.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
