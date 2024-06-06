import path from 'path';
import type { CliPlugin, AppTools } from '@modern-js/app-tools-v2';
import type { Entrypoint, ServerRoute } from '@modern-js/types';
import { cloneDeep } from '@modern-js/utils/lodash';
import { isRouteEntry } from './route';
import * as templates from './template';
import { isPageComponentFile } from './utils';

export const routerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-router',
  required: ['@modern-js/runtime'],
  setup: api => {
    const { internalDirectory } = api.useAppContext();
    let originEntrypoints: any[] = [];
    return {
      _internalRuntimePlugins({ entryName, plugins }) {
        const { serverRoutes } = api.useAppContext();
        const serverBase = serverRoutes
          .filter((route: ServerRoute) => route.entryName === entryName)
          .map(route => route.urlPath)
          .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));

        plugins.push({
          name: 'router',
          implementation: '@modern-js/runtime-v2/router',
          config: { serverBase },
        });
        return { entryName, plugins };
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
      async beforeCreateCompiler() {
        const { metaName, entrypoints } = api.useAppContext();
        await Promise.all(
          entrypoints.map(async entrypoint => {
            if (entrypoint.nestedRoutesEntry) {
              const { generatorRegisterCode } = await import('./code');
              generatorRegisterCode(
                internalDirectory,
                entrypoint.entryName,
                templates.runtimeGlobalContext({
                  metaName,
                }),
              );
            }
          }),
        );
      },
      async modifyEntrypoints({ entrypoints }: { entrypoints: Entrypoint[] }) {
        // nest route
        const resolvedConfig = api.useResolvedConfigContext();
        originEntrypoints = cloneDeep(entrypoints);
        const { generatorRoutes } = await import('./code');
        await generatorRoutes({
          appContext: api.useAppContext(),
          api: api as any,
          entrypoints,
          config: resolvedConfig,
        });
        return { entrypoints };
      },

      watchFiles() {
        const { entrypoints } = api.useAppContext();
        const nestedRouteEntries = entrypoints
          .map(point => point.nestedRoutesEntry)
          .filter(Boolean) as string[];
        return { files: nestedRouteEntries, isPrivate: true };
      },

      async fileChange(e) {
        const appContext = api.useAppContext();
        const { appDirectory, entrypoints } = appContext;
        const { filename, eventType } = e;
        const nestedRouteEntries = entrypoints
          .map(point => point.nestedRoutesEntry)
          .filter(Boolean) as string[];
        const pagesDir = entrypoints
          .map(point => point.entry)
          // should only watch file-based routes
          .filter(entry => entry && !path.extname(entry))
          .concat(nestedRouteEntries);
        const isPageFile = (name: string) =>
          pagesDir.some(pageDir => name.includes(pageDir));

        const absoluteFilePath = path.resolve(appDirectory, filename);
        const isRouteComponent =
          isPageFile(absoluteFilePath) && isPageComponentFile(absoluteFilePath);

        if (
          isRouteComponent &&
          (eventType === 'add' || eventType === 'unlink')
        ) {
          const resolvedConfig = api.useResolvedConfigContext();
          const { generatorRoutes } = await import('./code');
          const entrypoints = cloneDeep(originEntrypoints);
          await generatorRoutes({
            appContext,
            api: api as any,
            entrypoints,
            config: resolvedConfig,
          });
        }
      },
    };
  },
});

export default routerPlugin;
