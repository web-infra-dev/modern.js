import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-swc',

  setup: api => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-swc'];
    },

    prepare() {
      const context = api.useAppContext();
      if (context.builder) {
        const config = api.useResolvedConfigContext();
        context.builder.addPlugins([builderPluginSwc(config.tools.swc)]);
      }
    },
  }),
});
