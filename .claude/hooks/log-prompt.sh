#!/bin/bash
# Log prompts with timestamps for session tracking
# Hook: UserPromptSubmit

LOG_DIR="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')/.claude/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/prompts-$(date +%Y-%m-%d).log"
echo "[$(date +%Y-%m-%dT%H:%M:%S)] $*" >> "$LOG_FILE"
