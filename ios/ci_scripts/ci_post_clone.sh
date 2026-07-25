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

# Sentry upload needs SENTRY_AUTH_TOKEN. Without it, Archive fails the build.
# Mirror eas.json development-simulator: skip upload unless a token is provided.
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  export SENTRY_DISABLE_AUTO_UPLOAD=true
  echo "SENTRY_AUTH_TOKEN unset — disabling Sentry source map upload"
fi

# Do NOT use --clean: it would delete ios/ci_scripts (this script).
npx expo prebuild --platform ios --no-install

cd ios
pod install

# Persist for Xcode script phases (Archive). Workflow env vars are available to
# ci_scripts, but Sentry upload runs inside an Xcode build phase that sources
# .xcode.env.local — forward the token there so sentry-cli can authenticate.
{
  echo "export NODE_BINARY=$NODE_BIN"
  if [ -n "${SENTRY_DISABLE_AUTO_UPLOAD:-}" ]; then
    echo "export SENTRY_DISABLE_AUTO_UPLOAD=true"
  fi
  if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
    # %q escapes safely; do not echo the raw token to build logs.
    printf 'export SENTRY_AUTH_TOKEN=%q\n' "$SENTRY_AUTH_TOKEN"
  fi
} > .xcode.env.local

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "SENTRY_AUTH_TOKEN forwarded to .xcode.env.local"
fi

echo "Generated workspace:"
ls -la Kapelyuh.xcworkspace
