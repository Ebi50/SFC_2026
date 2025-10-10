// KILL-SWITCH: Dieser Service Worker deregistriert sich selbst sofort
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      // Deregistriere diesen Service Worker
      return self.registration.unregister();
    }).then(() => {
      // Lade alle Clients neu
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});

// Keine fetch interception
self.addEventListener('fetch', (event) => {
  // Lasse alle Requests durch
});
