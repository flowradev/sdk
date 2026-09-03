#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?version required}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add typescript/package.json cli/package.json python/pyproject.toml python/src/flowra/__init__.py
git commit -m "Release v${VERSION}"
git tag "v${VERSION}"
git push origin HEAD
git push origin "v${VERSION}"
