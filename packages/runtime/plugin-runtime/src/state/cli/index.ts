import {
  getEntryOptions,
  createRuntimeExportsUtils,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import {} from '../types';

const PLUGIN_IDENTIFIER = 'state';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-state',
  required: ['@modern-js/runtime'],
  setup: api => {
    const stateConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;

    return {
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
        };
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        const { entryName } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const { packageName } = api.useAppContext();

        const stateConfig = getEntryOptions(
          entryName,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        )?.state;

        stateConfigMap.set(entryName, stateConfig);

        if (stateConfig) {
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [
              {
                imported: PLUGIN_IDENTIFIER,
              },
            ],
          });
        }

        return {
          entrypoint,
          imports,
        };
      },

      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const stateOptions = stateConfigMap.get(entrypoint.entryName);

        if (stateOptions) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: `${JSON.stringify(
              stateConfigMap.get(entrypoint.entryName),
            )}`,
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-state'];
      },
      addRuntimeExports() {
        pluginsExportsUtils.addExport(
          `export { default as state } from '@modern-js/runtime/model'`,
        );
      },
    };
  },
});
