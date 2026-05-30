// Fetch RWS 78 tarot images from Wikimedia Commons.
// Public domain (Pamela Colman Smith deck, 1909).
// Saves to public/assets/tarot/000.jpg ... 077.jpg
import { writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'assets', 'tarot');

// 22 大阿尔卡纳：id 0-21 → 文件名 RWS_Tarot_##_Name.jpg
const MAJOR_FILES = [
  'RWS_Tarot_00_Fool.jpg',
  'RWS_Tarot_01_Magician.jpg',
  'RWS_Tarot_02_High_Priestess.jpg',
  'RWS_Tarot_03_Empress.jpg',
  'RWS_Tarot_04_Emperor.jpg',
  'RWS_Tarot_05_Hierophant.jpg',
  'RWS_Tarot_06_Lovers.jpg',
  'RWS_Tarot_07_Chariot.jpg',
  'RWS_Tarot_08_Strength.jpg',
  'RWS_Tarot_09_Hermit.jpg',
  'RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'RWS_Tarot_11_Justice.jpg',
  'RWS_Tarot_12_Hanged_Man.jpg',
  'RWS_Tarot_13_Death.jpg',
  'RWS_Tarot_14_Temperance.jpg',
  'RWS_Tarot_15_Devil.jpg',
  'RWS_Tarot_16_Tower.jpg',
  'RWS_Tarot_17_Star.jpg',
  'RWS_Tarot_18_Moon.jpg',
  'RWS_Tarot_19_Sun.jpg',
  'RWS_Tarot_20_Judgement.jpg',
  'RWS_Tarot_21_World.jpg'
];

// 小阿尔卡纳：4 花色 × 14 张
// 我们 tarot-rws-78.ts 里 id = 22 + suitIdx*14 + (num-1)
// suit 顺序：wands, cups, swords, pentacles
const MINOR_PREFIX = ['Wands', 'Cups', 'Swords', 'Pents'];

function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }

const ALL_FILES = [
  ...MAJOR_FILES,
  ...MINOR_PREFIX.flatMap(prefix =>
    Array.from({ length: 14 }, (_, i) => `${prefix}${pad2(i + 1)}.jpg`)
  )
];

console.log(`Total: ${ALL_FILES.length} files`);

async function getCanonicalUrl(fileName) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=400`;
  const r = await retryFetch(url);
  if (!r.ok) throw new Error(`api ${r.status} for ${fileName}`);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`bad json for ${fileName}: ${text.slice(0, 80)}`); }
  const pages = json.query?.pages ?? {};
  const first = Object.values(pages)[0];
  if (!first?.imageinfo?.[0]) return null;
  // 取 thumbnail 400px 宽，避免下载原图（每张原图 ~500KB-2MB）
  return first.imageinfo[0].thumburl ?? first.imageinfo[0].url;
}

async function retryFetch(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, { headers: { 'User-Agent': 'luck-today/1.0 (https://nic-wang.github.io/luck-today/)' } });
    } catch (e) {
      lastErr = e;
      const wait = 500 * Math.pow(2, i);
      console.log(`  [retry ${i + 1}/${attempts}] ${e.code || e.message} · wait ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function fileExists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function downloadOne(id, fileName) {
  const outPath = path.join(OUT, `${pad3(id)}.jpg`);
  if (await fileExists(outPath)) {
    console.log(`[skip] ${pad3(id)} ${fileName}`);
    return true;
  }
  let url;
  try {
    url = await getCanonicalUrl(fileName);
  } catch (e) {
    console.error(`[fail-meta] ${pad3(id)} ${fileName}: ${e.message}`);
    return false;
  }
  if (!url) {
    console.error(`[fail-meta-empty] ${pad3(id)} ${fileName}`);
    return false;
  }
  let r;
  try {
    r = await retryFetch(url);
  } catch (e) {
    console.error(`[fail-fetch] ${pad3(id)} ${fileName}: ${e.message}`);
    return false;
  }
  if (!r.ok) {
    console.error(`[fail-fetch] ${pad3(id)} ${fileName} → ${r.status}`);
    return false;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outPath, buf);
  console.log(`[ok] ${pad3(id)} ${fileName} (${(buf.length / 1024).toFixed(1)}KB)`);
  return true;
}

function pad3(n) { return String(n).padStart(3, '0'); }

const failures = [];
for (let i = 0; i < ALL_FILES.length; i++) {
  const ok = await downloadOne(i, ALL_FILES[i]);
  if (!ok) failures.push({ id: i, file: ALL_FILES[i] });
  // 礼貌限速：每 200ms 一次
  await new Promise(r => setTimeout(r, 200));
}

if (failures.length > 0) {
  console.log('\n=== Failures ===');
  for (const f of failures) console.log(`  ${pad3(f.id)} ${f.file}`);
  console.log(`\n(${ALL_FILES.length - failures.length}/${ALL_FILES.length} succeeded)`);
  process.exit(1);
}
console.log(`\n=== Done. ${ALL_FILES.length} images ===`);
