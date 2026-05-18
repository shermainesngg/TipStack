#!/bin/bash
# Daily pipeline: fetch → process → dedup/synthesize → feed posts
# Scheduled via crontab at 10pm SGT daily

set -euo pipefail

export PATH="/Users/shermainesng/.nvm/versions/node/v22.22.0/bin:/Users/shermainesng/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

LOG="$DIR/scripts/data/pipeline-$(date +%Y-%m-%d).log"
mkdir -p "$DIR/scripts/data"

{
  echo "=== Pipeline started at $(date) ==="

  echo "[1/4] Fetching new content..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/fetch-all.ts

  echo "[2/4] Processing fetched items..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/process-fetched.ts

  echo "[3/4] Dedup + synthesis..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/push-content.ts

  echo "[4/4] Generating feed posts..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/seed-feed-posts.ts

  echo "=== Pipeline finished at $(date) ==="
} >> "$LOG" 2>&1
