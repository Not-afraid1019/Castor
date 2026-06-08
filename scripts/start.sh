#!/usr/bin/env bash
# Start Castor in the background (Linux / macOS)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/data/castor.pid"
LOG_FILE="$PROJECT_DIR/data/castor.stdout.log"

cd "$PROJECT_DIR"

# Ensure data directory exists
mkdir -p data

# Check if already running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Castor is already running (PID: $OLD_PID)"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# Start in background
nohup npx tsx src/index.ts > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "Castor started (PID: $!)"
echo "Logs: $LOG_FILE"
