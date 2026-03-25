import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  ServerRoute,
} from '@modern-js/types';
import type { RouterConfig } from '@modern-js/runtime';
import {
  fs,
  filterRoutesForServer,
  findExists,
  NESTED_ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import {
  getEntrypointRoutesDir,
  handleFileChange,
  handleGeneratorEntryCode,
  handleModifyEntrypoints,
  isRouteEntry,
} from '@modern-js/runtime/cli';
import {
  writeTanstackRegisterFile,
  writeTanstackRouterTypesForEntry,
} from './tanstackTypes';

const DEFAULT_TANSTACK_ROUTES_DIR = 'views';
const DEFAULT_GENERATED_DIR_NAME = 'modern-tanstack';
const TANSTACK_ENTRYPOINTS_KEY = '__tanstack_router_entries__';
const TANSTACK_RUNTIME_MODULE = '@modern-js/plugin-tanstack/runtime';
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

function hasTanstackRouterConfigInRuntimeFile(runtimeConfigBase: string) {
  const runtimeConfigFile = findExists(
    JS_OR_TS_EXTS.map(ext => `${runtimeConfigBase}${ext}`),
  );

  if (!runtimeConfigFile) {
    return false;
  }

  try {
    const content = fs.readFileSync(runtimeConfigFile, 'utf-8');
    return /tanstackRouter\s*:/.test(content);
  } catch {
    return false;
  }
}

type TanstackRouteEntrypointLike = {
  entry?: string;
  nestedRoutesEntry?: string;
};

function isTanstackRouteEntrypoint(
  entrypoint: TanstackRouteEntrypointLike,
  routesDir: string,
) {
  const entrypointRoutesDir = getEntrypointRoutesDir(entrypoint);
  if (entrypointRoutesDir) {
    return entrypointRoutesDir === routesDir;
  }

  if (entrypoint.nestedRoutesEntry) {
    return path.basename(entrypoint.nestedRoutesEntry) === routesDir;
  }

  return Boolean(entrypoint.entry && isRouteEntry(entrypoint.entry, routesDir));
}

export interface TanstackRouterPluginOptions extends Partial<RouterConfig> {
  routesDir?: string;
  generatedDirName?: string;
}

export const tanstackRouterPlugin = (
  options: TanstackRouterPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-tanstack',
  required: ['@modern-js/runtime'],
  setup: api => {
    const nestedRoutesForServer: Record<string, unknown> = {};
    const { metaName } = api.getAppContext();
    const routesDir = options.routesDir || DEFAULT_TANSTACK_ROUTES_DIR;
    const generatedDirName =
      options.generatedDirName || DEFAULT_GENERATED_DIR_NAME;

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const { serverRoutes, srcDirectory, runtimeConfigFile } = api.getAppContext();
      const hasRuntimeTanstackConfig = hasTanstackRouterConfigInRuntimeFile(
        path.join(srcDirectory, runtimeConfigFile),
      );
      const { routesDir: _routesDir, generatedDirName: _generatedDirName, ...runtimeConfig } =
        options;
      const hasInlineRuntimeConfig = Object.keys(runtimeConfig).length > 0;
      const serverBase = serverRoutes
        .filter((route: ServerRoute) => route.entryName === entrypoint.entryName)
        .map(route => route.urlPath)
        .sort((left, right) => (left.length - right.length > 0 ? -1 : 1));

      if (
        isTanstackRouteEntrypoint(entrypoint, routesDir) ||
        hasRuntimeTanstackConfig ||
        hasInlineRuntimeConfig
      ) {
        plugins.push({
          name: 'tanstackRouter',
          path: `@${metaName}/plugin-tanstack/runtime`,
          config: {
            serverBase,
            ...runtimeConfig,
          },
        });
      }

      return { entrypoint, plugins };
    });

    api.checkEntryPoint(({ path: entryPath, entry }) => {
      return {
        path: entryPath,
        entry: entry || isRouteEntry(entryPath, routesDir),
      };
    });

    api.config(() => {
      return {
        source: {
          include: [
            /[\\/]node_modules[\\/]@tanstack[\\/]react-router[\\/]/,
            /[\\/]node_modules[\\/]@tanstack[\\/]history[\\/]/,
            path.resolve(__dirname, '../runtime').replace('cjs', 'esm'),
          ],
        },
      };
    });

    api.modifyEntrypoints(async ({ entrypoints }) => {
      return {
        entrypoints: await handleModifyEntrypoints(entrypoints, routesDir),
      };
    });

    api.generateEntryCode(async ({ entrypoints }) => {
      await generateTanstackEntryCode(api, entrypoints, generatedDirName);
    });

    api.onFileChanged(async event => {
      await handleFileChange(api, event, {
        includeEntry: entrypoint => isTanstackRouteEntrypoint(entrypoint, routesDir),
        regenerate: async ({ api, entrypoints }) => {
          await generateTanstackEntryCode(api, entrypoints, generatedDirName);
        },
        entrypointsKey: TANSTACK_ENTRYPOINTS_KEY,
      });
    });

    api.modifyFileSystemRoutes(({ entrypoint, routes }) => {
      if (isTanstackRouteEntrypoint(entrypoint, routesDir)) {
        nestedRoutesForServer[entrypoint.entryName] = filterRoutesForServer(
          routes as (NestedRouteForCli | PageRoute)[],
        );
      }

      return {
        entrypoint,
        routes,
      };
    });

    api.onBeforeGenerateRoutes(async ({ entrypoint, code }) => {
      if (isTanstackRouteEntrypoint(entrypoint, routesDir)) {
        const { distDirectory } = api.getAppContext();

        const nestedRoutesSpecPath = path.resolve(
          distDirectory,
          NESTED_ROUTE_SPEC_FILE,
        );
        const existingNestedRoutes = (await fs.pathExists(nestedRoutesSpecPath))
          ? ((await fs.readJSON(nestedRoutesSpecPath)) as Record<string, unknown>)
          : {};

        await fs.outputJSON(nestedRoutesSpecPath, {
          ...existingNestedRoutes,
          ...nestedRoutesForServer,
        });
      }

      return {
        entrypoint,
        code,
      };
    });
  },
});

async function generateTanstackEntryCode(
  api: Parameters<NonNullable<ReturnType<typeof tanstackRouterPlugin>['setup']>>[0],
  entrypoints: Entrypoint[],
  generatedDirName: string,
) {
  const appContext = api.getAppContext();
  const routesByEntry = await handleGeneratorEntryCode(
    api,
    entrypoints,
    TANSTACK_ENTRYPOINTS_KEY,
  );

  await writeTanstackRegisterFile({
    appContext,
    entrypoints,
    generatedDirName,
    runtimeModule: TANSTACK_RUNTIME_MODULE,
  });

  await Promise.all(
    entrypoints.map(async entrypoint => {
      const entryName = entrypoint.entryName;
      const routes = routesByEntry[entryName];
      const outPath = path.join(
        appContext.srcDirectory,
        generatedDirName,
        entryName,
        'router.gen.ts',
      );

      if (routes?.length) {
        await writeTanstackRouterTypesForEntry({
          appContext,
          entryName,
          routes,
          generatedDirName,
          runtimeModule: TANSTACK_RUNTIME_MODULE,
        });
        return;
      }

      if (await fs.pathExists(outPath)) {
        await fs.remove(outPath);
      }
    }),
  );
}

export default tanstackRouterPlugin;
