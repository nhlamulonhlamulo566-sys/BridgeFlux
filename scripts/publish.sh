#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "Building production assets..."
npm run build

OUT_DIR="$ROOT/dist/publish"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Collecting installer artifacts..."
cp -r public/* "$OUT_DIR/" || true

VERSION=$(node -p "require('./package.json').version")
STAMP=$(date +%Y%m%d%H%M%S)
ZIPNAME="bridgeflux-${VERSION}-${STAMP}.zip"

echo "Packaging $ZIPNAME"
cd "$OUT_DIR/.."
echo "Generating checksums..."
if command -v sha256sum >/dev/null 2>&1; then
	(cd publish && find . -type f -print0 | xargs -0 sha256sum > checksums.sha256)
elif command -v shasum >/dev/null 2>&1; then
	(cd publish && find . -type f -print0 | xargs -0 shasum -a 256 > checksums.sha256)
else
	echo "Warning: no sha256 tool found; skipping checksums generation"
fi

zip -r "$ZIPNAME" "publish" >/dev/null
mv "$ZIPNAME" "$ROOT/"

echo "Created $ROOT/$ZIPNAME"
echo "To publish locally using GitHub CLI:"
echo "  gh release create v$VERSION $ROOT/$ZIPNAME --title \"BridgeFlux $VERSION\" --notes \"Local release $STAMP\""
echo "Or upload $ZIPNAME to your hosting of choice."
