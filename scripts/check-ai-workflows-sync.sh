#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
AI_WORKFLOWS_REPO="${AI_WORKFLOWS_REPO:-https://gitlab.com/greenberrynl/config/ai-workflows.git}"
AI_WORKFLOWS_REF="${AI_WORKFLOWS_REF:-main}"
AI_WORKFLOWS_DIR="${AI_WORKFLOWS_DIR:-}"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ai-workflows-check.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ -n "$AI_WORKFLOWS_DIR" ]]; then
  SOURCE_DIR="$AI_WORKFLOWS_DIR"
else
  SOURCE_DIR="$TMP_DIR/ai-workflows"
  CLONE_URL="$AI_WORKFLOWS_REPO"
  if [[ -n "${AI_WORKFLOWS_TOKEN:-}" && "$AI_WORKFLOWS_REPO" == https://gitlab.com/* ]]; then
    CLONE_URL="https://oauth2:${AI_WORKFLOWS_TOKEN}@${AI_WORKFLOWS_REPO#https://}"
  fi
  git clone --depth 1 --branch "$AI_WORKFLOWS_REF" "$CLONE_URL" "$SOURCE_DIR" >/dev/null
fi

SYNC_SCRIPT="$SOURCE_DIR/scripts/sync.sh"
if [[ ! -x "$SYNC_SCRIPT" ]]; then
  echo "Missing executable sync script: $SYNC_SCRIPT" >&2
  exit 1
fi

CHECK_DIR="$TMP_DIR/project"
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='tsconfig.tsbuildinfo' \
  --exclude='tsconfig.typecheck.tsbuildinfo' \
  "$ROOT_DIR/" "$CHECK_DIR/"

"$SYNC_SCRIPT" --project "$CHECK_DIR" >/dev/null

MANAGED_PATHS=(
  "AI-WORKFLOWS.md"
  "AGENTS.md"
  "CLAUDE.md"
  ".github/copilot-instructions.md"
  ".github/prompts"
  ".cursor/rules"
  "commands"
  "rules"
)

DRIFT=0
for path in "${MANAGED_PATHS[@]}"; do
  if ! diff -qr "$ROOT_DIR/$path" "$CHECK_DIR/$path" >/dev/null; then
    echo "AI workflow drift detected in $path" >&2
    DRIFT=1
  fi
done

if [[ "$DRIFT" -ne 0 ]]; then
  echo "" >&2
  echo "Run this from the project root and commit the result:" >&2
  echo "  /Users/wietekepots/Web/ai-workflows/scripts/sync.sh --project ." >&2
  exit 1
fi

echo "AI workflow files are in sync."
