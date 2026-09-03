![Flowra](./docs/assets/logo.png)

# Flowra SDK

Call hosted AI agents and locked workflows from your backend. Gmail, Slack, GitHub, Notion, Telegram — 1,000+ apps, OAuth, human approval, a ledger of every tool call.

[Product](https://flowra.dev) · [Docs](https://docs.flowra.dev) · [SDK guide](https://docs.flowra.dev/guides/sdk) · [MIT](./LICENSE)

![Flowra Official SDK](./docs/assets/readme-banner.png)

This repo is for **your server**. In Cursor / Claude / OpenClaw, use [MCP](https://docs.flowra.dev) instead.

Get a project API key: [Dashboard](https://flowra.dev) → Project settings → API Keys.

```ts
import { Flowra } from '@flowra/sdk';

const flowra = new Flowra({ apiKey: process.env.FLOWRA_API_KEY! });
```

```python
import os
from flowra import Flowra

flowra = Flowra(api_key=os.environ["FLOWRA_API_KEY"])
```

Python is the same API in snake_case (`create_link`, `as_user`, `ingest_url`).

---

## What you can do

### Send Gmail or Slack from your app

Don't invent slugs — take them from `tools.list` (often `GMAIL_SEND_EMAIL`, `SLACK_SEND_MESSAGE`).

```ts
const tools = await flowra.tools.list({ q: 'gmail send email' });
const slug = tools.data[0].slug; // e.g. GMAIL_SEND_EMAIL

await flowra.tools.execute(slug, {
  arguments: {
    recipient_email: 'you@example.com',
    subject: 'Invoice paid',
    body: 'Thanks — you are all set.',
  },
});
```

### Connect an app (OAuth)

If the user isn't connected yet, you get a URL. Open it, they approve, you continue.

```ts
const configs = await flowra.authConfigs.list({ q: 'gmail' });
const link = await flowra.connections.createLink({
  authConfigId: configs.data[0].id,
});

if (link.redirectUrl) {
  // send the user here, then retry
  console.log(link.redirectUrl);
}
```

### Ship your own tool — it lands in the cloud

Gmail is already in the catalog. Your billing API is not. Create a toolkit + tool on **this project**; Flowra hosts it. It does not join the public catalog, but **discovery on this project** will find it: MCP `FLOWRA_DISCOVER_TOOLS`, `flowra discover "…"`, or `tools.list`.

```ts
await flowra.toolkits.create({
  slug: 'httpbin',
  name: 'HTTP Bin',
  description: 'Probe REST API',
  baseUrl: 'https://httpbin.org',
  noAuth: true,
});

await flowra.tools.create({
  toolkitSlug: 'httpbin',
  slug: 'HTTPBIN_GET_JSON',
  name: 'Get JSON',
  description: 'GET /json from httpbin',
  noAuth: true,
  inputParameters: { type: 'object', properties: {} },
  outputParameters: { type: 'object' },
  script: {
    language: 'javascript',
    source: `export default async function ({ input }) {
  const res = await fetch("https://httpbin.org/json");
  return { ok: true, data: await res.json(), input };
}`,
  },
});
```

Next discover for this project returns `HTTPBIN_GET_JSON`. Then execute it like any catalog tool:

```ts
await flowra.tools.execute('HTTPBIN_GET_JSON', { arguments: {} });
```

```bash
flowra discover "get json from httpbin"
flowra execute HTTPBIN_GET_JSON -d '{}'
```

Slug: `UPPER_SNAKE` with the toolkit prefix (`httpbin` → `HTTPBIN_GET_JSON`). Only register when DISCOVER has no app for that job.

### Run a locked workflow

A workflow is a graph you already designed (cron recap, triage, alerts). Your backend just triggers it.

```ts
const run = await flowra.workflows.run('WORKFLOW_ID', {
  input: { channel: '#ops' },
  mode: 'production',
});

const status = await flowra.workflows.status(run.threadId);
```

### Pause for a human, then resume

Sends, deletes, and payouts can wait. If the run is `paused`, don't start over.

```ts
const status = await flowra.workflows.status(threadId);

if (status.status === 'paused') {
  await flowra.workflows.resume(threadId, {
    resumeValue: { approved: true },
  });
}
```

### Chat with an agent that has your tools

```ts
const thread = await flowra.chat.createThread({
  metadata: { source: 'support' },
});

await flowra.chat.stream(thread.id, {
  input: {
    messages: [
      { role: 'user', content: "Rank today's inbox and draft a Slack recap." },
    ],
  },
});
```

### Teach it your docs

```ts
const collection = await flowra.knowledge.create({ name: 'Help center' });

await flowra.knowledge.ingestUrl(collection.id, {
  url: 'https://docs.yoursite.com/faq',
});

const hits = await flowra.knowledge.search(collection.id, {
  query: 'How do I reset my API key?',
  limit: 5,
});
```

### Act as a customer of _their_ product

```ts
const acme = flowra.asUser('customer_42');
await acme.connections.createLink({ authConfigId: 'AUTH_CONFIG_ID' });
await acme.tools.execute('GMAIL_SEND_EMAIL', {
  arguments: {
    recipient_email: 'ada@acme.com',
    subject: 'Welcome',
    body: 'Hi Ada',
  },
});
```

Default user is `project_default_user`. Never pass a project UUID as the username. Keep the API key out of source.

### One shot from a terminal

When MCP isn't connected: **discover → connect → execute**. Never invent the slug.

```bash
flowra login --key "$FLOWRA_API_KEY"
flowra discover "Gmail list recent inbox emails"
flowra connect gmail
flowra execute GMAIL_SEND_EMAIL -d '{"recipient_email":"you@example.com","subject":"Hi","body":"Test"}'
```

If `connect` returns `redirectUrl`, open it, then run connect again.

---

## Install

Not on npm / PyPI yet. **Do not** `pip install flowra` from PyPI — that name is unrelated.

**TypeScript**

```bash
git clone https://github.com/flowradev/sdk.git
cd sdk/typescript && pnpm install && pnpm build
pnpm add /path/to/sdk/typescript   # in your app
```

**Python** (3.10+)

```bash
pip install "git+https://github.com/flowradev/sdk.git#subdirectory=python"
```

**CLI**

```bash
cd sdk/cli && pnpm install && pnpm build && npm link
```

---

## Map of the client

| You want              | Call                                           |
| --------------------- | ---------------------------------------------- |
| Apps & OAuth          | `tools` `toolkits` `connections` `authConfigs` |
| Agents & cron graphs  | `workflows` `triggers` `chat`                  |
| RAG / files / tables  | `knowledge` `files` `database`                 |
| Code, browser, models | `sandbox` `browser` `llm` `mcp`                |
| Credits               | `usage`                                        |

---

[MIT](./LICENSE) © Flowra
