"""SSE parsing helpers for chat/agent stream usage events."""

from __future__ import annotations

import json
from typing import Any, Optional, TypedDict


class StreamUsageBreakdown(TypedDict, total=False):
    ai_model: float
    tool: float
    sandbox: float
    browser: float
    workflow: float
    media: float


class StreamUsageEvent(TypedDict, total=False):
    runCredits: float
    threadCreditsTotal: float
    balanceRemaining: float
    executionId: Optional[str]
    breakdown: StreamUsageBreakdown


class ParsedSseEvent(TypedDict, total=False):
    event: str
    data: Any
    id: str


def parse_sse_chunk(buffer: str) -> tuple[list[ParsedSseEvent], str]:
    """Parse a raw SSE chunk into structured events.

    Returns ``(events, remainder)`` where ``remainder`` is an incomplete
    trailing block that should be prepended to the next chunk.
    """
    events: list[ParsedSseEvent] = []
    blocks = buffer.split("\n\n")
    remainder = blocks.pop() if blocks else ""

    for block in blocks:
        lines = block.split("\n")
        event = "message"
        event_id: Optional[str] = None
        data_lines: list[str] = []

        for line in lines:
            if line.startswith("event:"):
                event = line[6:].strip()
            elif line.startswith("data:"):
                data_lines.append(line[5:].lstrip())
            elif line.startswith("id:"):
                event_id = line[3:].strip()

        if not data_lines:
            continue

        raw = "\n".join(data_lines)
        data: Any = raw
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            pass

        parsed: ParsedSseEvent = {"event": event, "data": data}
        if event_id is not None:
            parsed["id"] = event_id
        events.append(parsed)

    return events, remainder


def extract_stream_usage(events: list[ParsedSseEvent]) -> Optional[StreamUsageEvent]:
    """Return the last ``usage`` event from a list of parsed SSE events."""
    for item in reversed(events):
        if item.get("event") == "usage":
            data = item.get("data")
            if isinstance(data, dict):
                return data  # type: ignore[return-value]
    return None
