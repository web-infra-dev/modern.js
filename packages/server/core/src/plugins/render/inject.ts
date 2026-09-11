import type {
  CacheConfig,
  GetRenderHandlerOptions,
  Render,
  ServerPlugin,
} from '../../types';
import { createRender } from './render';

export interface InjectRenderHandlerOptions {
  staticGenerate?: boolean;
  cacheConfig?: CacheConfig;
}

export const injectRenderHandlerPlugin = ({
  staticGenerate,
  cacheConfig,
}: InjectRenderHandlerOptions): ServerPlugin => ({
  name: '@modern-js/plugin-inject-render',
  setup(api) {
    api.onPrepare(async () => {
      const { distDirectory: pwd, routes, metaName } = api.getServerContext();

      const config = api.getServerConfig();
      if (!routes) {
        return;
      }

      const getRenderHandlerOptions: GetRenderHandlerOptions = {
        pwd: pwd!,
        routes,
        config,
        metaName,
        // TODO: support modern.server.ts cache config
        cacheConfig: cacheConfig,
        staticGenerate,
      };

      const render = await getRenderHandler(getRenderHandlerOptions);

      api.updateServerContext({
        render,
        getRenderOptions: getRenderHandlerOptions,
      });
    });
  },
});

export async function getRenderHandler({
  pwd,
  routes,
  config,
  cacheConfig,
  metaName,
  staticGenerate,
}: GetRenderHandlerOptions): Promise<Render> {
  const ssrConfig = config.server?.ssr;
  const ssrByEntries = config.server?.ssrByEntries;
  const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
  const forceCSRMap = new Map<string, boolean>();
  if (ssrByEntries) {
    Object.entries(ssrByEntries).forEach(([entryName, ssrConfig]) => {
      forceCSRMap.set(
        entryName,
        typeof ssrConfig === 'object' ? (ssrConfig.forceCSR ?? false) : false,
      );
    });
  }

  const render = createRender({
    routes,
    pwd,
    config,
    staticGenerate,
    cacheConfig,
    forceCSR,
    forceCSRMap,
    nonce: config.security?.nonce,
    metaName: metaName || 'modern-js',
  });

  return render;
}
