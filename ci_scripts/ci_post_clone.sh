#!/bin/sh
set -euo pipefail

cd "$CI_PRIMARY_REPOSITORY_PATH"

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export HOMEBREW_NO_AUTO_UPDATE=1

if ! command -v node >/dev/null 2>&1; then
  brew install node@24
fi

NODE_BIN="$(command -v node)"
if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(brew --prefix node@24)/bin/node"
  export PATH="$(dirname "$NODE_BIN"):$PATH"
fi

echo "Using Node $($NODE_BIN -v)"

npm ci
npm run styles:build

export APP_VARIANT="${APP_VARIANT:-production}"
export CI=1

npx expo prebuild --platform ios --no-install

cd ios
pod install

cat > .xcode.env.local <<EOF
export NODE_BINARY=$NODE_BIN
EOF
