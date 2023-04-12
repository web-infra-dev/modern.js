import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';
import { logger } from '@modern-js/utils/logger';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-swc',

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

      context.builder.addPlugins([builderPluginSwc(swc)]);

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
