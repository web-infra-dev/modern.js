import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import { createRuntimeExportsUtils, getEntryOptions } from '@modern-js/utils';
import './types';

const PLUGIN_IDENTIFIER = 'state';

export const statePlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-state',

  required: ['@modern-js/runtime'],

  setup: api => {
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const { entryName, isMainEntry } = entrypoint;
      const userConfig = api.getNormalizedConfig();
      const { packageName, metaName } = api.getAppContext();

      const stateConfig = getEntryOptions(
        entryName,
        isMainEntry!,
        userConfig.runtime,
        userConfig.runtimeByEntries,
        packageName,
      )?.state;
      plugins.push({
        name: PLUGIN_IDENTIFIER,
        path: `@${metaName}/plugin-state/runtime`,
        config: typeof stateConfig === 'boolean' ? {} : stateConfig || {},
      });
      return { entrypoint, plugins };
    });
    api.config(() => {
      const { metaName } = api.getAppContext();
      return {
        resolve: {
          alias: {
            [`@${metaName}/runtime/model`]: `@${metaName}/plugin-state/runtime`,
          },
        },
      };
    });
    api.addRuntimeExports(() => {
      const { internalDirectory, metaName } = api.useAppContext();

      const pluginsExportsUtils = createRuntimeExportsUtils(
        internalDirectory,
        'plugins',
      );
      pluginsExportsUtils.addExport(
        `export { default as state } from '@${metaName}/plugin-state/runtime'`,
      );
    });
  },
});

export default statePlugin;
