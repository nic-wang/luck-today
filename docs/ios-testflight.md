# iOS · TestFlight 上线清单

Bundle ID：`com.nicwang.lucktoday` · 显示名：**TOF** · App Store：**TruthOrFate**

## 虾饺已接好（代码侧）

- `capacitor.config.ts` — Bundle ID / webDir
- `vite.config.ts` — `CAPACITOR=1` 时 `base: './'`（原生包）；默认 `base: '/luck-today/'`（GH Pages 不变）
- `package.json` 脚本：
  - `npm run build:ios` — 打 iOS 用 dist
  - `npm run cap:sync` — build:ios + 同步到 Xcode 工程
  - `npm run cap:open` — 打开 Xcode

## 证书页怎么选（重要）

**不要**在 Developer Portal 手动「创建新证书」。先离开该页，去 **Identifiers** 注册 App ID。

| 选项 | 现在要不要建 |
|------|-------------|
| Apple Development | 不用手动建，Xcode 自动签名会代建 |
| Apple Distribution | 上传 TestFlight 时由 Xcode 代建 |
| 服务类（推送 / Apple Pay 等） | 全部跳过 |

一键预检 + 打开所需页面：

```bash
bash scripts/ios-testflight-setup.sh
```

## 牛牛待办（开发者账号通过后）

### 1. 本机环境（一次性）

```bash
cd ~/WorkBuddy/luck-today-deploy
npm run ios:setup        # 预检 + 同步 + 打开 Identifiers / ASC / Xcode
# 或分步：
npm run cap:sync
npm run cap:open
```

CLI Archive（可选，需 Team ID）：

```bash
DEVELOPMENT_TEAM=你的10位ID bash scripts/ios-archive.sh
```

### 2. Apple Developer Portal

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → App IDs → `com.nicwang.lucktoday`
2. 无需特殊 Capability（当前纯本地 Web 壳）

### 3. App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → 我的 App → **+** → 新建
2. 名称：TruthOrFate · Bundle ID 选 `com.nicwang.lucktoday` · 主屏显示名 TOF（Xcode Display Name / Info.plist）
3. 无需现在填商店截图（TestFlight 不需要公开上架资料）

### 4. Xcode 签名 & 上传

1. 打开工程 → Signing & Team 选个人开发者 Team
2. Product → Archive → Distribute App → **App Store Connect** → Upload
3. 等处理完成（约 10–30 分钟）→ TestFlight 页出现构建

### 5. 内测分发（TruthOrFate · 主屏 TOF）

1. App Store Connect → **TruthOrFate** → **TestFlight**
2. 等构建从「处理中」→ **可测试**（约 10–30 分钟）
3. **内部测试** → 创建组 → 加家人 Apple ID 邮箱
4. 家人 iPhone 装 **TestFlight** → 接受邀请 → 安装（主屏显示 **TOF**）

检查签名是否就绪：`npm run ios:check-signing`

## 日常发版

```bash
npm run cap:sync    # 改完 Web 代码后
# Xcode Archive → Upload → TestFlight 自动推给测试员
```

PWA（GitHub Pages）继续独立迭代；TestFlight 走 `cap:sync` 发版，两条线并存。
