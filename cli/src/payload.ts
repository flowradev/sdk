const SESSION_KEYS = ['id', 'sessionId', 'session_id'];

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function executeData(raw: unknown): Record<string, unknown> {
  const outer = asRecord(raw);
  if (!outer) {
    return { value: raw };
  }
  const nested = asRecord(outer.data);
  if (nested && ('successful' in nested || 'session' in nested || 'mainToolSlugs' in nested || 'toolkits' in nested)) {
    return nested;
  }
  if ('successful' in outer || 'session' in outer || 'mainToolSlugs' in outer) {
    return outer;
  }
  return nested ?? outer;
}

export function sessionIdFrom(payload: unknown, fallback?: string): string | undefined {
  const data = asRecord(payload) ?? executeData(payload);
  const session = asRecord(data.session);
  if (session) {
    for (const key of SESSION_KEYS) {
      const value = session[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  for (const key of SESSION_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return fallback;
}

export function isToolFailure(payload: Record<string, unknown>): boolean {
  if (payload.successful === false) {
    return true;
  }
  if (typeof payload.error === 'string' && payload.error.length > 0 && payload.successful !== true) {
    return true;
  }
  return false;
}
