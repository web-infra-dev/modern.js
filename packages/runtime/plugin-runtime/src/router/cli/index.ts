import path from 'node:path';
import {
  createRuntimeExportsUtils,
  filterRoutesForServer,
  fs,
  getEntryOptions,
  isRouterV5 as isV5,
  NESTED_ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import type {
  NestedRouteForCli,
  PageRoute,
  ServerRoute,
} from '@modern-js/types';
import { isRouteEntry } from './entry';
import {
  handleFileChange,
  handleGeneratorEntryCode,
  handleModifyEntrypoints,
} from './handler';

export { isRouteEntry } from './entry';
export { handleFileChange, handleModifyEntrypoints } from './handler';

export const routerPlugin = (): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-router',
  required: ['@modern-js/runtime'],
  setup: api => {
    const nestedRoutes: Record<string, unknown> = {};
    const nestedRoutesForServer: Record<string, unknown> = {};
    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const { packageName, serverRoutes, metaName } = api.useAppContext();
        const serverBase = serverRoutes
          .filter(
            (route: ServerRoute) => route.entryName === entrypoint.entryName,
          )
          .map(route => route.urlPath)
          .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));
        const userConfig = api.useResolvedConfigContext();
        const routerConfig = getEntryOptions(
          entrypoint.entryName,
          entrypoint.isMainEntry,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        )?.router;
        if (routerConfig && !isV5(userConfig)) {
          plugins.push({
            name: 'router',
            path: `@${metaName}/runtime/router`,
            config:
              typeof routerConfig === 'boolean'
                ? { serverBase }
                : { ...routerConfig, serverBase },
          });
        }

        return { entrypoint, plugins };
      },
      checkEntryPoint({ path, entry }) {
        return { path, entry: entry || isRouteEntry(path) };
      },
      config() {
        return {
          source: {
            include: [
              // react-router v6 is no longer support ie 11
              // so we need to compile these packages to ensure the compatibility
              // https://github.com/remix-run/react-router/commit/f6df0697e1b2064a2b3a12e8b39577326fdd945b
              /node_modules\/react-router/,
              /node_modules\/react-router-dom/,
              /node_modules\/@remix-run\/router/,
            ],
          },
        };
      },
      async modifyEntrypoints({ entrypoints }) {
        const newEntryPoints = await handleModifyEntrypoints(api, entrypoints);
        return { entrypoints: newEntryPoints };
      },
      async generateEntryCode({ entrypoints }) {
        await handleGeneratorEntryCode(api, entrypoints);
      },
      addRuntimeExports() {
        const userConfig = api.useResolvedConfigContext();
        const { internalDirectory, metaName } = api.useAppContext();

        const pluginsExportsUtils = createRuntimeExportsUtils(
          internalDirectory,
          'plugins',
        );
        if (!isV5(userConfig)) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@${metaName}/runtime/router'`,
          );
        }
      },
      async fileChange(e) {
        await handleFileChange(api, e);
      },

      async modifyFileSystemRoutes({ entrypoint, routes }) {
        nestedRoutes[entrypoint.entryName] = routes;
        nestedRoutesForServer[entrypoint.entryName] = filterRoutesForServer(
          routes as (NestedRouteForCli | PageRoute)[],
        );

        return {
          entrypoint,
          routes,
        };
      },

      async beforeGenerateRoutes({ entrypoint, code }) {
        const { distDirectory } = api.useAppContext();

        await fs.outputJSON(
          path.resolve(distDirectory, NESTED_ROUTE_SPEC_FILE),
          nestedRoutesForServer,
        );

        return {
          entrypoint,
          code,
        };
      },
    };
  },
});

export default routerPlugin;
