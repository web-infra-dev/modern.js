import type { McpBffOptions } from '@modern-js/mcp-apps/bff';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
// Marks route declarations for bff-runtime to discover before BFF registers routes.
// Symbol.for keeps declarations interoperable across CJS/ESM package entries.
export const MCP_BFF_ENDPOINT = Symbol.for('@modern-js/plugin-mcp-apps/bff');

export type McpEndpointOptions = Pick<
  McpBffOptions,
  'serverInfo' | 'onError' | 'allowedOrigins'
>;

/**
 * Declare a BFF endpoint without initializing the MCP handler yet.
 * During prepareApiServer, bff-runtime reads the attached definition and options,
 * binds the built UI resources, and replaces this placeholder with a real handler.
 * Deferring initialization makes framework context and UI artifact paths available.
 */
export function mcpApps(
  definition: McpAppsDefinition,
  options: McpEndpointOptions = {},
) {
  const endpoint = (_input: { data?: unknown }): Promise<Response> => {
    throw new Error(
      'MCP endpoint is not initialized. Enable bffPlugin() and mcpAppsPlugin(), and export the handlers returned by mcpApps() from an API route.',
    );
  };
  // All methods share one declaration so the runtime can reuse the same handler.
  Object.defineProperty(endpoint, MCP_BFF_ENDPOINT, {
    value: { ...options, definition },
  });
  return {
    POST: endpoint,
    GET: endpoint,
    DELETE: endpoint,
    PUT: endpoint,
    PATCH: endpoint,
    OPTIONS: endpoint,
  };
}

/** Mount a server definition as a BFF endpoint. */
export const mcpServer = mcpApps;

/** Shared by the build plugin and BFF runtime to locate the compiled definition. */
export function compiledConfigPath(configPath: string) {
  return configPath.replace(/\.(tsx?|mts|cts)$/, extension =>
    extension === '.mts' ? '.mjs' : extension === '.cts' ? '.cjs' : '.js',
  );
}
