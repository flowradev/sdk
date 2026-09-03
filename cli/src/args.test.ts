import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgv } from './args.ts';

test('parses discover use case and session flag', () => {
  const parsed = parseArgv(['discover', 'send', 'an', 'email', '--session-id', 'sess_1']);
  assert.equal(parsed.command, 'discover');
  assert.deepEqual(parsed.positional, ['send', 'an', 'email']);
  assert.equal(parsed.flags.sessionId, 'sess_1');
});

test('parses execute JSON data', () => {
  const parsed = parseArgv(['execute', 'GMAIL_SEND_EMAIL', '-d', '{"subject":"Hi"}', '--no-wait']);
  assert.equal(parsed.command, 'execute');
  assert.equal(parsed.positional[0], 'GMAIL_SEND_EMAIL');
  assert.equal(parsed.flags.data, '{"subject":"Hi"}');
  assert.equal(parsed.flags.noWait, true);
});

test('rejects unknown flags', () => {
  assert.throws(() => parseArgv(['whoami', '--oops']), /Unknown flag/);
});
