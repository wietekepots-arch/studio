#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
HOOK="$HOOKS_DIR/pre-commit"

mkdir -p "$HOOKS_DIR"

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
CHECK="$ROOT_DIR/scripts/check-ai-workflows-sync.sh"

if [[ -x "$CHECK" ]]; then
  AI_WORKFLOWS_DIR="${AI_WORKFLOWS_DIR:-/Users/wietekepots/Web/ai-workflows}" "$CHECK"
fi
EOF

chmod +x "$HOOK"

echo "Installed AI workflows pre-commit hook at $HOOK"
