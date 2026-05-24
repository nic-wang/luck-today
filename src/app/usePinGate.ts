import { useEffect, useState } from 'react';

const PIN_HASH = 'e264ef79df035c5fdca411bada273c40139ff966fdaee2c7b092cc54a9da673e';
const KEY_PWA = 'LUCK_GATE_PASS_PWA';
const KEY_SESSION = 'LUCK_GATE_PASS_SESSION';

function isPwa() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function storageKey() {
  return isPwa() ? KEY_PWA : KEY_SESSION;
}

function storage() {
  return isPwa() ? localStorage : sessionStorage;
}

async function sha256(value: string) {
  if (!window.crypto?.subtle?.digest) return sha256Fallback(value);
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function sha256Fallback(ascii: string) {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const words: number[] = [];
  const bytes: number[] = [];
  let result = '';
  const hash = (sha256Fallback as unknown as { h?: number[] }).h = (sha256Fallback as unknown as { h?: number[] }).h || [];
  const k = (sha256Fallback as unknown as { k?: number[] }).k = (sha256Fallback as unknown as { k?: number[] }).k || [];
  const isComposite: Record<number, number> = {};
  let primeCounter = k.length;

  for (let candidate = 2; primeCounter < 64; candidate += 1) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter += 1;
    }
  }

  for (let i = 0; i < ascii.length; i += 1) {
    const c = ascii.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  bytes.push(0, 0, 0, 0);
  bytes.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  const H = hash.slice(0, 8);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = H.slice(0);
    for (let i = 0; i < 64; i += 1) {
      if (i >= 16) {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const gamma0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const gamma1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + gamma0 + w[i - 7] + gamma1) | 0;
      }
      const a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      H[7] = g;
      H[6] = f;
      H[5] = e;
      H[4] = (d + temp1) | 0;
      H[3] = c;
      H[2] = b;
      H[1] = a;
      H[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i += 1) H[i] = (H[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i += 1) result += ((H[i] >>> 0).toString(16).padStart(8, '0'));
  return result;
}

export function usePinGate() {
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setPassed(storage().getItem(storageKey()) === PIN_HASH);
    } catch {
      setPassed(false);
    }
  }, []);

  async function submit(pin: string) {
    const hash = await sha256(pin);
    if (hash === PIN_HASH) {
      storage().setItem(storageKey(), PIN_HASH);
      setPassed(true);
      setError(false);
      return true;
    }
    setError(true);
    return false;
  }

  return { passed, error, submit, isPwa: isPwa() };
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
