#!/bin/bash
set -euo pipefail

echo "Running ios/ci_scripts/ci_post_clone.sh"

# Repo root (script lives at ios/ci_scripts/)
cd "${CI_PRIMARY_REPOSITORY_PATH:-../..}"

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export HOMEBREW_NO_AUTO_UPDATE=1

# Xcode Cloud sets CI=TRUE which breaks getenv boolean parsing in some RN tooling.
export CI=true

brew install node@24 cocoapods || brew install node cocoapods

# Prefer Node 24 when Homebrew keg is available
if [ -d "$(brew --prefix node@24 2>/dev/null)/bin" ]; then
  export PATH="$(brew --prefix node@24)/bin:$PATH"
fi

NODE_BIN="$(command -v node)"
echo "Using Node $($NODE_BIN -v) at $NODE_BIN"

npm ci
npm run styles:build

export APP_VARIANT="${APP_VARIANT:-production}"

# Do NOT use --clean: it would delete ios/ci_scripts (this script).
npx expo prebuild --platform ios --no-install

cd ios
pod install

cat > .xcode.env.local <<EOF
export NODE_BINARY=$NODE_BIN
EOF

echo "Generated workspace:"
ls -la Kapelyuh.xcworkspace
