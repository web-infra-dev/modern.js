import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import {
  createRuntimeExportsUtils,
  getEntryOptions,
  isRouterV5 as isV5,
} from '@modern-js/utils';
import './types';
import type { ServerRoute } from '@modern-js/types';

export const routerPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-router-v5',
  required: ['@modern-js/runtime'],
  setup: api => {
    let routerExportsUtils: any;

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const userConfig = api.getNormalizedConfig();
      const { serverRoutes, metaName, packageName } = api.getAppContext();
      if (isV5(userConfig)) {
        const routerConfig = getEntryOptions(
          entrypoint.entryName,
          entrypoint.isMainEntry,
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
      }
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
        source: {
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
      if (isV5(userConfig)) {
        pluginsExportsUtils.addExport(
          `export { default as router } from '@${metaName}/plugin-router-v5/runtime'`,
        );
        routerExportsUtils?.addExport(
          `export * from '@${metaName}/plugin-router-v5/runtime'`,
        );
      }
    });
  },
});

export default routerPlugin;
