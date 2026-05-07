/**
 * PIN 码门 · 命理今日
 *
 * 必须最先加载。验证通过后释放页面渲染，否则显示遮罩输入框。
 * PIN 用 SHA-256 哈希存储，防止源码直接看到。
 *
 * 默认 PIN：嘻嘻生日 0603（你俩心照不宣）
 *
 * 存储策略（双模式）：
 *   - PWA 模式（装到主屏 · display-mode: standalone）→ localStorage · 输一次永久免输
 *   - 浏览器模式 → sessionStorage · 每次开站都要输
 */

(function () {
  'use strict';

  // SHA-256 of "0603"
  const PIN_HASH = 'e264ef79df035c5fdca411bada273c40139ff966fdaee2c7b092cc54a9da673e';
  // 两个 key 彼此隔离：PWA 用 localStorage，浏览器用 sessionStorage
  // 重点：浏览器 localStorage 里不能有 PWA 的 key（否则浏览器下次也免输）
  const KEY_PWA = 'LUCK_GATE_PASS_PWA';
  const KEY_SESSION = 'LUCK_GATE_PASS_SESSION';
  const LEGACY_KEY = 'LUCK_GATE_PASS'; // 老 key · 首次加载时按当前模式迁移后清掉

  // 检测是否运行在 PWA (standalone) 模式
  function isPWA() {
    try {
      return window.matchMedia('(display-mode: standalone)').matches
          || window.navigator.standalone === true; // iOS Safari
    } catch (e) { return false; }
  }

  function getStore() {
    return isPWA() ? localStorage : sessionStorage;
  }
  function getKey() {
    return isPWA() ? KEY_PWA : KEY_SESSION;
  }

  // 检查是否已通过
  function isPassed() {
    try {
      return getStore().getItem(getKey()) === PIN_HASH;
    } catch (e) { return false; }
  }

  function markPassed() {
    try {
      getStore().setItem(getKey(), PIN_HASH);
    } catch (e) {}
  }

  // 迁移 & 清理：处理从老版 `LUCK_GATE_PASS` 过来的用户
  try {
    // 1) 迁移老 key
    const legacyLocal = localStorage.getItem(LEGACY_KEY);
    const legacySession = sessionStorage.getItem(LEGACY_KEY);
    if (legacyLocal === PIN_HASH && isPWA()) {
      // 老 PWA 通行证 → 迁到新 PWA key
      localStorage.setItem(KEY_PWA, PIN_HASH);
    } else if (legacySession === PIN_HASH && !isPWA()) {
      sessionStorage.setItem(KEY_SESSION, PIN_HASH);
    }
    // 2) 无论如何，清掉老 key（防止交叉污染）
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    // 3) 关键修复：浏览器模式启动时，localStorage 不应有 PWA 之外的通行证
    //    但 PWA 的 key 保留在 localStorage 里（PWA 下次开还要用）· 无需清
    // 4) PWA 模式启动时，清 session 的 key（避免遗留）
    if (isPWA()) sessionStorage.removeItem(KEY_SESSION);
  } catch (e) {}

  async function sha256(s) {
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (isPassed()) return;

  // 显示遮罩
  document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.createElement('div');
    overlay.id = 'pin-gate';
    overlay.innerHTML = `
      <div class="pin-card">
        <div class="pin-emoji">🔐</div>
        <div class="pin-title">命理今日</div>
        <div class="pin-sub">请输入访问码</div>
        <div class="pin-dots" id="pin-dots">
          <span></span><span></span><span></span><span></span>
        </div>
        <input type="tel" inputmode="numeric" maxlength="4" pattern="[0-9]*" id="pin-input" autocomplete="off">
        <div class="pin-hint">${isPWA() ? '提示：嘻嘻生日 4 位 · 本次输完即永久记住' : '提示：嘻嘻生日 4 位'}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 锁滚动
    document.body.style.overflow = 'hidden';

    const input = document.getElementById('pin-input');
    const dots = document.querySelectorAll('#pin-dots span');
    input.focus();

    input.addEventListener('input', async function () {
      const v = this.value.replace(/\D/g, '').slice(0, 4);
      this.value = v;
      dots.forEach((d, i) => d.classList.toggle('filled', i < v.length));
      if (v.length === 4) {
        const hash = await sha256(v);
        if (hash === PIN_HASH) {
          markPassed();
          overlay.classList.add('pass');
          document.body.style.overflow = '';
          setTimeout(() => overlay.remove(), 600);
        } else {
          // 错误抖动
          overlay.querySelector('.pin-card').classList.add('shake');
          setTimeout(() => {
            overlay.querySelector('.pin-card').classList.remove('shake');
            input.value = '';
            dots.forEach(d => d.classList.remove('filled'));
            input.focus();
          }, 500);
        }
      }
    });

    // 点遮罩聚焦
    overlay.addEventListener('click', () => input.focus());
  });

  // 注入 CSS
  const style = document.createElement('style');
  style.textContent = `
    #pin-gate {
      position: fixed; inset: 0; z-index: 9999;
      background: linear-gradient(135deg, #2D3A2E, #1a241b);
      display: grid; place-items: center;
      animation: pin-fadein .3s ease;
    }
    #pin-gate.pass { animation: pin-fadeout .5s ease forwards; }
    .pin-card {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.12);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px 36px;
      text-align: center;
      max-width: 320px;
      width: calc(100% - 40px);
    }
    .pin-card.shake { animation: pin-shake .4s ease; }
    .pin-emoji { font-size: 38px; margin-bottom: 12px; }
    .pin-title {
      color: #fff; font-size: 20px; font-weight: 700;
      letter-spacing: 4px; margin-bottom: 6px;
      font-family: "PingFang SC", -apple-system, sans-serif;
    }
    .pin-sub {
      color: rgba(255,255,255,.6); font-size: 13px;
      margin-bottom: 28px; letter-spacing: .5px;
    }
    .pin-dots {
      display: flex; justify-content: center; gap: 14px;
      margin-bottom: 16px;
    }
    .pin-dots span {
      width: 14px; height: 14px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.4);
      transition: all .2s;
    }
    .pin-dots span.filled {
      background: #fff; border-color: #fff;
    }
    #pin-input {
      position: absolute; left: -9999px;
      opacity: 0; pointer-events: none;
    }
    .pin-hint {
      color: rgba(255,255,255,.35); font-size: 11px;
      margin-top: 18px; letter-spacing: .3px;
    }
    @keyframes pin-fadein { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pin-fadeout {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(1.05); }
    }
    @keyframes pin-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-6px); }
      80% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);

  // 标识"门没开" — 让外层逻辑可以判断（不强行 block，因为遮罩已盖死）
  window.__LUCK_GATE_LOCKED = true;
})();
