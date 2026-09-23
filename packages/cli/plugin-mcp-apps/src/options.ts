export interface McpAppsPluginOptions {
  /** Trusted application definition, relative to the project root. */
  config?: string;
  /** Optional tsconfig for config/handler compilation. */
  tsconfig?: string;
  /** Static server-only import aliases in addition to tsconfig paths. */
  alias?: Record<string, string>;
}

export interface McpAppsServerOptions {
  development?: boolean;
  endpoint?: string;
  /** Relative to appDirectory, only used in development. */
  devEntry?: string;
  /** Relative to distDirectory; serialized into the production launcher. */
  entry?: string;
  serverInfo?: { name: string; version: string };
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
