import { validateMcpAppsConfig } from '../configuration/validate';
import {
  abortable,
  createMcpAppsHandlerLoader,
  createStaticMcpAppsToolResult,
  createToolRegistry,
  fetchJson,
  loadMcpAppsConfig,
  meaningfulContent,
  createToolResultWithView,
  publicOrigin,
  readHtml,
  resolveLocalConfigModule,
  toolError,
} from './utils';

import { getUiCapability } from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import {
  Server,
  WebStandardStreamableHTTPServerTransport,
  createMcpHandler as createSdkHandler,
  isLegacyRequest,
} from '@modelcontextprotocol/server';
import {
  ProtocolError,
  ProtocolErrorCode,
  specTypeSchemas,
} from '@modelcontextprotocol/server';
import type {
  LoadRemoteHandler,
  McpAppsDefinition,
  RemoteToolHandlerResult,
} from '../configuration/index';
import {
  createUiResources,
  createMcpAppsViewResource,
  resolveUiHtml,
} from '../ui/resources';

export {
  createMcpViewResult,
  loadMcpAppsConfig,
  meaningfulContent,
  withViewProps,
} from './utils';

export type * from '../configuration/index';
export {
  bindUiResources,
  getUiEntryName,
  createUiManifest,
  readUiManifestResource,
} from '../ui/resources';
export type { McpUiManifest } from '../ui/resources';
export { validateMcpAppsConfig } from '../configuration/validate';

export interface McpHandlerOptions<T = undefined> {
  development?: boolean;
  /** Additional browser origins allowed to call the endpoint. Same-origin is allowed by default. */
  allowedOrigins?: string[];
  serverInfo?: { name: string; version: string };
  configPath?: string;
  loadRemoteHandler?: LoadRemoteHandler;
  handlerTimeoutMs?: number;
  /** Optional prebuilt resource HTML supplied by a framework deployment adapter. */
  resourceHtml?: string;
  /** Authentication belongs here or in the surrounding HTTP middleware. */
  createContext?: (request: Request) => T | Promise<T>;
  /** Called for unexpected handler errors; error details are not sent to clients. */
  onError?: (error: unknown, toolName: string) => void;
}

/**
 * Stateless MCP HTTP endpoint. One SDK server/transport per HTTP request.
 * Mount at an exact route. Supports Node Web Request/Response adapters and Hono.
 * This factory validates definitions once; it never reads UI source or fetches a manifest.
 */
export function createMcpHandler<T = undefined>(
  definition: McpAppsDefinition,
  options: McpHandlerOptions<T> = {},
): (request: Request) => Promise<Response> {
  validateMcpAppsConfig(definition);
  const { resources, toolUris } = createUiResources(definition);
  const loadHandler = options.loadRemoteHandler ?? createMcpAppsHandlerLoader();
  const tools = createToolRegistry(definition, options, resources, toolUris);

  const createServer = async (request: Request) => {
    const context = await options.createContext?.(request);
    const server = new Server(
      options.serverInfo ?? {
        name: definition.name ?? 'modern-mcp-apps',
        version: definition.version ?? '1.0.0',
      },
      { capabilities: { tools: {}, resources: {} } },
    );
    server.setRequestHandler('tools/list', async () => {
      const capabilities = server.getClientCapabilities();
      // Stateless legacy requests do not carry their initialize capabilities.
      // For negotiated capabilities, respect the host's supported UI MIME types.
      const supportsUi =
        capabilities === undefined ||
        getUiCapability(capabilities)?.mimeTypes?.includes(
          'text/html;profile=mcp-app',
        );
      return {
        tools: [...tools.values()].map(({ descriptor }) => {
          if (supportsUi || !descriptor._meta?.ui.resourceUri)
            return descriptor;
          const { resourceUri: _uri, ...ui } = descriptor._meta.ui;
          return { ...descriptor, _meta: { ...descriptor._meta, ui } };
        }),
      };
    });
    server.setRequestHandler('resources/list', async () => ({
      resources: [...resources.values()],
    }));
    server.setRequestHandler('resources/read', async ({ params }, extra) => {
      const resource = resources.get(params.uri);
      if (!resource) {
        throw new ProtocolError(
          ProtocolErrorCode.InvalidParams,
          `Unknown UI resource: ${params.uri}`,
        );
      }
      const { name: _name, ...content } = resource;
      const tool = [...tools.values()].find(
        ({ tool }) => toolUris.get(tool.name) === params.uri,
      )?.tool;
      const view = tool?.view;
      const base =
        view?.assetBase === 'request' ? publicOrigin(request) : view?.assetBase;
      const resolved = resolveUiHtml(
        await readHtml(
          tool,
          definition.remotes.find(
            remote => remote.name === (tool ? tool.remote : resource.name),
          ),
          {
            ...options,
            signal: AbortSignal.any([request.signal, extra.mcpReq.signal]),
          },
        ),
        content._meta.ui,
        base,
      );
      return {
        contents: [
          {
            ...content,
            text: resolved.text,
            _meta: { ui: resolved.ui },
          },
        ],
      };
    });
    server.setRequestHandler('tools/call', async ({ params }, extra) => {
      const registered = tools.get(params.name);
      if (!registered) {
        throw new ProtocolError(
          ProtocolErrorCode.InvalidParams,
          `Unknown tool: ${params.name}`,
        );
      }
      const { tool, validateInput, validateOutput, timeoutMs } = registered;
      const input = params.arguments ?? {};
      if (!validateInput(input)) {
        return toolError(
          `Invalid input for tool "${tool.name}": ${JSON.stringify(validateInput.errors)}`,
        );
      }
      const timeout = new AbortController();
      const timer = setTimeout(
        () => timeout.abort(new Error('Tool timed out')),
        timeoutMs,
      );
      const signal = AbortSignal.any([
        request.signal,
        extra.mcpReq.signal,
        timeout.signal,
      ]);
      try {
        const remote = definition.remotes.find(
          item => item.name === tool.remote,
        );
        const resourceUri = toolUris.get(tool.name);
        const viewResource = resourceUri
          ? createMcpAppsViewResource({
              remote,
              toolConfig: tool,
              resourceUri,
              serverUrl: new URL(publicOrigin(request)).origin,
            })
          : undefined;
        if (!tool.handler) {
          if (!viewResource)
            throw new Error('View-only tool is missing its resource');
          return createStaticMcpAppsToolResult({
            toolName: tool.name,
            resource: viewResource,
            args: input,
          });
        }
        const handlerConfig = tool.handler;
        const handlerResult: RemoteToolHandlerResult = await abortable(
          async () => {
            const handler =
              typeof handlerConfig === 'function'
                ? handlerConfig
                : await loadHandler({
                    remote,
                    handler: handlerConfig,
                    configPath: options.configPath,
                  });
            signal.throwIfAborted();
            return handler(input, {
              toolName: tool.name,
              remoteName: remote?.name,
              remote,
              handler:
                typeof handlerConfig === 'function' ? undefined : handlerConfig,
              request,
              context,
              extra,
              signal,
              fetch,
              fetchJson,
              serverUrl: new URL(publicOrigin(request)).origin,
            });
          },
          signal,
        );
        const validated = await specTypeSchemas.CallToolResult[
          '~standard'
        ].validate({
          ...handlerResult,
          content: meaningfulContent(handlerResult, tool.name),
        });
        if (validated.issues) throw new Error('Invalid tool result');
        const result = validated.value;
        if (
          !result.isError &&
          validateOutput &&
          !validateOutput(result.structuredContent)
        ) {
          throw new Error(`Invalid structured output from tool "${tool.name}"`);
        }
        return createToolResultWithView({
          toolName: tool.name,
          args: input,
          resource: viewResource,
          handlerResult: {
            ...result,
            content: meaningfulContent(handlerResult, tool.name),
            viewProps: handlerResult.viewProps,
          },
        });
      } catch (error) {
        try {
          options.onError?.(error, tool.name);
        } catch {
          // Error reporting must not replace the tool's error response.
        }
        return toolError(
          timeout.signal.aborted
            ? 'Tool timed out'
            : signal.aborted
              ? 'Tool cancelled'
              : 'Tool execution failed',
        );
      } finally {
        clearTimeout(timer);
      }
    });
    return server;
  };

  const modern = createSdkHandler(
    ({ requestInfo }) => {
      if (!requestInfo) throw new Error('MCP HTTP request is required');
      return createServer(requestInfo);
    },
    { legacy: 'reject', responseMode: 'json' },
  );

  return async request => {
    const origin = request.headers.get('origin');
    if (
      origin !== null &&
      ![
        new URL(request.url).origin,
        new URL(publicOrigin(request)).origin,
        ...(options.allowedOrigins ?? []),
      ].includes(origin)
    ) {
      return new Response('Forbidden origin', { status: 403 });
    }
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }
    // Preserve JSON responses for existing hosts while the SDK classifies and
    // validates the latest per-request protocol envelope on the modern path.
    if (!(await isLegacyRequest(request))) return modern.fetch(request);
    const server = await createServer(request);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      return await transport.handleRequest(request);
    } finally {
      await server.close();
    }
  };
}

/** Load mcp_apps.ts (development) or its compiled JS (deployment). */
export function createMcpAppsHandler<T = undefined>(
  options: McpHandlerOptions<T> & { configPath: string },
) {
  const handler = createArtifactHandler<T>(options.configPath, options);
  return (request: Request) => handler.handle(request);
}

/** Load a file-backed definition, sharing refresh and cancellation across adapters. */
export function createArtifactHandler<T = unknown>(
  entry: string,
  options: McpHandlerOptions<T> = {},
) {
  let active:
    | {
        revision: string;
        handle: ReturnType<typeof createMcpHandler<T>>;
        abort: AbortController;
      }
    | undefined;
  let loading: Promise<void> | undefined;
  let lifecycle = new AbortController();
  const contexts = new WeakMap<Request, T>();
  // Only entry content is checked here. Dependency changes require a host rebuild/reset.
  const refresh = async () => {
    const signal = lifecycle.signal;
    if (active && !options.development) return;
    const configPath = await resolveLocalConfigModule(entry);
    const revision = options.development
      ? await fs.readFile(configPath, 'utf8')
      : 'production';
    if (active?.revision === revision) return;
    const definition = await loadMcpAppsConfig(configPath);
    signal.throwIfAborted();
    const handle = createMcpHandler(definition, {
      ...options,
      configPath,
      createContext: request =>
        contexts.has(request)
          ? (contexts.get(request) as T)
          : (options.createContext?.(request) as T | Promise<T>),
    });
    active?.abort.abort();
    active = { revision, handle, abort: new AbortController() };
  };
  return {
    async handle(request: Request, context?: T) {
      const pending = (loading ??= refresh().finally(() => {
        if (loading === pending) loading = undefined;
      }));
      await pending;
      if (!active) throw new Error('MCP Apps handler is unavailable');
      const { handle, abort } = active;
      // Read the body through Modern.js's request proxy to resume its stream.
      const init: RequestInit & { duplex: 'half' } = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: AbortSignal.any([request.signal, abort.signal]),
        duplex: 'half',
      };
      const scoped = new Request(request.url, init);
      if (context !== undefined) contexts.set(scoped, context);
      try {
        return await handle(scoped);
      } finally {
        contexts.delete(scoped);
      }
    },
    reset() {
      lifecycle.abort();
      lifecycle = new AbortController();
      loading = undefined;
      active?.abort.abort();
      active = undefined;
    },
  };
}
