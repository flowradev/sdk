import { executeData } from './payload.js';
import { apiRoot } from './api-root.js';
import { refreshMcpOAuth, type McpOAuthTokens } from './oauth.js';

export type FlowraHttpOptions = {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  tokenExpiresAt?: number;
  baseUrl: string;
  username: string;
  onOAuthTokens?: (tokens: McpOAuthTokens) => Promise<void>;
};

export { apiRoot };

export class FlowraHttp {
  private options: FlowraHttpOptions;

  constructor(options: FlowraHttpOptions) {
    this.options = options;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-username': this.options.username,
    };
    if (this.options.accessToken) {
      headers.authorization = `Bearer ${this.options.accessToken}`;
    } else if (this.options.apiKey) {
      headers['x-api-key'] = this.options.apiKey;
    }
    return headers;
  }

  private async maybeRefresh(): Promise<void> {
    const { accessToken, refreshToken, clientId, tokenExpiresAt, baseUrl } = this.options;
    if (!accessToken || !refreshToken || !clientId) return;
    if (tokenExpiresAt && tokenExpiresAt > Date.now() + 30_000) return;
    const next = await refreshMcpOAuth(baseUrl, {
      accessToken,
      refreshToken,
      clientId,
      tokenExpiresAt: tokenExpiresAt ?? 0,
    });
    this.options = { ...this.options, ...next };
    await this.options.onOAuthTokens?.(next);
  }

  private async request(method: string, path: string, body?: unknown, retried = false): Promise<unknown> {
    await this.maybeRefresh();
    const response = await fetch(`${apiRoot(this.options.baseUrl)}${path}`, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { error: text };
      }
    }
    if (response.status === 401 && !retried && this.options.refreshToken && this.options.clientId) {
      this.options = { ...this.options, tokenExpiresAt: 0 };
      return this.request(method, path, body, true);
    }
    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      (err as Error & { detail: unknown }).detail = parsed;
      throw err;
    }
    return parsed;
  }

  getProfile(): Promise<unknown> {
    return this.request('GET', '/users/profile');
  }

  balance(): Promise<unknown> {
    return this.request('GET', '/usage/balance');
  }

  async execute(
    toolSlug: string,
    body: { arguments?: Record<string, unknown>; metaSessionId?: string } = {},
  ): Promise<Record<string, unknown>> {
    const raw = await this.request('POST', `/tools/execute/${encodeURIComponent(toolSlug)}`, body);
    return executeData(raw);
  }
}
