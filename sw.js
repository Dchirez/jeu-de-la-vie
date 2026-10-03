/* Service worker : la page reste jouable hors connexion.
   Réseau d'abord (on voit toujours la dernière version publiée), cache en secours.
   Copie du sw.js de la salle de jeux (dépôt games) ; seule la liste ESSENTIEL change. */
const ESSENTIEL = ["./", "ds.css", "/games/pont-hub.js"];
const CACHE = "dchirez" + new URL(self.registration.scope).pathname.replace(/\W+/g, "-") + "v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ESSENTIEL.map((u) => c.add(u).catch(() => {})))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles.filter((k) => k !== CACHE && k.startsWith(CACHE.replace(/v\d+$/, ""))).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== location.origin && !/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;
  e.respondWith(fetch(req).then((rep) => {
    if (rep.ok || rep.type === "opaque") { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
    return rep;
  }).catch(() => caches.match(req, { ignoreSearch: true })
    .then((r) => r || (req.mode === "navigate" ? caches.match("./") : Response.error()))));
});
