import { apiRoot } from './api-root.js';

export type McpOAuthEndpoints = {
  register: string;
  authorize: string;
  token: string;
  resource: string;
};

function hostname(baseUrl: string): string {
  try {
    return new URL(baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** Hosted MCP OAuth on mcp.flowra.dev; local/staging uses /api/v1/mcp/oauth. */
export function mcpOAuthEndpoints(baseUrl: string): McpOAuthEndpoints {
  const host = hostname(baseUrl);
  if (host === 'flowra.dev' || host === 'www.flowra.dev' || host === 'mcp.flowra.dev') {
    return {
      register: 'https://mcp.flowra.dev/register',
      authorize: 'https://mcp.flowra.dev/authorize',
      token: 'https://mcp.flowra.dev/token',
      resource: 'https://mcp.flowra.dev/mcp',
    };
  }
  const root = apiRoot(baseUrl);
  return {
    register: `${root}/mcp/oauth/register`,
    authorize: `${root}/mcp/oauth/authorize`,
    token: `${root}/mcp/oauth/token`,
    resource: `${root}/mcp`,
  };
}
