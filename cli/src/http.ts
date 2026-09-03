import { executeData } from './payload.js';
import { apiRoot } from './api-root.js';

export type FlowraHttpOptions = {
  apiKey: string;
  baseUrl: string;
  username: string;
};

export { apiRoot };

export class FlowraHttp {
  private readonly options: FlowraHttpOptions;

  constructor(options: FlowraHttpOptions) {
    this.options = options;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${apiRoot(this.options.baseUrl)}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': this.options.apiKey,
        'x-username': this.options.username,
      },
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
