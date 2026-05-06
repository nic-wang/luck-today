# CLAUDE.md · luck-today 工作指引

> 本文件给 Claude（以及未来的自己）看。每次打开这个目录先读这里。

## 这是什么

**命理今日** · 家庭内部的趋吉避凶仪表盘 · 纯静态站 · 通过 GitHub Pages 托管。

- **仓库**：`github.com/nic-wang/luck-today`
- **线上**：https://nic-wang.github.io/luck-today/
- **PIN 门**：`lib/gate.js` · 使用 sessionStorage · 每次开站都要输入

## 这是唯一真源

- ✅ 本目录 `/Users/nic/WorkBuddy/luck-today-deploy/` 是 **GitHub 仓库的本地克隆**，git 双向同步
- ❌ `Claw/personal/命理今日_archived/` 已归档 · 不要改那里
- ❌ `Claw/personal/宠物/命格看板.html` 是命理看板的**前身**（v3/v4 单页版）· 已被 `family/index.html` 接棒 · 不要改那里

## 目录结构

```
luck-today-deploy/
├── index.html             主入口（双视角并排 · 牛牛 | 嘻嘻）
├── family/index.html      家庭命格看板（6 位成员 + 关系矩阵 · 被 index.html iframe 嵌入）
├── lib/
│   ├── gate.js            PIN 门 · sessionStorage
│   ├── luck-engine.js     核心运势算法（十神 / 流日 / 宜忌 / 方位）
│   └── relations.js       成员关系矩阵计算
├── vendor/lunar.js        农历八字（UMD）
├── assets/photos/         6 位成员的 512×512 像素头像
├── README.md              对外说明
└── CLAUDE.md              本文件
```

## 修改流程

```bash
# 1. 在本目录改文件（直接编辑 html/js）
# 2. 本地验证：浏览器直接打开 index.html 即可（注意：PIN 门在 file:// 下也会起作用）
# 3. 推送
cd /Users/nic/WorkBuddy/luck-today-deploy
git add -A
git commit -m "feat(xx): ..."
git push

# 4. 等 GitHub Pages 自动构建（通常 30-60 秒）
gh api repos/nic-wang/luck-today/pages/builds/latest --jq '{status, duration}'
```

## 历史踩坑备忘

- **图像覆写坑**：裁剪头像时**绝对不要覆盖原文件**，裁剪输出要另存到 `assets/photos/`，源图保留在别处
- **Read 工具对图像会返回合成预览**：不要用 Read 判断图像内容，用 `sips -g pixelWidth -g pixelHeight`
- **双目录漂移**：曾经 `Claw/personal/命理今日/` 和本仓库并存，手动同步 `lib/` 导致容易出错。现在已归档前者

## 关键人物档案

- **王宁（牛牛）**：1989 年农历 4/11 未时 · 广东高州播扬镇 · 男 · 乙木日主
- **嘻嘻**：牛牛伴侣
- **宠物**：泡泡 / 蛋蛋 / 小五 / 糯米鸡

详细档案见 `Claw/personal/宠物/宠物档案.md`。
