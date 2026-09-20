import assert from 'node:assert/strict';
import test from 'node:test';
import { mcpOAuthEndpoints } from '../dist/oauth-urls.js';

test('hosted Flowra uses mcp.flowra.dev OAuth', () => {
  const urls = mcpOAuthEndpoints('https://flowra.dev');
  assert.equal(urls.authorize, 'https://mcp.flowra.dev/authorize');
  assert.equal(urls.token, 'https://mcp.flowra.dev/token');
  assert.equal(urls.resource, 'https://mcp.flowra.dev/mcp');
});

test('localhost uses /api/v1/mcp/oauth', () => {
  const urls = mcpOAuthEndpoints('http://localhost:3001');
  assert.equal(urls.authorize, 'http://localhost:3001/api/v1/mcp/oauth/authorize');
  assert.equal(urls.resource, 'http://localhost:3001/api/v1/mcp');
});
