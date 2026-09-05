"""Product facade for the Flowra API."""

from __future__ import annotations

from typing import Any, Iterator, Mapping, Optional, Union

from ._http import FileBody, HttpClient
from .stream_usage import ParsedSseEvent, parse_sse_chunk


class Flowra:
    """Flowra client covering the main API-key resource groups."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = "https://flowra.dev",
        username: Optional[str] = None,
        timeout: float = 60.0,
    ) -> None:
        self._options = {
            "api_key": api_key,
            "base_url": base_url,
            "username": username,
            "timeout": timeout,
        }
        self._http = HttpClient(
            api_key=api_key,
            base_url=base_url,
            username=username,
            timeout=timeout,
        )
        self.tools = _Tools(self._http)
        self.toolkits = _Toolkits(self._http)
        self.skills = _Skills(self._http)
        self.workflows = _Workflows(self._http)
        self.connections = _Connections(self._http)
        self.auth_configs = _AuthConfigs(self._http)
        self.users = _Users(self._http)
        self.triggers = _Triggers(self._http)
        self.chat = _Chat(self._http)
        self.files = _Files(self._http)
        self.knowledge = _Knowledge(self._http)
        self.database = _Database(self._http)
        self.sandbox = _Sandbox(self._http)
        self.mcp = _Mcp(self._http)
        self.llm = _Llm(self._http)
        self.browser = _Browser(self._http)
        self.usage = _Usage(self._http)

    def as_user(self, username: str) -> "Flowra":
        return Flowra(
            api_key=self._options["api_key"],
            base_url=self._options["base_url"],
            username=username,
            timeout=self._options["timeout"],
        )

    def get_profile(self) -> Any:
        return self._http.request("GET", "/api/v1/users/profile")

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Optional[Mapping[str, Any]] = None,
        json: Any = None,
    ) -> Any:
        return self._http.request(method, path, query=query, json_body=json)


class _Tools:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/tools", query=query)

    def get(self, tool_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/tools/byId/{tool_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/tools", json_body=dict(body))

    def update(self, tool_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/tools/byId/{tool_id}",
            json_body=dict(body),
        )

    def remove(self, tool_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/tools/byId/{tool_id}")

    def set_active(self, tool_id: str) -> Any:
        return self._http.request("PATCH", f"/api/v1/tools/byId/{tool_id}/status")

    def execute(self, tool_slug: str, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/tools/execute/{tool_slug}",
            json_body=dict(body or {}),
        )

    def execution_logs(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/tools/execution-logs", query=query)


class _Toolkits:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/toolkits", query=query)

    def list_with_tools(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/toolkits/with-tools", query=query)

    def get(self, toolkit_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/toolkits/byId/{toolkit_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/toolkits", json_body=dict(body))

    def update(self, toolkit_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/toolkits/byId/{toolkit_id}",
            json_body=dict(body),
        )

    def remove(self, toolkit_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/toolkits/byId/{toolkit_id}")

    def set_active(self, toolkit_id: str) -> Any:
        return self._http.request("PATCH", f"/api/v1/toolkits/byId/{toolkit_id}/status")

    def messaging_channels(self) -> Any:
        return self._http.request("GET", "/api/v1/toolkits/messaging-channels")

    def list_categories(self) -> Any:
        return self._http.request("GET", "/api/v1/toolkits/categories")


class _Skills:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/skills/list", query=query)

    def get(self, skill_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/skills/detail/{skill_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/skills/create", json_body=dict(body))

    def update(self, skill_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/skills/update/{skill_id}",
            json_body=dict(body),
        )

    def remove(self, skill_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/skills/delete/{skill_id}")

    def add_to_library(self, skill_id: str) -> Any:
        return self._http.request("POST", f"/api/v1/skills/library/add/{skill_id}")

    def catalog_browse(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/skills/catalog/browse", query=query)

    def import_github(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/skills/import/github", json_body=dict(body))

    def registry_search(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/skills/registry/search", query=query)

    def registry_list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/skills/registry/list", query=query)

    def registry_install(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/skills/registry/install",
            json_body=dict(body),
        )

    def registry_sync(self, skill_id: str) -> Any:
        return self._http.request("POST", f"/api/v1/skills/registry/sync/{skill_id}")


class _Workflows:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/workflow/manager/list", query=query)

    def get(self, workflow_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/workflow/manager/detail/{workflow_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/workflow/manager/create",
            json_body=dict(body),
        )

    def update(self, workflow_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/update/{workflow_id}",
            json_body=dict(body),
        )

    def remove(self, workflow_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/workflow/manager/delete/{workflow_id}")

    def set_active(self, workflow_id: str, active_status: bool) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/activeStatus/{workflow_id}",
            json_body={"activeStatus": active_status},
        )

    def run(self, workflow_id: str, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/workflow/manager/execute/{workflow_id}",
            json_body=dict(body or {}),
        )

    def status(self, thread_id: str) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/workflow/manager/executions/thread/{thread_id}/status",
        )

    def resume(self, thread_id: str, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/workflow/manager/executions/thread/{thread_id}/resume",
            json_body=dict(body or {}),
        )

    def executions(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/workflow/manager/executions", query=query)

    def execution(self, execution_id: str) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/workflow/manager/executions/{execution_id}",
        )

    def statistics(self, workflow_id: str) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/workflow/manager/{workflow_id}/statistics",
        )

    def executions_for(self, workflow_id: str, **query: Any) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/workflow/manager/{workflow_id}/executions",
            query=query,
        )

    def add_connection(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/workflow/manager/add-connection",
            json_body=dict(body),
        )

    def change_connection(self, workflow_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/change-connection/{workflow_id}",
            json_body=dict(body),
        )

    def set_auth_config(self, workflow_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/set-auth-config/{workflow_id}",
            json_body=dict(body),
        )

    def clear_auth_config(self, workflow_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/clear-auth-config/{workflow_id}",
            json_body=dict(body),
        )

    def clear_connection(self, workflow_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/workflow/manager/clear-connection/{workflow_id}",
            json_body=dict(body),
        )


class _Connections:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/connected_accounts", query=query)

    def list_grouped(self) -> Any:
        return self._http.request("GET", "/api/v1/connected_accounts/grouped-by-toolkit")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/connected_accounts",
            json_body=dict(body),
        )

    def create_link(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/connected_accounts/link",
            json_body=dict(body),
        )

    def update(self, connection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/connected_accounts/{connection_id}",
            json_body=dict(body),
        )

    def remove(self, connection_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/connected_accounts/{connection_id}")


class _AuthConfigs:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/auth_configs", query=query)

    def get(self, auth_config_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/auth_configs/{auth_config_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/auth_configs", json_body=dict(body))

    def remove(self, auth_config_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/auth_configs/{auth_config_id}")


class _Users:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/external-users", query=query)

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/external-users", json_body=dict(body))

    def get_by_username(self, username: str) -> Any:
        return self._http.request("GET", f"/api/v1/external-users/username/{username}")

    def toggle_active(self, user_id: str) -> Any:
        return self._http.request(
            "PUT",
            f"/api/v1/external-users/{user_id}/toggle-active",
        )

    def refresh_avatar(self, user_id: str) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/external-users/{user_id}/refresh-avatar",
        )


class _Triggers:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/trigger_instances/active", query=query)

    def upsert(self, slug: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/trigger_instances/{slug}/upsert",
            json_body=dict(body),
        )

    def remove(self, trigger_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/trigger_instances/manage/{trigger_id}")

    def set_status(self, trigger_id: str) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/trigger_instances/manage/{trigger_id}/status",
        )

    def invocation_logs(self, **query: Any) -> Any:
        return self._http.request(
            "GET",
            "/api/v1/trigger_instances/invocation-logs",
            query=query,
        )

    def replay_webhook(self, log_id: str) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/trigger_instances/invocation-logs/{log_id}/replay-webhook",
        )


class _Chat:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def create_thread(self, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/graphify/threads",
            json_body=dict(body or {}),
        )

    def get_thread(self, thread_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/graphify/threads/{thread_id}")

    def update_thread(self, thread_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/graphify/threads/{thread_id}",
            json_body=dict(body),
        )

    def delete_thread(self, thread_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/graphify/threads/{thread_id}")

    def search_threads(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/graphify/threads/search",
            json_body=dict(body),
        )

    def history(self, thread_id: str, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/graphify/threads/{thread_id}/history",
            json_body=dict(body or {}),
        )

    def state(self, thread_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/graphify/threads/{thread_id}/state")

    def stream(
        self,
        thread_id: str,
        body: Mapping[str, Any],
        *,
        as_events: bool = False,
    ) -> Union[str, Iterator[ParsedSseEvent]]:
        """Stream a chat/agent run.

        By default returns the full SSE body as a string (buffered).
        Pass ``as_events=True`` to iterate parsed SSE events as they arrive.
        """
        if not as_events:
            return self._http.request(
                "POST",
                f"/api/v1/graphify/threads/{thread_id}/runs/stream",
                json_body=dict(body),
            )

        def _iter() -> Iterator[ParsedSseEvent]:
            buffer = ""
            for chunk in self._http.stream_text(
                "POST",
                f"/api/v1/graphify/threads/{thread_id}/runs/stream",
                json_body=dict(body),
            ):
                buffer += chunk
                events, buffer = parse_sse_chunk(buffer)
                for event in events:
                    yield event

        return _iter()

    def list_runs(self, thread_id: str, **query: Any) -> Any:
        defaults = {"limit": "20", "offset": "0", "status": ""}
        defaults.update({k: v for k, v in query.items() if v is not None})
        return self._http.request(
            "GET",
            f"/api/v1/graphify/threads/{thread_id}/runs",
            query=defaults,
        )

    def cancel_run(
        self,
        thread_id: str,
        run_id: str,
        **query: Any,
    ) -> Any:
        defaults = {"wait": "false", "action": "interrupt"}
        defaults.update({k: v for k, v in query.items() if v is not None})
        return self._http.request(
            "POST",
            f"/api/v1/graphify/threads/{thread_id}/runs/{run_id}/cancel",
            query=defaults,
        )

    def generate_title(self, thread_id: str) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/graphify/threads/{thread_id}/generate-title",
        )

    def send_operator_reply(self, thread_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/graphify/threads/{thread_id}/operator-reply",
            json_body=dict(body),
        )

    def set_reply_mode(self, thread_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/graphify/threads/{thread_id}/reply-mode",
            json_body=dict(body),
        )

    def join_stream(
        self,
        thread_id: str,
        run_id: str,
        *,
        as_events: bool = False,
        last_event_id: Optional[str] = None,
        **query: Any,
    ) -> Union[str, Iterator[ParsedSseEvent]]:
        """Join an in-flight chat/agent run stream.

        By default returns the full SSE body as a string (buffered).
        Pass ``as_events=True`` to iterate parsed SSE events as they arrive.
        """
        extra_headers = {"last-event-id": last_event_id} if last_event_id else None
        path = f"/api/v1/graphify/threads/{thread_id}/runs/{run_id}/stream"
        if not as_events:
            return self._http.request(
                "GET",
                path,
                query=query or None,
                extra_headers=extra_headers,
            )

        def _iter() -> Iterator[ParsedSseEvent]:
            buffer = ""
            for chunk in self._http.stream_text(
                "GET",
                path,
                query=query or None,
                extra_headers=extra_headers,
            ):
                buffer += chunk
                events, buffer = parse_sse_chunk(buffer)
                for event in events:
                    yield event

        return _iter()


class _Files:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/file", query=query)

    def upload(
        self,
        file_type: str,
        file: FileBody,
        *,
        fields: Optional[Mapping[str, Any]] = None,
        file_field: str = "file",
    ) -> Any:
        return self._http.request_multipart(
            "POST",
            f"/api/v1/file/upload/single/{file_type}",
            fields=fields,
            files={file_field: file},
            file_field=file_field,
        )

    def remove(self, file_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/file/{file_id}")

    def download(self, file_id: str) -> bytes:
        result = self._http.request(
            "GET",
            f"/api/v1/file/download/{file_id}",
            binary=True,
        )
        if isinstance(result, bytes):
            return result
        if result is None:
            return b""
        return str(result).encode("utf-8")

    def storage_breakdown(self) -> Any:
        return self._http.request("GET", "/api/v1/file/storage-breakdown")

    def serve_by_filename(self, filename: str) -> bytes:
        result = self._http.request(
            "GET",
            f"/api/v1/file/{filename}",
            binary=True,
        )
        if isinstance(result, bytes):
            return result
        if result is None:
            return b""
        return str(result).encode("utf-8")

    def delete_many(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/file/delete-many",
            json_body=dict(body),
        )

    def file_type(self, file_type: str) -> Any:
        return self._http.request("GET", f"/api/v1/file/fileType/{file_type}")

    def file_types(self) -> Any:
        return self._http.request("GET", "/api/v1/file/fileTypes")

    def prune_oldest(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/file/prune-oldest",
            json_body=dict(body),
        )


class _Knowledge:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self) -> Any:
        return self._http.request("GET", "/api/v1/knowledge/collections")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/knowledge/collections",
            json_body=dict(body),
        )

    def get(self, collection_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/knowledge/collections/{collection_id}")

    def rename(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/knowledge/collections/{collection_id}",
            json_body=dict(body),
        )

    def remove(self, collection_id: str) -> Any:
        return self._http.request(
            "DELETE",
            f"/api/v1/knowledge/collections/{collection_id}",
        )

    def chunks(self, collection_id: str, **query: Any) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/knowledge/collections/{collection_id}/chunks",
            query=query,
        )

    def sources(self, collection_id: str) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/knowledge/collections/{collection_id}/sources",
        )

    def delete_source(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "DELETE",
            f"/api/v1/knowledge/collections/{collection_id}/sources",
            json_body=dict(body),
        )

    def ingest_file(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/knowledge/collections/{collection_id}/ingest/file",
            json_body=dict(body),
        )

    def ingest_text(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/knowledge/collections/{collection_id}/ingest/text",
            json_body=dict(body),
        )

    def ingest_url(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/knowledge/collections/{collection_id}/ingest/url",
            json_body=dict(body),
        )

    def search(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/knowledge/collections/{collection_id}/search",
            json_body=dict(body),
        )

    def set_expose_via_mcp(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/knowledge/collections/{collection_id}/expose-mcp",
            json_body=dict(body),
        )


class _Database:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self) -> Any:
        return self._http.request("GET", "/api/v1/table/collections")

    def get(self, collection_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/table/collections/{collection_id}")

    def remove(self, collection_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/table/collections/{collection_id}")

    def documents(self, collection_id: str, **query: Any) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/table/collections/{collection_id}/documents",
            query=query,
        )

    def create_document(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/table/collections/{collection_id}/documents",
            json_body=dict(body),
        )

    def update_document(
        self,
        collection_id: str,
        document_id: str,
        body: Mapping[str, Any],
    ) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/table/collections/{collection_id}/documents/{document_id}",
            json_body=dict(body),
        )

    def delete_document(self, collection_id: str, document_id: str) -> Any:
        return self._http.request(
            "DELETE",
            f"/api/v1/table/collections/{collection_id}/documents/{document_id}",
        )

    def set_expose_via_mcp(self, collection_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/table/collections/{collection_id}/expose-mcp",
            json_body=dict(body),
        )


class _Sandbox:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def run_ephemeral(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/sandbox/ephemeral", json_body=dict(body))

    def create_session(self, body: Optional[Mapping[str, Any]] = None) -> Any:
        return self._http.request(
            "POST",
            "/api/v1/sandbox/sessions",
            json_body=dict(body or {}),
        )

    def get_session(self, session_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/sandbox/sessions/{session_id}")

    def execute(self, session_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/sandbox/sessions/{session_id}/execute",
            json_body=dict(body),
        )

    def release_session(self, session_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/sandbox/sessions/{session_id}")

    def start_thread_computer(self, thread_id: str) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/sandbox/threads/{thread_id}/start",
        )

    def get_thread_computer(self, thread_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/sandbox/threads/{thread_id}")

    def release_thread_computer(self, thread_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/sandbox/threads/{thread_id}")


class _Mcp:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/mcp_manager", query=query)

    def get(self, server_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/mcp_manager/{server_id}")

    def create(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/mcp_manager", json_body=dict(body))

    def update(self, server_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/mcp_manager/{server_id}",
            json_body=dict(body),
        )

    def remove(self, server_id: str) -> Any:
        return self._http.request("DELETE", f"/api/v1/mcp_manager/{server_id}")

    def config(self, server_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/mcp_manager/{server_id}/config")

    def set_auth_config(self, server_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/mcp_manager/set-auth-config/{server_id}",
            json_body=dict(body),
        )

    def clear_auth_config(self, server_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "PATCH",
            f"/api/v1/mcp_manager/clear-auth-config/{server_id}",
            json_body=dict(body),
        )

    def hosted_sse(self) -> Any:
        return self._http.request("GET", "/api/v1/mcp")

    def hosted_post(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/mcp", json_body=dict(body))

    def handle_sse(self, server_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/mcp/{server_id}")

    def handle_post(self, server_id: str, body: Mapping[str, Any]) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/mcp/{server_id}",
            json_body=dict(body),
        )


class _Llm:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def models(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/ai/models", query=query)

    def chat(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/ai/llm/chat", json_body=dict(body))

    def generate(self, body: Mapping[str, Any]) -> Any:
        return self._http.request("POST", "/api/v1/ai/llm/generate", json_body=dict(body))


class _Browser:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def status(self, session_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/browser/sessions/{session_id}/status")

    def touch(self, session_id: str) -> Any:
        return self._http.request("POST", f"/api/v1/browser/sessions/{session_id}/touch")

    def close(self, session_id: str) -> Any:
        return self._http.request("POST", f"/api/v1/browser/sessions/{session_id}/close")

    def view(self, session_id: str, **query: Any) -> Any:
        return self._http.request(
            "GET",
            f"/api/v1/browser/sessions/{session_id}/view",
            query=query,
        )

    def complete_connection(self, session_id: str) -> Any:
        return self._http.request(
            "POST",
            f"/api/v1/browser/sessions/{session_id}/complete-browser-connection",
        )


class _Usage:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def list(self, **query: Any) -> Any:
        return self._http.request("GET", "/api/v1/usage", query=query)

    def balance(self) -> Any:
        return self._http.request("GET", "/api/v1/usage/balance")

    def for_execution(self, execution_id: str) -> Any:
        return self._http.request("GET", f"/api/v1/usage/executions/{execution_id}")


# Re-export parse helper used by stream(as_events=True)
__all__ = ["Flowra", "parse_sse_chunk"]
