# 命理今日 · 双视角趋吉避凶

> 私人项目 · 仅家人内部使用 · 不对外开放

家庭成员每日趋吉避凶仪表盘，含个人十神流日、奇门吉时、塔罗、宠物关系矩阵等。

## 站点结构

```
index.html             命理今日（主入口 · 双视角并排）
family/index.html      家庭命格看板（被 iframe 嵌入）
lib/                   核心算法
vendor/                第三方库
assets/photos/         头像
```

## 技术栈

- vanilla JS · 无构建 · 纯静态
- `lunar-javascript` UMD 农历八字
- sessionStorage 做 PIN 门（每次访问都要输入）
- localStorage 签到历史

## 部署

**GitHub Pages** · 推到 `main` 后自动构建 · 线上地址 https://nic-wang.github.io/luck-today/

```bash
# 本地改完 → 推上去即可
git add -A && git commit -m "…" && git push
```

## 隐私

- robots.txt 禁止搜索引擎抓取
- 所有数据本地计算 · 无服务端
- 仅凭链接访问 · 不对外公开

---

*本仓库源码可被看到，但实际站点会做 PIN 码门保护，请凭链接访问。*
