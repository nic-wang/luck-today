# 命理今日 · Luck Today OS

> 私人项目 · 仅家人内部使用 · 不对外开放

家庭成员每日趋吉避凶仪表盘，含今日简报、行动窗口、家庭关系、解释型算法和 PWA 访问。

## 站点结构

```
src/index.html          Vite 入口
src/app/                应用壳、PIN 门、导航
src/data/               成员和关系数据
src/engine/             解释型算法 v2
src/features/           今日 / 家庭 / 解释页面
public/                 PWA、图标、头像、vendor/lunar.js
index.html              legacy v1 页面，保留作迁移回滚参考
```

## 技术栈

- Vite · React · TypeScript
- `lunar-javascript` UMD 农历八字
- sessionStorage 做 PIN 门（每次访问都要输入）
- GitHub Pages 静态部署

## 部署

**GitHub Pages** · GitHub Actions 构建 `dist/` 并部署 · 线上地址 https://nic-wang.github.io/luck-today/

```bash
npm install
npm run dev
npm run build
```

## 隐私

- robots.txt 禁止搜索引擎抓取
- 所有数据本地计算 · 无服务端
- 仅凭链接访问 · 不对外公开
- PIN 是软门禁，不是强加密；公开仓库源码可见，不应放证件、客户、公司内网、财务等敏感信息

---

*本仓库源码可被看到，实际站点只适合轻量私人信息。*
