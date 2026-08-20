#!/bin/bash
# Auto-commit and push when the agent finishes a turn (after corrections).
# Skips if there are no changes or only ignored files like .env.

set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT"

# Read hook input (required by Cursor hooks protocol)
cat >/dev/null

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

if [ -z "$(git remote)" ]; then
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Stage changes, but never commit secrets
git add -A
git reset HEAD -- .env .env.local .env.* 2>/dev/null || true

if git diff --cached --quiet; then
  exit 0
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
git commit -m "Auto-save: agent rettelser ($TIMESTAMP)"

git push -u origin "$BRANCH" 2>/dev/null || git push origin "$BRANCH"

exit 0
