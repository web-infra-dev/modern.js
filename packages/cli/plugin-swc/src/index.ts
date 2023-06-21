import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { isSSR } from '@modern-js/utils';
import {
  builderPluginSwc,
  PluginSwcOptions,
} from '@modern-js/builder-plugin-swc';
import { logger } from '@modern-js/utils/logger';

export function factory(
  name: string,
  modifySwcOptions: (options: PluginSwcOptions) => PluginSwcOptions,
): () => CliPlugin<AppTools> {
  return () => ({
    name,
    setup: api => ({
      validateSchema() {
        return [
          {
            target: 'tools.swc',
            schema: { typeof: ['object'] },
          },
        ];
      },
      prepare() {
        const context = api.useAppContext();
        if (!context.builder) {
          return;
        }

        const config = api.useResolvedConfigContext();
        const { esbuild, swc = {} } = config.tools;

        const swcOptions = modifySwcOptions(swc);

        // common configuration
        if (isSSR(config)) {
          swcOptions.extensions = {
            ...(swcOptions.extensions || {}),
            loadableComponents: true,
          };
        }

        context.builder.addPlugins([builderPluginSwc(swcOptions)]);

        if (esbuild) {
          if (swc.jsMinify !== false && esbuild.minimize !== false) {
            logger.warn(
              'You have enabled both esbuild minimizer and SWC minimizer, which will cause conflicts. Please remove `tools.esbuild` config and only use SWC to minimize your code.',
            );
          }
          if (esbuild.loader !== false) {
            logger.warn(
              'You have enabled both esbuild loader and SWC loader, which will cause conflicts. Please remove `tools.esbuild` config and only use SWC to transform your code.',
            );
          }
        }
      },
    }),
  });
}

const PLUGIN_NAME = '@modern-js/plugin-swc';

export const swcPlugin = factory(PLUGIN_NAME, swcOptions => {
  swcOptions.extensions = {
    ...(swcOptions.extensions || {}),
    ssrLoaderId: {
      runtimePackageName: '@modern-js/runtime',
      functionUseLoaderName: 'useLoader',
    },
  };
  return swcOptions;
});

export default swcPlugin;
