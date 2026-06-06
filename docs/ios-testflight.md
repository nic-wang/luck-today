# iOS · TestFlight 上线清单

Bundle ID：`com.nicwang.lucktoday` · App 名：命理今日

## 虾饺已接好（代码侧）

- `capacitor.config.ts` — Bundle ID / webDir
- `vite.config.ts` — `CAPACITOR=1` 时 `base: './'`（原生包）；默认 `base: '/luck-today/'`（GH Pages 不变）
- `package.json` 脚本：
  - `npm run build:ios` — 打 iOS 用 dist
  - `npm run cap:sync` — build:ios + 同步到 Xcode 工程
  - `npm run cap:open` — 打开 Xcode

## 牛牛待办（开发者账号通过后）

### 1. 本机环境（一次性）

```bash
brew install cocoapods   # 若未装
cd ~/WorkBuddy/luck-today-deploy
npx cap add ios          # 首次生成 ios/ 工程
npm run cap:sync
npm run cap:open
```

### 2. Apple Developer Portal

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → App IDs → `com.nicwang.lucktoday`
2. 无需特殊 Capability（当前纯本地 Web 壳）

### 3. App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → 我的 App → **+** → 新建
2. 名称：命理今日 · Bundle ID 选 `com.nicwang.lucktoday`
3. 无需现在填商店截图（TestFlight 不需要公开上架资料）

### 4. Xcode 签名 & 上传

1. 打开工程 → Signing & Team 选个人开发者 Team
2. Product → Archive → Distribute App → **App Store Connect** → Upload
3. 等处理完成（约 10–30 分钟）→ TestFlight 页出现构建

### 5. 内测分发

- **内部测试**：App Store Connect 用户与访问 → 加家人 Apple ID（最多 100 人，即时）
- **外部测试**：需轻量 Beta 审核（1–2 工作日）

## 日常发版

```bash
npm run cap:sync    # 改完 Web 代码后
# Xcode Archive → Upload → TestFlight 自动推给测试员
```

PWA（GitHub Pages）继续独立迭代；TestFlight 走 `cap:sync` 发版，两条线并存。
