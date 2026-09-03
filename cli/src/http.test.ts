import assert from 'node:assert/strict';
import test from 'node:test';
import { apiRoot } from './api-root.ts';

test('apiRoot appends /api/v1 once', () => {
  assert.equal(apiRoot('https://flowra.dev'), 'https://flowra.dev/api/v1');
  assert.equal(apiRoot('https://flowra.dev/'), 'https://flowra.dev/api/v1');
  assert.equal(apiRoot('https://flowra.dev/api/v1'), 'https://flowra.dev/api/v1');
});
