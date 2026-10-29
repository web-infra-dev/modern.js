import type { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { requestOrigin } from './resources';
import { requestUiOptions } from './context';
import type { RegisterUiOptions } from './resources';

export { registerUiResources } from './resources';
export type { RegisterUiOptions } from './resources';
export type { UiManifest, UiMetadata } from '../manifest';

export type McpServerFactory = (
  request: Request,
) => McpServer | Promise<McpServer>;
export interface FetchHandlerOptions {
  allowedOrigins?: string[];
  onError?: (error: Error) => void;
}
/** The parts of the Hono request context used by BFF handlers. */
export interface HonoLikeContext {
  req: { raw: Request };
  get(key: 'locals'): Record<string, unknown> | undefined;
}
export interface BffHandlerOptions extends FetchHandlerOptions {
  /** Returns the current Hono context. Defaults to `useHonoContext` from `@modern-js/server-runtime`. */
  useContext?: () => HonoLikeContext;
}
async function currentContext(
  useContext?: () => HonoLikeContext,
): Promise<HonoLikeContext> {
  if (useContext) return useContext();
  // Keep the optional Modern.js runtime out of standalone Fetch services.
  const { useHonoContext } = await import('@modern-js/server-runtime');
  return useHonoContext();
}

/** Stateless HTTP adapter. Tool registration and validation belong to the SDK. */
export function createFetchHandler(
  createServer: McpServerFactory,
  options: FetchHandlerOptions = {},
) {
  const handler = createMcpHandler(
    ({ requestInfo }) => {
      if (!requestInfo) throw new Error('MCP HTTP request is required');
      return createServer(requestInfo);
    },
    { legacy: 'stateless', onerror: options.onError },
  );
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    if (
      origin &&
      ![
        new URL(request.url).origin,
        requestOrigin(request),
        ...(options.allowedOrigins ?? []),
      ].includes(origin)
    )
      return new Response('Forbidden origin', { status: 403 });
    return handler.fetch(request);
  };
}

/** Export these functions from api/lambda/mcp.ts to expose /api/mcp. */
export function createBffHandlers(
  createServer: McpServerFactory,
  options: BffHandlerOptions = {},
) {
  const { useContext, ...fetchOptions } = options;
  const handle = createFetchHandler(async request => {
    const uiOptions = (await currentContext(useContext)).get('locals')
      ?.modernMcpApps as
      Pick<RegisterUiOptions, 'manifest' | 'mode'> | undefined;
    // The SDK may clone the incoming request before invoking its factory.
    if (uiOptions) requestUiOptions.set(request, uiOptions);
    return createServer(request);
  }, fetchOptions);
  const route = async (input: { data?: unknown }) => {
    const context = await currentContext(useContext);
    const raw = context.req.raw;
    const headers = new Headers(raw.headers);
    headers.delete('content-length');
    // BFF consumes JSON before invoking the function. Reconstruct only its body.
    const request = new Request(raw.url, {
      method: raw.method,
      headers,
      ...(raw.method === 'GET' || raw.method === 'HEAD'
        ? {}
        : { body: input.data === undefined ? '' : JSON.stringify(input.data) }),
      signal: raw.signal,
    });
    return handle(request);
  };
  return { POST: route, GET: route, DELETE: route };
}
