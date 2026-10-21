import { compileToolSchemas } from '../schema/validate';
import { normalizeToolConfig } from '../configuration/normalize';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { CallToolResult } from '@modelcontextprotocol/server';
import type {
  LoadRemoteHandler,
  LoadRemoteHandlerOptions,
  McpAppsConfig,
  McpAppsDefinition,
  NormalizedToolConfig,
  RemoteConfig,
  RemoteToolHandler,
  RemoteToolHandlerResult,
} from '../configuration/index';
import {
  createMcpAppsViewResource,
  createUiResources,
  readRuntimeHtml,
  readHtmlSource,
} from '../ui/resources';
import { MCP_VIEW_META_KEY } from '../ui/view-result';

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

export function toolError(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

export async function abortable<T>(
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

export function createToolRegistry(
  definition: McpAppsDefinition,
  options: { handlerTimeoutMs?: number },
  resources: ReturnType<typeof createUiResources>['resources'],
  toolUris: ReturnType<typeof createUiResources>['toolUris'],
) {
  const tools = new Map(
    definition.tools
      .map(tool => normalizeToolConfig(tool, definition.viewDefaults))
      .map(tool => {
        const inputSchema = tool.inputSchema ?? {
          type: 'object',
          properties: {},
        };
        // MCP recommends this format (SHOULD, not MUST), so warn without rejecting.
        // https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tool-names
        if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(tool.name)) {
          console.warn(
            `Tool name ${JSON.stringify(tool.name)} does not follow the MCP recommended format: 1–128 ASCII letters, digits, underscores, hyphens or dots. Some clients may not support it.`,
          );
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
        const { validateInput, validateOutput } = compileToolSchemas(
          inputSchema,
          tool.outputSchema,
        );
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
  return tools;
}

export async function readHtml(
  tool: NormalizedToolConfig | undefined,
  remote: RemoteConfig | undefined,
  options: {
    resourceHtml?: string;
    development?: boolean;
    configPath?: string;
    signal?: AbortSignal;
  },
) {
  options.signal?.throwIfAborted();
  if (remote) {
    const html =
      options.resourceHtml ?? (await readRuntimeHtml(options.development));
    const capabilities = remote.capabilities ?? {};
    return html.replace(
      /<head\b[^>]*>/i,
      head =>
        `${head}<script type="application/json" id="modern-mcp-capabilities">${JSON.stringify(capabilities).replace(/</g, '\\u003c')}</script>`,
    );
  }
  const html = tool?.view?.html;
  if (!html)
    throw new Error(
      'Local MCP view has no HTML resource; bind the application-built UI resources first',
    );
  return readHtmlSource(html, {
    directory: options.configPath
      ? path.dirname(options.configPath)
      : undefined,
    signal: options.signal,
  });
}

/**
 * Account for HTTPS termination at the application's reverse proxy.
 * The deployment must sanitize x-forwarded-proto and preserve the public host.
 */
export function publicOrigin(request: Request) {
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
export async function resolveLocalConfigModule(
  configPath: string,
): Promise<string> {
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

export function createMcpAppsHandlerLoader(): LoadRemoteHandler {
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

/** Framework-owned view metadata replaces any handler value at the reserved key. */
function createViewMetadata(
  resultMeta: Record<string, unknown> | undefined,
  payload: {
    tool?: string;
    resource?: unknown;
    args: unknown;
    viewProps?: Record<string, unknown>;
  },
): Record<string, unknown> {
  return {
    ...resultMeta,
    [MCP_VIEW_META_KEY]: { version: 1, ...payload },
  };
}

export function createStaticMcpAppsToolResult({
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
    _meta: createViewMetadata(undefined, payload),
  };
}

export async function fetchJson<T = unknown>(
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

export function createToolResultWithView({
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
          _meta: resource
            ? createViewMetadata(handlerResult._meta, {
                tool: toolName,
                resource,
                args,
                ...(handlerResult.viewProps
                  ? { viewProps: handlerResult.viewProps }
                  : {}),
              })
            : { ...handlerResult._meta },
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
  const metadata = createViewMetadata(result._meta, {
    args,
    ...(viewProps ? { viewProps } : {}),
  });
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
