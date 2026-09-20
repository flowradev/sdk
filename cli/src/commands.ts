import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadConfig, saveConfig, resolveAuth } from './config.js';
import { createClient, fail, printJson } from './io.js';
import { loginWithMcpOAuth, openAuthorizeUrl } from './oauth.js';
import { executeData, isToolFailure, sessionIdFrom } from './payload.js';
import { redactValue } from './redact.js';
import { colorEnabled, humOk, humStep, humWarn, palette } from './style.js';
import type { Flags } from './args.js';

const DISCOVER_SLUG = 'FLOWRA_DISCOVER_TOOLS';
const CONNECT_SLUG = 'FLOWRA_MANAGE_CONNECTIONS';
const KEYS_HINT = 'Dashboard → Project settings → API Keys';
const DEFAULT_DASHBOARD = 'https://flowra.dev';

function dashboardUrl(baseUrl: string): string {
  return baseUrl.replace(/\/api\/v1\/?$/, '') || DEFAULT_DASHBOARD;
}

async function persistSession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) {
    return;
  }
  const config = await loadConfig();
  await saveConfig({ ...config, lastSessionId: sessionId });
}

function sessionArg(flags: Flags, configSession?: string): { id: string } | { generate_id: true } {
  const id = flags.sessionId || configSession;
  return id ? { id } : { generate_id: true };
}

async function promptKey(): Promise<string> {
  if (!input.isTTY) {
    throw new Error('No TTY. Use `flowra login --key <sk>` or FLOWRA_API_KEY, or `--no-wait` for the dashboard URL.');
  }
  const c = palette(colorEnabled(output));
  const rl = createInterface({ input, output });
  try {
    const value = (await rl.question(`${c.brightCyan('▸')} Paste project API key: `)).trim();
    if (!value) {
      throw new Error('Empty key.');
    }
    return value;
  } finally {
    rl.close();
  }
}

export async function login(flags: Flags): Promise<void> {
  const existing = await loadConfig();
  const baseUrl = (flags.baseUrl || process.env.FLOWRA_BASE_URL || existing.baseUrl || DEFAULT_DASHBOARD).replace(
    /\/$/,
    '',
  );
  const username = flags.username || process.env.FLOWRA_USERNAME || existing.username || 'project_default_user';

  if (flags.noWait && !flags.key && !process.env.FLOWRA_API_KEY) {
    humWarn('awaiting login', 'run `flowra login` on a machine with a browser, or paste a key');
    printJson({
      status: 'awaiting_login',
      dashboardUrl: dashboardUrl(baseUrl),
      keysPath: KEYS_HINT,
      next: 'flowra login                 # browser OAuth (same as MCP)\nflowra login --key <paste>   # or export FLOWRA_API_KEY',
    });
    return;
  }

  humStep('login', baseUrl);

  if (!flags.key && !process.env.FLOWRA_API_KEY) {
    const started = await loginWithMcpOAuth(baseUrl);
    humWarn('open browser', started.authorizeUrl);
    openAuthorizeUrl(started.authorizeUrl);
    const tokens = await started.tokens;
    const next = {
      ...existing,
      apiKey: undefined,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      clientId: tokens.clientId,
      tokenExpiresAt: tokens.tokenExpiresAt,
      baseUrl,
      username,
    };
    await saveConfig(next);
    const client = await createClient(flags, next);
    const profile = redactValue(await client.getProfile());
    humOk('saved', 'oauth');
    printJson({
      status: 'ok',
      saved: true,
      auth: 'oauth',
      username,
      baseUrl,
      profile,
    });
    return;
  }

  const apiKey = (flags.key || process.env.FLOWRA_API_KEY || (await promptKey())).trim();
  const next = {
    ...existing,
    apiKey,
    accessToken: undefined,
    refreshToken: undefined,
    clientId: undefined,
    tokenExpiresAt: undefined,
    baseUrl,
    username,
  };
  await saveConfig(next);

  const client = await createClient(flags, next);
  const profile = redactValue(await client.getProfile());
  humOk('saved', username);
  printJson({
    status: 'ok',
    saved: true,
    auth: 'api_key',
    username,
    baseUrl,
    profile,
  });
}

export async function whoami(flags: Flags): Promise<void> {
  humStep('whoami');
  const config = await loadConfig();
  const auth = resolveAuth(config, flags);
  const client = await createClient(flags, config);
  const profile = redactValue(await client.getProfile());
  let balance: unknown = null;
  try {
    balance = redactValue(await client.balance());
  } catch {
    balance = null;
  }
  humOk(auth.username, auth.baseUrl);
  printJson({
    status: 'ok',
    username: auth.username,
    baseUrl: auth.baseUrl,
    keySource: auth.source,
    profile,
    balance,
  });
}

export async function discover(useCase: string, flags: Flags): Promise<void> {
  humStep('discover', useCase);
  const config = await loadConfig();
  const client = await createClient(flags, config);
  const raw = await client.execute(DISCOVER_SLUG, {
    arguments: {
      userMessage: useCase,
      intentSummary: useCase,
      includeInputSchemas: false,
      session: sessionArg(flags, config.lastSessionId),
      queries: [{ useCase }],
    },
    metaSessionId: flags.sessionId || config.lastSessionId,
  });
  const data = executeData(raw);
  const sessionId = sessionIdFrom(data, flags.sessionId || config.lastSessionId);
  await persistSession(sessionId);
  if (isToolFailure(data)) {
    humWarn('discover failed');
    printJson(redactValue({ ...data, sessionId }));
    process.exit(2);
  }
  humOk('discover', sessionId ? `session ${sessionId}` : undefined);
  printJson(redactValue({ ...data, sessionId }));
}

export async function connect(toolkit: string, flags: Flags): Promise<void> {
  humStep('connect', toolkit);
  const config = await loadConfig();
  const client = await createClient(flags, config);
  const sessionId = flags.sessionId || config.lastSessionId;
  const call = () =>
    client.execute(CONNECT_SLUG, {
      arguments: { toolkits: [toolkit] },
      metaSessionId: sessionId,
    });

  const once = async () => {
    const raw = await call();
    const data = executeData(raw);
    const nextSession = sessionIdFrom(data, sessionId);
    await persistSession(nextSession);
    return data;
  };

  let data = await once();
  if (flags.wait) {
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
      const rows = Array.isArray(data.toolkits) ? data.toolkits : Array.isArray(data.data) ? data.data : [data];
      const statuses = rows
        .map((row) => (row && typeof row === 'object' ? (row as { status?: string }).status : undefined))
        .filter(Boolean);
      if (statuses.some((status) => status === 'initiated')) {
        humWarn('waiting for OAuth', 're-checking…');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        data = await once();
        continue;
      }
      break;
    }
  }

  const out = redactValue({ ...data, sessionId: sessionIdFrom(data, sessionId) });
  if (isToolFailure(data)) {
    humWarn('connect failed');
    printJson(out);
    process.exit(2);
  }
  humOk('connect', toolkit);
  printJson(out);
}

export async function executeTool(slug: string, flags: Flags): Promise<void> {
  if (!slug || slug.startsWith('CREATE_')) {
    fail('Pass a slug from `flowra discover`. There is no CREATE_WORKFLOW / CREATE_AGENT command.');
  }
  let args: Record<string, unknown> = {};
  if (flags.data) {
    try {
      const parsed = JSON.parse(flags.data) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        fail('--data must be a JSON object');
      }
      args = parsed as Record<string, unknown>;
    } catch {
      fail('Invalid JSON for --data');
    }
  }
  humStep('execute', slug);
  const config = await loadConfig();
  const sessionId = flags.sessionId || config.lastSessionId;
  const client = await createClient(flags, config);
  const raw = await client.execute(slug, {
    arguments: args,
    metaSessionId: sessionId,
  });
  const data = executeData(raw);
  const out = redactValue({ ...data, sessionId: sessionIdFrom(data, sessionId) });
  if (isToolFailure(data)) {
    humWarn('execute failed', slug);
    printJson(out);
    process.exit(2);
  }
  humOk('execute', slug);
  printJson(out);
}
