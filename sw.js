// Shred service worker — offline-first for the app shell.
// The AI calls always hit the network (and fail gracefully offline);
// everything else (UI, calorie engine) works with no connection.
const CACHE = "shred-v2-personalised";
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
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache AI provider calls — always go to network.
  if (/api\.groq\.com|generativelanguage\.googleapis\.com|openrouter|together|api\.openai\.com/.test(url.host)) {
    return; // default network behaviour
  }
  // Cache-first for our own assets, fall back to network.
  if (e.request.method === "GET" && url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html")))
    );
  }
});
