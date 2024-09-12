// Basic service worker for caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-cache').then((cache) => {
      return cache.addAll([
        './',
        './icon.png',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const imageFile = formData.get('image');
        
        if (imageFile) {
          const db = await openDB();
          await storeImage(db, imageFile);
        }

        return Response.redirect('./', 303);
      })()
    );
  }
});

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ImageDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('images', { keyPath: 'id' });
    };
  });
}

async function storeImage(db, imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put({ id: 'sharedImage', data: reader.result });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(imageFile);
  });
}
