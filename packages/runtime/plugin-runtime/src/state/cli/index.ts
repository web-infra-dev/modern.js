import { createRuntimeExportsUtils, getEntryOptions } from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';

const PLUGIN_IDENTIFIER = 'state';

export const statePlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-state',

  required: ['@modern-js/runtime'],

  setup: api => {
    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const { entryName, isMainEntry } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const { packageName, metaName } = api.useAppContext();

        const stateConfig = getEntryOptions(
          entryName,
          isMainEntry,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        )?.state;
        if (stateConfig) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            implementation: `@${metaName}/runtime/model`,
            config: typeof stateConfig === 'boolean' ? {} : stateConfig,
          });
        }
        return { entrypoint, plugins };
      },
      addRuntimeExports() {
        const { internalDirectory, metaName } = api.useAppContext();

        const pluginsExportsUtils = createRuntimeExportsUtils(
          internalDirectory,
          'plugins',
        );
        pluginsExportsUtils.addExport(
          `export { default as state } from '@${metaName}/runtime/model'`,
        );
      },
    };
  },
});

export default statePlugin;
