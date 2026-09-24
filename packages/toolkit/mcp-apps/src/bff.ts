import { type McpAppsDefinition, createMcpHandler } from './server';

export interface McpBffOptions {
  definition: McpAppsDefinition;
  development?: boolean;
  /** Resource paths are resolved against this application-provided location. */
  configPath?: string;
  serverInfo?: { name: string; version: string };
  onError?: (error: unknown) => void;
}

interface BffContext {
  req: { raw: Request };
}

/** Modern.js BFF has already parsed the body before invoking the API function. */
export function createMcpBffHandler(options: McpBffOptions) {
  const contexts = new WeakMap<Request, BffContext>();
  const handler = createMcpHandler(options.definition, {
    configPath: options.configPath,
    development: options.development,
    serverInfo: options.serverInfo,
    onError: options.onError,
    createContext: request => contexts.get(request),
  });
  return async (input: { data?: unknown }, context: BffContext) => {
    const raw = context.req.raw;
    // Match the stateless transport even for methods with no request body.
    if (raw.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }
    try {
      const headers = new Headers(raw.headers);
      // The original stream has been consumed. Re-encode BFF's parsed JSON;
      // an absent body stays empty so SDK parse-error handling still applies.
      headers.delete('content-length');
      const request = new Request(raw.url, {
        method: raw.method,
        headers,
        body: input.data === undefined ? '' : JSON.stringify(input.data),
        signal: raw.signal,
      });
      contexts.set(request, context);
      try {
        return await handler(request);
      } finally {
        contexts.delete(request);
      }
    } catch (error) {
      options.onError?.(error);
      return Response.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: 'MCP Apps is unavailable' },
        },
        { status: 503 },
      );
    }
  };
}
