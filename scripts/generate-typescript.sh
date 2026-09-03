#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/typescript/src/generated"

npx --yes @hey-api/openapi-ts@0.73.0 \
  -i "$ROOT/openapi.json" \
  -o "$OUT" \
  -c @hey-api/client-fetch

echo "Generated $OUT"
