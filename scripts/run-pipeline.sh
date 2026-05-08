#!/bin/bash
# Daily pipeline: fetch → process → publish + feed posts
# Scheduled via crontab at 1pm SGT daily

set -euo pipefail

export PATH="/Users/shermainesng/.nvm/versions/node/v22.22.0/bin:/Users/shermainesng/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

LOG="$DIR/scripts/data/pipeline-$(date +%Y-%m-%d).log"
mkdir -p "$DIR/scripts/data"

{
  echo "=== Pipeline started at $(date) ==="

  echo "[1/3] Fetching new content..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/fetch-all.ts

  echo "[2/3] Processing fetched items..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/process-fetched.ts

  echo "[3/3] Publishing & generating feed posts..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/generate-missing-feed-posts.ts

  echo "=== Pipeline finished at $(date) ==="
} >> "$LOG" 2>&1
