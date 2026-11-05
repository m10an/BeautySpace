/* Versioned same-origin shell. Never cache user data or third-party requests. */
const CACHE = "beautycalendar-v2-masterplan-1";
const ASSETS = [
  "./editorial.js?v=29",
  "./lib/editorial.js",
  "./lib/builder-draft.js",
  "./ipl.js?v=29",
  "./lib/ipl.js",
  "./assets/Poppins-Regular.woff2",
  "./assets/Poppins-SemiBold.woff2",
  "./assets/PinyonScript-Regular.woff2",
  "./assets/CormorantGaramond.woff2",
  "./forms.js?v=29",
  "./help.js?v=29",
  "./inspiration.js?v=29",
  "./lib/form-rules.js",
  "./lib/free-consultant.js",
  "./lib/inspiration.js?v=29",
  "./data/ingredient-names.json",
  "./data/comedogenicity.json",
  "./lib/inci-reference.js",
  "./builder.js?v=29",
  "./lib/routine-plan.js",
  "./lib/dialog.js",
  "./ai-client.js?v=29",
  "./lib/ai-plan.js",
  "./runtime-config.json",
  "./",
  "./index.html",
  "./style.css?v=29",
  "./app.js?v=29",
  "./ingredients.js?v=29",
  "./motion.js?v=29",
  "./prompts.js?v=29",
  "./theme.js?v=29",
  "./shell.js?v=29",
  "./products.js?v=29",
  "./archive.js",
  "./lib/domain.js",
  "./lib/storage.js",
  "./ingredients-db.json",
  "./inspiration.json",
  "./inspiration.json?v=29",
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
  if (new URL(event.request.url).pathname.endsWith("/runtime-config.json")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() =>
        caches.open(CACHE).then((cache) => cache.match(event.request)),
      ),
    );
    return;
  }
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
