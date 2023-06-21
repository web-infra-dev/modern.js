import { getEntryOptions, createRuntimeExportsUtils } from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';

const PLUGIN_IDENTIFIER = 'state';

export const statePlugin = (): CliPlugin<AppTools> => ({
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
        const { entryName, isMainEntry } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const { packageName } = api.useAppContext();

        const stateConfig = getEntryOptions(
          entryName,
          isMainEntry,
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
        return [
          {
            target: 'runtime.state',
            schema: { type: ['boolean', 'object'] },
          },
        ];
      },
      addRuntimeExports() {
        pluginsExportsUtils.addExport(
          `export { default as state } from '@modern-js/runtime/model'`,
        );
      },
    };
  },
});
