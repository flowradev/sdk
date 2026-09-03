#!/usr/bin/env python3
"""Refresh openapi.json and strip invalid self-$refs.

By default strips the spec already in this repo. To copy from the private API
tree first:

  FLOWRA_OPENAPI=/path/to/flowra_private/api/public/openapi.json ./scripts/generate.sh
"""

from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DST = ROOT / "openapi.json"


def strip_self_refs(spec: dict) -> int:
    removed = 0
    schemas = (spec.get("components") or {}).get("schemas") or {}
    for name, schema in schemas.items():
        if not isinstance(schema, dict):
            continue
        if schema.get("$ref") == f"#/components/schemas/{name}":
            del schema["$ref"]
            removed += 1
    return removed


def main() -> None:
    src = Path(os.environ["FLOWRA_OPENAPI"]).expanduser() if os.environ.get("FLOWRA_OPENAPI") else DST
    if not src.exists():
        raise SystemExit(f"Missing OpenAPI source: {src}")

    spec = json.loads(src.read_text(encoding="utf-8"))
    removed = strip_self_refs(spec)
    DST.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    origin = src if src != DST else "in-place"
    print(f"Wrote {DST} from {origin} (stripped {removed} self-$refs)")


if __name__ == "__main__":
    main()
