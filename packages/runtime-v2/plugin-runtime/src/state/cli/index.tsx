import type { CliPlugin, AppTools } from '@modern-js/app-tools-v2';

export const statePlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-state',
  required: ['@modern-js/runtime'],
  setup: _api => {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _internal_runtimePlugins({ entryName, plugins }) {
        plugins.push({
          name: 'state',
          implementation: '@modern-js/runtime-v2/state',
          config: {},
        });
        return { entryName, plugins };
      },
    };
  },
});

export default statePlugin;
