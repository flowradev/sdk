# @flowra/cli

Thin terminal door for a Flowra **project**. Prefer MCP for Cursor / OpenClaw / Claude. Use this CLI when the agent can run shell commands and MCP is not connected.

Never invent tool slugs. Typical loop: **discover → connect → execute**.

## Install

Until the package is on npm, from this repository:

```bash
pnpm --dir cli install
pnpm --dir cli build
cd cli && npm link
flowra --help
```

Without a global link: `pnpm --dir cli flowra --help` or `node cli/dist/index.js`.

Calls the same public REST as `@flowra/sdk` (`POST /api/v1/tools/execute/:slug`). Package name `@flowra/cli` (bin: `flowra`). Do not `pip install flowra`.

## Auth

Project API key from Dashboard → Project settings → API Keys. Stored in `~/.flowra/config.json` (mode `0600`). `FLOWRA_API_KEY` overrides the file. The CLI never prints the key.

```bash
flowra login --no-wait          # JSON with dashboardUrl — share with the user
flowra login --key sk_...       # save; then whoami
flowra whoami
```

Optional: `FLOWRA_BASE_URL`, `FLOWRA_USERNAME` (`x-username`, default `project_default_user`), `FLOWRA_HOME`.

## Commands

```bash
flowra discover "Gmail list recent inbox emails"
flowra connect gmail            # if status=initiated, open redirectUrl; re-run after OAuth
flowra execute GMAIL_SEND_EMAIL -d '{"recipient_email":"you@example.com","subject":"Hi","body":"Test"}'
```

Reuse `sessionId` from discover (`--session-id`). Do not pipe discover through `head`. JSON is always on stdout; errors on stderr.

`connect --wait` polls a few minutes until the toolkit is no longer `initiated`. Agents should omit `--wait` and show `redirectUrl`.

Durable cron / HITL / ledger still belong on the hosted workflow — this CLI is operate-now, not a replacement for creating a workflow.
