# flowra

Python SDK for the Flowra API. Stdlib only (no extra runtime deps). Requires Python 3.10+.

## Install

PyPI name is `flowra-sdk`. Import stays `flowra`. Do **not** `pip install flowra` — that package is unrelated.

```bash
pip install flowra-sdk
```

From this repo:

```bash
pip install -e "./python"
```

## Quickstart

```python
import os
from flowra import Flowra

flowra = Flowra(api_key=os.environ["FLOWRA_API_KEY"])

profile = flowra.get_profile()
tools = flowra.tools.list(limit=10)
run = flowra.workflows.run("WORKFLOW_ID", {"input": {"message": "hello"}})
```

Act as an external user:

```python
user_client = flowra.as_user("customer_42")
user_client.connections.create_link({"authConfigId": "..."})
```

## Namespaces

`tools`, `toolkits`, `skills`, `workflows`, `connections`, `auth_configs`, `users`, `triggers`, `chat`, `files`, `knowledge`, `database`, `sandbox`, `mcp`, `llm`, `browser`, `usage`

Method names are snake_case mirrors of the TypeScript facade (e.g. `create_link`, `set_active`, `ingest_url`).

## Chat streaming and usage

```python
from flowra import Flowra

flowra = Flowra(api_key="...")

for event in flowra.chat.stream(thread_id, {"input": {"messages": [...]}}, as_events=True):
    if event["event"] == "usage":
        print(event["data"])
```

```python
balance = flowra.usage.balance()
ledger = flowra.usage.list(threadId="...")
```

## Files

```python
flowra.files.upload("document", "/path/to/file.pdf")
content = flowra.files.download(file_id)  # bytes
```

## Escape hatch

```python
flowra.request("GET", "/api/v1/toolkits", query={"limit": 5})
```

HTTP failures raise `FlowraAPIError` (`status_code`, `body`).
