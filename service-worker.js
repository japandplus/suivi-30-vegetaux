/* ============================================================
   Service worker - Suivi alimentaire hebdomadaire
   Date de creation : 2026-08-04
   Version : 2.0.0

   Permet le fonctionnement hors-ligne et l'installation de
   l'application (PWA). Aucune donnee n'est envoyee sur internet :
   ce fichier ne fait que mettre en cache les fichiers de
   l'application elle-meme (HTML, manifeste, icones), pas les
   donnees de l'utilisateur (qui restent dans localStorage).
   ============================================================ */

const VERSION_APP = "2.0.0";
const NOM_CACHE = `suivi-alimentaire-cache-v${VERSION_APP}`;

// Chemins relatifs au dossier ou se trouve ce service worker.
// "./" cible le document effectivement servi a cette adresse (index.html
// une fois deploye, quel que soit son nom de fichier d'origine).
const FICHIERS_A_METTRE_EN_CACHE = [
  "./",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png",
];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(NOM_CACHE).then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom !== NOM_CACHE)
          .map((nom) => caches.delete(nom))
      )
    )
  );
  self.clients.claim();
});

// Strategie : cache d'abord, puis reseau (utile pour usage hors-ligne).
// Si une nouvelle version est recuperee sur le reseau, elle remplace
// discretement la version en cache pour la prochaine ouverture.
self.addEventListener("fetch", (evenement) => {
  if (evenement.request.method !== "GET") return;

  evenement.respondWith(
    caches.match(evenement.request).then((reponseEnCache) => {
      const recuperationReseau = fetch(evenement.request)
        .then((reponseReseau) => {
          if (reponseReseau && reponseReseau.status === 200) {
            const copie = reponseReseau.clone();
            caches.open(NOM_CACHE).then((cache) => cache.put(evenement.request, copie));
          }
          return reponseReseau;
        })
        .catch(() => reponseEnCache); // hors-ligne : on retombe sur le cache

      return reponseEnCache || recuperationReseau;
    })
  );
});
