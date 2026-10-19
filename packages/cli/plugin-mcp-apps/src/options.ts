export interface McpAppsPluginOptions {
  /** Enable the development-only /__mcp_debug page. Defaults to true. */
  debug?: boolean;
  /** Build local UI resources without a BFF dependency or server compilation. */
  mode?: 'integrated' | 'ui-only';
  /** Application definition for UI discovery, relative to the project root. Defaults to mcp_apps.ts. */
  config?: string;
  /** Exact HTTP route, defaults to /mcp. Set false for manual BFF mounting. */
  endpoint?: string | false;
}

export function endpointPath(endpoint = '/mcp') {
  if (
    !/^\/(?:[a-zA-Z0-9_.~-]+\/?)+$/.test(endpoint) ||
    endpoint.endsWith('/') ||
    endpoint.split('/').some(part => part === '.' || part === '..')
  ) {
    throw new Error(
      'MCP endpoint must be an exact absolute path without wildcards, parameters or trailing slash',
    );
  }
  return endpoint;
}
