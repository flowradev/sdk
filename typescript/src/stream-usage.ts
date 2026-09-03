/** Parsed SSE `event: usage` payload after a chat/agent stream completes. */
export type StreamUsageEvent = {
  runCredits: number;
  threadCreditsTotal: number;
  balanceRemaining?: number;
  executionId?: string | null;
  breakdown?: {
    ai_model: number;
    tool: number;
    sandbox: number;
    browser: number;
    workflow: number;
    media: number;
  };
};

export type ParsedSseEvent = {
  event: string;
  data: unknown;
  id?: string;
};

/**
 * Parse a raw SSE chunk (one or more events) into structured events.
 * Works with fetch() streams and Node Readable streams.
 */
export function parseSseChunk(buffer: string): { events: ParsedSseEvent[]; remainder: string } {
  const events: ParsedSseEvent[] = [];
  const blocks = buffer.split('\n\n');
  const remainder = blocks.pop() ?? '';

  for (const block of blocks) {
    const lines = block.split('\n');
    let event = 'message';
    let id: string | undefined;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      } else if (line.startsWith('id:')) {
        id = line.slice(3).trim();
      }
    }

    if (!dataLines.length) continue;
    const raw = dataLines.join('\n');
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      // keep raw string
    }
    events.push({ event, data, id });
  }

  return { events, remainder };
}

/** Return the last `usage` event from a list of parsed SSE events. */
export function extractStreamUsage(events: ParsedSseEvent[]): StreamUsageEvent | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.event === 'usage') {
      return events[i].data as StreamUsageEvent;
    }
  }
  return null;
}
