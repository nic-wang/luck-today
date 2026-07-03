#!/usr/bin/env bash
# luck-today · TestFlight 一键预检 + 打开所需页面
# 用法：bash scripts/ios-testflight-setup.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUNDLE_ID="com.nicwang.lucktoday"

echo "== 1. 预检 =="
echo "Bundle ID: $BUNDLE_ID"
grep -q "appId: '$BUNDLE_ID'" capacitor.config.ts || { echo "✗ capacitor.config.ts appId 不匹配"; exit 1; }
echo "✓ capacitor.config.ts"

if ! command -v pod >/dev/null; then
  echo "✗ CocoaPods 未安装 → brew install cocoapods"
  exit 1
fi
echo "✓ CocoaPods $(pod --version)"

echo ""
echo "== 2. 同步 iOS 构建 =="
npm run cap:sync

echo ""
echo "== 3. 签名身份（Xcode 首次需登录 Apple ID 自动生成）=="
IDENTITIES=$(security find-identity -v -p codesigning 2>/dev/null | grep -c "Apple Development\|Apple Distribution" || true)
if [ "$IDENTITIES" -eq 0 ]; then
  echo "⚠ 尚无签名证书 — 正常。打开 Xcode 后勾选 Automatically manage signing 并选 Team，会自动创建。"
else
  security find-identity -v -p codesigning 2>/dev/null | grep "Apple"
fi

echo ""
echo "== 4. 打开 Apple 后台（需浏览器登录）=="
echo "→ Identifiers（注册 App ID，跳过「创建证书」页）"
open "https://developer.apple.com/account/resources/identifiers/list"
sleep 1
echo "→ App Store Connect（TruthOrFate / TOF）"
open "https://appstoreconnect.apple.com/apps"

echo ""
echo "== 5. 打开 Xcode 工程 =="
echo "用 App.xcworkspace（不是 xcodeproj）"
npx cap open ios

echo ""
cat <<EOF

== Xcode 逐步（你现在在这）==
1. 左侧点蓝色 App → 中间选 TARGETS 下的 App（不是 PROJECT）
2. 顶部点 Signing & Capabilities（不是 Info）
3. ✓ Automatically manage signing → Team 选个人开发者账号
4. Bundle Identifier = $BUNDLE_ID · Display Name = TOF（General 标签）
5. 顶部设备选 Any iOS Device (arm64)
6. Product → Archive → Distribute App → App Store Connect → Upload

检查签名：bash scripts/ios-check-signing.sh
EOF
