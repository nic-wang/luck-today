/**
 * luck-today · family/index.html 脚本
 * ---
 * 从 family/index.html 内联抽出 · Step C 重构
 * 依赖加载顺序：../lib/gate.js → ../vendor/lunar.js → ../lib/luck-engine.js → ../lib/members.js → ../lib/relations.js → 本文件
 */

// embed 模式检测（被 iframe 嵌入时启用）
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get('embed') === '1' || window.self !== window.top) {
    document.body.setAttribute('data-embed', '1');
  }
})();

// 从 keyword 反推关系的核心五行（优先级：水>火>木>金>土）
function relWuxingFromKeyword(keyword) {
  if (!keyword) return null;
  const wxs = ['水', '火', '木', '金', '土'];
  for (const wx of wxs) {
    if (keyword.includes(wx)) return wx;
  }
  return null;
}

/* ━━━━━━━━━━ 数据层 · 从 lib/ 引入 ━━━━━━━━━━ */
const members = window.MEMBERS;
const memberOrder = window.MEMBER_ORDER;
const relations = window.RELATIONS;
const relKey = window.relKey;

/* ━━━━━━━━━━ 干支引擎（基于 lunar.js · 节气准确）━━━━━━━━━━ */
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_WX = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const BRANCH_WX = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

// 用 lunar.js 做真·农历八字（按节气切月柱 · 按立春切年柱）
// 保留对外 API：dayGanzhi(date) → {stem, branch, full} / monthGanzhi(date) → {stem, branch, full} / yearGanzhi(year) → string
function _lunarOf(date) {
  const Solar = window.Solar;
  if (!Solar) throw new Error('vendor/lunar.js 未加载');
  return Solar.fromYmdHms(
    date.getFullYear(), date.getMonth() + 1, date.getDate(),
    12, 0, 0   // 用正午 12 点 · 避免时柱干扰日柱
  ).getLunar();
}
function dayGanzhi(date) {
  const lu = _lunarOf(date);
  const stem = lu.getDayGan();
  const branch = lu.getDayZhi();
  return { stem, branch, full: stem + branch };
}
function monthGanzhi(date) {
  const lu = _lunarOf(date);
  const stem = lu.getMonthGan();
  const branch = lu.getMonthZhi();
  return { stem, branch, full: stem + branch };
}
function yearGanzhi(yearOrDate) {
  // 兼容两种调用：yearGanzhi(2026) 和 yearGanzhi(dateObj)
  const d = (typeof yearOrDate === 'number')
    ? new Date(yearOrDate, 5, 15)   // 取年中（避免立春边界 · 1 月会算上一年）
    : yearOrDate;
  const lu = _lunarOf(d);
  return lu.getYearGan() + lu.getYearZhi();
}

const TODAY = new Date();
const todayGz = dayGanzhi(TODAY);
const todayMonth = monthGanzhi(TODAY);
const todayYear = yearGanzhi(TODAY.getFullYear());
const todayDayWx = STEM_WX[todayGz.stem] + BRANCH_WX[todayGz.branch];

/* ━━━━━━━━━━ 今日动态引擎 ━━━━━━━━━━ */

// 五行生克：克(+)生(-)
const WX_GEN = { '木':'火','火':'土','土':'金','金':'水','水':'木' }; // 生
const WX_KE = { '木':'土','土':'水','水':'火','火':'金','金':'木' };   // 克

function todayWuxingStrength() {
  // 今日主五行（日干）+ 辅五行（日支）
  const mainWx = STEM_WX[todayGz.stem];
  const subWx = BRANCH_WX[todayGz.branch];
  // 回家庭本位分
  const base = { '木':3, '火':2.5, '土':3, '金':3, '水':5 };
  const dyn = { ...base };
  // 主五行 +1 · 辅五行 +0.5
  dyn[mainWx] = Math.min(5, dyn[mainWx] + 1);
  dyn[subWx] = Math.min(5, dyn[subWx] + 0.5);
  // 被今日主五行克的那个 -0.5
  const kedWx = WX_KE[mainWx];
  if (kedWx) dyn[kedWx] = Math.max(0, dyn[kedWx] - 0.5);
  return { base, dyn, mainWx, subWx, kedWx };
}

// 今日宜忌（基于日主五行 + 家用神水）
function todayYiJi() {
  const mainWx = STEM_WX[todayGz.stem];
  const yi = [], ji = [];
  const BANK = {
    '木': { yi: ['东向晨光','绿植贴身','早起走动','木器握手'], ji: ['重金属声响','久坐不动','辛辣过度'] },
    '火': { yi: ['南窗小憩','深红配饰','热茶慢品','跳舞发汗'], ji: ['大额决策','烈日久曝','浓茶咖啡过量'] },
    '土': { yi: ['黄色衣物','大地接触','稳固饮食','腹式呼吸'], ji: ['过度思虑','胃口贪多','湿重环境'] },
    '金': { yi: ['白/银饰物','西向散步','萧瑟音乐','呼吸练习'], ji: ['悲伤回忆','久待空调','剧烈运动'] },
    '水': { yi: ['深色衣物','北向静坐','补水慢饮','海蓝意象'], ji: ['强光直射','辛辣上头','通宵熬夜'] }
  };
  // 基础：今日主五行的宜忌
  yi.push(...BANK[mainWx].yi.slice(0, 2));
  ji.push(...BANK[mainWx].ji.slice(0, 1));
  // 家用神是水 · 所以再叠加 1 条补水宜
  yi.push(BANK['水'].yi[2]);
  // 火旺日叠加 1 条忌
  if (mainWx === '火' || BRANCH_WX[todayGz.branch] === '火') {
    ji.push(BANK['火'].ji[0]);
  }
  return { yi: yi.slice(0,3), ji: ji.slice(0,2), mainWx };
}

// 成员今日状态（针对 member 的 mainWuxing）
function memberTodayState(member) {
  const mainWx = STEM_WX[todayGz.stem];
  const subWx = BRANCH_WX[todayGz.branch];
  const mine = member.mainWuxing;
  // 和今日主五行的关系
  if (!mine) return { level: '平', desc: '数据不足', yi: [], ji: [] };
  let level, desc, yi = [], ji = [];
  if (mine === mainWx) {
    level = '强'; desc = '同五行叠加 · 能量最旺';
    yi = ['高强度运动/社交', '适合主动表达'];
    ji = ['情绪易过度/透支'];
  } else if (WX_GEN[mine] === mainWx) {
    level = '泄'; desc = '被今日五行泄耗 · 需蓄能';
    yi = ['保持补给 · 多喝水', '独处补阴'];
    ji = ['长时间激烈活动'];
  } else if (WX_GEN[mainWx] === mine) {
    level = '生'; desc = '被今日五行相生 · 受滋养';
    yi = ['承接外来能量', '学习/吸收新东西'];
    ji = ['不要懒散'];
  } else if (WX_KE[mine] === mainWx) {
    level = '克'; desc = '今日五行克你 · 宜避峰';
    yi = ['低调蓄势', '避开强刺激'];
    ji = ['顶撞权威/扛锤'];
  } else if (WX_KE[mainWx] === mine) {
    level = '胜'; desc = '今日主动克今日之气 · 消耗';
    yi = ['做需要魄力的事'];
    ji = ['耗能莫过'];
  } else {
    level = '平'; desc = '与今日五行不冲不合';
    yi = ['日常节奏'];
    ji = ['无需特别'];
  }
  return { level, desc, yi, ji };
}

// 关系今日动态分（在基础分基础上 +/- 根据今日五行与关系主五行的匹配）
function relationTodayScore(baseScore, relWuxing) {
  const mainWx = STEM_WX[todayGz.stem];
  // relWuxing 取关系的"主调五行"（根据 keyword 粗映射）
  if (!relWuxing) return { score: baseScore, delta: 0, hint: '—' };
  let delta = 0;
  if (relWuxing === mainWx) { delta = 0.5; }
  else if (WX_GEN[mainWx] === relWuxing) { delta = 0.3; }
  else if (WX_GEN[relWuxing] === mainWx) { delta = -0.3; }
  else if (WX_KE[mainWx] === relWuxing) { delta = -0.5; }
  else if (WX_KE[relWuxing] === mainWx) { delta = 0.2; }
  const score = Math.max(0, Math.min(5, baseScore + delta));
  const hint = delta > 0 ? `↑ +${delta.toFixed(1)} 今日加持` : delta < 0 ? `↓ ${delta.toFixed(1)} 今日压制` : '今日持平';
  return { score, delta, hint };
}

/* 五行雷达数据 */
const wuxingData = [
  { name: '木', val: 3, color: '#5C8A6B' },
  { name: '火', val: 2.5, color: '#E89B7A' },
  { name: '土', val: 3, color: '#C9A26B' },
  { name: '金', val: 3, color: '#A0B3A0' },
  { name: '水', val: 5, color: '#6B8FA8' }
];

function todayWuxingHint() {
  // 今日五行倾向：根据日干支判断
  const dayWx = STEM_WX[todayGz.stem];
  const branchWx = BRANCH_WX[todayGz.branch];
  return `${dayWx}主 ${branchWx}辅`;
}

/* ━━━━━━━━━━ 渲染 ━━━━━━━━━━ */
function renderHead() {
  const row = document.getElementById('memberRow');
  row.innerHTML = '';
  memberOrder.forEach(id => {
    const m = members[id];
    const div = document.createElement('div');
    div.className = 'avatar-mini';
    const avatarStyle = m.photo
      ? `background-image: url('${MEMBER_PHOTO(m)}'); background-position: ${m.photoPos || 'center'}; background-size: cover; background-color: ${m.colorBg};`
      : `background: ${m.colorBg};`;
    div.innerHTML = `
      <div class="circle ${m.photo ? 'has-photo' : ''}" style="${avatarStyle}">${m.photo ? '' : m.emoji}</div>
      <div class="name">${m.name}</div>
      <div class="role">${m.role}</div>
    `;
    div.onclick = () => setRight(id);
    row.appendChild(div);
  });
}

function renderHeroToday() {
  const dateStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}-${String(TODAY.getDate()).padStart(2,'0')}`;
  document.getElementById('todayDate').textContent = dateStr;
  document.getElementById('todayGanzhi').textContent = `${todayYear}年 · ${todayMonth.full}月 · ${todayGz.full}日`;
  const mainWx = STEM_WX[todayGz.stem];
  const subWx = BRANCH_WX[todayGz.branch];
  document.getElementById('todayWuxing').textContent = `${mainWx}主 ${subWx}辅`;

  // 今日宜忌
  const yj = todayYiJi();
  document.getElementById('yiText').textContent = yj.yi.join(' · ');
  document.getElementById('jiText').textContent = yj.ji.join(' · ');

  // 宠物生命时间线（4 条 · 只放宠物）
  const petList = ['dandan','paopao','xiaowu','xiaomiji'];
  const tl = document.getElementById('petTimeline');
  tl.innerHTML = '';
  petList.forEach(id => {
    const m = members[id];
    const birth = new Date(m.birth.split(' ')[0]);
    const days = Math.floor((TODAY - birth) / 86400000);
    const yrs = (days / 365.25).toFixed(1);
    const keyTag = m.chips.find(c => c.includes('合') || c.includes('挚友') || c.includes('水库') || c.includes('警')) || m.chips[0];
    const avatarStyle = m.photo
      ? `background-image: url('${MEMBER_PHOTO(m)}'); background-position: ${m.photoPos || 'center'};`
      : `background: ${m.colorBg};`;
    const row = document.createElement('div');
    row.className = 'pet-row';
    row.innerHTML = `
      <div class="pet-avatar ${m.photo ? 'has-photo' : ''}" style="${avatarStyle}">${m.photo ? '' : m.emoji}</div>
      <div class="pet-main">
        <span class="pet-name">${m.name}</span>
        <span class="pet-tag">${m.role} · ${keyTag}</span>
      </div>
      <div class="pet-days"><span class="dnum">${days}</span> 天 <span class="dyr">${yrs}y</span></div>
    `;
    row.onclick = () => { setRight(id); document.querySelector('.matcher').scrollIntoView({behavior:'smooth',block:'center'}); };
    tl.appendChild(row);
  });
}

function renderWuxing() {
  const { base, dyn, mainWx, subWx } = todayWuxingStrength();
  const wxs = ['木','火','土','金','水'];
  // 顶点坐标（每个五行在雷达的相对坐标 · 中心 160,160 · 每行轴向）
  const axes = {
    '木': { cx: 160, cy: 40, dx: 0, dy: -1 },
    '火': { cx: 277, cy: 107, dx: 0.9, dy: -0.55 },
    '土': { cx: 277, cy: 213, dx: 0.9, dy: 0.55 },
    '金': { cx: 160, cy: 280, dx: 0, dy: 1 },
    '水': { cx: 43, cy: 160, dx: -1, dy: 0 }
  };
  // 把分值转为坐标（中心 160,160 · 半径 120 表示满分 5）
  const toCoord = (wx, val) => {
    const a = axes[wx];
    const r = (val / 5) * 120;
    const cx = 160 + a.dx * r;
    const cy = 160 + a.dy * r;
    return `${cx},${cy}`;
  };
  const basePoints = wxs.map(wx => toCoord(wx, base[wx])).join(' ');
  const dynPoints = wxs.map(wx => toCoord(wx, dyn[wx])).join(' ');
  document.getElementById('radarBase').setAttribute('points', basePoints);
  document.getElementById('radarDyn').setAttribute('points', dynPoints);

  // 顶点圆点
  const g = document.getElementById('radarPoints');
  g.innerHTML = wxs.map(wx => {
    const [cx, cy] = toCoord(wx, dyn[wx]).split(',');
    const color = { '木':'#5C8A6B','火':'#E89B7A','土':'#C9A26B','金':'#A0B3A0','水':'#6B8FA8' }[wx];
    return `<circle cx="${cx}" cy="${cy}" r="5" fill="${color}" stroke="#fff" stroke-width="2"/>`;
  }).join('');

  // 列表
  const list = document.getElementById('wuxingList');
  list.innerHTML = '';
  const COLORS = { '木':'#5C8A6B','火':'#E89B7A','土':'#C9A26B','金':'#A0B3A0','水':'#6B8FA8' };
  wxs.forEach(wx => {
    const b = base[wx], d = dyn[wx];
    const delta = d - b;
    const deltaHtml = Math.abs(delta) < 0.01 ? '' :
      delta > 0 ? `<span style="color:${COLORS[wx]}; font-size:10px;"> ↑${delta.toFixed(1)}</span>`
                : `<span style="color:#B86E3D; font-size:10px;"> ↓${delta.toFixed(1)}</span>`;
    const div = document.createElement('div');
    div.className = 'wuxing-item';
    div.innerHTML = `
      <div class="wx-name" style="color:${COLORS[wx]};">${wx}</div>
      <div class="wx-bar"><div class="wx-bar-fill" style="width:${d/5*100}%; background:${COLORS[wx]};"></div></div>
      <div class="wx-num">${d.toFixed(1)}${deltaHtml}</div>
    `;
    list.appendChild(div);
  });

  // 头部文案
  document.getElementById('radarHead').textContent = `今日 ${mainWx}${mainWx === '水' ? '位补强' : mainWx === '火' ? '旺盛' : '当令'}`;
  document.getElementById('radarDesc').innerHTML = `今日日干 <strong style="color:${COLORS[mainWx]}">${mainWx}</strong> · 支辅 <strong style="color:${COLORS[subWx]}">${subWx}</strong> · 主位 +1 支辅 +0.5 被克 -0.5 · 每日波动`;
}

function renderCards() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  memberOrder.forEach(id => {
    const m = members[id];
    const chipsHtml = m.chips.slice(0, 3).map(c => {
      let cls = 'chip';
      if (c.includes('合水') || c.includes('挚友') || c.includes('水库') || c.includes('合化')) cls = 'chip primary';
      else if (c.includes('火警') || c.includes('⚠')) cls = 'chip alert';
      else if (c.includes('金') && !c.includes('合')) cls = 'chip gold';
      return `<span class="${cls}">${c}</span>`;
    }).join('');

    const state = memberTodayState(m);

    const avatarStyle = m.photo
      ? `background-image: url('${MEMBER_PHOTO(m)}'); background-position: ${m.photoPos || 'center'};`
      : `background: ${m.colorBg};`;

    const card = document.createElement('div');
    card.className = 'member-card';
    card.style.setProperty('--card-color', m.color);
    card.innerHTML = `
      <div class="head">
        <div class="avatar ${m.photo ? 'has-photo' : ''}" style="${avatarStyle}">${m.photo ? '' : m.emoji}</div>
        <div class="info">
          <div class="name">${m.name}</div>
          <div class="alias">${m.alias}</div>
        </div>
      </div>
      <div class="meta-row">${chipsHtml}</div>
      <div class="bazi-row">${m.bazi} · ${m.zodiac}</div>
      <div class="highlight">${m.highlight}</div>
      <div class="today-level" data-level="${state.level}">今日 · ${state.level} · ${state.desc}</div>
      <div class="today-split">
        <div class="split-blk blk-yi"><div class="blk-ttl">今日宜</div>${(state.yi || []).slice(0,2).join('<br>') || '—'}</div>
        <div class="split-blk blk-ji"><div class="blk-ttl">今日忌</div>${(state.ji || []).slice(0,2).join('<br>') || '—'}</div>
      </div>
    `;
    card.onclick = () => {
      setRight(id);
      document.querySelector('.matcher').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    grid.appendChild(card);
  });
}

function renderStars(score) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return '⭐'.repeat(full) + (half ? '✨' : '');
}

function renderStarsAnimated(score) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<span>⭐</span>';
  if (half) html += '<span>✨</span>';
  return html;
}

function renderMatrix() {
  const matrix = document.getElementById('matrix');
  const headerHtml = memberOrder.map(id => {
    const m = members[id];
    const ico = m.photo
      ? `<div style="width:22px;height:22px;border-radius:50%;background-image:url('${MEMBER_PHOTO(m)}');background-position:${m.photoPos || 'center'};background-size:cover;background-color:${m.colorBg};margin:0 auto 2px;"></div>`
      : `<div style="font-size:14px;">${m.emoji}</div>`;
    return `<div class="head-cell">${ico}${m.name}</div>`;
  }).join('');
  matrix.innerHTML = `<div class="head-cell"></div>` + headerHtml;

  memberOrder.forEach(rid => {
    matrix.innerHTML += `<div class="row-label">${members[rid].name}</div>`;
    memberOrder.forEach(cid => {
      if (rid === cid) {
        matrix.innerHTML += `<div class="cell diag">—</div>`;
      } else {
        const r = relations[relKey(rid, cid)];
        const score = r ? r.score : 0;
        const cls = score >= 4.5 ? 's5' : score >= 3.5 ? 's4' : score >= 2.5 ? 's3' : score >= 1.5 ? 's2' : 's1';
        matrix.innerHTML += `<div class="cell ${cls}" data-l="${rid}" data-r="${cid}">${score.toFixed(1)}</div>`;
      }
    });
  });

  const tooltip = document.getElementById('matrixTooltip');
  matrix.querySelectorAll('.cell:not(.diag)').forEach(c => {
    c.onmouseenter = () => {
      const lid = c.dataset.l, rid = c.dataset.r;
      const L = members[lid], R = members[rid];
      const r = relations[relKey(lid, rid)];
      const relWx = relWuxingFromKeyword(r.keyword);
      const tScore = relationTodayScore(r.score, relWx);
      tooltip.innerHTML = `
        <div class="tip-name">${L.name} × ${R.name}</div>
        <div>${r.keyword} · 基础 ${r.score}/5</div>
        <div class="tip-meta">今日 ${tScore.score.toFixed(1)}/5 · ${tScore.hint}</div>
      `;
      tooltip.classList.add('show');
    };
    c.onmousemove = (e) => {
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY + 14) + 'px';
    };
    c.onmouseleave = () => tooltip.classList.remove('show');
    c.onclick = () => {
      setLeft(c.dataset.l);
      setRight(c.dataset.r);
      document.querySelector('.matcher').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  });
}

/* 选择器状态 */
let leftId = 'niu';
let rightId = 'xiaowu';

function setLeft(id) { leftId = id; updatePicker(); }
function setRight(id) { rightId = id; updatePicker(); }

function updatePicker() {
  const L = members[leftId];
  const R = members[rightId];

  const display = document.getElementById('relDisplay');
  display.classList.add('fade');

  const lAv = document.getElementById('leftAvatar');
  const rAv = document.getElementById('rightAvatar');
  lAv.classList.remove('swap'); void lAv.offsetWidth; lAv.classList.add('swap');
  rAv.classList.remove('swap'); void rAv.offsetWidth; rAv.classList.add('swap');

  // 头像：支持像素图
  const setAv = (el, m) => {
    el.textContent = '';
    el.style.backgroundImage = '';
    el.classList.remove('has-photo');
    if (m.photo) {
      el.classList.add('has-photo');
      el.style.backgroundImage = `url('${MEMBER_PHOTO(m)}')`;
      el.style.backgroundPosition = m.photoPos || 'center';
      el.style.backgroundSize = 'cover';
      el.style.backgroundColor = m.colorBg;
    } else {
      el.style.background = m.colorBg;
      el.textContent = m.emoji;
    }
  };
  setAv(lAv, L);
  setAv(rAv, R);

  document.getElementById('leftName').textContent = L.name;
  document.getElementById('leftMeta').textContent = `${L.bazi} · ${L.zodiac}`;
  document.getElementById('rightName').textContent = R.name;
  document.getElementById('rightMeta').textContent = `${R.bazi} · ${R.zodiac}`;

  renderPickerOptions('leftOptions', leftId, setLeft);
  renderPickerOptions('rightOptions', rightId, setRight);

  setTimeout(() => {
    if (leftId === rightId) {
      document.getElementById('relTodayTag').textContent = `今日 · ${todayGz.full}`;
      document.getElementById('relStars').innerHTML = '<span>—</span>';
      document.getElementById('relNum').textContent = '本人';
      document.getElementById('relKey').textContent = '请选择两位不同的成员';
      document.getElementById('relTodayStars').innerHTML = '<span>—</span>';
      document.getElementById('relTodayNum').textContent = '';
      document.getElementById('relTodayDelta').textContent = '';
      document.getElementById('relEssence').textContent = '一个人没法和自己合盘 🦜';
      document.getElementById('relMech').textContent = '—';
      document.getElementById('relBody').textContent = '—';
      document.getElementById('relActions').innerHTML = '<li>换一位试试</li>';
      document.getElementById('relTodayText').textContent = '—';
      display.classList.remove('fade');
      return;
    }

    const r = relations[relKey(leftId, rightId)];
    if (!r) {
      document.getElementById('relStars').innerHTML = '<span>—</span>';
      document.getElementById('relNum').textContent = '';
      document.getElementById('relKey').textContent = '关系数据待补';
      document.getElementById('relEssence').textContent = '这对关系暂未录入';
      display.classList.remove('fade');
      return;
    }

    // 基础
    document.getElementById('relTodayTag').textContent = `今日 · ${todayGz.full} · ${L.name} × ${R.name}`;
    document.getElementById('relStars').innerHTML = renderStarsAnimated(r.score);
    document.getElementById('relNum').textContent = `${r.score.toFixed(1)} / 5.0`;
    document.getElementById('relKey').textContent = r.keyword;
    document.getElementById('relEssence').textContent = r.essence;
    document.getElementById('relMech').textContent = r.mechanism;
    document.getElementById('relBody').textContent = r.body;
    document.getElementById('relActions').innerHTML = r.actions.map(a => `<li>${a}</li>`).join('');
    document.getElementById('relTodayText').textContent = ' ' + r.today;

    // 今日动态分
    const relWx = relWuxingFromKeyword(r.keyword);
    const tScore = relationTodayScore(r.score, relWx);
    document.getElementById('relTodayStars').innerHTML = renderStarsAnimated(tScore.score);
    document.getElementById('relTodayNum').textContent = `${tScore.score.toFixed(1)} / 5.0`;
    const deltaEl = document.getElementById('relTodayDelta');
    deltaEl.textContent = tScore.hint;
    deltaEl.style.color = tScore.delta > 0 ? 'var(--c-forest)' : tScore.delta < 0 ? '#B86E3D' : 'var(--text-mute)';

    display.classList.remove('fade');
  }, 250);
}

function renderPickerOptions(containerId, currentId, setter) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  memberOrder.forEach(id => {
    const m = members[id];
    const opt = document.createElement('div');
    opt.className = 'opt' + (id === currentId ? ' active' : '');
    if (m.photo) {
      opt.classList.add('has-photo');
      opt.style.backgroundImage = `url('${MEMBER_PHOTO(m)}')`;
      opt.style.backgroundPosition = m.photoPos || 'center';
      opt.style.backgroundSize = 'cover';
      opt.style.backgroundColor = m.colorBg;
      opt.textContent = '';
    } else {
      opt.style.background = m.colorBg;
      opt.textContent = m.emoji;
    }
    opt.title = m.name;
    opt.onclick = () => setter(id);
    c.appendChild(opt);
  });
}

/* ━━━━━━━━━━ 五行轮盘（炫版）━━━━━━━━━━ */
function renderWheel() {
  const svg = document.getElementById('uxingWheel') || document.getElementById('wuxingWheel');
  if (!svg) return;

  const wxs = ['木','火','土','金','水']; // 按相生顺序
  const COLORS = { '木':'#5C8A6B','火':'#E89B7A','土':'#C9A26B','金':'#A0B3A0','水':'#6B8FA8' };
  const { base, dyn, mainWx } = todayWuxingStrength();

  const cx = 200, cy = 200, outerR = 170, innerR = 80;
  // 把今日主五行放到正上方（旋转）
  const mainIdx = wxs.indexOf(mainWx);
  const sliceDeg = 72;
  // 让 mainIdx 在索引 0 ·即正上方
  const rotateOffset = -mainIdx * sliceDeg;

  // 5 个扇区
  const slices = wxs.map((wx, i) => {
    // 起始角度（0° = 正上方 · 顺时针）· 每个扇区 72°
    const startAng = -90 + i * sliceDeg - sliceDeg / 2; // 让第 0 个扇区中心在正上方
    const endAng = startAng + sliceDeg;
    const rad = d => (d * Math.PI) / 180;
    const x1o = cx + outerR * Math.cos(rad(startAng));
    const y1o = cy + outerR * Math.sin(rad(startAng));
    const x2o = cx + outerR * Math.cos(rad(endAng));
    const y2o = cy + outerR * Math.sin(rad(endAng));
    const x1i = cx + innerR * Math.cos(rad(startAng));
    const y1i = cy + innerR * Math.sin(rad(startAng));
    const x2i = cx + innerR * Math.cos(rad(endAng));
    const y2i = cy + innerR * Math.sin(rad(endAng));
    const path = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 0 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 0 0 ${x1i} ${y1i} Z`;
    // 文字位置（扇区中心）
    const midAng = (startAng + endAng) / 2;
    const tx = cx + ((outerR + innerR) / 2) * Math.cos(rad(midAng));
    const ty = cy + ((outerR + innerR) / 2) * Math.sin(rad(midAng));
    return { wx, path, tx, ty, color: COLORS[wx], val: dyn[wx], base: base[wx] };
  });

  // SVG
  let svgContent = '';
  // 背景圆盘
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${outerR + 8}" fill="rgba(244,247,242,0.6)"/>`;
  slices.forEach((s, i) => {
    const dim = (s.wx !== mainWx && s.wx !== BRANCH_WX[todayGz.branch]) ? 'dim' : '';
    svgContent += `<g class="wheel-slice ${dim}" data-wx="${s.wx}" data-idx="${i}">
      <path d="${s.path}" fill="${s.color}" opacity="0.85"/>
      <text x="${s.tx}" y="${s.ty - 4}" class="wheel-center-txt" text-anchor="middle" font-size="20" font-weight="600" fill="#fff">${s.wx}</text>
      <text x="${s.tx}" y="${s.ty + 14}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.9)" font-family="'Space Grotesk', monospace">${s.val.toFixed(1)}</text>
    </g>`;
  });
  // 中心圆
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${innerR - 2}" fill="${COLORS[mainWx]}" opacity="0.15"/>`;
  svgContent += `<text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="'Cormorant Garamond', 'Noto Serif SC', serif" font-size="22" font-weight="600" fill="${COLORS[mainWx]}">${todayGz.full}</text>`;
  svgContent += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="#7A8378" font-family="'Space Grotesk', monospace" letter-spacing="2">TODAY MAIN ${mainWx}</text>`;

  svg.innerHTML = svgContent;

  // 外侧信息栏（成员映射）
  const info = document.getElementById('wheelInfo');
  const wxMembers = { '木':[], '火':[], '土':[], '金':[], '水':[] };
  memberOrder.forEach(id => {
    const mw = members[id].mainWuxing;
    if (mw) wxMembers[mw].push(members[id].name);
  });
  document.getElementById('wheelTitleAccent').textContent = `${mainWx}位当令`;
  info.innerHTML = `<div class="w-title">五行 <em style="font-style:italic;color:${COLORS[mainWx]}">${mainWx}</em> 主</div>
    <div class="w-sub">${todayGz.full} · ${dateFmt()}</div>` +
    wxs.map(wx => {
      const mem = wxMembers[wx].join(' · ') || '—';
      const delta = (dyn[wx] - base[wx]);
      const deltaHtml = Math.abs(delta) < 0.01 ? '—' :
        delta > 0 ? `<span class="w-delta up">+${delta.toFixed(1)}</span>` :
        `<span class="w-delta down">${delta.toFixed(1)}</span>`;
      return `<div class="w-row" data-wx="${wx}">
        <span class="w-dot" style="background:${COLORS[wx]}"></span>
        <span class="w-k" style="color:${COLORS[wx]}">${wx}</span>
        <span class="w-v">${mem}</span>
        ${deltaHtml}
      </div>`;
    }).join('');

  // 交互：hover 扇区 → 突出对应 info 行
  svg.querySelectorAll('.wheel-slice').forEach(sl => {
    sl.addEventListener('mouseenter', () => {
      svg.querySelectorAll('.wheel-slice').forEach(x => x.classList.add('dim'));
      sl.classList.remove('dim');
      sl.classList.add('active');
    });
    sl.addEventListener('mouseleave', () => {
      svg.querySelectorAll('.wheel-slice').forEach(x => {
        x.classList.remove('active');
        // 恢复主/辅的默认高亮
        if (x.dataset.wx === mainWx || x.dataset.wx === BRANCH_WX[todayGz.branch]) x.classList.remove('dim');
        else x.classList.add('dim');
      });
    });
    sl.addEventListener('click', () => {
      const wx = sl.dataset.wx;
      // 筛选该五行相关成员 · 把第一个设为 right
      const mems = wxMembers[wx];
      if (mems.length > 0) {
        const found = memberOrder.find(id => members[id].name === mems[0]);
        if (found) {
          setRight(found);
          document.querySelector('.matcher').scrollIntoView({behavior:'smooth',block:'center'});
        }
      }
    });
  });
}

function dateFmt() {
  const d = TODAY;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* 初始化（包加 try-catch · 任一函数失败不影响其他）*/
function safe(fn, name) {
  try { fn(); } catch (e) { console.error('[render error]', name, e); }
}
safe(renderHead, 'head');
safe(renderHeroToday, 'heroToday');
safe(renderWuxing, 'wuxing');
safe(renderCards, 'cards');
safe(renderMatrix, 'matrix');
safe(updatePicker, 'picker');
safe(renderWheel, 'wheel');
