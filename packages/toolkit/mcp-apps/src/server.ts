import fs from 'node:fs/promises';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import type {
  LoadRemoteHandler,
  McpAppsDefinition,
  RemoteToolHandlerResult,
} from './config';
import {
  createMcpAppsViewResource,
  createStaticMcpAppsToolResult,
  fetchJson,
  mergeHandlerResultWithView,
  normalizeToolConfig,
} from './definition';
import { createMcpAppsHandlerLoader, loadMcpAppsConfig } from './loader';
import {
  createUiResources,
  readRuntimeHtml,
  validateMcpAppsConfig,
} from './resources';

export type * from './config';
export { bindUiResources, getUiEntryName } from './ui-resources';
export { loadMcpAppsConfig } from './loader';
export { validateMcpAppsConfig } from './resources';

export interface McpHandlerOptions<T = undefined> {
  development?: boolean;
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
  const loadHandler =
    options.loadRemoteHandler ?? createMcpAppsHandlerLoader(definition);
  const tools = new Map(
    definition.tools.map(normalizeToolConfig).map(tool => {
      const inputSchema = tool.inputSchema ?? {
        type: 'object',
        properties: {},
      };
      if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(tool.name)) {
        throw new Error(`Invalid tool name: ${tool.name}`);
      }
      if (
        inputSchema.type !== 'object' ||
        (tool.outputSchema && tool.outputSchema.type !== 'object')
      ) {
        throw new Error(
          `Tool "${tool.name}" requires object input/output schemas`,
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
        inputSchema: inputSchema as { type: 'object'; [key: string]: unknown },
        ...(tool.outputSchema && !tool.view
          ? {
              outputSchema: tool.outputSchema as {
                type: 'object';
                [key: string]: unknown;
              },
            }
          : {}),
        ...(tool.annotations ? { annotations: tool.annotations } : {}),
        ...(resource || tool.visibility
          ? {
              _meta: {
                ...(resource ? { 'openai/outputTemplate': resource.uri } : {}),
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
    if (!tool?.view || tool.remote)
      return options.resourceHtml ?? readRuntimeHtml(options.development);
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

  return async request => {
    // Stateless P0 has no server-initiated SSE stream or session to delete.
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }
    const context = await options.createContext?.(request);
    const server = new Server(
      options.serverInfo ?? { name: 'modern-mcp-apps', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {} } },
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...tools.values()].map(({ descriptor }) => descriptor),
    }));
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [...resources.values()],
    }));
    server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => {
      const resource = [...resources.values()].find(
        item => item.uri === params.uri,
      );
      if (!resource) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown UI resource: ${params.uri}`,
        );
      }
      const { name: _name, ...content } = resource;
      const view = [...tools.values()].find(
        ({ tool }) => toolUris.get(tool.name) === params.uri,
      )?.tool.view;
      let text = await readHtml(resource.uri);
      if (view?.assetBase) {
        const base =
          view.assetBase === 'request' ? publicOrigin(request) : view.assetBase;
        const url = new URL(base);
        if (!['http:', 'https:'].includes(url.protocol))
          throw new Error('Invalid MCP UI asset base');
        const escaped = url.href
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;');
        text = text.replace(
          /<head\b[^>]*>/i,
          head => `${head}<base href="${escaped}">`,
        );
        const ui = content._meta.ui;
        const csp = (ui.csp ?? {}) as {
          resourceDomains?: string[];
          connectDomains?: string[];
          baseUriDomains?: string[];
        };
        content._meta = {
          ui: {
            ...ui,
            csp: {
              ...csp,
              resourceDomains: [
                ...new Set([...(csp.resourceDomains ?? []), url.origin]),
              ],
              baseUriDomains: [
                ...new Set([...(csp.baseUriDomains ?? []), url.origin]),
              ],
              connectDomains: [
                ...new Set([...(csp.connectDomains ?? []), url.origin]),
              ],
            },
          },
        };
      }
      return {
        contents: [
          {
            ...content,
            text,
          },
        ],
      };
    });
    server.setRequestHandler(
      CallToolRequestSchema,
      async ({ params }, extra) => {
        const registered = tools.get(params.name);
        if (!registered) {
          throw new McpError(
            ErrorCode.InvalidParams,
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
          extra.signal,
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
                  typeof handlerConfig === 'function'
                    ? undefined
                    : handlerConfig,
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
          const result = CallToolResultSchema.parse({
            ...handlerResult,
            content: handlerResult.content ?? [],
          });
          if (
            !result.isError &&
            validateOutput &&
            !validateOutput(result.structuredContent)
          ) {
            throw new Error(
              `Invalid structured output from tool "${tool.name}"`,
            );
          }
          return mergeHandlerResultWithView({
            toolName: tool.name,
            args: input,
            resource: viewResource,
            handlerResult: {
              ...result,
              content: handlerResult.content,
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
      },
    );
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
  let pending: Promise<ReturnType<typeof createMcpHandler<T>>> | undefined;
  return async (request: Request): Promise<Response> => {
    pending ??= loadMcpAppsConfig(options.configPath).then(definition =>
      createMcpHandler(definition, options),
    );
    const current = pending;
    try {
      return await (await current)(request);
    } catch (error) {
      if (pending === current) pending = undefined;
      throw error;
    }
  };
}

export { createArtifactHandler } from './artifact';

/** Account for HTTPS termination at the application's reverse proxy. */
function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'http' || proto === 'https') url.protocol = `${proto}:`;
  return `${url.origin}/`;
}
