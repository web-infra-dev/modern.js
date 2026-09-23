import path from 'node:path';
import { createArtifactHandler } from './artifact';

export interface McpBffOptions {
  /** Project root in development; compiled output root in production. */
  root: string;
  development?: boolean;
  /** Override the compiled artifact entry, relative to root or absolute. */
  entry?: string;
  serverInfo?: { name: string; version: string };
  onError?: (error: unknown) => void;
}

interface BffContext {
  req: { raw: Request };
}

/** Modern.js BFF has already parsed the body before invoking the API function. */
export function createMcpBffHandler(options: McpBffOptions) {
  const development =
    options.development ?? process.env.NODE_ENV === 'development';
  const handler = createArtifactHandler(
    path.resolve(
      options.root,
      options.entry ??
        (development
          ? 'node_modules/.cache/modern-mcp-apps/mcp_apps.mjs'
          : 'mcp-apps/mcp_apps.mjs'),
    ),
    { development, serverInfo: options.serverInfo },
  );
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
      return await handler.handle(request, context);
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
