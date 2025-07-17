import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { createRuntimeExportsUtils, getEntryOptions } from '@modern-js/utils';
import './types';
import type { ServerRoute } from '@modern-js/types';

export const routerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-router-v5',
  required: ['@modern-js/runtime'],
  setup: api => {
    let routerExportsUtils: any;

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const userConfig = api.getNormalizedConfig();
      const { serverRoutes, metaName, packageName } = api.getAppContext();
      const routerConfig = getEntryOptions(
        entrypoint.entryName,
        entrypoint.isMainEntry!,
        userConfig.runtime,
        userConfig.runtimeByEntries,
        packageName,
      )?.router;
      const serverBase = serverRoutes
        .filter(
          (route: ServerRoute) => route.entryName === entrypoint.entryName,
        )
        .map(route => route.urlPath)
        .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));
      plugins.push({
        name: 'router',
        path: `@${metaName}/plugin-router-v5/runtime`,
        config:
          typeof routerConfig === 'boolean'
            ? { serverBase }
            : { ...routerConfig, serverBase },
      });
      return { entrypoint, plugins };
    });
    api.config(() => {
      const { internalDirectory, metaName } = api.getAppContext();
      // .modern-js/.runtime-exports/router (legacy)
      routerExportsUtils = createRuntimeExportsUtils(
        internalDirectory,
        'router',
      );

      return {
        resolve: {
          alias: {
            [`@${metaName}/runtime/router-v5`]: routerExportsUtils.getPath(),
          },
        },
      };
    });
    api.addRuntimeExports(() => {
      const userConfig = api.getNormalizedConfig();
      const { internalDirectory, metaName } = api.getAppContext();
      const pluginsExportsUtils = createRuntimeExportsUtils(
        internalDirectory,
        'plugins',
      );
      pluginsExportsUtils.addExport(
        `export { default as router } from '@${metaName}/plugin-router-v5/runtime'`,
      );
      routerExportsUtils?.addExport(
        `export * from '@${metaName}/plugin-router-v5/runtime'`,
      );
    });
  },
});

export default routerPlugin;
