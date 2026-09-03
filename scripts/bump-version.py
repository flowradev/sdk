#!/usr/bin/env python3
"""Bump the shared SDK version in TypeScript, CLI, and Python packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_semver(value: str) -> tuple[int, int, int]:
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", value.strip())
    if not match:
        raise SystemExit(f"Not a patch/minor/major semver: {value}")
    return int(match[1]), int(match[2]), int(match[3])


def bump(version: str, kind: str) -> str:
    major, minor, patch = parse_semver(version)
    if kind == "major":
        return f"{major + 1}.0.0"
    if kind == "minor":
        return f"{major}.{minor + 1}.0"
    if kind == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise SystemExit(f"Unknown bump: {kind}")


def replace_once(path: Path, pattern: str, repl: str) -> None:
    text = path.read_text(encoding="utf-8")
    updated, n = re.subn(pattern, repl, text, count=1, flags=re.M)
    if n != 1:
        raise SystemExit(f"Expected 1 version match in {path}, got {n}")
    path.write_text(updated, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("kind", choices=("patch", "minor", "major"))
    args = parser.parse_args()

    ts = ROOT / "typescript" / "package.json"
    data = json.loads(ts.read_text(encoding="utf-8"))
    current = data["version"]
    nxt = bump(current, args.kind)

    data["version"] = nxt
    ts.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    cli = ROOT / "cli" / "package.json"
    cli_data = json.loads(cli.read_text(encoding="utf-8"))
    cli_data["version"] = nxt
    cli.write_text(json.dumps(cli_data, indent=2) + "\n", encoding="utf-8")

    replace_once(
        ROOT / "python" / "pyproject.toml",
        r'^version = "[^"]+"',
        f'version = "{nxt}"',
    )
    replace_once(
        ROOT / "python" / "src" / "flowra" / "__init__.py",
        r'^__version__ = "[^"]+"',
        f'__version__ = "{nxt}"',
    )

    print(nxt)


if __name__ == "__main__":
    main()
