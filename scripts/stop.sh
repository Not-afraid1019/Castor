#!/usr/bin/env bash
# Stop Castor (Linux / macOS)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/data/castor.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Castor is not running (no pid file)"
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Castor stopped (PID: $PID)"
else
  echo "Castor process not found (stale pid file)"
fi

rm -f "$PID_FILE"
