import type {
  CacheConfig,
  GetRenderHandlerOptions,
  OnFallback,
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
    return {
      async prepare() {
        const { distDirectory: pwd, routes, metaName } = api.useAppContext();

        const config = api.useConfigContext();

        const hookRunner = api.useHookRunners();

        if (!routes) {
          return;
        }

        const onFallback: OnFallback = async (reason, utils, error) => {
          // For other framework can report ssr fallback reason & error.
          await hookRunner.fallback({
            reason,
            ...utils,
            error,
          });
        };

        const getRenderHandlerOptions: GetRenderHandlerOptions = {
          pwd,
          routes,
          config,
          metaName,
          cacheConfig: config.render?.cache || cacheConfig,
          staticGenerate,
          onFallback,
        };

        const render = await getRenderHandler(getRenderHandlerOptions);

        api.setAppContext({
          ...api.useAppContext(),
          render,
          getRenderOptions: getRenderHandlerOptions,
        });
      },
    };
  },
});

export async function getRenderHandler({
  pwd,
  routes,
  config,
  cacheConfig,
  metaName,
  staticGenerate,
  onFallback,
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
    onFallback,
  });

  return render;
}
