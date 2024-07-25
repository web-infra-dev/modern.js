import type { ServerRoute } from '@modern-js/types';
import type {
  CacheConfig,
  Render,
  ServerPlugin,
  UserConfig,
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
    return {
      async prepare() {
        const { distDirectory: pwd, routes, metaName } = api.useAppContext();

        const config = api.useConfigContext();

        if (!routes) {
          return;
        }

        const render = await getRenderHandler({
          pwd,
          routes,
          config,
          metaName,
          cacheConfig: config.render?.cache || cacheConfig,
          staticGenerate,
        });

        api.setAppContext({
          ...api.useAppContext(),
          render,
        });
      },
    };
  },
});

interface GetRenderHandlerOptions {
  pwd: string;
  routes: ServerRoute[];
  config: UserConfig;
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
  metaName?: string;
}

async function getRenderHandler({
  pwd,
  routes,
  config,
  cacheConfig,
  metaName,
  staticGenerate,
}: GetRenderHandlerOptions): Promise<Render> {
  const ssrConfig = config.server?.ssr;
  const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;

  const render = createRender({
    routes,
    pwd,
    config,
    staticGenerate,
    cacheConfig,
    forceCSR,
    nonce: config.security?.nonce,
    metaName: metaName || 'modern-js',
  });

  return render;
}
