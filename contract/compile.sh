#!/usr/bin/env bash
# Compile the Blackline attestation Compact contract.
# Usage: ./contract/compile.sh
#
# Prerequisites:
#   - compact CLI installed (curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh)
#
# Options:
#   --skip-zk   Skip ZK proof key generation (faster, no Docker needed)
#   --full      Generate full ZK keys (requires Docker proof server running)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE="$SCRIPT_DIR/attestation.compact"
TARGET="$SCRIPT_DIR/dist"

# Allow compact compiler to resolve imports from node_modules
export COMPACT_PATH="${COMPACT_PATH:-}:$PROJECT_ROOT/node_modules"

if ! command -v compact &> /dev/null; then
  echo "Error: 'compact' CLI not found. Install it first."
  exit 1
fi

mkdir -p "$TARGET"

SKIP_ZK=""
if [[ "${1:-}" == "--skip-zk" ]]; then
  SKIP_ZK="--skip-zk"
  echo "Compiling (skipping ZK key generation)..."
elif [[ "${1:-}" == "--full" ]]; then
  echo "Compiling with full ZK key generation (requires Docker proof server)..."
else
  SKIP_ZK="--skip-zk"
  echo "Compiling (use --full for ZK keys, requires Docker)..."
fi

compact compile $SKIP_ZK "$SOURCE" "$TARGET"

echo "✅ Contract compiled to $TARGET"
ls -la "$TARGET"
