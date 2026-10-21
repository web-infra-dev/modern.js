import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createMcpBffHandler } from '@modern-js/mcp-apps/bff';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';
import {
  type McpUiManifest,
  bindUiResources,
} from '@modern-js/mcp-apps/server';
import { type ServerPlugin, useHonoContext } from '@modern-js/server-core';
import { cleanRequireCache, compatibleRequire } from '@modern-js/utils';
import {
  MCP_BFF_ENDPOINT,
  type McpEndpointOptions,
  compiledConfigPath,
} from './bff';

export interface McpAppsBffRuntimeOptions {
  development: boolean;
  configPath: string;
  /** Omitted for legacy/manual BFF declarations. */
  endpoint?: string | false;
  /** Root-relative directory containing HTML emitted by the application builder. */
  resourceDirectory: string;
  /** Explicit public asset base, otherwise resolved from the request. */
  assetBase: string;
}

const AUTO_ENDPOINT = Symbol('modern-mcp-auto-endpoint');

type ApiHandler = (input: { data?: unknown }) => unknown;

// Only the route fields consumed here are needed from the BFF server context.
interface ApiHandlerInfo {
  handler: ApiHandler;
  routePath: string;
  httpMethod: string;
}

/** Host framework hooks; route registration remains shared. */
export interface McpAppsBffRuntimeAdapter {
  useContext?: () => { req: { raw: Request } };
  transformResponse?: (
    response: Response,
    context: { req: { raw: Request } },
    appDirectory: string,
  ) => Response | Promise<Response>;
}

/**
 * Bind built UI resources before BFF registers routes, then install either the
 * automatic endpoint or handlers declared manually through mcpApps()/mcpServer().
 */
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
        // Production consumes the build manifest. Development uses conventional
        // artifact paths so binding does not depend on the first UI emit finishing.
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
        // Resolve request context per invocation, not during route initialization.
        const wrapHandler =
          (handle: ReturnType<typeof createMcpBffHandler>) =>
          async (input: { data?: unknown }): Promise<Response> => {
            const context = (adapter.useContext ?? useHonoContext)();
            const response = await handle(input, context);
            return adapter.transformResponse
              ? adapter.transformResponse(response, context, ctx.appDirectory)
              : response;
          };
        // Manual declarations share one placeholder across HTTP methods.
        const handlers = new Map<
          ApiHandler,
          (input: { data?: unknown }) => Promise<Response>
        >();
        const infos = (ctx.apiHandlerInfos ?? []) as ApiHandlerInfo[];
        const autoEndpoint = options.endpoint;
        // Drop previously generated routes when rebinding, preserving user routes.
        const userInfos = infos.filter(
          info => !Reflect.get(info.handler, AUTO_ENDPOINT),
        );
        if (
          autoEndpoint &&
          userInfos.some(info => info.routePath === autoEndpoint)
        ) {
          throw new Error(
            `MCP endpoint conflicts with an existing BFF route: ${autoEndpoint}. Use endpoint: false for manual mounting.`,
          );
        }
        // Automatic mounting loads source in development and compiled JS in production.
        if (autoEndpoint) {
          const configPath = path.resolve(
            root,
            options.development
              ? options.configPath
              : compiledConfigPath(options.configPath),
          );
          if (options.development) cleanRequireCache([configPath]);
          const loaded = await compatibleRequire(configPath);
          const definition = (loaded.default ?? loaded) as McpAppsDefinition;
          const handle = createMcpBffHandler({
            definition: bindDefinition(definition),
            configPath,
            development: options.development,
          });
          const handler: ApiHandler = wrapHandler(handle);
          Reflect.set(handler, AUTO_ENDPOINT, true);
          // Let the MCP transport handle unsupported methods consistently.
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
        // Replace marked manual declarations after UI paths are available.
        // Unmarked application handlers pass through unchanged.
        const apiHandlerInfos = userInfos.map(info => {
          const endpointOptions = Reflect.get(
            info.handler,
            MCP_BFF_ENDPOINT,
          ) as
            | (McpEndpointOptions & { definition: McpAppsDefinition })
            | undefined;
          if (!endpointOptions) return info;
          let handler = handlers.get(info.handler);
          if (!handler) {
            const handle = createMcpBffHandler({
              ...endpointOptions,
              configPath: path.resolve(root, options.configPath),
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
      // Development reloads rebuild the server runtime and run this hook again.
      // Updating apiHandlerInfos on the old runtime would not replace its registered routes.
      api.prepareApiServer((async (
        input: Input,
        next: (value: Input) => void,
      ) => {
        await bind();
        return next(input);
      }) as unknown as Prepare);
    },
  };
}
