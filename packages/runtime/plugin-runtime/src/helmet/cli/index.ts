import type { AppTools, CliPlugin } from '@modern-js/app-tools';

const PLUGIN_IDENTIFIER = 'helmet';

export const helmetPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-helmet',

  required: ['@modern-js/runtime'],

  setup: api => {
    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const { metaName } = api.useAppContext();

        plugins.push({
          name: PLUGIN_IDENTIFIER,
          path: `@${metaName}/runtime/helmet`,
          config: {},
        });
        return { entrypoint, plugins };
      },
    };
  },
});

export default helmetPlugin;
