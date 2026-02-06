import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  ServerRoute,
} from '@modern-js/types';
import { findExists, fs, NESTED_ROUTE_SPEC_FILE } from '@modern-js/utils';
import { filterRoutesForServer } from '@modern-js/utils';
import { isRouteEntry } from './entry';
import {
  handleFileChange,
  handleGeneratorEntryCode,
  handleModifyEntrypoints,
} from './handler';

export { isRouteEntry } from './entry';
export { handleFileChange, handleModifyEntrypoints } from './handler';

const JS_OR_TS_EXTS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.mts',
  '.cjs',
  '.cts',
] as const;

function hasRouterConfigInRuntimeFile(runtimeConfigBase: string) {
  const runtimeConfigFile = findExists(
    JS_OR_TS_EXTS.map(ext => `${runtimeConfigBase}${ext}`),
  );

  if (!runtimeConfigFile) {
    return false;
  }

  try {
    const content = fs.readFileSync(runtimeConfigFile, 'utf-8');
    return /router\s*:/.test(content);
  } catch {
    return false;
  }
}

export const routerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-router',
  required: ['@modern-js/runtime'],
  setup: api => {
    const nestedRoutes: Record<string, unknown> = {};
    const nestedRoutesForServer: Record<string, unknown> = {};

    const { metaName } = api.getAppContext();

    api.addCommand(({ program }) => {
      program
        .command('routes')
        .description('generate routes inspect report')
        .action(async () => {
          const { generateRoutesInspectReport } = await import(
            './code/inspect'
          );
          await generateRoutesInspectReport(api);
        });
    });

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const { nestedRoutesEntry } = entrypoint as Entrypoint;
      const { serverRoutes, metaName, srcDirectory, runtimeConfigFile } =
        api.getAppContext();
      const normalizedConfig = api.getNormalizedConfig() as any;
      const hasUserRouterConfig =
        normalizedConfig.router &&
        Object.keys(normalizedConfig.router).length > 0;
      const hasRuntimeRouterConfig = hasRouterConfigInRuntimeFile(
        path.join(srcDirectory, runtimeConfigFile),
      );
      const serverBase = serverRoutes
        .filter(
          (route: ServerRoute) => route.entryName === entrypoint.entryName,
        )
        .map(route => route.urlPath)
        .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));

      if (
        nestedRoutesEntry ||
        hasUserRouterConfig ||
        hasRuntimeRouterConfig
      ) {
        plugins.push({
          name: 'router',
          path: `@${metaName}/runtime/router/internal`,
          config: { serverBase },
        });
      }

      return { entrypoint, plugins };
    });
    api.checkEntryPoint(({ path, entry }) => {
      return { path, entry: entry || isRouteEntry(path) };
    });
    api.config(() => {
      return {
        source: {
          include: [
            // react-router v6 and v7 is no longer support ie 11
            // so we need to compile these packages to ensure the compatibility
            // https://github.com/remix-run/react-router/commit/f6df0697e1b2064a2b3a12e8b39577326fdd945b
            /[\\/]node_modules[\\/]react-router[\\/]/,
            /[\\/]node_modules[\\/]react-router-dom[\\/]/,
            path.resolve(__dirname, '../runtime').replace('cjs', 'esm'),
          ],
        },
      };
    });
    api.modifyEntrypoints(async ({ entrypoints }) => {
      const newEntryPoints = await handleModifyEntrypoints(entrypoints);
      return { entrypoints: newEntryPoints };
    });
    api.generateEntryCode(async ({ entrypoints }) => {
      await handleGeneratorEntryCode(api, entrypoints);
    });
    api.onFileChanged(async e => {
      await handleFileChange(api, e);
    });

    api.modifyFileSystemRoutes(({ entrypoint, routes }) => {
      nestedRoutes[entrypoint.entryName] = routes;
      nestedRoutesForServer[entrypoint.entryName] = filterRoutesForServer(
        routes as (NestedRouteForCli | PageRoute)[],
      );

      return {
        entrypoint,
        routes,
      };
    });

    api.onBeforeGenerateRoutes(async ({ entrypoint, code }) => {
      const { distDirectory } = api.getAppContext();

      await fs.outputJSON(
        path.resolve(distDirectory, NESTED_ROUTE_SPEC_FILE),
        nestedRoutesForServer,
      );

      return {
        entrypoint,
        code,
      };
    });
  },
});

export default routerPlugin;
