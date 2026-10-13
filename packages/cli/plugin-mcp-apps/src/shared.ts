// Symbol.for keeps declarations interoperable across CJS/ESM package entries.
export const MCP_BFF_ENDPOINT = Symbol.for('@modern-js/plugin-mcp-apps/bff');

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
