// Symbol.for keeps declarations interoperable across CJS/ESM package entries.
export const MCP_BFF_ENDPOINT = Symbol.for('@modern-js/plugin-mcp-apps/bff');

export interface McpAppsBffRuntimeOptions {
  development: boolean;
  /** Relative to the project root. */
  devEntry: string;
  /** Relative to the compiled output root. */
  entry: string;
}
