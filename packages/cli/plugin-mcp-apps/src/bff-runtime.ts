import path from 'node:path';
import { createMcpBffHandler } from '@modern-js/mcp-apps/bff';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import { bindUiResources } from '@modern-js/mcp-apps/server';
import { type ServerPlugin, useHonoContext } from '@modern-js/server-core';
import { cleanRequireCache, compatibleRequire } from '@modern-js/utils';
import type { McpEndpointOptions } from './bff';
import {
  MCP_BFF_ENDPOINT,
  type McpAppsBffRuntimeOptions,
  compiledConfigPath,
} from './shared';

const AUTO_ENDPOINT = Symbol('modern-mcp-auto-endpoint');

type ApiHandler = (input: { data?: unknown }) => unknown;

/** Bind artifacts to BFF-discovered functions. Never registers HTTP middleware. */
export default function mcpBffRuntime(
  options: McpAppsBffRuntimeOptions,
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
          const handle = createMcpBffHandler({
            definition: bindUiResources(definition, {
              directory: path.resolve(root, options.resourceDirectory),
              assetBase: options.assetBase,
            }),
            configPath: config,
            development: options.development,
          });
          const handler: ApiHandler = input => handle(input, useHonoContext());
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
          let handler = handlers.get(info.handler);
          if (!handler) {
            const handle = createMcpBffHandler({
              ...endpointOptions,
              configPath: path.resolve(root, options.config),
              development: options.development,
              definition: bindUiResources(endpointOptions.definition, {
                directory: path.resolve(root, options.resourceDirectory),
                assetBase: options.assetBase,
              }),
            });
            handler = input => handle(input, useHonoContext());
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
