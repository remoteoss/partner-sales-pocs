#!/usr/bin/env bash
# Pre-demo preflight for the HiBob EOR demo.
#
# Checks the things that fail silently or fail late — the ones you cannot see
# by looking at the screen until you are already presenting. Run it before
# every demo. Exits non-zero on the first hard failure.
#
#   ./scripts/preflight.sh

set -uo pipefail

POC_PORT=${POC_PORT:-3002}
TIGER_URL=${TIGER_URL:-http://localhost:4000}
DRAGON_URL=${DRAGON_URL:-http://localhost:3000}
DRAGON_DIR=${DRAGON_DIR:-$HOME/cursor/dragon/dragon/apps/employ}
FAILED=0

pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILED=1; }
warn() { printf '  \033[33mwarn\033[0m %s\n' "$1"; }

echo
echo "HiBob EOR demo preflight"
echo "========================"

echo
echo "1. Services"
curl -sf -o /dev/null --max-time 3 "$TIGER_URL" \
  && pass "Tiger is up on $TIGER_URL" \
  || fail "Tiger is NOT responding on $TIGER_URL — start it before the demo"

curl -sf -o /dev/null --max-time 3 "$DRAGON_URL" \
  && pass "Dragon is up on $DRAGON_URL" \
  || fail "Dragon is NOT responding on $DRAGON_URL — the magic-link handoff will fail"

curl -sf -o /dev/null --max-time 3 "http://localhost:$POC_PORT" \
  && pass "POC is up on :$POC_PORT" \
  || warn "POC not running on :$POC_PORT (start it with npm run dev)"

echo
echo "2. Credentials and token exchange"
if [ -f .env ]; then
  PROFILE=$(grep -E '^VITE_PARTNER_PROFILE=' .env | cut -d= -f2 | tr -d '[:space:]')
  GATEWAY=$(grep -E '^VITE_REMOTE_GATEWAY=' .env | cut -d= -f2 | tr -d '[:space:]')
  [ "$PROFILE" = "hibob" ] \
    && pass "VITE_PARTNER_PROFILE=hibob" \
    || fail "VITE_PARTNER_PROFILE is '$PROFILE', expected 'hibob' — cp .env.hibob-local .env"
  [ "$GATEWAY" = "local" ] \
    && pass "VITE_REMOTE_GATEWAY=local" \
    || fail "VITE_REMOTE_GATEWAY is '$GATEWAY', expected 'local'"
  if grep -qE '^VITE_REFRESH_TOKEN=.' .env; then
    fail "VITE_REFRESH_TOKEN is set — the SDK would hire into THAT company, not the one created on stage. Remove it."
  else
    pass "no VITE_REFRESH_TOKEN (correct — the session supplies it)"
  fi
else
  fail ".env missing — cp .env.hibob-local .env"
fi

# A partner token proves the Tiger seed ran and the credentials match.
if curl -sf -o /dev/null --max-time 5 "http://localhost:$POC_PORT/api/fetch-partner-token"; then
  pass "partner token exchange returns 200 (Tiger seed applied)"
else
  fail "partner token exchange failed — run: mix run priv/scripts/setup_hibob_demo.exs in apps/tiger"
fi

echo
echo "3. Dragon co-branding"
if grep -q "HIBOB: 'hibob'" \
  "$DRAGON_DIR/src/domains/shared/integrations/partner-whitelabel/config.tsx" 2>/dev/null; then
  pass "hibob is registered in Dragon's partnersConfig"
else
  fail "hibob missing from Dragon partnersConfig — the employer handoff will render as Remote"
fi
[ -f "$DRAGON_DIR/public/images/partners/hibob/hibob-primary.svg" ] \
  && pass "Dragon hibob assets present" \
  || fail "Dragon hibob assets missing"
warn "visit $DRAGON_URL/?whitelabel_brand=hibob once to seed the theme for this browser"

echo
echo "4. Demo state"
if [ -f server/session.json ] && grep -q '"company_id": *"[^"]' server/session.json 2>/dev/null; then
  warn "a company already exists in server/session.json — the demo will open in the 'hiring' state"
  warn "for a clean run from discovery, clear it first"
else
  pass "no stale session — demo opens in the discovery state"
fi

echo
if [ "$FAILED" -eq 0 ]; then
  printf '\033[32mPreflight passed.\033[0m\n\n'
else
  printf '\033[31mPreflight FAILED — fix the items above before demoing.\033[0m\n\n'
fi
exit $FAILED
