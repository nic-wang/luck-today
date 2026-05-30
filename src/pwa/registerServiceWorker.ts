export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  // SW 用 postMessage 通知"我升级了" → client 主动 reload
  // 解决 iOS PWA 缓存太顽固吃旧 HTML 的问题
  let reloading = false;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'sw-updated' && !reloading) {
      reloading = true;
      // 给 SW 一点时间清完缓存 + 接管 client 再 reload
      setTimeout(() => window.location.reload(), 200);
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(reg => {
      // 检测到新版 SW 安装好后立即 skipWaiting
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // 老 SW 还在控制 · 让新 SW 接管
            sw.postMessage({ type: 'skip-waiting' });
          }
        });
      });
    }).catch(error => {
      console.warn('[PWA] Service worker register failed:', error);
    });
  });
}
