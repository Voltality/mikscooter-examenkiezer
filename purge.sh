#!/usr/bin/env bash
#
# MikScooter Examenkiezer — jsDelivr cache purge helper
#
# Usage:
#   ./purge.sh examenkiezer.js
#
# Purges the jsDelivr CDN cache for a given file in this repo so that
# the latest version on GitHub @main becomes live globally within ~30–60 seconds.
#
# Run this AFTER `git push` whenever you want the change live on the Webflow site.

set -euo pipefail

REPO="Voltality/mikscooter-examenkiezer"
FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "Usage: $0 <filename>"
  echo "Example: $0 examenkiezer.js"
  exit 1
fi

URL="https://purge.jsdelivr.net/gh/${REPO}@main/${FILE}"

echo "Purging jsDelivr cache..."
echo "  $URL"
echo ""

RESPONSE=$(curl -sS -w "\n%{http_code}" "$URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Purge successful"
  echo ""
  echo "Propagation to global edge nodes: ~30–60 seconds."
  echo "Verify with: curl -I https://cdn.jsdelivr.net/gh/${REPO}@main/${FILE}"
else
  echo "✗ Purge failed (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi
