# Contributing

TypeScript types are generated from the committed [`openapi.json`](./openapi.json). Python is hand-written and must stay in sync with the TypeScript facade.

```bash
./scripts/generate.sh
```

To refresh the spec from a local Flowra API checkout:

```bash
FLOWRA_OPENAPI=/path/to/api/public/openapi.json ./scripts/generate.sh
```
