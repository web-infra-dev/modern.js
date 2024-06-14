import {
  createRuntimeExportsUtils,
  getEntryOptions,
  isRouterV5 as isV5,
} from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { ServerRoute } from '@modern-js/types';
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
    let pluginsExportsUtils: any;

    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const { packageName, serverRoutes } = api.useAppContext();
        const serverBase = serverRoutes
          .filter(
            (route: ServerRoute) => route.entryName === entrypoint.entryName,
          )
          .map(route => route.urlPath)
          .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));
        const userConfig = api.useResolvedConfigContext();
        const runtimeConfig = getEntryOptions(
          entrypoint.entryName,
          entrypoint.isMainEntry,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        );
        if (runtimeConfig?.router && !isV5(userConfig)) {
          plugins.push({
            name: 'router',
            implementation: '@modern-js/runtime/router',
            config: { serverBase },
          });
        }

        return { entrypoint, plugins };
      },
      checkEntryPoint({ path, entry }) {
        return { path, entry: entry || isRouteEntry(path) };
      },
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

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
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
        };
      },
      async modifyEntrypoints({ entrypoints }) {
        const newEntryPoints = await handleModifyEntrypoints(api, entrypoints);
        return { entrypoints: newEntryPoints };
      },
      async generateEntryCode({ entrypoints }) {
        const newEntryPoints = await handleGeneratorEntryCode(api, entrypoints);
        return { entrypoints: newEntryPoints };
      },
      addRuntimeExports() {
        const userConfig = api.useResolvedConfigContext();
        if (!isV5(userConfig)) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@modern-js/runtime/router'`,
          );
        }
      },
      async fileChange(e) {
        await handleFileChange(api, e);
      },
    };
  },
});

export default routerPlugin;
