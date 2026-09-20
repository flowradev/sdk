import { loadConfig, resolveAuth, saveConfig, type FlowraCliConfig } from './config.js';
import type { Flags } from './args.js';
import { FlowraHttp } from './http.js';
import { redactValue } from './redact.js';
import { colorEnabled, colorizeJson, palette } from './style.js';

export async function createClient(flags: Flags, config?: FlowraCliConfig): Promise<FlowraHttp> {
  const current = config ?? (await loadConfig());
  const resolved = resolveAuth(current, flags);
  return new FlowraHttp({
    ...resolved,
    onOAuthTokens: async (tokens) => {
      const latest = await loadConfig();
      await saveConfig({
        ...latest,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        clientId: tokens.clientId,
        tokenExpiresAt: tokens.tokenExpiresAt,
        apiKey: undefined,
      });
    },
  });
}

export function printJson(value: unknown): void {
  const raw = JSON.stringify(value, null, 2);
  process.stdout.write(`${colorizeJson(raw, colorEnabled(process.stdout))}\n`);
}

export function fail(message: string, extra?: unknown): never {
  const body = extra !== undefined ? { error: message, detail: extra } : { error: message };
  const redacted = redactValue(body);
  if (process.stderr.isTTY) {
    const c = palette(colorEnabled(process.stderr));
    process.stderr.write(`${c.red('✘')} ${c.bold(message)}\n`);
  }
  // Always one JSON object line for agents / scripts that scrape stderr.
  process.stderr.write(`${JSON.stringify(redacted)}\n`);
  process.exit(1);
}
