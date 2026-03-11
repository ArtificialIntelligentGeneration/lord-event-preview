#!/bin/bash
set -euo pipefail

SITE="https://lord-event.ru"
PASS=0
FAIL=0
WARN=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
warn() { WARN=$((WARN+1)); echo "  ⚠️  $1"; }

check_status() {
  local url="$1" expected="$2" label="$3"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' -L "$url")
  if [ "$status" = "$expected" ]; then
    ok "$label → $status"
  else
    fail "$label → $status (expected $expected)"
  fi
}

check_redirect() {
  local url="$1" expected_location="$2" label="$3"
  local status location
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-redirs 0 "$url")
  location=$(curl -s -o /dev/null -w '%{redirect_url}' --max-redirs 0 "$url")
  if [[ "$status" =~ ^30[12]$ ]] && [[ "$location" == *"$expected_location"* ]]; then
    ok "$label → $status -> $expected_location"
  else
    fail "$label → status=$status location=$location (expected 30x -> $expected_location)"
  fi
}

check_variant_header() {
  local url="$1" ua="$2" expected="$3" label="$4"
  local variant
  variant=$(curl -s -D - -o /dev/null -A "$ua" "$url" | grep -i 'x-lord-html-variant' | tr -d '\r\n' | awk -F': ' '{print $2}')
  if [ "$variant" = "$expected" ]; then
    ok "$label variant=$variant"
  else
    fail "$label variant='$variant' (expected $expected)"
  fi
}

check_css_ref() {
  local url="$1" css_file="$2" label="$3"
  local body
  body=$(curl -sL "$url")
  if echo "$body" | grep -q "$css_file"; then
    ok "$label contains $css_file"
  else
    fail "$label missing $css_file"
  fi
}

DESKTOP_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
MOBILE_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"

echo ""
echo "═══════════════════════════════════════"
echo "  LORD Event Site — Post-Deploy Smoke"
echo "═══════════════════════════════════════"
echo ""

echo "── 1. Page status codes (desktop) ──"
check_status "$SITE/"                 200 "Root"
check_status "$SITE/love/"            200 "Love"
check_status "$SITE/schastye/"        200 "Schastye"
check_status "$SITE/radost/"          200 "Radost"

echo ""
echo "── 2. CSS references ──"
check_css_ref "$SITE/"         "tokens.css" "Root"
check_css_ref "$SITE/"         "main.css"   "Root"
check_css_ref "$SITE/love/"    "tokens.css" "Love"
check_css_ref "$SITE/love/"    "core.css"   "Love"
check_css_ref "$SITE/love/"    "pages.css"  "Love"
check_css_ref "$SITE/schastye/" "tokens.css" "Schastye"
check_css_ref "$SITE/schastye/" "core.css"   "Schastye"
check_css_ref "$SITE/schastye/" "pages.css"  "Schastye"

echo ""
echo "── 3. HTML variant headers (desktop) ──"
check_variant_header "$SITE/"          "$DESKTOP_UA" "desktop" "Root desktop"
check_variant_header "$SITE/love/"     "$DESKTOP_UA" "desktop" "Love desktop"
check_variant_header "$SITE/schastye/" "$DESKTOP_UA" "desktop" "Schastye desktop"
check_variant_header "$SITE/radost/"   "$DESKTOP_UA" "desktop" "Radost desktop"

echo ""
echo "── 4. HTML variant headers (mobile) ──"
check_variant_header "$SITE/"          "$MOBILE_UA" "mobile-root-v2" "Root mobile"
check_variant_header "$SITE/love/"     "$MOBILE_UA" "mobile-v1"      "Love mobile"
check_variant_header "$SITE/schastye/" "$MOBILE_UA" "mobile-v1"      "Schastye mobile"
check_variant_header "$SITE/radost/"   "$MOBILE_UA" "mobile-v1"      "Radost mobile"

echo ""
echo "── 5. Old mobile path redirects ──"
check_redirect "$SITE/mobile/"                                    "$SITE/"          "mobile root"
check_redirect "$SITE/mobile/versions/v1/love/index.html"         "$SITE/love/"     "v1 love"
check_redirect "$SITE/mobile/versions/v1/schastye/index.html"     "$SITE/schastye/" "v1 schastye"
check_redirect "$SITE/mobile/versions/v1/radost/index.html"       "$SITE/radost/"   "v1 radost"

echo ""
echo "── 6. www redirect ──"
check_redirect "https://www.lord-event.ru/" "$SITE/" "www → bare"

echo ""
echo "── 7. API endpoints ──"
check_status "$SITE/api/rum" 405 "RUM GET→405"
rum_status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Content-Type: application/json" -d '{}' "$SITE/api/rum")
if [ "$rum_status" = "204" ]; then ok "RUM POST→204"; else fail "RUM POST→$rum_status (expected 204)"; fi

echo ""
echo "═══════════════════════════════════════"
echo "  Results: ✅ $PASS passed  ❌ $FAIL failed  ⚠️  $WARN warnings"
echo "═══════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
