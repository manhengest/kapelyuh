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

export APP_VARIANT="${APP_VARIANT:-production}"

TOKEN_SET=0
if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  TOKEN_SET=1
  # Length only — never print the token value.
  echo "SENTRY_AUTH_TOKEN is set (length=${#SENTRY_AUTH_TOKEN})"
else
  export SENTRY_DISABLE_AUTO_UPLOAD=true
  echo "SENTRY_AUTH_TOKEN unset — disabling Sentry source map upload"
fi

# Do NOT use --clean: it would delete ios/ci_scripts (this script).
npx expo prebuild --platform ios --no-install

cd ios
pod install

# sentry-cli reads auth from sentry.properties more reliably than env alone
# inside Xcode build phases. Rewrite after prebuild so it is not wiped.
if [ "$TOKEN_SET" -eq 1 ]; then
  umask 077
  cat > sentry.properties <<'EOF'
defaults.url=https://sentry.io/
defaults.org=khodzinskyi-vv
defaults.project=react-native
EOF
  # Append token separately so special characters are not interpreted by the shell.
  printf 'auth.token=%s\n' "$SENTRY_AUTH_TOKEN" >> sentry.properties
  echo "Wrote auth.token into ios/sentry.properties for Archive upload"

  # Early auth check (non-fatal) so Post-Clone logs show the real API error.
  if SENTRY_PROPERTIES=sentry.properties npx --yes @sentry/cli@2 info 2>&1 | tee /tmp/sentry-info.log; then
    echo "Sentry auth check OK"
  else
    echo "warning: Sentry auth check failed — see output above"
    echo "warning: verify org=khodzinskyi-vv project=react-native and token scopes (project:releases, org:read)"
  fi
fi

# Persist for Xcode script phases (Archive).
# SENTRY_ALLOW_FAILURE keeps Archive green if Sentry API still rejects the token.
{
  echo "export NODE_BINARY=$NODE_BIN"
  echo "export SENTRY_ALLOW_FAILURE=true"
  if [ -n "${SENTRY_DISABLE_AUTO_UPLOAD:-}" ]; then
    echo "export SENTRY_DISABLE_AUTO_UPLOAD=true"
  fi
} > .xcode.env.local

echo "Generated workspace:"
ls -la Kapelyuh.xcworkspace
