import type { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { useHonoContext } from '@modern-js/server-core';
import { requestOrigin } from './resources';

export { loadUiManifest, registerUiResources } from './resources';
export type { RegisterUiOptions } from './resources';
export type { UiManifest, UiMetadata } from '../manifest';

export type McpServerFactory = (
  request: Request,
) => McpServer | Promise<McpServer>;
export interface FetchHandlerOptions {
  allowedOrigins?: string[];
  onError?: (error: Error) => void;
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
  options: FetchHandlerOptions = {},
) {
  const handle = createFetchHandler(createServer, options);
  const route = async (input: { data?: unknown }) => {
    const raw = useHonoContext().req.raw;
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
