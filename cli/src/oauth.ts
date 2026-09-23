import { createHash, randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { mcpOAuthEndpoints } from './oauth-urls.js';

export type McpOAuthTokens = {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  tokenExpiresAt: number;
};

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier, 'ascii').digest('base64url');
  return { verifier, challenge };
}

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return { error: text };
  }
}

function listenLoopback(
  expectedState: string,
): Promise<{ port: number; close: () => Promise<void>; wait: Promise<{ code: string }> }> {
  let settle: (value: { code: string }) => void;
  let fail: (err: Error) => void;
  const wait = new Promise<{ code: string }>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/callback') {
      res.statusCode = 404;
      res.end();
      return;
    }
    const err = url.searchParams.get('error');
    const code = url.searchParams.get('code') ?? '';
    const state = url.searchParams.get('state') ?? '';
    const description = url.searchParams.get('error_description') ?? err ?? 'OAuth failed';
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    if (!code || err) {
      res.end('<!doctype html><title>Flowra</title><body>Sign-in failed. Close this tab and run <code>flowra login</code> again.</body>');
      fail(new Error(description));
      return;
    }
    if (state !== expectedState) {
      res.end('<!doctype html><title>Flowra</title><body>Sign-in failed (state). Close this tab and run <code>flowra login</code> again.</body>');
      fail(new Error('OAuth state mismatch'));
      return;
    }
    res.end('<!doctype html><title>Flowra</title><body>Signed in. You can close this tab and return to the terminal.</body>');
    settle({ code });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not bind loopback callback'));
        return;
      }
      const timer = setTimeout(() => {
        fail(new Error('Timed out waiting for Flowra sign-in'));
      }, LOGIN_TIMEOUT_MS);
      const close = () =>
        new Promise<void>((done) => {
          clearTimeout(timer);
          server.close(() => done());
        });
      void wait.finally(() => {
        void close();
      });
      resolve({ port: address.port, close, wait });
    });
  });
}

function asTokens(body: Record<string, unknown>, clientId: string): McpOAuthTokens {
  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
  const expiresIn = typeof body.expires_in === 'number' ? body.expires_in : 3600;
  if (!accessToken.startsWith('mcp_at_') || !refreshToken.startsWith('mcp_rt_')) {
    throw new Error('OAuth token response was invalid');
  }
  return {
    accessToken,
    refreshToken,
    clientId,
    tokenExpiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };
}

export async function loginWithMcpOAuth(baseUrl: string): Promise<{ authorizeUrl: string; tokens: Promise<McpOAuthTokens> }> {
  const urls = mcpOAuthEndpoints(baseUrl);
  const state = randomBytes(16).toString('base64url');
  const loopback = await listenLoopback(state);
  const redirectUri = `http://127.0.0.1:${loopback.port}/callback`;
  const { verifier, challenge } = pkce();

  const registered = await fetch(urls.register, {
    method: 'POST',
    redirect: 'manual',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      client_name: 'Flowra CLI',
      token_endpoint_auth_method: 'none',
    }),
  });
  const created = await readJson(registered);
  if (!registered.ok || typeof created.client_id !== 'string') {
    await loopback.close();
    const detail =
      typeof created.error_description === 'string'
        ? created.error_description
        : typeof created.error === 'string'
          ? created.error
          : `HTTP ${registered.status}`;
    throw new Error(`Could not register the CLI OAuth client (${detail})`);
  }
  const clientId = created.client_id;

  const authorize = new URL(urls.authorize);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('resource', urls.resource);
  authorize.searchParams.set('scope', 'mcp');

  const tokens = loopback.wait.then(async ({ code }) => {
    const exchanged = await fetch(urls.token, {
      method: 'POST',
      redirect: 'manual',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
        resource: urls.resource,
      }),
    });
    const body = await readJson(exchanged);
    if (!exchanged.ok) {
      throw new Error(typeof body.error_description === 'string' ? body.error_description : 'OAuth token exchange failed');
    }
    return asTokens(body, clientId);
  });

  return { authorizeUrl: authorize.toString(), tokens };
}

export function openAuthorizeUrl(url: string): void {
  openBrowser(url);
}

export async function refreshMcpOAuth(baseUrl: string, tokens: McpOAuthTokens): Promise<McpOAuthTokens> {
  const urls = mcpOAuthEndpoints(baseUrl);
  const exchanged = await fetch(urls.token, {
    method: 'POST',
    redirect: 'manual',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: tokens.clientId,
    }),
  });
  const body = await readJson(exchanged);
  if (!exchanged.ok) {
    throw new Error(typeof body.error_description === 'string' ? body.error_description : 'OAuth refresh failed');
  }
  return asTokens(body, tokens.clientId);
}
