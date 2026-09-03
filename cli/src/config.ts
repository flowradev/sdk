import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export type FlowraCliConfig = {
  apiKey?: string;
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

export function resolveAuth(
  config: FlowraCliConfig,
  flags: { baseUrl?: string; username?: string },
): { apiKey: string; baseUrl: string; username: string } {
  const apiKey = (process.env.FLOWRA_API_KEY || config.apiKey || '').trim();
  if (!apiKey) {
    throw new Error(
      'No API key. Run `flowra login --no-wait`, then `flowra login --key <sk>` or set FLOWRA_API_KEY.',
    );
  }
  return {
    apiKey,
    baseUrl: (flags.baseUrl || process.env.FLOWRA_BASE_URL || config.baseUrl || 'https://flowra.dev').replace(
      /\/$/,
      '',
    ),
    username: flags.username || process.env.FLOWRA_USERNAME || config.username || 'project_default_user',
  };
}
