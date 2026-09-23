import { createMcpBffHandler } from '@modern-js/mcp-apps/bff';
import { type ServerPlugin, useHonoContext } from '@modern-js/server-core';
import type { McpEndpointOptions } from './bff';
import { MCP_BFF_ENDPOINT, type McpAppsBffRuntimeOptions } from './shared';

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
      const bind = () => {
        const ctx = api.getServerContext();
        const root = options.development ? ctx.appDirectory : ctx.distDirectory;
        if (!root)
          throw new Error('MCP Apps requires a BFF application directory');
        const handlers = new Map<
          ApiHandler,
          (input: { data?: unknown }) => Promise<Response>
        >();
        const infos = (ctx.apiHandlerInfos ?? []) as { handler: ApiHandler }[];
        const apiHandlerInfos = infos.map(info => {
          const endpointOptions = Reflect.get(info.handler, MCP_BFF_ENDPOINT) as
            | McpEndpointOptions
            | undefined;
          if (!endpointOptions) return info;
          let handler = handlers.get(info.handler);
          if (!handler) {
            const handle = createMcpBffHandler({
              ...endpointOptions,
              root,
              development: options.development,
              entry: options.development ? options.devEntry : options.entry,
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
      api.prepareApiServer(((input: Input, next: (value: Input) => void) => {
        bind();
        next(input);
      }) as unknown as Prepare);
      api.onReset(({ event }) => {
        if (event.type === 'file-change') bind();
      });
    },
  };
}
