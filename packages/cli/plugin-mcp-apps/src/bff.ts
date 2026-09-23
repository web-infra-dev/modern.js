import type { McpBffOptions } from '@modern-js/mcp-apps/bff';
import { MCP_BFF_ENDPOINT } from './shared';

export type McpEndpointOptions = Pick<McpBffOptions, 'serverInfo' | 'onError'>;

/** Declare a BFF endpoint. Its compiled artifact is bound by the BFF lifecycle. */
export function mcpApps(options: McpEndpointOptions = {}) {
  const endpoint = (_input: { data?: unknown }): Promise<Response> => {
    throw new Error(
      'MCP endpoint is not initialized. Enable bffPlugin() and mcpAppsPlugin(), and export the handlers returned by mcpApps() from an API route.',
    );
  };
  Object.defineProperty(endpoint, MCP_BFF_ENDPOINT, { value: options });
  return {
    POST: endpoint,
    GET: endpoint,
    DELETE: endpoint,
    PUT: endpoint,
    PATCH: endpoint,
    OPTIONS: endpoint,
  };
}
