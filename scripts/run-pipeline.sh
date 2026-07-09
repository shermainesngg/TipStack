#!/bin/bash
# Daily pipeline: fetch → process → dedup/synthesize → feed posts
# Scheduled via crontab at 10pm SGT daily

set -euo pipefail

export PATH="/Users/shermainesng/.nvm/versions/node/v22.22.0/bin:/Users/shermainesng/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# Load env vars so the Claude CLI picks up CLAUDE_CODE_OAUTH_TOKEN in non-interactive (cron) contexts
set -a
source "$DIR/.env.local"
set +a

LOG="$DIR/scripts/data/pipeline-$(date +%Y-%m-%d).log"
mkdir -p "$DIR/scripts/data"

{
  echo "=== Pipeline started at $(date) ==="

  echo "[1/3] Fetching new content..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/fetch-all.ts

  echo "[2/3] Fetching Anthropic changelog..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/fetch-changelog.ts

  echo "[3/3] Processing fetched items (extract, dedup, synthesize, feed posts)..."
  npx tsx --require ./scripts/lib/stub-server-only.cjs scripts/process-fetched.ts

  echo "=== Pipeline finished at $(date) ==="
} >> "$LOG" 2>&1
