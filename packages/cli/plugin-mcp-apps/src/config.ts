export interface McpAppsPluginOptions {
  /** Enable the development-only /__mcp_inspector page. Defaults to true. */
  inspector?: boolean;
  /** Build local UI resources without a BFF dependency or server compilation. */
  mode?: 'integrated' | 'ui-only';
  /** Application definition for UI discovery, relative to the project root. Defaults to mcp_apps.ts. */
  config?: string;
  /** Exact HTTP route, defaults to /mcp. Set false for manual BFF mounting. */
  endpoint?: string | false;
}

export interface McpAppsBffRuntimeOptions {
  development: boolean;
  config: string;
  /** Omitted for legacy/manual BFF declarations. */
  endpoint?: string | false;
  /** Root-relative directory containing HTML emitted by the application builder. */
  resourceDirectory: string;
  /** Explicit public asset base, otherwise resolved from the request. */
  assetBase: string;
}

export function compiledConfigPath(config: string) {
  return config.replace(/\.(tsx?|mts|cts)$/, extension =>
    extension === '.mts' ? '.mjs' : extension === '.cts' ? '.cjs' : '.js',
  );
}
