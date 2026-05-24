/**
 * luck-today Service Worker
 * ---
 * 策略：
 *   - HTML / JS / CSS: network-first（优先拿最新，失败回缓存）
 *   - 图片 / vendor 库: cache-first
 *   - Vite hashed assets 不做手写预缓存，避免版本漂移
 *
 * 升级流程：改了代码想强制用户拿新版 → 改下面的 VERSION，push 后客户端会自动清旧缓存
 */

const VERSION = 'v3-20260525-tyme4ts-rws78-qimen';
const CACHE_NAME = `luck-today-${VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

// activate: 清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('luck-today-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = request.destination === 'document' || request.headers.get('accept')?.includes('text/html');
  const isJS = request.destination === 'script' || url.pathname.endsWith('.js');
  const isCSS = request.destination === 'style';
  const isImage = request.destination === 'image';

  if (isHTML || isJS || isCSS) {
    event.respondWith(
      fetch(request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request))
    );
  } else if (isImage) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
          return resp;
        })
      )
    );
  }
});
