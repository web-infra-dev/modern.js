import { createArtifactHandler } from './artifact';
import { type McpAppsDefinition, createMcpHandler } from './server';

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
      definition: McpAppsDefinition;
      serverInfo?: { name: string; version: string };
      configPath?: string;
    }
  | {
      configPath: string;
      development?: boolean;
      serverInfo?: { name: string; version: string };
    }
);

/** Mount after authentication at app.all('/mcp', mcpApps(...)). Does not listen. */
export function mcpApps(options: McpAppsHonoOptions) {
  const contexts = new WeakMap<Request, unknown>();
  const handleDefinition =
    'definition' in options
      ? createMcpHandler(options.definition, {
          serverInfo: options.serverInfo,
          configPath: options.configPath,
          createContext: request => contexts.get(request),
        })
      : undefined;
  const handler =
    'definition' in options
      ? {
          async handle(request: Request, context?: unknown) {
            contexts.set(request, context);
            try {
              return await handleDefinition!(request);
            } finally {
              contexts.delete(request);
            }
          },
        }
      : 'handler' in options
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
