"""Flowra SDK errors."""

from __future__ import annotations

from typing import Any, Optional


class FlowraAPIError(Exception):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        body: Any = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.body = body
