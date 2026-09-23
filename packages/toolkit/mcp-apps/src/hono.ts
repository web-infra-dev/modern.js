import { createArtifactHandler } from './artifact';

/** Structural Hono context: no runtime dependency on Hono or a Node listener. */
interface HonoContext {
  req: { raw: Request; path: string };
}
interface Handler {
  handle(request: Request, context?: unknown): Promise<Response>;
}
export type McpAppsHonoOptions = {
  endpoint?: string;
  onError?: (error: unknown) => void;
} & (
  | { handler: Handler }
  | {
      configPath: string;
      development?: boolean;
      serverInfo?: { name: string; version: string };
    }
);

/** Mount after authentication at app.all('/mcp', mcpApps(...)). Does not listen. */
export function mcpApps(options: McpAppsHonoOptions) {
  const handler =
    'handler' in options
      ? options.handler
      : createArtifactHandler(options.configPath, {
          development: options.development ?? false,
          serverInfo: options.serverInfo,
        });
  return async (c: HonoContext, next: () => Promise<void>) => {
    if (options.endpoint && c.req.path !== options.endpoint) return next();
    try {
      return await handler.handle(c.req.raw, c);
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
