#!/usr/bin/env bash
# 检查 Xcode 签名是否就绪（Archive 前跑一遍）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== TOF / TruthOrFate iOS 签名检查 =="
echo "Bundle ID: com.nicwang.lucktoday"
echo "Display Name: $(grep -A1 CFBundleDisplayName "$ROOT/ios/App/App/Info.plist" | tail -1 | sed 's/.*<string>//;s/<\/string>//;s/^[[:space:]]*//')"

IDENTITIES=$(security find-identity -v -p codesigning 2>/dev/null | grep -c "Apple Development\|Apple Distribution" || true)
if [ "$IDENTITIES" -gt 0 ]; then
  echo "✓ 签名证书已存在 ($IDENTITIES)"
  security find-identity -v -p codesigning 2>/dev/null | grep "Apple"
else
  echo "✗ 尚无签名证书"
  echo "  → Xcode: TARGETS → App → Signing & Capabilities"
  echo "  → 勾选 Automatically manage signing，选 Team"
fi

TEAM=$(cd "$ROOT/ios/App" && xcodebuild -workspace App.xcworkspace -scheme App -showBuildSettings 2>/dev/null | grep 'DEVELOPMENT_TEAM =' | head -1 | sed 's/.*= //' || true)
if [ -n "$TEAM" ] && [ "$TEAM" != "" ]; then
  echo "✓ DEVELOPMENT_TEAM = $TEAM"
else
  echo "✗ DEVELOPMENT_TEAM 未设置（Xcode 里选 Team）"
fi

echo ""
echo "Archive 前：设备选 Any iOS Device (arm64)，再 Product → Archive"
