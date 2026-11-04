/* Versioned same-origin shell. Never cache user data or third-party requests. */
const CACHE = "beautycalendar-v2-builder-1";
const ASSETS = [
  "./assets/serum-editorial.jpg",
  "./assets/Montserrat.ttf",
  "./assets/Montserrat-Italic.ttf",
  "./data/ingredient-names.json",
  "./data/comedogenicity.json",
  "./lib/inci-reference.js",
  "./builder.js?v=24",
  "./lib/routine-plan.js",
  "./lib/dialog.js",
  "./",
  "./index.html",
  "./style.css?v=24",
  "./app.js?v=24",
  "./ingredients.js?v=24",
  "./motion.js?v=24",
  "./prompts.js?v=24",
  "./theme.js?v=24",
  "./shell.js?v=24",
  "./products.js?v=24",
  "./archive.js",
  "./lib/domain.js",
  "./lib/storage.js",
  "./ingredients-db.json",
  "./inspiration.json",
  "./skin-editorial.jpg",
  "./hair-editorial.jpg",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];
const OWNED_PREFIXES = ["beautycalendar-v2-", "beautyjournal-restore-"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
// New workers wait for old tabs to close, avoiding mixed versions during editing.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE &&
                OWNED_PREFIXES.some((prefix) => key.startsWith(prefix)),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(CACHE).then((cache) => cache.match("./index.html")),
      ),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE)
      .then(
        async (cache) =>
          (await cache.match(event.request)) || fetch(event.request),
      ),
  );
});
