#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 "$ROOT/scripts/prepare-openapi.py"

echo "Generating TypeScript client..."
bash "$ROOT/scripts/generate-typescript.sh"

echo "Done. Spec: openapi.json"
echo "TS:       typescript/src/generated"
echo "Python:   python (hand-written facade; regenerate TS types only)"
