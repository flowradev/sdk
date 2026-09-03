"""HTTP helpers for the Flowra SDK."""

from __future__ import annotations

import json
import mimetypes
import uuid
from pathlib import Path
from typing import Any, BinaryIO, Iterator, Mapping, MutableMapping, Optional, Union
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

from .errors import FlowraAPIError

FileBody = Union[str, Path, bytes, BinaryIO]


class HttpClient:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = "https://flowra.dev",
        username: Optional[str] = None,
        timeout: float = 60.0,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.timeout = timeout

    def _build_url(
        self,
        path: str,
        query: Optional[Mapping[str, Any]] = None,
    ) -> str:
        url = urljoin(f"{self.base_url}/", path.lstrip("/"))
        if query:
            filtered = {
                key: value
                for key, value in query.items()
                if value is not None
            }
            if filtered:
                url = f"{url}?{urlencode(filtered, doseq=True)}"
        return url

    def _base_headers(
        self,
        *,
        accept: str = "application/json",
    ) -> MutableMapping[str, str]:
        headers: MutableMapping[str, str] = {
            "Accept": accept,
            "x-api-key": self.api_key,
        }
        if self.username:
            headers["x-username"] = self.username
        return headers

    def _raise_http_error(self, exc: HTTPError) -> None:
        body: Any
        try:
            body = json.loads(exc.read().decode("utf-8"))
        except Exception:
            body = None
        message = None
        if isinstance(body, dict):
            message = body.get("message") or body.get("error")
        raise FlowraAPIError(
            message or f"HTTP {exc.code}",
            status_code=exc.code,
            body=body,
        ) from exc

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Optional[Mapping[str, Any]] = None,
        json_body: Any = None,
        binary: bool = False,
        extra_headers: Optional[Mapping[str, str]] = None,
    ) -> Any:
        url = self._build_url(path, query)
        headers = self._base_headers(
            accept="application/octet-stream" if binary else "application/json",
        )
        if extra_headers:
            headers.update(extra_headers)

        data: Optional[bytes] = None
        if json_body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(json_body).encode("utf-8")

        request = Request(url, data=data, headers=dict(headers), method=method.upper())
        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
                if not raw:
                    return None
                if binary:
                    return raw
                content_type = response.headers.get("Content-Type", "")
                if "application/json" in content_type:
                    return json.loads(raw.decode("utf-8"))
                return raw.decode("utf-8")
        except HTTPError as exc:
            self._raise_http_error(exc)
        except URLError as exc:
            raise FlowraAPIError(str(exc.reason)) from exc

    def request_multipart(
        self,
        method: str,
        path: str,
        *,
        query: Optional[Mapping[str, Any]] = None,
        fields: Optional[Mapping[str, Any]] = None,
        files: Optional[Mapping[str, FileBody]] = None,
        file_field: str = "file",
    ) -> Any:
        """POST/PUT multipart/form-data (used for file upload)."""
        url = self._build_url(path, query)
        boundary = f"----FlowraFormBoundary{uuid.uuid4().hex}"
        body = bytearray()

        for key, value in (fields or {}).items():
            if value is None:
                continue
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(
                f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8")
            )
            body.extend(str(value).encode("utf-8"))
            body.extend(b"\r\n")

        for name, file_value in (files or {}).items():
            filename, content, content_type = self._read_file(file_value)
            field_name = name or file_field
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(
                (
                    f'Content-Disposition: form-data; name="{field_name}"; '
                    f'filename="{filename}"\r\n'
                ).encode("utf-8")
            )
            body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
            body.extend(content)
            body.extend(b"\r\n")

        body.extend(f"--{boundary}--\r\n".encode("utf-8"))

        headers = self._base_headers()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

        request = Request(
            url,
            data=bytes(body),
            headers=dict(headers),
            method=method.upper(),
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
                if not raw:
                    return None
                content_type = response.headers.get("Content-Type", "")
                if "application/json" in content_type:
                    return json.loads(raw.decode("utf-8"))
                return raw.decode("utf-8")
        except HTTPError as exc:
            self._raise_http_error(exc)
        except URLError as exc:
            raise FlowraAPIError(str(exc.reason)) from exc

    def stream_text(
        self,
        method: str,
        path: str,
        *,
        query: Optional[Mapping[str, Any]] = None,
        json_body: Any = None,
        extra_headers: Optional[Mapping[str, str]] = None,
        chunk_size: int = 1024,
    ) -> Iterator[str]:
        """Yield decoded text chunks from a streaming response (SSE)."""
        url = self._build_url(path, query)
        headers = self._base_headers(accept="text/event-stream")
        if extra_headers:
            headers.update(extra_headers)
        data: Optional[bytes] = None
        if json_body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(json_body).encode("utf-8")

        request = Request(url, data=data, headers=dict(headers), method=method.upper())
        try:
            response = urlopen(request, timeout=self.timeout)
        except HTTPError as exc:
            self._raise_http_error(exc)
            return  # pragma: no cover
        except URLError as exc:
            raise FlowraAPIError(str(exc.reason)) from exc

        try:
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                yield chunk.decode("utf-8", errors="replace")
        finally:
            response.close()

    @staticmethod
    def _read_file(file_value: FileBody) -> tuple[str, bytes, str]:
        if isinstance(file_value, (str, Path)):
            path = Path(file_value)
            content = path.read_bytes()
            filename = path.name
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            return filename, content, content_type

        if isinstance(file_value, bytes):
            return "upload.bin", file_value, "application/octet-stream"

        # BinaryIO / file-like
        name = getattr(file_value, "name", "upload.bin")
        filename = Path(str(name)).name if name else "upload.bin"
        content = file_value.read()
        if isinstance(content, str):
            content = content.encode("utf-8")
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        return filename, content, content_type
