#!/usr/bin/env bash
# luck-today · Archive ipa（需先在 Xcode 选过 Team，或 export DEVELOPMENT_TEAM=你的10位TeamID）
# 用法：DEVELOPMENT_TEAM=XXXXXXXXXX bash scripts/ios-archive.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ios/App"

if [ -z "${DEVELOPMENT_TEAM:-}" ]; then
  echo "✗ 需要 DEVELOPMENT_TEAM（10 位 Team ID）"
  echo "  Xcode → Settings → Accounts → 选中 Team → 查看 Team ID"
  echo "  或 Signing 面板里 Team 名称下方"
  echo ""
  echo "推荐首次用 Xcode GUI：Product → Archive → Distribute → App Store Connect"
  exit 1
fi

npm run cap:sync --prefix "$ROOT"

ARCHIVE_PATH="$ROOT/ios/build/LuckToday.xcarchive"
rm -rf "$ROOT/ios/build"

xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  CODE_SIGN_STYLE=Automatic \
  archive

echo "✓ Archive: $ARCHIVE_PATH"
echo "下一步：Xcode → Window → Organizer → 选中该 Archive → Distribute App → App Store Connect → Upload"
