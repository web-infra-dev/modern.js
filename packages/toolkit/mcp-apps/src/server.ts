import { MCP_VIEW_META_KEY } from './view-result';
import { getUiCapability } from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
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
import type { CallToolResult } from '@modelcontextprotocol/server';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import type {
  LoadRemoteHandler,
  LoadRemoteHandlerOptions,
  McpAppsConfig,
  McpAppsDefinition,
  RemoteToolHandler,
  RemoteToolHandlerResult,
} from './config';
import {
  normalizeToolConfig,
  createUiResources,
  createMcpAppsViewResource,
  readRuntimeHtml,
  resolveUiHtml,
  validateMcpAppsConfig,
} from './resources';

export type * from './config';
export {
  bindUiResources,
  getUiEntryName,
  createUiManifest,
  readUiManifestResource,
} from './resources';
export type { McpUiManifest } from './resources';
export { validateMcpAppsConfig } from './resources';

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

export function meaningfulContent(
  result: RemoteToolHandlerResult,
  toolName: string,
) {
  if (result.content?.length) return result.content;
  const data = result.structuredContent;
  return [
    {
      type: 'text' as const,
      text:
        data === undefined
          ? `Tool ${toolName} ${result.isError ? 'failed' : 'completed'}.`
          : JSON.stringify(data),
    },
  ];
}

function toolError(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

async function abortable<T>(
  work: () => T | Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(work), aborted]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
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
  const tools = new Map(
    definition.tools
      .map(tool => normalizeToolConfig(tool, definition.viewDefaults))
      .map(tool => {
        const inputSchema = tool.inputSchema ?? {
          type: 'object',
          properties: {},
        };
        if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(tool.name)) {
          throw new Error(`Invalid tool name: ${tool.name}`);
        }
        const timeoutMs =
          (typeof tool.handler === 'function'
            ? undefined
            : tool.handler?.timeoutMs) ??
          options.handlerTimeoutMs ??
          30_000;
        if (
          !Number.isSafeInteger(timeoutMs) ||
          timeoutMs < 1 ||
          timeoutMs > 2_147_483_647
        ) {
          throw new Error(`Invalid timeoutMs for tool "${tool.name}"`);
        }
        if (
          tool.visibility &&
          (tool.visibility.length === 0 ||
            tool.visibility.some(value => value !== 'model' && value !== 'app'))
        ) {
          throw new Error(`Invalid visibility for tool "${tool.name}"`);
        }
        const uri = toolUris.get(tool.name);
        const resource = uri ? resources.get(uri) : undefined;
        // Compile per tool so schemas with the same $id cannot share stale validators.
        // Strict mode fails unsupported keywords instead of silently dropping constraints.
        const ajv = new Ajv2020({ strict: true, allErrors: true });
        addFormats(ajv);
        const validateInput = ajv.compile(inputSchema);
        const validateOutput = tool.outputSchema
          ? ajv.compile(tool.outputSchema)
          : undefined;
        const descriptor = {
          name: tool.name,
          ...(tool.title === undefined ? {} : { title: tool.title }),
          ...(tool.description === undefined
            ? {}
            : { description: tool.description }),
          inputSchema: inputSchema as {
            type: 'object';
            [key: string]: unknown;
          },
          ...(tool.outputSchema
            ? {
                outputSchema: tool.outputSchema as {
                  type: 'object';
                  [key: string]: unknown;
                },
              }
            : {}),
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
          ...(resource || tool.visibility || tool._meta
            ? {
                _meta: {
                  ...tool._meta,
                  ui: {
                    ...(resource ? { resourceUri: resource.uri } : {}),
                    visibility: tool.visibility ?? ['model', 'app'],
                  },
                },
              }
            : {}),
        };
        return [
          tool.name,
          { tool, descriptor, validateInput, validateOutput, timeoutMs },
        ];
      }),
  );
  if (tools.size !== definition.tools.length) {
    throw new Error('Tool names must be unique');
  }

  const readHtml = async (uri: string) => {
    const tool = [...tools.values()].find(
      ({ tool }) => toolUris.get(tool.name) === uri,
    )?.tool;
    if (!tool?.view || tool.remote) {
      const html =
        options.resourceHtml ?? (await readRuntimeHtml(options.development));
      const capabilities =
        definition.remotes.find(remote => remote.name === tool?.remote)
          ?.capabilities ?? {};
      return html.replace(
        /<head\b[^>]*>/i,
        head =>
          `${head}<script type="application/json" id="modern-mcp-capabilities">${JSON.stringify(capabilities).replace(/</g, '\\u003c')}</script>`,
      );
    }
    const html = tool.view.html;
    if (!html)
      throw new Error(
        'Local MCP view has no HTML resource; bind the application-built UI resources first',
      );
    if (html.startsWith('https://')) {
      const response = await fetch(html, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error(`UI HTML request failed: ${response.status}`);
      return response.text();
    }
    if (path.isAbsolute(html)) return fs.readFile(html, 'utf8');
    if (!options.configPath)
      throw new Error('Compiled local view requires configPath');
    return fs.readFile(
      path.resolve(path.dirname(options.configPath), html),
      'utf8',
    );
  };

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
    server.setRequestHandler('resources/read', async ({ params }) => {
      const resource = [...resources.values()].find(
        item => item.uri === params.uri,
      );
      if (!resource) {
        throw new ProtocolError(
          ProtocolErrorCode.InvalidParams,
          `Unknown UI resource: ${params.uri}`,
        );
      }
      const { name: _name, ...content } = resource;
      const view = [...tools.values()].find(
        ({ tool }) => toolUris.get(tool.name) === params.uri,
      )?.tool.view;
      const base =
        view?.assetBase === 'request' ? publicOrigin(request) : view?.assetBase;
      const resolved = resolveUiHtml(
        await readHtml(resource.uri),
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
              serverUrl: new URL(request.url).origin,
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
              serverUrl: new URL(request.url).origin,
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
        return mergeHandlerResultWithView({
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
        options.onError?.(error, tool.name);
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

/** Account for HTTPS termination at the application's reverse proxy. */
function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'http' || proto === 'https') url.protocol = `${proto}:`;
  return `${url.origin}/`;
}

export async function loadMcpAppsConfig(
  configPath: string,
): Promise<McpAppsConfig> {
  const resolvedPath = await resolveLocalConfigModule(configPath);

  if (/\.[cm]?tsx?$/.test(resolvedPath) || /\.[cm]?js$/.test(resolvedPath)) {
    return loadMcpAppsModule(resolvedPath);
  }

  const raw = await fs.readFile(path.resolve(resolvedPath), 'utf8');
  return JSON.parse(raw) as McpAppsConfig;
}

// Resolve a config path that omits its extension, mirroring how local handler
// modules are resolved. Lets callers point at "dir/mcp_apps" and pick up the
// compiled mcp_apps.mjs (prod) or the mcp_apps.ts source (dev) automatically.
// If nothing matches, the path is returned unchanged so the original error
// (e.g. ENOENT from readFile) still surfaces.
async function resolveLocalConfigModule(configPath: string): Promise<string> {
  if (path.extname(configPath)) {
    return configPath;
  }
  const absolute = path.resolve(configPath);
  const candidates = [
    `${absolute}.mjs`,
    `${absolute}.js`,
    `${absolute}.cjs`,
    `${absolute}.ts`,
    `${absolute}.tsx`,
    `${absolute}.json`,
  ];
  for (const candidate of candidates) {
    try {
      if ((await fs.stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {
      // Try the next extension.
    }
  }
  return configPath;
}

let moduleRevision = 0;

// Load application-compiled modules. TypeScript support belongs to the host runtime.
async function importLocalModule(
  modulePath: string,
): Promise<Record<string, unknown>> {
  const absolutePath = path.resolve(modulePath);
  // Query parameters bypass ESM caching, but CJS uses the filename cache.
  const require = createRequire(absolutePath);
  delete require.cache[require.resolve(absolutePath)];
  const moduleUrl = pathToFileURL(absolutePath);
  moduleUrl.searchParams.set('t', String(++moduleRevision));
  return (await importOptional(moduleUrl.href)) as Record<string, unknown>;
}

async function loadMcpAppsModule(configPath: string): Promise<McpAppsConfig> {
  const mod = (await importLocalModule(configPath)) as {
    default?: McpAppsConfig;
    config?: McpAppsConfig;
    mcpApps?: McpAppsConfig;
  };
  const exported = mod.default ?? mod.config ?? mod.mcpApps;
  const config =
    exported && !('tools' in exported) && 'default' in exported
      ? (exported as { default: McpAppsConfig }).default
      : exported;
  if (!config) {
    throw new Error(
      `${configPath}: expected a default export from defineMcpApps(...)`,
    );
  }
  return config;
}

function createMcpAppsHandlerLoader(): LoadRemoteHandler {
  const localLoaderCache = new Map<string, Promise<RemoteToolHandler>>();
  return async options => {
    const cacheKey = `${options.configPath ?? process.cwd()}:${options.handler.module}:${options.handler.exportName}`;
    if (!localLoaderCache.has(cacheKey)) {
      const loading = loadLocalToolHandler(options);
      localLoaderCache.set(cacheKey, loading);
      loading.catch(() => {
        if (localLoaderCache.get(cacheKey) === loading)
          localLoaderCache.delete(cacheKey);
      });
    }
    const handler = localLoaderCache.get(cacheKey);
    if (!handler) {
      throw new Error(
        `Unable to load local handler "${options.handler.module}"`,
      );
    }
    return handler;
  };
}

async function loadLocalToolHandler({
  handler,
  configPath,
}: LoadRemoteHandlerOptions): Promise<RemoteToolHandler> {
  const modulePath = await resolveLocalHandlerModule(
    handler.module,
    configPath,
  );
  // TypeScript support belongs to the host runtime, as with config loading.
  const mod = await importLocalModule(modulePath);
  const resolved = mod[handler.exportName] ?? mod.default;
  if (typeof resolved !== 'function') {
    throw new Error(
      `Export "${handler.exportName}" from "${modulePath}" is not a function`,
    );
  }
  return resolved as RemoteToolHandler;
}

async function resolveLocalHandlerModule(
  modulePath: string,
  configPath?: string,
): Promise<string> {
  const baseDir = configPath
    ? path.dirname(path.resolve(configPath))
    : process.cwd();
  const candidate = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(baseDir, modulePath);
  const candidates = path.extname(candidate)
    ? [candidate]
    : [
        candidate,
        `${candidate}.ts`,
        `${candidate}.tsx`,
        `${candidate}.js`,
        `${candidate}.mjs`,
        `${candidate}.cjs`,
        path.join(candidate, 'index.ts'),
        path.join(candidate, 'index.js'),
      ];
  for (const item of candidates) {
    try {
      const stat = await fs.stat(item);
      if (stat.isFile()) {
        return item;
      }
    } catch {
      // Try the next extension.
    }
  }
  throw new Error(
    `Local handler module "${modulePath}" was not found from ${baseDir}`,
  );
}

function importOptional(specifier: string): Promise<unknown> {
  return import(specifier);
}

function createStaticMcpAppsToolResult({
  toolName,
  resource,
  args,
}: {
  toolName: string;
  resource: NonNullable<ReturnType<typeof createMcpAppsViewResource>>;
  args: unknown;
}) {
  const payload = { tool: toolName, resource, args };
  return {
    content: [
      {
        type: 'text' as const,
        text: `Opened ${toolName} with arguments ${JSON.stringify(args)}.`,
      },
    ],
    _meta: { [MCP_VIEW_META_KEY]: { version: 1, ...payload } },
  };
}

async function fetchJson<T = unknown>(
  url: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }
  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body:
      body !== undefined && typeof body !== 'string'
        ? JSON.stringify(body)
        : body,
  });
  if (!response.ok) {
    throw new Error(
      `${url}: request failed (${response.status} ${response.statusText})`,
    );
  }
  return (await response.json()) as T;
}

function mergeHandlerResultWithView({
  toolName,
  args,
  resource,
  handlerResult,
}: {
  toolName: string;
  args: unknown;
  resource?: ReturnType<typeof createMcpAppsViewResource>;
  handlerResult: RemoteToolHandlerResult;
}) {
  return {
    content: meaningfulContent(handlerResult, toolName),
    ...(handlerResult.structuredContent === undefined
      ? {}
      : { structuredContent: handlerResult.structuredContent }),
    ...(handlerResult._meta || resource
      ? {
          _meta: {
            ...handlerResult._meta,
            ...(resource
              ? {
                  [MCP_VIEW_META_KEY]: {
                    version: 1,
                    tool: toolName,
                    resource,
                    args,
                    ...(handlerResult.viewProps
                      ? { viewProps: handlerResult.viewProps }
                      : {}),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(handlerResult.isError ? { isError: true } : {}),
  };
}

/** Result contract consumed by createMcpView in a user-managed MCP server. */
export function createMcpViewResult(
  args: Record<string, unknown>,
  result: RemoteToolHandlerResult,
) {
  const { viewProps, ...rest } = result;
  const metadata: Record<string, unknown> = {
    ...result._meta,
    [MCP_VIEW_META_KEY]: {
      version: 1,
      args,
      ...(viewProps ? { viewProps } : {}),
    },
  };
  return {
    ...rest,
    content: result.content ?? [],
    _meta: metadata,
  };
}

type BusinessResult<T extends Record<string, unknown>> = Omit<
  RemoteToolHandlerResult,
  'structuredContent' | 'viewProps'
> & { structuredContent: T };

/** Explicitly reuse structured business data as card props, optionally mapping it. */
export function withViewProps<T extends Record<string, unknown>>(
  result: BusinessResult<T>,
): BusinessResult<T> & { viewProps: T };
export function withViewProps<
  T extends Record<string, unknown>,
  P extends Record<string, unknown>,
>(
  result: BusinessResult<T>,
  select: (data: T) => P,
): BusinessResult<T> & { viewProps: P };
export function withViewProps<
  T extends Record<string, unknown>,
  P extends Record<string, unknown>,
>(result: BusinessResult<T>, select?: (data: T) => P) {
  return {
    ...result,
    viewProps: select
      ? select(result.structuredContent)
      : result.structuredContent,
  };
}
