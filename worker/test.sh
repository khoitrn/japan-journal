#!/usr/bin/env bash
# Japan Journal — stress test script
# Run against local wrangler dev: cd worker && npm run dev
# Then in another terminal: bash test.sh

BASE="http://localhost:8787/webhook"
# Must match USER_PHONE in .dev.vars (no + prefix for the whatsapp: prefix)
FROM="whatsapp:+12223334444"

PASS=0
FAIL=0

check() {
  local label="$1"
  local status="$2"
  local body="$3"
  local expect="$4"

  if [[ "$status" == "200" ]] && echo "$body" | grep -q "$expect"; then
    echo "  ✅  $label"
    ((PASS++))
  else
    echo "  ❌  $label"
    echo "      status=$status  expected to contain: $expect"
    echo "      body: $(echo "$body" | head -c 200)"
    ((FAIL++))
  fi
}

post() {
  local data="$1"
  curl -s -o /tmp/jj_body -w "%{http_code}" -X POST "$BASE" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "From=$FROM" \
    --data-urlencode "Body=$data"
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Japan Journal — Stress Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Infrastructure ──────────────────────────────────────────────────────────
echo "[ 1 ] Infrastructure"

STATUS=$(curl -s -o /tmp/jj_body -w "%{http_code}" -X POST "$BASE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=whatsapp:+19999999999" \
  --data-urlencode "Body=PING")
BODY=$(cat /tmp/jj_body)
check "PING reachable (any phone)" "$STATUS" "$BODY" "PING OK"

STATUS=$(post "unknown command xyz")
BODY=$(cat /tmp/jj_body)
check "Unknown-phone message silently ignored (TwiML 200)" "$STATUS" "$BODY" "<Response>"

echo ""

# ── 2. Tag parsing ─────────────────────────────────────────────────────────────
echo "[ 2 ] Tag Parsing (jottings stored, no AI call)"

for tag in "#tech" "#culture" "#lang" "#reflect" "#questions" "#tomorrow" "#activity"; do
  STATUS=$(post "$tag short note")
  BODY=$(cat /tmp/jj_body)
  check "Tag $tag accepted silently" "$STATUS" "$BODY" "<Response>"
done

STATUS=$(post "#TECH uppercase tag test")
BODY=$(cat /tmp/jj_body)
check "#TECH uppercase normalised" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "no tag plain jotting")
BODY=$(cat /tmp/jj_body)
check "Untagged jotting accepted" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "#tech")
BODY=$(cat /tmp/jj_body)
check "Tag-only (no text after) accepted" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "#unknown this is not a real tag")
BODY=$(cat /tmp/jj_body)
check "Unknown tag treated as plain jotting" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "mid-message #tech tag ignored")
BODY=$(cat /tmp/jj_body)
check "Mid-message tag does NOT trigger section hint" "$STATUS" "$BODY" "<Response>"

echo ""

# ── 3. Commands ────────────────────────────────────────────────────────────────
echo "[ 3 ] Commands"

STATUS=$(post "HELP")
BODY=$(cat /tmp/jj_body)
check "HELP returns TwiML 200" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "VOICE: I write like I'm texting. Short and direct.")
BODY=$(cat /tmp/jj_body)
check "VOICE: command accepted" "$STATUS" "$BODY" "<Response>"

echo ""

# ── 4. TEST command — full Claude round-trip ───────────────────────────────────
echo "[ 4 ] TEST command — Claude draft generation"
echo "      (makes a real API call — takes ~10-15s)"

STATUS=$(post "TEST")
BODY=$(cat /tmp/jj_body)
check "TEST returns TwiML 200 (no crash)" "$STATUS" "$BODY" "<Response>"

echo ""

# ── 5. Edit + DONE flow ────────────────────────────────────────────────────────
echo "[ 5 ] Edit + DONE flow (requires TEST to have run)"

STATUS=$(post "add to tech section: also noticed all the vending machines are cashless now")
BODY=$(cat /tmp/jj_body)
check "Edit message accepted during reviewing state" "$STATUS" "$BODY" "<Response>"

STATUS=$(post "DONE")
BODY=$(cat /tmp/jj_body)
check "DONE accepted" "$STATUS" "$BODY" "<Response>"

echo ""

# ── 6. Edge cases ──────────────────────────────────────────────────────────────
echo "[ 6 ] Edge Cases"

STATUS=$(post "")
BODY=$(cat /tmp/jj_body)
check "Empty body handled" "$STATUS" "$BODY" "<Response>"

STATUS=$(curl -s -o /tmp/jj_body -w "%{http_code}" -X POST "$BASE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=$FROM" \
  --data-urlencode "Body=photo caption here" \
  --data-urlencode "MediaUrl0=https://api.twilio.com/fake/photo.jpg" \
  --data-urlencode "MediaContentType0=image/jpeg")
BODY=$(cat /tmp/jj_body)
check "Photo attachment with caption accepted" "$STATUS" "$BODY" "<Response>"

STATUS=$(curl -s -o /tmp/jj_body -w "%{http_code}" -X POST "$BASE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=$FROM" \
  --data-urlencode "Body=#culture" \
  --data-urlencode "MediaUrl0=https://api.twilio.com/fake/photo.jpg" \
  --data-urlencode "MediaContentType0=image/jpeg")
BODY=$(cat /tmp/jj_body)
check "Tagged photo accepted" "$STATUS" "$BODY" "<Response>"

# Long message (simulate typing a lot at once)
LONG="visited the teamlab borderless exhibit, the whole place is projection-mapped and it reacts to your movement. no walls between the installations, everything bleeds into everything else. spent two hours just wandering. felt like being inside a living painting. the technology behind it must be insane — hundreds of synchronized projectors, real-time motion tracking, all running without visible seams"
STATUS=$(post "$LONG")
BODY=$(cat /tmp/jj_body)
check "Long untagged jotting accepted" "$STATUS" "$BODY" "<Response>"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "  Results: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
