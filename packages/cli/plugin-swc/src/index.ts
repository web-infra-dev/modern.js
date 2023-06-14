import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
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
        return PLUGIN_SCHEMAS['@modern-js/plugin-swc'];
      },

      prepare() {
        const context = api.useAppContext();
        if (!context.builder) {
          return;
        }

        const config = api.useResolvedConfigContext();
        const { esbuild, swc = {} } = config.tools;

        // for useloader api use
        const swcOptions = modifySwcOptions(swc);

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
export default factory(PLUGIN_NAME, swcOptions => {
  swcOptions.extensions = {
    ...(swcOptions.extensions || {}),
    ssrLoaderId: {
      runtimePackageName: '@modern-js/runtime',
      functionUseLoaderName: 'useloader',
    },
  };
  return swcOptions;
});
