// ZIVO AI Service Worker – offline-first PWA support
const CACHE_NAME = "zivo-ai-v1";
const STATIC_ASSETS = ["/", "/ai", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});

// Push notification support
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "ZIVO AI", body: "New update available" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/next.svg",
    })
  );
});

// Background sync support
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(Promise.resolve());
  }
});
