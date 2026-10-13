import path from 'node:path';
import { createMcpBffHandler } from '@modern-js/mcp-apps/bff';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import { bindUiResources } from '@modern-js/mcp-apps/server';
import {
  type Context,
  type Next,
  type ServerPlugin,
  useHonoContext,
} from '@modern-js/server-core';
import { cleanRequireCache, compatibleRequire } from '@modern-js/utils';
import type { McpEndpointOptions } from './bff';
import { bindMfRemotes, localRemoteNames, readMfArtifacts } from './mf';
import {
  MCP_BFF_ENDPOINT,
  type McpAppsBffRuntimeOptions,
  compiledConfigPath,
} from './shared';

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

/** Bind artifacts to BFF-discovered functions. Never registers HTTP middleware. */
export default function mcpBffRuntime(
  options: McpAppsBffRuntimeOptions,
  adapter: McpAppsBffRuntimeAdapter = {},
): ServerPlugin {
  return {
    name: '@modern-js/plugin-mcp-apps/bff-runtime',
    pre: ['@modern-js/plugin-bff'],
    required: ['@modern-js/plugin-bff'],
    setup(api) {
      const bind = async () => {
        const ctx = api.getServerContext();
        const root = options.development ? ctx.appDirectory : ctx.distDirectory;
        if (!root)
          throw new Error('MCP Apps requires a BFF application directory');
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
            const artifacts = await readMfArtifacts(
              path.resolve(root, options.resourceDirectory),
            );
            const definition = bindMfRemotes(
              params.definition,
              artifacts,
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
          if (
            ctx.middlewares.some(item => item.name === 'mcp-public-ui-assets')
          )
            return;
          ctx.middlewares.push({
            name: 'mcp-public-ui-assets',
            path: '/static/*',
            order: 'pre',
            handler: async (context: Context, next: Next) => {
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
            definition: bindUiResources(definition, {
              directory: path.resolve(root, options.resourceDirectory),
              assetBase: options.assetBase,
            }),
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
          const endpointOptions = Reflect.get(info.handler, MCP_BFF_ENDPOINT) as
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
              definition: bindUiResources(endpointOptions.definition, {
                directory: path.resolve(root, options.resourceDirectory),
                assetBase: options.assetBase,
              }),
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
