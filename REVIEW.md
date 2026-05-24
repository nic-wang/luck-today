# luck-today · 代码 Review（2026-05-07）

> 本文件仅本地存在 · **不进 commit** · 用来对齐改进方向  
> 完成 review 后可以按结论拆 issue / 分支执行，本文件可删

---

## 📊 仓库体检数据

| 指标 | 值 | 备注 |
|---|---|---|
| 源码文件总行数 | **4,245** 行（不含 vendor） | vendor/lunar.js 独占 8,538 行 |
| `index.html` | 1,161 行 · 49 KB | HTML+CSS+内联 JS 全塞在一起 |
| `family/index.html` | 2,046 行 · 82 KB | 同上 · 而且更胖 |
| `lib/luck-engine.js` | 457 行 · 25 KB | 算法主力 |
| `lib/relations.js` | 158 行 · 10 KB | 关系数据 |
| `lib/gate.js` | 183 行 · 6 KB | PIN 门 |
| `sw.js` | 97 行 | Service Worker |
| 内联脚本 | index.html 395 行 · family 897 行 | **应该外提** |
| TODO / FIXME | 0 条 | 代码里没标 bug |
| Commit 数 | 9 条（全在近 9 天） | 小步快跑 |

**总体印象**：从"能跑的原型"到"能维护的产品"中间还差一层。每个文件自给自足没问题，但**两个入口之间有严重的逻辑/数据重复**，这是最大的负债。

---

## 🏆 五维度打分（10 分制）

| 维度 | 得分 | 评语 |
|---|---|---|
| **可读性** | 6/10 | HTML/CSS/JS 未分离 · 两个大文件各读一遍头昏；但 luck-engine 分段注释清晰很加分 |
| **一致性** | 4/10 | 🚨 核心算法有"两套"，`relations` 数据有"两份"，两边对"今天是什么日子"可能给出不同答案 |
| **性能** | 7/10 | 纯静态 · PWA 离线 OK · 但 vendor/lunar.js 436 KB 全量引入有优化空间 |
| **可维护性** | 5/10 | 硬编码 + 内联 + 重复 = 改一处要想三处；没有构建步骤、没测试、没分支工作流 |
| **可扩展性** | 5/10 | 加第 3 个人（比如以后孩子）得同时改 index.html / family/index.html / lib/relations.js / luck-engine 四处；关系矩阵 O(n²) 手填也不好扩 |

**加权综合：5.4 / 10** —— 原型期合格，产品化之前需要补技术债。

---

## 🚨 三大严重问题（必须先处理）

### 🔴 #1 · 核心算法被实现了两遍（一致性风险）

**现状**：
- `lib/luck-engine.js` 基于 **vendor/lunar.js**（真正的农历八字库）计算日干支
- `family/index.html` 里**自己手写了一套简化版**（`dayGanzhi / monthGanzhi / yearGanzhi`），**没用 lunar.js**

**后果**：
- `index.html` 说今天是"庚辰日"，`family/index.html` 可能算出"辛巳日"
- 节气日特别危险：lunar 认节气切换点，手写版只按公历月份
- 每次改算法都要改两处，迟早漂移

**证据**：
```javascript
// family/index.html:1408-1437
const STEM_WX = { '甲':'木',... };  // luck-engine.js:14 已有
function dayGanzhi(date) { ... }   // luck-engine.js 用的是 lunar.getDayGan()
function monthGanzhi(date) { ... }  // 纯公历近似 · 不算节气
```

**建议**：family/index.html 也加载 `vendor/lunar.js` + `lib/luck-engine.js`，删掉自己那套 `STEM_WX/dayGanzhi/monthGanzhi/WX_GEN/WX_KE/todayWuxingStrength/todayYiJi/memberTodayState/relationTodayScore`。估计能删掉 150-200 行。

---

### 🔴 #2 · `relations` 数据复制了两份

**现状**：15 组关系数据（`niu_xixi` / `niu_paopao` / ...）在 `lib/relations.js` 和 `family/index.html` 里**逐字重复**。

**后果**：
- 改一处文案（比如今天加了一条 action）忘了改另一处 → 两个页面看到的关系描述不一致
- 今天 7 点多我们改 index 的时候就差点踩到

**证据**：两处 key 集合完全一致，内容也一样，只是缩进不同。

**建议**：
- family/index.html 改成直接用 `window.RELATIONS`（lib/relations.js 已经 export 到 window）
- 删掉 1267-1400 那一段内联 `const relations = {...}`
- 主 index.html 已经在用 `window.RELATIONS['niu_xixi']`（783 行 renderCouple 里），模式是对的

---

### 🔴 #3 · HTML 里的内联 JS 过大（可维护性）

**现状**：
- index.html 内联 395 行 JS（渲染、签到、tab、塔罗）
- family/index.html 内联 897 行 JS（数据、关系矩阵、画布、SVG）
- 任何 JS 改动 = HTML 文件变更 = git diff 看起来像是 HTML 大改

**后果**：
- 找 bug 得在一个 2000+ 行文件里定位
- 文本编辑器代码折叠失效（HTML + JS 混合）
- 未来想写测试，这种代码完全没法测

**建议**（分三步走，每步都能独立落地）：
1. 把 index.html 的 `<script>…</script>` 拆成 `lib/app.js`
2. 把 family/index.html 的大 `<script>` 拆成 `lib/family.js`（数据层+渲染层）
3. 把 `members` 数据单独抽出来 `lib/members.js`（家庭成员档案 · 可以和 USERS 合并）

不需要任何构建工具 · 纯 `<script src>` 就行。

---

## 🟡 七个可改进点（影响没那么大 · 时间有空再做）

### #4 · 牛牛栏和嘻嘻栏 HTML 镜像重复（250 行）

`index.html` 里 505-595 行（牛牛）和 598-688 行（嘻嘻）几乎是复制粘贴，只差名字和 id 前缀。

**建议**：用 `<template>` + JS 克隆渲染，或直接写个 `renderUserColumn(userKey)` 函数生成 DOM。

---

### #5 · 用户档案散落三处

同一个"牛牛"在代码里出现了至少 3 次：
- `index.html:766-775` USERS.niu（生日 + challenges）
- `index.html:510-513` 硬编码在 HTML（名字 · 王宁 · 乙木 · 八字）
- `family/index.html:1167-1182` members.niu（emoji + color + chips + highlight）

**建议**：
- 建 `lib/members.js` 作为**单一事实源**
- 两边都从这里读
- HTML 里的文字由 JS 填充，不再硬编码

---

### #6 · Service Worker 缓存策略的小瑕疵

**发现**：
- `manifest.json` **没加进 PRECACHE**（sw.js:16-33 清单里缺它）→ 离线时浏览器可能说"manifest 404"
- HTML 用 network-first + 把最新响应写回 cache · **但是 sw.js 自己不在 PRECACHE 里**（其实 SW 不靠 cache 加载，这一条其实 OK，提一下）
- "update found" 没给用户提示（改了代码、push 了，用户开 PWA 还是看到旧版，直到后台刷新完）

**建议**：
- manifest.json 加进 PRECACHE
- 监听 `controllerchange` 事件，弹个小 toast："发现新版本，点这里刷新" —— 30 行代码

---

### #7 · PIN 门有个假 bug：浏览器模式也被 PWA 模式清掉了

**`lib/gate.js:52-57`**：
```javascript
try {
  if (isPWA()) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  // 注意：浏览器模式不清 localStorage · 保留 PWA 的通行证
} catch (e) {}
```

这段逻辑是：PWA 启动时清掉 sessionStorage 的残留。但如果同一设备 iOS Safari 有开过 PWA，又在浏览器里打开，浏览器的 `sessionStorage` 不会被清（对），可是 `localStorage` 里的通行证**对浏览器和 PWA 是共享的**（同源）—— 意味着用户在浏览器模式也会不用输 PIN，和你的设计"浏览器模式每次都要输"矛盾。

**建议**：分 key 存——`LUCK_GATE_PASS_PWA` 和 `LUCK_GATE_PASS_SESSION`，互不干扰。

---

### #8 · vendor/lunar.js 体积 436 KB 全量引入

首次加载要下 436 KB 的农历库，但你其实只用了 5 个方法（`fromYmdHms / getLunar / getEightChar / getYearGan...etc`）。

**建议**：
- 短期：不改（PWA 首次装完就缓存了，只影响初次加载）
- 中期：用 `lunar-javascript` 的 ESM 版本按需引入
- 长期：自己写个极简版（你用到的逻辑可能只要 100 行）

---

### #9 · CSS 在 index.html 和 family/index.html 里各写一套

一些 token（`--ink`、`--ink-soft`、`--niu`、`--xixi`、`--gold` 等）显然是"全站的"但写在各自 `<style>` 里。颜色一改两处。

**建议**：抽 `assets/theme.css` 作为公共主题，两个 HTML 都 `<link rel="stylesheet">`。CSS 文件单独缓存效率也更高。

---

### #10 · 随机性的可重复性陷阱

**`luck-engine.js:279`**：
```javascript
dim[k] = Math.max(20, Math.min(95, Math.round(base * v + (Math.random() * 8 - 4))));
```

四维分加了 `Math.random()` 抖动 → **每次刷新页面分数都变**。但你的 UI 1 分钟定时 `render()` 一次（index.html:1145），说明你希望分数稳定。

**现象**：你会看到事业分从 72 跳到 68 再跳到 75 —— 用户体感"这算命怎么不靠谱"。

**建议**：把 `Math.random()` 换成基于 `${userId}-${dayGanzhi}` 的哈希（你已经在 `todayCard` 里用过这个套路），当天稳定。

---

## 🟢 做得好的地方（别动）

1. **算法模块化**：`luck-engine.js` 的 11 个小节划分 + 段落注释，是全仓可读性最高的文件
2. **单一入口 `compute(user)`** 设计优雅，调用方不需要懂内部
3. **`CLAUDE.md` 建立了**"这里才是真源"的规范 —— 昨天踩的坑以后不会再踩
4. **Service Worker 分级策略**（HTML network-first + 图片 cache-first）思路正确
5. **PWA 路径全相对 `assets/icons/icon-180.png`** · Pages 部署到子路径不会挂
6. **manifest.json `scope` 限制到 `/luck-today/`** 这样 PWA 不会误捕获其他站点

---

## 📋 优先级矩阵

```
影响 ↑
高    │  #1 算法双套     │  #3 HTML/JS 分离
      │  #2 relations     │
      │                   │
中    │  #7 PIN 门        │  #5 用户档案散落
      │  #10 随机分数     │  #4 牛牛嘻嘻镜像
      │  #6 SW 瑕疵       │
      │                   │
低    │                   │  #9 CSS 抽出
      │                   │  #8 lunar.js 体积
      ├───────────────────┼─────────────────────→ 工作量
      小                   大
```

**推荐顺序**：
- 🚀 **本周先做 #1 + #2**：一致性风险最高，工作量中等（150-200 行代码删除）
- 🪣 **下次 UI 改版时顺手做 #3 + #4 + #5**：文件体量重整，迁移成本但能收回 1000+ 行
- 💤 **有空再做 #6 / #7 / #10**：不阻塞任何功能
- 🔮 **#8 / #9 可以不做**：收益低，除非要上非 PWA 浏览器

---

## 🧪 建议的工作流改革（就你今天提的那个）

```bash
# 1. 新建功能分支
git checkout -b feat/xxx

# 2. 启 local server
cd ~/WorkBuddy/luck-today-deploy
python3 -m http.server 8000
# 浏览器：http://localhost:8000/

# 3. 多轮改 + 本地测
#    Chrome DevTools → Device Toolbar → iPhone 17 Pro Max
#    （会自动模拟 safe-area · 之前那个 bug 在本地就能看出）

# 4. 满意了再合回 main
git checkout main && git merge --no-ff feat/xxx
git push   # ← 只在这一步推

# 5. 出问题（罕见情况）可以回滚
git revert HEAD  # 不强推、不改历史
```

---

## 🤔 接下来怎么办？

这份 REVIEW 只是诊断，下一步看你决定：

1. **全做**：按优先级我逐个发 PR / 改动（本地多轮迭代 → 一次 push），你审完再合
2. **只做红色三项**（#1 #2 #3）：收益最大 · 预估 2-3 个小时能搞完
3. **先做红色两项**（#1 #2）：最快落地 · 1 小时 · 消除一致性风险
4. **只看先不做**：这份 REVIEW 留着，等下次 UI 改版时带着它一起做
5. **你挑几条**：告诉我要做的编号（比如"只做 #1 和 #10"）

---

## 🗑 本文件的归宿

- 如果选 1/2/3：做完对应项后删掉这份 REVIEW.md
- 如果选 4：留着作为 roadmap 参考
- 如果选 5：做完你挑的项后删
- **不要 commit 这个文件** —— 它不是代码，是讨论文档，进 git 反而碍眼
