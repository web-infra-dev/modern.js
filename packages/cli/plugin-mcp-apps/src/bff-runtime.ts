import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createMcpBffHandler } from '@modern-js/mcp-apps/bff';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import {
  type McpUiManifest,
  bindUiResources,
} from '@modern-js/mcp-apps/server';
import {
  type Context,
  type Next,
  type ServerPlugin,
  useHonoContext,
} from '@modern-js/server-core';
import { cleanRequireCache, compatibleRequire, mime } from '@modern-js/utils';
import { MCP_BFF_ENDPOINT, type McpEndpointOptions } from './bff';
import {
  bindMfRemotes,
  findMfAsset,
  localRemoteNames,
  readMfArtifacts,
  compiledConfigPath,
} from './mf';

export interface McpAppsBffRuntimeOptions {
  development: boolean;
  config: string;
  /** Omitted for legacy/manual BFF declarations. */
  endpoint?: string | false;
  /** Root-relative directory containing HTML emitted by the application builder. */
  resourceDirectory: string;
  /** Explicit public asset base, otherwise resolved from the request. */
  assetBase: string;
}

const AUTO_ENDPOINT = Symbol('modern-mcp-auto-endpoint');

type ApiHandler = (input: { data?: unknown }) => unknown;

/** Host framework hooks; route registration remains shared. */
export interface McpAppsBffRuntimeAdapter {
  useContext?: () => { req: { raw: Request } };
  transformResponse?: (
    response: Response,
    context: { req: { raw: Request } },
    appDirectory: string,
  ) => Response | Promise<Response>;
}

/** Bind UI artifacts to BFF routes and expose emitted MF assets. */
export default function mcpBffRuntime(
  options: McpAppsBffRuntimeOptions,
  adapter: McpAppsBffRuntimeAdapter = {},
): ServerPlugin {
  return {
    name: '@modern-js/plugin-mcp-apps/bff-runtime',
    pre: ['@modern-js/plugin-bff'],
    required: ['@modern-js/plugin-bff'],
    setup(api) {
      let hasLocalRemotes = false;
      const bind = async () => {
        hasLocalRemotes = false;
        const ctx = api.getServerContext();
        const root = options.development ? ctx.appDirectory : ctx.distDirectory;
        if (!root)
          throw new Error('MCP Apps requires a BFF application directory');
        let manifest: McpUiManifest | undefined;
        if (!options.development) {
          try {
            manifest = JSON.parse(
              await readFile(
                path.resolve(
                  root,
                  options.resourceDirectory,
                  '../ui-manifest.json',
                ),
                'utf8',
              ),
            );
          } catch (error) {
            // Keep previously built deployments without a manifest working.
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
        }
        const resourceDirectory = path.resolve(root, options.resourceDirectory);
        const bindDefinition = (definition: McpAppsDefinition) =>
          bindUiResources(definition, {
            directory: resourceDirectory,
            assetBase: options.assetBase,
            manifest,
          });
        let artifacts: ReturnType<typeof readMfArtifacts> | undefined;
        const loadArtifacts = () => {
          if (options.development) return readMfArtifacts(resourceDirectory);
          artifacts ??= readMfArtifacts(resourceDirectory).catch(error => {
            artifacts = undefined;
            throw error;
          });
          return artifacts;
        };
        const createBoundHandler = (
          params: Parameters<typeof createMcpBffHandler>[0],
        ) => {
          if (!localRemoteNames(params.definition).length)
            return createMcpBffHandler(params);
          // Compilation completes after route registration in development.
          // Resolve lazily, and keep only the most recent origin/artifact pair.
          let cached:
            | { key: string; handler: ReturnType<typeof createMcpBffHandler> }
            | undefined;
          return async (
            ...args: Parameters<ReturnType<typeof createMcpBffHandler>>
          ) => {
            if (args[1].req.raw.method !== 'POST') {
              return new Response(null, {
                status: 405,
                headers: { Allow: 'POST' },
              });
            }
            const definition = bindMfRemotes(
              params.definition,
              await loadArtifacts(),
              args[1].req.raw,
            );
            const key = JSON.stringify(definition.remotes);
            if (cached?.key !== key)
              cached = {
                key,
                handler: createMcpBffHandler({ ...params, definition }),
              };
            return cached.handler(...args);
          };
        };
        const wrapHandler =
          (handle: ReturnType<typeof createMcpBffHandler>) =>
          async (input: { data?: unknown }): Promise<Response> => {
            const context = (adapter.useContext ?? useHonoContext)();
            const response = await handle(input, context);
            return adapter.transformResponse
              ? adapter.transformResponse(response, context, ctx.appDirectory)
              : response;
          };
        const registerRemoteAssets = (definition: McpAppsDefinition) => {
          if (!definition.tools.some(tool => tool.remote)) return;
          hasLocalRemotes ||= localRemoteNames(definition).length > 0;
          if (
            ctx.middlewares.some(item => item.name === 'mcp-public-ui-assets')
          )
            return;
          ctx.middlewares.push({
            name: 'mcp-public-ui-assets',
            path: '/*',
            order: 'pre',
            handler: async (context: Context, next: Next) => {
              let asset: string | undefined;
              if (!context.req.path.startsWith('/static/')) {
                if (!hasLocalRemotes) return next();
                let artifacts: Awaited<ReturnType<typeof readMfArtifacts>>;
                try {
                  artifacts = await loadArtifacts();
                } catch (error) {
                  // Development assets may not exist until the first compilation.
                  if ((error as NodeJS.ErrnoException).code === 'ENOENT')
                    return next();
                  throw error;
                }
                asset = findMfAsset(artifacts, context.req.raw);
                if (!asset) return next();
              }
              context.header('Access-Control-Allow-Origin', '*');
              if (context.req.method === 'OPTIONS') {
                context.header(
                  'Access-Control-Allow-Methods',
                  'GET, HEAD, OPTIONS',
                );
                context.header('Access-Control-Allow-Headers', 'Content-Type');
                if (
                  context.req.header(
                    'Access-Control-Request-Private-Network',
                  ) === 'true'
                ) {
                  context.header(
                    'Access-Control-Allow-Private-Network',
                    'true',
                  );
                }
                return context.body(null, 204);
              }
              if (
                asset &&
                !options.development &&
                ['GET', 'HEAD'].includes(context.req.method)
              ) {
                const filename = path.resolve(root, asset);
                const relative = path.relative(root, filename);
                if (
                  relative === '..' ||
                  relative.startsWith(`..${path.sep}`) ||
                  path.isAbsolute(relative)
                )
                  return next();
                try {
                  const content = await readFile(filename);
                  return new Response(
                    context.req.method === 'HEAD' ? null : content,
                    {
                      headers: {
                        'Content-Type':
                          mime.lookup(filename) || 'application/octet-stream',
                        'Content-Length': String(content.byteLength),
                        'Access-Control-Allow-Origin': '*',
                      },
                    },
                  );
                } catch (error) {
                  if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
                    throw error;
                }
              }
              await next();
            },
          });
        };
        const handlers = new Map<
          ApiHandler,
          (input: { data?: unknown }) => Promise<Response>
        >();
        const infos = (ctx.apiHandlerInfos ?? []) as { handler: ApiHandler }[];
        const autoEndpoint = options.endpoint;
        const userInfos = infos.filter(
          info => !Reflect.get(info.handler, AUTO_ENDPOINT),
        );
        if (
          autoEndpoint &&
          userInfos.some(
            info => (info as { routePath?: string }).routePath === autoEndpoint,
          )
        ) {
          throw new Error(
            `MCP endpoint conflicts with an existing BFF route: ${autoEndpoint}. Use endpoint: false for manual mounting.`,
          );
        }
        if (autoEndpoint) {
          const config = path.resolve(
            root,
            options.development
              ? options.config
              : compiledConfigPath(options.config),
          );
          if (options.development) cleanRequireCache([config]);
          const loaded = await compatibleRequire(config);
          const definition = (loaded.default ?? loaded) as McpAppsDefinition;
          registerRemoteAssets(definition);
          const handle = createBoundHandler({
            definition: bindDefinition(definition),
            configPath: config,
            development: options.development,
          });
          const handler: ApiHandler = wrapHandler(handle);
          Reflect.set(handler, AUTO_ENDPOINT, true);
          userInfos.push(
            ...['POST', 'GET', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'].map(
              httpMethod => ({
                routePath: autoEndpoint,
                httpMethod,
                handler,
              }),
            ),
          );
        }
        const apiHandlerInfos = userInfos.map(info => {
          const endpointOptions = Reflect.get(
            info.handler,
            MCP_BFF_ENDPOINT,
          ) as
            | (McpEndpointOptions & { definition: McpAppsDefinition })
            | undefined;
          if (!endpointOptions) return info;
          registerRemoteAssets(endpointOptions.definition);
          let handler = handlers.get(info.handler);
          if (!handler) {
            const handle = createBoundHandler({
              ...endpointOptions,
              configPath: path.resolve(root, options.config),
              development: options.development,
              definition: bindDefinition(endpointOptions.definition),
            });
            handler = wrapHandler(handle);
            handlers.set(info.handler, handler);
          }
          return { ...info, handler };
        });
        api.updateServerContext({ ...ctx, apiHandlerInfos });
      };
      // BFF discovers functions before its Hono adapter registers the routes.
      // The pipeline's runtime supplies next, although its public callback type
      // currently only describes the input argument (as in plugin-bff itself).
      type Prepare = Parameters<typeof api.prepareApiServer>[0];
      type Input = Parameters<Prepare>[0];
      api.prepareApiServer((async (
        input: Input,
        next: (value: Input) => void,
      ) => {
        await bind();
        return next(input);
      }) as unknown as Prepare);
      api.onReset(async ({ event }) => {
        if (event.type === 'file-change') await bind();
      });
    },
  };
}
