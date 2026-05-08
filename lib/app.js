/**
 * luck-today · index.html 主入口脚本
 * ---
 * 从 index.html 内联抽出 · Step C 重构
 * 依赖加载顺序：gate.js → vendor/lunar.js → lib/relations.js → lib/members.js → lib/luck-engine.js → 本文件
 */

/* ━━━━━━━━━━ 用户档案（直接硬编码 · 已与 LuckCraft 一致）━━━━━━━━━━ */
const USERS = {
  niu: {
    id: 'niu', year: 1989, month: 5, day: 15, hour: 14, gender: '男',
    accent: { color: '#5C8A6B', bg: '#E2EDE5' },
    challenges: [
      { tag: '事业', text: '今天主动向一位同事请教一个具体问题，记录在备忘里' },
      { tag: '财运', text: '今天记录所有支出，找出 1 笔可以省下的' },
      { tag: '健康', text: '今天做 10 分钟拉伸，把肩颈放松一次' },
      { tag: '社交', text: '给一位 30 天没联系的朋友发个问候' },
      { tag: '学习', text: '看 1 篇高质量长文，提取 3 个要点' }
    ]
  },
  xixi: {
    id: 'xixi', year: 1999, month: 6, day: 3, hour: 22, gender: '女',
    accent: { color: '#C9A26B', bg: '#F5EBD8' },
    challenges: [
      { tag: '形象', text: '今天搭一身让自己满意的造型，自拍存档' },
      { tag: '社交', text: '今天给一位喜欢的家人/朋友寄一句感谢' },
      { tag: '心情', text: '今天写 3 件让自己开心的小事' },
      { tag: '学习', text: '今天背 5 个英语长句' },
      { tag: '健康', text: '今天喝够 1.5 升水，睡前不刷手机 30 分钟' }
    ]
  }
};

/* ━━━━━━━━━━ Live Topbar ━━━━━━━━━━ */
function pad(n) { return String(n).padStart(2, '0'); }
function updateLive() {
  const now = new Date();
  document.getElementById('liveTime').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
setInterval(updateLive, 1000);
updateLive();

function updateLiveGanzhi() {
  const today = LuckEngine.compute(USERS.niu).today;
  document.getElementById('liveGanzhi').textContent = `${today.dayGan}${today.dayZhi} · ${today.animal}`;
  document.getElementById('liveLunar').textContent = today.lunarDate;
}

/* ━━━━━━━━━━ 渲染单个人 ━━━━━━━━━━ */
function fmtRange([s, e]) { return `${pad(s)}–${pad(e === 0 ? 24 : e)}`; }

function render(userKey) {
  const user = USERS[userKey];
  const data = LuckEngine.compute(user);
  const prefix = userKey;

  // Hero · 现在该做什么
  const cg = data.currentGate;
  const nowEl = document.getElementById(`${prefix}-now`);
  nowEl.classList.remove('bad', 'neutral');
  let cls = 'good';
  if (cg.luck === '凶' || cg.luck === '大凶') cls = 'bad';
  else if (cg.luck === '中') cls = 'neutral';
  if (cls !== 'good') nowEl.classList.add(cls);
  document.getElementById(`${prefix}-now-tag`).textContent = `现在 · ${cg.zhi}时 · ${cg.gate} · ${cg.luck}`;
  document.getElementById(`${prefix}-now-title`).textContent = cg.advice;
  document.getElementById(`${prefix}-now-desc`).textContent = `${data.theme.shiShen}日 · ${data.theme.theme}`;
  // 倒计时
  const next = data.nextGood;
  const meta = document.getElementById(`${prefix}-now-meta`);
  meta.innerHTML = '';
  if (next.gate) {
    const m = Math.floor(next.minutesLeft);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    meta.innerHTML = `
      <span class="countdown">⏳ ${h>0?h+'h ':''}${mm}m 后 → ${next.gate.zhi}时 ${next.gate.gate}</span>
      <span>📍 今日吉方：${data.recommendations.bestDir}</span>
      <span>🎯 数字：${data.recommendations.numbers.join(' · ')}</span>
    `;
  }

  // 今日主题
  document.getElementById(`${prefix}-theme-title`).textContent = data.theme.theme;
  document.getElementById(`${prefix}-theme-shen`).textContent = `${data.theme.shiShen}日`;
  document.getElementById(`${prefix}-theme-scene`).textContent = data.theme.scene;
  document.getElementById(`${prefix}-theme-meta`).textContent = `${data.today.dayGan}${data.today.dayZhi}日`;

  document.getElementById(`${prefix}-good`).innerHTML = data.theme.goodFor.map(x => `<li>${x}</li>`).join('');
  document.getElementById(`${prefix}-bad`).innerHTML = data.theme.watchOut.map(x => `<li>${x}</li>`).join('');

  // 宜忌
  document.getElementById(`${prefix}-yi`).innerHTML = data.yiJi.yi.map(x => `<li>${x}</li>`).join('');
  document.getElementById(`${prefix}-ji`).innerHTML = data.yiJi.ji.map(x => `<li>${x}</li>`).join('');

  // 时段
  const hoursEl = document.getElementById(`${prefix}-hours`);
  const nowZhi = cg.zhi;
  hoursEl.innerHTML = data.gates.map(g => {
    let cellCls = 'hour-cell';
    if (g.luck === '吉' || g.luck === '大吉') cellCls += ' good';
    else if (g.luck === '凶' || g.luck === '大凶') cellCls += ' bad';
    if (g.zhi === nowZhi) cellCls += ' now';
    // 个人级别颜色（personalLevel > 0 绿 · < 0 红）
    let personalBadgeCls = 'h-personal';
    if (g.personalLevel > 0) personalBadgeCls += ' good';
    else if (g.personalLevel < 0) personalBadgeCls += ' bad';
    return `
      <div class="${cellCls}">
        <div class="h-line1">
          <span class="h-time">${g.zhi === nowZhi ? '▶ ' : ''}${fmtRange(g.hourRange)}</span>
          <span class="h-gate">${g.gate}</span>
          <span class="h-tag">${g.tag}</span>
          ${g.personalTag ? `<span class="${personalBadgeCls}">· ${g.personalTag}</span>` : ''}
        </div>
        <div class="h-plain">${g.plain || g.advice}</div>
        ${g.personalHint ? `<div class="h-personal-hint">${g.personalHint}</div>` : ''}
      </div>
    `;
  }).join('');

  // 四维（含算分依据 · 点击展开）
  const dimEl = document.getElementById(`${prefix}-dims`);
  const bd = data.dim._breakdown || {};
  dimEl.innerHTML = Object.entries(data.dim).map(([k, v]) => {
    const b = bd[k];
    const toneClass = b ? (b.tone === '强' ? 'tone-strong' : b.tone === '弱' ? 'tone-weak' : 'tone-mid') : '';
    const hint = b ? `${b.weightReason} · ${b.formula}` : '';
    return `
      <div class="dim-row ${toneClass}" ${b ? `title="${hint}"` : ''}>
        <span>${k}${b ? `<span class="dim-tone">${b.tone}</span>` : ''}</span>
        <div class="dim-bar"><span style="width:${v}%"></span></div>
        <span class="dim-num">${v}</span>
      </div>
    `;
  }).join('');
  document.getElementById(`${prefix}-score`).textContent = data.score;
  // 算分依据说明
  const breakdownEl = document.getElementById(`${prefix}-score-reason`);
  if (breakdownEl) {
    const firstKey = Object.keys(bd)[0];
    const sample = firstKey ? bd[firstKey] : null;
    breakdownEl.innerHTML = sample
      ? `<details><summary>查看算分逻辑</summary>
           <div class="score-breakdown">
             <div><b>基础分</b>：${sample.baseReason}</div>
             <div><b>维度加权</b>（按今日十神"${data.theme.shiShen}"）：</div>
             <ul>
               ${Object.entries(bd).map(([k, b]) => `
                 <li>${k}：${b.base} × ${b.weight.toFixed(2)} ${b.jitter >= 0 ? '+' : ''}${Math.round(b.jitter)} = <b>${data.dim[k]}</b></li>
               `).join('')}
             </ul>
             <div class="score-note">* 抖动基于"姓名+日柱+维度"哈希 · 同一人同一天完全稳定</div>
           </div>
         </details>`
      : '';
  }

  // 推荐
  const r = data.recommendations;
  const recoEl = document.getElementById(`${prefix}-reco`);
  recoEl.innerHTML = `
    <div class="reco-cell">
      <div class="rc-label">穿搭</div>
      <div class="rc-value">${r.colors.join(' / ')}</div>
      <div class="rc-extra">${r.colorsAdvice}</div>
      <button class="copy-btn" data-copy="${r.colors.join(' · ')} · ${r.colorItems.join('、')}">📋 复制配色</button>
    </div>
    <div class="reco-cell">
      <div class="rc-label">饰品加持</div>
      <div class="rc-value">${r.accessory}</div>
      <div class="rc-extra">本命用神 · 五行加成</div>
    </div>
    <div class="reco-cell">
      <div class="rc-label">吉方</div>
      <div class="rc-value">${r.bestDir}</div>
      <div class="rc-extra">忌：${r.worstDir}</div>
    </div>
    <div class="reco-cell">
      <div class="rc-label">幸运数字</div>
      <div class="rc-value">${r.numbers.join(' · ')}</div>
      <div class="rc-extra">用神色：${r.colors[0]}</div>
    </div>
    <div class="reco-cell reco-foods">
      <div class="rc-label">趋吉饮食 · 配饮</div>
      <div class="rc-value">${r.foods.join(' · ')} · 配 ${r.drink}</div>
      <button class="copy-btn" data-copy="${r.foods.join(' · ')} · 配 ${r.drink}">📋 复制菜单</button>
    </div>
  `;

  // 5 个扩展子模块
  const extraEl = document.getElementById(`${prefix}-reco-extra`);
  if (extraEl) {
    extraEl.innerHTML = `
      <div class="sub-card sub-avoid">
        <div class="sub-title">🚫 今日避坑清单</div>
        <ul class="sub-list">${(r.avoidList || []).map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
      <div class="sub-card sub-wellness">
        <div class="sub-title">💪 今日身体作息</div>
        <div class="sub-kv"><span class="sub-k">饮水</span><span class="sub-v">${r.wellness.drink}</span></div>
        <div class="sub-kv"><span class="sub-k">运动</span><span class="sub-v">${r.wellness.move}</span></div>
        <div class="sub-kv"><span class="sub-k">睡眠</span><span class="sub-v">${r.wellness.sleep}</span></div>
      </div>
      <div class="sub-card sub-helper">
        <div class="sub-title">👥 今日贵人属相</div>
        <div class="sub-kv"><span class="sub-k">今日值神</span><span class="sub-v">${r.helper.todayLucky}</span></div>
        <div class="sub-kv"><span class="sub-k">长期贵人</span><span class="sub-v">${r.helper.longTerm.join(' · ')}</span></div>
        <div class="sub-note">${r.helper.note}</div>
      </div>
      <div class="sub-card sub-home">
        <div class="sub-title">🏠 今日居家布局</div>
        <div class="sub-kv"><span class="sub-k sub-k-good">宜</span><span class="sub-v">${r.home.do}</span></div>
        <div class="sub-kv"><span class="sub-k sub-k-bad">忌</span><span class="sub-v">${r.home.dont}</span></div>
        <div class="sub-note">${r.home.tip}</div>
      </div>
      <div class="sub-card sub-speech">
        <div class="sub-title">🗣 今日说话建议</div>
        <div class="sub-note" style="margin-bottom:6px;font-weight:700;color:var(--ink)">${r.speech.tone}</div>
        <div class="sub-kv"><span class="sub-k">对领导</span><span class="sub-v">${r.speech.toLeader}</span></div>
        <div class="sub-kv"><span class="sub-k">对同事</span><span class="sub-v">${r.speech.toPeer}</span></div>
        <div class="sub-kv"><span class="sub-k">对家人</span><span class="sub-v">${r.speech.toFamily}</span></div>
      </div>
    `;
  }

  // 塔罗 · v2（新 DOM 结构 + L2 解读）
  const t = data.tarot;
  const tarotEl = document.getElementById(`${prefix}-tarot`);
  tarotEl.innerHTML = renderTarotCard(t);

  // 挑战（基于今日主题十神选 1 条）
  const ch = pickChallenge(user, data.theme);
  document.getElementById(`${prefix}-challenge`).textContent = `[${ch.tag}] ${ch.text}`;

  return data;
}

/* ━━━━━━━━━━ 塔罗渲染（统一函数） ━━━━━━━━━━ */
function renderTarotCard(card, question) {
  if (!card) return '';
  const elem = card.element || 'arcana';
  const elemIcon = { fire: '🔥', water: '💧', air: '💨', earth: '🌍', arcana: '✧' }[elem] || '✧';
  const cardNum = String(card.id).padStart(2, '0');
  const pos = card.reversed ? '逆位' : '正位';
  const adviceLabel = card.reversed ? '⚠ 提醒' : '✨ 建议';
  const advice = card.reversed ? (card.dnAdvice || card.dn) : (card.upAdvice || card.up);
  const meaning = card.reversed ? (card.dn || card.meaning) : (card.up || card.meaning);

  return `
    <div class="tarot-card elem-${elem}${card.reversed ? ' reversed' : ''}">
      <span class="t-num">${cardNum}</span>
      <span class="t-elem">${elemIcon}</span>
      <div class="t-emoji">${card.emoji}</div>
      <div class="t-name">${card.name}</div>
      ${card.en ? `<div class="t-name-en">${card.en}</div>` : ''}
      <div class="t-pos">${pos}</div>
    </div>
    <div class="tarot-meaning${card.reversed ? ' reversed' : ''}">
      ${question ? `<div class="t-advice" style="margin-bottom:8px"><span class="t-advice-label">问：</span>${question}</div>` : ''}
      <div class="t-headline">${card.name} · ${pos}</div>
      ${card.core ? `
        <div class="t-core">
          <div class="t-core-label">牌意内核</div>
          ${card.core}
        </div>` : ''}
      <div class="t-advice"><span class="t-advice-label">${adviceLabel}：</span>${advice}</div>
      <div class="t-advice" style="color:var(--ink-mute);font-size:11px;margin-top:4px">关键词：${meaning}</div>
    </div>
  `;
}

function pickChallenge(user, theme) {
  // 基于十神选最匹配 tag 的挑战
  const map = {
    '正官': '事业', '七杀': '事业',
    '正财': '财运', '偏财': '财运',
    '食神': '心情', '伤官': '社交',
    '比肩': '社交', '劫财': '健康',
    '正印': '学习', '偏印': '学习'
  };
  const target = map[theme.shiShen] || '心情';
  const candidates = user.challenges.filter(c => c.tag === target);
  const pool = candidates.length ? candidates : user.challenges;
  // 用日期作种子保证当天稳定
  const idx = new Date().getDate() % pool.length;
  return pool[idx];
}

/* ━━━━━━━━━━ 节气专题 ━━━━━━━━━━ */
function renderJieqi() {
  const data = LuckEngine.compute(USERS.niu);
  const today = data.today;
  if (!today.jieQi) return;
  const box = document.getElementById('jieqiBox');
  box.style.display = '';
  document.getElementById('jieqiContent').innerHTML = `
    <div style="font-size:18px;font-weight:700;margin-bottom:6px">「${today.jieQi}」交节日 · 能量切换</div>
    <p style="color:var(--ink-soft);font-size:13px;line-height:1.7">
      今天是 ${today.jieQi} 节气日，节气日是命理能量的切换点。建议两位都把今天作为"小盘点+小启动"日：
      上半天复盘上一节气的得失，下半天定下未来 15 天的关键 1-3 件事。
    </p>
  `;
}

/* ━━━━━━━━━━ 大运 3 步（精简：八字+流年用神匹配） ━━━━━━━━━━ */
function renderDayun() {
  const box = document.getElementById('dayunBox');
  const niu = LuckEngine.compute(USERS.niu);
  const xixi = LuckEngine.compute(USERS.xixi);
  function blockOf(label, color, baseYear, items) {
    return `
      <div style="border-left:3px solid ${color};padding-left:14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px">${label} · 关键 3 步</div>
        ${items.map(it => `
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--ink-soft);font-feature-settings:'tnum'">${it.year}（${it.year - baseYear} 年后）· ${it.tag}</div>
            <div style="font-size:13px">${it.note}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  const baseYear = new Date().getFullYear();
  box.innerHTML =
    blockOf('牛牛 · 乙木用水', '#5C8A6B', baseYear, [
      { year: 2027, tag: '丁未流年 · 火土泄身', note: '保守稳一手 · 健康优先 · 不要换赛道' },
      { year: 2031, tag: '辛亥流年 · 水星临门', note: '远行/留学/拓展 · 用神高分窗口' },
      { year: 2032, tag: '甲子大运启动', note: '十年好运起步 · 正财与正印双高 · 蓄力期收尾' }
    ]) +
    blockOf('嘻嘻 · 丙火用水', '#C9A26B', baseYear, [
      { year: 2027, tag: '丁未流年 · 同火并立', note: '事业上有同辈竞争 · 文昌运高 · 重要考试/作品的黄金年' },
      { year: 2030, tag: '庚戌流年 · 财官双显', note: '事业进阶/感情明朗双窗口' },
      { year: 2031, tag: '辛亥流年 · 用神高分', note: '可远行/留学/换城市 · 命理调候到位' }
    ]);
}

/* ━━━━━━━━━━ 视图切换 ━━━━━━━━━━ */
document.getElementById('viewSwitch').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  const mode = e.target.dataset.mode;
  document.getElementById('duoWrap').dataset.mode = mode;
  [...e.currentTarget.children].forEach(b => b.classList.toggle('active', b === e.target));
  // 写到 localStorage 作为下次默认
  try { localStorage.setItem('LUCK_default_view', mode); } catch (e) {}
});

/* ━━━━━━━━━━ 复制按钮 ━━━━━━━━━━ */
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  navigator.clipboard.writeText(btn.dataset.copy).then(() => {
    const t = document.getElementById('toast');
    t.textContent = '已复制：' + btn.dataset.copy.slice(0, 30) + (btn.dataset.copy.length > 30 ? '…' : '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1500);
  });
});

/* ━━━━━━━━━━ 塔罗追问 ━━━━━━━━━━ */
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.tarot-ask button');
  if (!btn) return;
  const userKey = btn.dataset.user;
  const input = btn.parentElement.querySelector('input');
  const q = input.value.trim();
  const card = LuckEngine.drawTarot(q || null);
  LuckEngine.pushTarotRecord(userKey, card);

  const tEl = document.getElementById(`${userKey}-tarot`);
  tEl.innerHTML = renderTarotCard(card, q);
});

/* ━━━━━━━━━━ 双人关系亮点 ━━━━━━━━━━ */
function renderCouple() {
  const r = (window.RELATIONS && window.RELATIONS['niu_xixi']) || null;
  if (!r) return;
  const stars = '⭐'.repeat(Math.round(r.score));
  document.getElementById('csKeyword').textContent = r.keyword;
  document.getElementById('csScore').textContent = `匹配 ${r.score}/5  ${stars}`;
  document.getElementById('csEssence').textContent = r.essence;

  // 动态今日（不用 r.today 那条静态字符串，改用流日计算）
  const todayPillars = LuckEngine.compute(USERS.niu).today;
  const dyn = LuckEngine.calcRelationToday(r, todayPillars, window.MEMBERS, ['niu', 'xixi']);
  const flavorColor = {
    strong: 'var(--good)',
    bless:  'var(--niu)',
    neutral: 'var(--ink-soft)',
    drain:  'var(--xixi)',
    weak:   'var(--bad)'
  };
  const flavorLabel = {
    strong: '今日 · 能量峰',
    bless:  '今日 · 受流日加持',
    neutral: '今日 · 平稳',
    drain:  '今日 · 略泄',
    weak:   '今日 · 低峰'
  };
  document.getElementById('csToday').innerHTML =
    `<strong style="color:${flavorColor[dyn.flavor] || 'var(--niu)'}">${flavorLabel[dyn.flavor] || '今日'} · </strong>${dyn.today}`;
  // actions 也用动态的（每天不同）· 回退到 r.actions 只在 dyn 没返回时
  const actionsToShow = (dyn.actions && dyn.actions.length ? dyn.actions : (r.actions || [])).slice(0, 3);
  document.getElementById('csActions').innerHTML = actionsToShow
    .map(a => `<li>${a}</li>`).join('');
}

/* ━━━━━━━━━━ Tab 切换 + iframe 懒加载 ━━━━━━━━━━ */
function setupTabs() {
  const tabbar = document.getElementById('tabbar');
  const panes = document.querySelectorAll('.tab-pane');
  tabbar.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    const tab = e.target.dataset.tab;
    [...tabbar.children].forEach(b => b.classList.toggle('active', b === e.target));
    panes.forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    // iframe 懒加载
    const pane = document.getElementById(`tab-${tab}`);
    const iframe = pane.querySelector('iframe[data-src]');
    if (iframe && !iframe.src) {
      iframe.src = iframe.dataset.src;
    }
  });
}

/* ━━━━━━━━━━ 默认视角 ━━━━━━━━━━ */
function applyDefaultView() {
  const params = new URLSearchParams(location.search);
  let mode = params.get('u');
  if (!mode) {
    mode = localStorage.getItem('LUCK_default_view') || 'duo';
  }
  if (!['duo', 'niu', 'xixi'].includes(mode)) mode = 'duo';
  document.getElementById('duoWrap').dataset.mode = mode;
  // 高亮按钮
  const switchEl = document.getElementById('viewSwitch');
  [...switchEl.children].forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

/* ━━━━━━━━━━ 启动 ━━━━━━━━━━ */
function refreshAll() {
  render('niu');
  render('xixi');
  updateLiveGanzhi();
  renderCouple();
}

setupTabs();
applyDefaultView();
refreshAll();
renderJieqi();
renderDayun();

// 每分钟刷新当前时段相关
setInterval(() => {
  // 不重新签到（autoSign 内已防重）
  render('niu');
  render('xixi');
}, 60 * 1000);
