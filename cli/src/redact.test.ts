import assert from 'node:assert/strict';
import test from 'node:test';
import { redactValue } from './redact.ts';

test('redacts apiKey and nested tokens', () => {
  const out = redactValue({
    apiKey: 'sk_live_secret',
    profile: { access_token: 'tok', email: 'a@b.c' },
  }) as { apiKey: string; profile: { access_token: string; email: string } };
  assert.equal(out.apiKey, '[redacted]');
  assert.equal(out.profile.access_token, '[redacted]');
  assert.equal(out.profile.email, 'a@b.c');
});
