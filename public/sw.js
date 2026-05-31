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

const VERSION = 'v3-20260531-apple-style';
const CACHE_NAME = `luck-today-${VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

// client 也可以主动告诉新 SW "立即接管"
self.addEventListener('message', event => {
  if (event.data?.type === 'skip-waiting') {
    self.skipWaiting();
  }
});

// activate: 清理旧版本缓存 + 通知所有 client 强制 reload
// （iOS PWA 缓存极顽固 · 即便 network-first 也常吃旧 HTML）
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k.startsWith('luck-today-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
      // 通知所有打开的 client 强制 reload · 拿新 HTML
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'sw-updated', version: VERSION });
      }
    })()
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
