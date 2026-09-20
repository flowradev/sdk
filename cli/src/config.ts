import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export type FlowraCliConfig = {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  tokenExpiresAt?: number;
  baseUrl?: string;
  username?: string;
  lastSessionId?: string;
};

export function configDir(home = homedir()): string {
  return process.env.FLOWRA_HOME?.trim() || path.join(home, '.flowra');
}

export function configPath(home = homedir()): string {
  return path.join(configDir(home), 'config.json');
}

export async function loadConfig(home = homedir()): Promise<FlowraCliConfig> {
  try {
    const raw = await readFile(configPath(home), 'utf8');
    const parsed = JSON.parse(raw) as FlowraCliConfig;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveConfig(next: FlowraCliConfig, home = homedir()): Promise<void> {
  const dir = configDir(home);
  await mkdir(dir, { mode: 0o700, recursive: true });
  const file = configPath(home);
  await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  await chmod(file, 0o600);
}

export type ResolvedAuth = {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  tokenExpiresAt?: number;
  baseUrl: string;
  username: string;
  source: 'env' | 'oauth' | 'config';
};

export function resolveAuth(
  config: FlowraCliConfig,
  flags: { baseUrl?: string; username?: string },
): ResolvedAuth {
  const envKey = (process.env.FLOWRA_API_KEY || '').trim();
  const fileKey = (config.apiKey || '').trim();
  const accessToken = (config.accessToken || '').trim();
  const baseUrl = (flags.baseUrl || process.env.FLOWRA_BASE_URL || config.baseUrl || 'https://flowra.dev').replace(
    /\/$/,
    '',
  );
  const username = flags.username || process.env.FLOWRA_USERNAME || config.username || 'project_default_user';

  if (envKey) {
    return { apiKey: envKey, baseUrl, username, source: 'env' };
  }
  if (accessToken.startsWith('mcp_at_')) {
    return {
      accessToken,
      refreshToken: (config.refreshToken || '').trim() || undefined,
      clientId: (config.clientId || '').trim() || undefined,
      tokenExpiresAt: config.tokenExpiresAt,
      baseUrl,
      username,
      source: 'oauth',
    };
  }
  if (fileKey) {
    return { apiKey: fileKey, baseUrl, username, source: 'config' };
  }
  throw new Error('Not signed in. Run `flowra login` (browser) or `flowra login --key <sk>` / FLOWRA_API_KEY.');
}
