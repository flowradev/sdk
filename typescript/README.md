# @flowra/sdk

TypeScript SDK for the Flowra API.

## Install

```bash
pnpm add @flowra/sdk
```

From this repository:

```bash
pnpm --dir typescript install
pnpm --dir typescript build
```

## Quickstart

```ts
import { Flowra } from '@flowra/sdk';

const flowra = new Flowra({ apiKey: process.env.FLOWRA_API_KEY! });

const profile = await flowra.getProfile();
const tools = await flowra.tools.list({ limit: 10 });
const run = await flowra.workflows.run('WORKFLOW_ID', {
  input: { message: 'hello' },
});
```

Act as an external user:

```ts
const userClient = flowra.asUser('customer_42');
await userClient.connections.createLink({ authConfigId: '...' });
```

## Generated surface

Every OpenAPI operation is also on `flowra.raw` (or as named exports):

```ts
import { toolsControllerGetTools, Flowra } from '@flowra/sdk';

const flowra = new Flowra({ apiKey: '...' });
await toolsControllerGetTools({ client: flowra.client, query: { limit: 5 } });
```

## Regenerate

From the repository root:

```bash
./scripts/generate.sh
```
