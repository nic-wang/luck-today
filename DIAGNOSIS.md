# 算法诊断 + 框架建议

> 针对你提的 3 个问题 · 只诊断 + 建议 · 不动代码

---

## 🔴 问题 #1：趋吉行动牛嘻内容几乎一样

### 根因分析

`lib/luck-engine.js:295-302` 的 `calcRecommendations(userBazi, today, feixing)` **只用一个变量** `yongShen`（调候用神）决定 5 个字段：

```javascript
const yong = userBazi.yongShen;  // ← 单一决定因子
return {
  colors:   WX_COLORS[yong].lucky,       // 颜色
  numbers:  WX_NUMBERS[yong],             // 数字
  foods:    WX_FOODS[yong],               // 饮食
  direction: WX_DIRECTION[yong],          // 方位
  accessory: WX_ACCESSORIES[yong][...]    // 饰品
};
```

**`yongShen` 怎么算的**（luck-engine.js:126-139）：**仅看月支季节**
- 巳午未 → 水
- 亥子丑 → 火
- 寅卯辰 → 金
- 申酉戌 → 火

### 为什么牛嘻完全一样

- 牛牛八字：己巳 · 己巳 · **乙亥** · 癸未 → 月支 **巳** → 夏 → 用神 **水**
- 嘻嘻八字：己卯 · 己巳 · **丙戌** · 己亥 → 月支 **巳** → 夏 → 用神 **水**

**两人都出生在 5 月（巳月）→ 算法输出完全一样**。这是"极简调候"的固有缺陷——没看日干、没看五行强弱、没看流日相互作用。

### 行业做法（从简到精）

| 级别 | 算法要素 | 准确度 | 代码量 |
|---|---|---|---|
| L1 · 当前 | 月令调候 1 因子 | 低 · 同季同用神 | 1 行 |
| L2 · 基础升级 | 月令 + 日干强弱 2 因子 | 中 · 同季不同命 | 20 行 |
| L3 · 行业常见 | 月令 + 日干强弱 + 五行缺补 + 流日冲合 | 高 · 每天都不同 | 80 行 |
| L4 · 专业级 | + 十二长生 + 调候用神 + 通关格局 | 极高 | 500+ 行 |

**推荐你做 L3**，理由：
- L2 牛嘻还是会有大面积相似（同月出生只差日干）
- L4 要读周易古籍，收益递减
- L3 引入**流日因子**后，每人每天的组合几乎全不同

### L3 算法框架（伪码）

```javascript
function calcRecommendations(userBazi, today, feixing) {
  // 1. 算今日流日五行
  const todayWx = TIANGAN_WUXING[today.dayGan];  // 今日日干五行
  const todayZhiWx = DIZHI_WUXING[today.dayZhi]; // 今日日支五行

  // 2. 个人缺口（用神优先级队列）
  const deficits = rankDeficits(userBazi.wxCount); // [水, 金, 木] 从最缺到最足
  const primaryYong = userBazi.yongShen;           // 调候用神

  // 3. 今天对个人的影响分
  //    如果今天的五行 = 你最缺的 → 大吉 · 推荐强化
  //    如果今天的五行 = 你最旺的 → 要泄 · 推荐相反色
  const todayMatchesYong = todayWx === primaryYong;
  const todayHurtsYong = WX_KE[todayWx] === primaryYong;

  // 4. 推荐色 = (个人用神 × 今日五行强化/削弱)
  let targetWx;
  if (todayMatchesYong) targetWx = primaryYong;       // 今天帮你 · 顺势
  else if (todayHurtsYong) targetWx = deficits[1];   // 今天克你 · 转向备选用神
  else targetWx = primaryYong;

  // 5. 今日特别推荐（5 个字段各自挑）
  return {
    colors:    pickColor(targetWx, today.dayGan),      // 加 dayGan 抖动
    numbers:   pickNumbers(targetWx, userBazi.dayGan), // 加用户日干抖动
    foods:     pickFoods(targetWx, today.dayZhi),
    direction: pickDir(targetWx, feixing.bestDir, userBazi.yongShen),
    accessory: pickAcc(targetWx, userBazi.dayGan),
    reason:    "今日 ${today.dayGan}${today.dayZhi} · 你用神 ${primaryYong} · 推理：..."
  };
}
```

**关键变量增加**：
- 从 1 个（yongShen）→ **5 个**（yongShen / dayGan / dayZhi / wxCount / feixing）
- 牛嘻分歧点：日干**乙木** vs **丙火**、五行缺口不同、流日与个人的冲合不同

---

## 🔴 问题 #2：关系亮点"今日"字段是写死的

### 根因

`lib/relations.js:25` `today` 字段是**字符串字面量**：

```javascript
today: '今日双火叠加 · 你俩之间易因小事拌嘴...'  // 永远不变
```

`index.html:1091` 的 `renderCouple()` 只是 `document.getElementById('csToday').innerHTML = r.today`——没做任何计算。

### 这不是代码 bug，是数据层缺动态计算

需要**新增一个函数** `calcRelationToday(r, today)`——根据：
- 关系的核心五行（从 `keyword` 反推：木火相生 → 主木火）
- 今日干支的五行
- 与关系五行的冲合生克

动态生成一句"今日相处建议"。

### 框架

```javascript
function calcRelationToday(relation, today) {
  const relWx = relWuxingFromKeyword(relation.keyword);
  const todayWx = TIANGAN_WUXING[today.dayGan];
  const todayZhiWx = DIZHI_WUXING[today.dayZhi];

  // 4 种情景
  if (todayWx === relWx) {
    return `今日 ${today.dayGan}${today.dayZhi} · 你俩的 ${relation.keyword} 今天被加强 · 宜一起做重要决定`;
  }
  if (WX_KE[todayWx] === relWx) {
    return `今日 ${today.dayGan}${today.dayZhi} · 流日克你俩的关系核心 · 少谈严肃话题 · 一起吃饭看剧`;
  }
  if (WX_SHENG[relWx] === todayWx) {
    return `今日 ${today.dayGan}${today.dayZhi} · 流日泄你俩的关系 · 俩人都会稍显疲惫 · 早睡`;
  }
  // 中性
  return `今日 ${today.dayGan}${today.dayZhi} · 关系平稳 · 正常相处`;
}
```

**关键收益**：每天都不一样 · 你老婆会觉得"它好像真懂我们"。

---

## 🔴 问题 #3：模块粗糙 · 框架建议

### 当前的模块清单（Dashboard）

1. ✅ 现在该做什么（奇门吉时）
2. ✅ 今日主题（十神）
3. ✅ 宜忌清单（十神衍生）
4. ✅ 12 时辰吉时
5. ✅ 四维好运（Math.random 已修）
6. ⚠️ 趋吉行动建议 · 牛嘻重复 · 见 #1
7. ✅ 塔罗（每日稳定）
8. ✅ 签到
9. ⚠️ 关系亮点 · 静态 · 见 #2

### 行业标杆对比（参考：安心、测测、紫微斗数大师、JING Daily）

| 模块 | 你有 | 安心 App | 测测 App | 建议 |
|---|---|---|---|---|
| 每日运势概览 | ✓ | ✓ | ✓ | ✓ 保留 |
| 吉时吉方 | ✓ 奇门 | ✓ 择时 | ✓ | ✓ 保留 |
| 穿搭/饰品推荐 | ✓ 粗糙 | ✓ 精细 | ✓ 精细 | 🔧 升级（本 doc #1）|
| 饮食推荐 | ✓ 粗糙 | ✓ 按节气 | ✓ 按地域 | 🔧 同上 |
| 塔罗 | ✓ | ✓ | ✓ | ✓ 保留 |
| **大运流年** | 硬编码 3 步 | ✓ 10 年表 | ✓ | 🆕 可升级 |
| **紫微/星座（另一套视角）** | ✗ | ✓ | ✓ | 🆕 可选 |
| **关系/合婚** | ✓ 静态 | ✓ 动态 | ✓ 动态 | 🔧 升级（本 doc #2）|
| **每日提问** | ✓ 塔罗追问 | ✓ | ✓ | ✓ 已有 |
| **人生时间线** | ✗ | ✓ | ✓ 流年地图 | 🆕 强推荐 |
| **天气/节气联动** | 部分 | ✓ | ✓ | 🆕 可选 |
| **情绪记录 → 回顾** | ✗ | ✓ | ✓ | 🆕 可选 |
| **提醒通知** | ✗ | ✓ | ✓ | 🆕 PWA 下可做 |
| 社交分享 | ✗ | ✓ | ✓ | ❌ 你是私用，不需要 |

### 推荐新增 3 个模块

#### 🆕 模块 A · 人生时间线（"命理地图"）
把大运 3 步扩成 **120 年卷轴**，每 10 年一个大运 · 每 1 年一个流年色块 · 今天位置高亮 · 点击任意年看详情。

这是命理 App 的**记忆点**——用户一看就觉得"哇这东西有深度"。

```
1989 ━┳━ 甲寅大运（童年）━━━━━━━━ 2001
       ┣━ 乙丑大运（学习期）━━━━━━ 2011
       ┣━ 丙寅大运（试错期）━━━━━━ 2021
       ┣━ 丁卯大运（积累期）━━━━━━ 2031 ← 现在
       ┣━ 戊辰大运（收获期）━━━━━━ 2041
       ┗━ ...
```

#### 🆕 模块 B · 情绪日签 + 月度回顾
在现有签到基础上加：
- 今日心情一键打分（😊🙂😐😕😢 5 档）
- 月底自动生成"过去 30 天情绪曲线 vs 命理运势曲线"
- 发现相关性：你情绪最差的 3 天 → 它会告诉你那几天命理能量图

这个**给你嘻嘻用绝了**——她会看到数据化的自己。

#### 🆕 模块 C · 节气专题卡（自动激活）
现在只有节气日才显示节气框。升级成：
- 距离下个节气 X 天（倒计时）
- 下个节气的命理能量切换说明
- 节气日当天自动换全站主题色（比如立夏 → 主色改火红）

这是**氛围感**，不增数据，只加视觉仪式感。

---

## 🎯 综合建议

### 现在有 4 种推进路径，按时间投入排序

| 路径 | 时间 | 收益 |
|---|---|---|
| **A** · 只修 Bug · 不加新模块 | 1h | 牛嘻推荐分化 + 关系今日动态化（解决 #1#2） |
| **B** · 修 Bug + 升级 calcRecommendations 到 L3 | 2.5h | 每人每天推荐全不同 · 算法深度+1 档 |
| **C** · A + 加模块 A/C（时间线+节气主题） | 4h | 增 2 个新模块 · 页面丰富度+1 档 |
| **D** · B + 加模块 A/B/C 三个全上 | 8h+ | 产品感显著升级 · 但工程量大 |

### 和重构的关系

**关键决定**：这些"改功能"和之前的 Step B/C 重构有 **顺序问题**：

- 如果**先做功能升级再重构** · Step C 抽 `lib/app.js` 会改写更多代码 · 一次性改透
- 如果**先做重构再升级** · 升级时站在整洁的代码上改，爽度更高，但要承担"改完再重构"

我推荐的顺序：
```
1. 先把 Step A 的 4 件事 commit 存档（现在还没 commit · 不然白做）
2. 然后做 路径 A（纯修 bug · 1h）· 也 commit 一次
3. 再做 Step B（family 接入 luck-engine · 30min）
4. 再做 Step C（文件分层 · 60min）
5. Step C 完成后 · 站在整洁代码上做路径 C/D（新模块）
6. 全部满意再上线
```

### 需要你拍板

<下一轮我会用 AskUserQuestion 问你选哪条路径>
