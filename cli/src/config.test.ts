import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { configPath, loadConfig, resolveAuth, saveConfig } from './config.ts';

test('saveConfig writes JSON and resolveAuth prefers env key', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'flowra-cli-'));
  await saveConfig({ apiKey: 'sk_file', baseUrl: 'https://example.test', username: 'u1' }, home);
  const raw = await readFile(configPath(home), 'utf8');
  assert.match(raw, /sk_file/);
  const config = await loadConfig(home);
  const previous = process.env.FLOWRA_API_KEY;
  process.env.FLOWRA_API_KEY = 'sk_env';
  try {
    const auth = resolveAuth(config, {});
    assert.equal(auth.apiKey, 'sk_env');
    assert.equal(auth.username, 'u1');
    assert.equal(auth.baseUrl, 'https://example.test');
  } finally {
    if (previous === undefined) {
      delete process.env.FLOWRA_API_KEY;
    } else {
      process.env.FLOWRA_API_KEY = previous;
    }
  }
});

test('resolveAuth throws without a key', async () => {
  const previous = process.env.FLOWRA_API_KEY;
  delete process.env.FLOWRA_API_KEY;
  try {
    assert.throws(() => resolveAuth({}, {}), /No API key/);
  } finally {
    if (previous !== undefined) {
      process.env.FLOWRA_API_KEY = previous;
    }
  }
});
