/**
 * luck-today Service Worker
 * ---
 * 策略：
 *   - HTML / JS / CSS: network-first（优先拿最新，失败回缓存）
 *   - 图片 / vendor 库: cache-first（一次缓存永久用，直到换 VERSION）
 *   - 首次访问后全部离线可用
 *
 * 升级流程：改了代码想强制用户拿新版 → 改下面的 VERSION，push 后客户端会自动清旧缓存
 */

const VERSION = 'v6-20260508-httplan-fix';
const CACHE_NAME = `luck-today-${VERSION}`;

// 首次访问预缓存清单
const PRECACHE = [
  './',
  './index.html',
  './family/index.html',
  './lib/gate.js',
  './lib/luck-engine.js',
  './lib/relations.js',
  './lib/members.js',
  './lib/app.js',
  './lib/family.js',
  './vendor/lunar.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/photos/牛牛-像素图.jpg',
  './assets/photos/嘻嘻-像素图.jpg',
  './assets/photos/泡泡-像素图.png',
  './assets/photos/蛋蛋-像素图.jpg',
  './assets/photos/小五-像素图.png',
  './assets/photos/糯米鸡-像素图.png',
];

// install: 预缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
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

// fetch: 按资源类型分流
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 只代理同源请求（GitHub Pages 域）
  if (url.origin !== self.location.origin) return;

  const isHTML = request.destination === 'document' ||
                 request.headers.get('accept')?.includes('text/html');
  const isJS = request.destination === 'script' || url.pathname.endsWith('.js');
  const isCSS = request.destination === 'style';
  const isImage = request.destination === 'image';

  if (isHTML || isJS || isCSS) {
    // network-first：想拿最新逻辑，断网才用缓存
    event.respondWith(
      fetch(request)
        .then(resp => {
          // 成功了顺便更新缓存
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request))
    );
  } else if (isImage) {
    // cache-first：图片基本不变，能缓就缓
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
  // 其他资源走默认
});
