import { loadConfig, resolveAuth, type FlowraCliConfig } from './config.js';
import type { Flags } from './args.js';
import { FlowraHttp } from './http.js';
import { redactValue } from './redact.js';

export async function createClient(flags: Flags, config?: FlowraCliConfig): Promise<FlowraHttp> {
  const resolved = resolveAuth(config ?? (await loadConfig()), flags);
  return new FlowraHttp(resolved);
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function fail(message: string, extra?: unknown): never {
  const body = extra !== undefined ? { error: message, detail: extra } : { error: message };
  process.stderr.write(`${JSON.stringify(redactValue(body))}\n`);
  process.exit(1);
}
