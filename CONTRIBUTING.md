# Contributing

TypeScript types are generated from the committed [`openapi.json`](./openapi.json). Python is hand-written and must stay in sync with the TypeScript facade.

```bash
./scripts/generate.sh
```

To refresh the spec from a local Flowra API checkout:

```bash
FLOWRA_OPENAPI=/path/to/api/public/openapi.json ./scripts/generate.sh
```

## Release (npm + PyPI)

One GitHub Action bumps **TypeScript**, **CLI**, and **Python** to the same semver, commits `Release vX.Y.Z`, tags it, then publishes:

| Registry | Package | Install |
| --- | --- | --- |
| npm | `@flowra/sdk` | `pnpm add @flowra/sdk` |
| npm | `@flowra/cli` | `pnpm add -g @flowra/cli` |
| PyPI | `flowra-sdk` | `pip install flowra-sdk` |

Import is still `from flowra import Flowra`. Do not publish a package named `flowra` on PyPI.

### Secrets (once)

Repo → **Settings → Secrets and variables → Actions**:

1. `NPM_TOKEN` — npm [Automation token](https://www.npmjs.com/settings/~/tokens) with publish rights on the `@flowra` org. Create the [flowra org](https://www.npmjs.com/org/create) first if it does not exist.
2. `PYPI_API_TOKEN` — PyPI [API token](https://pypi.org/manage/account/token/) (scope to project `flowra-sdk` after the first upload).

The workflow needs write access to `main` (Settings → Actions → General → Workflow permissions, or allow `github-actions[bot]` through branch protection).

### Run it

1. GitHub → **Actions → Release → Run workflow**
2. Branch: `main`
3. **bump**
   - `none` — publish the version already in the repo (use this for **0.1.0** the first time, or to retry a failed publish)
   - `patch` / `minor` / `major` — bump all three packages, commit, tag, publish

Do not run two releases at once. If npm already has that version, bump again (`patch`) instead of retrying `none`.
