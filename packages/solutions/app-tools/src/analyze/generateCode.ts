/* eslint-disable max-lines */
import path from 'path';
import {
  fs,
  getEntryOptions,
  isRouterV5,
  isSSGEntry,
  isUseSSRBundle,
  logger,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import { IAppContext, PluginAPI } from '@modern-js/core';
import type {
  Entrypoint,
  Route,
  NestedRoute,
  RouteLegacy,
  PageRoute,
  SSRMode,
} from '@modern-js/types';
import {
  AppNormalizedConfig,
  AppTools,
  ImportSpecifier,
  ImportStatement,
  Rspack,
  webpack,
} from '../types';
import * as templates from './templates';
import { getClientRoutes, getClientRoutesLegacy } from './getClientRoutes';
import {
  FILE_SYSTEM_ROUTES_FILE_NAME,
  ENTRY_POINT_FILE_NAME,
  ENTRY_BOOTSTRAP_FILE_NAME,
} from './constants';
import {
  getDefaultImports,
  getServerLoadersFile,
  getServerCombinedModueFile,
} from './utils';
import { walk } from './nestedRoutes';

const createImportSpecifier = (specifiers: ImportSpecifier[]): string => {
  let defaults = '';

  const named = [];

  for (const { local, imported } of specifiers) {
    if (local && imported) {
      named.push(`${imported} as ${local}`);
    } else if (local) {
      defaults = local;
    } else {
      named.push(imported);
    }
  }

  if (defaults && named.length) {
    return `${defaults}, { ${named.join(', ')} }`;
  } else if (defaults) {
    return defaults;
  } else {
    return `{ ${named.join(', ')} }`;
  }
};

export const createImportStatements = (
  statements: ImportStatement[],
): string => {
  // merge import statements with the same value.
  const deDuplicated: ImportStatement[] = [];

  const seen = new Map();

  for (const { value, specifiers, initialize } of statements) {
    if (!seen.has(value)) {
      deDuplicated.push({
        value,
        specifiers,
        initialize,
      });
      seen.set(value, specifiers);
    } else {
      seen.get(value).push(...specifiers);
      // make "initialize" param can be connected when multiple plugins were imported from same package
      const modifyIndex = deDuplicated.findIndex(v => v.value === value);
      const originInitialize = deDuplicated[modifyIndex]?.initialize ?? '';
      deDuplicated[modifyIndex].initialize = originInitialize.concat(
        `\n${initialize || ''}`,
      );
    }
  }

  return deDuplicated
    .map(
      ({ value, specifiers, initialize }) =>
        `import ${createImportSpecifier(specifiers)} from '${value}';\n${
          initialize || ''
        }`,
    )
    .join('\n');
};

export const generateCode = async (
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
  entrypoints: Entrypoint[],
  api: PluginAPI<AppTools<'shared'>>,
) => {
  const {
    internalDirectory,
    srcDirectory,
    internalDirAlias,
    internalSrcAlias,
    packageName,
  } = appContext;

  const hookRunners = api.useHookRunners();

  const isV5 = isRouterV5(config);
  const getRoutes = isV5 ? getClientRoutesLegacy : getClientRoutes;
  const importsStatemets = new Map<string, ImportStatement[]>();

  await Promise.all(entrypoints.map(generateEntryCode));

  return {
    importsStatemets,
  };

  async function generateEntryCode(entrypoint: Entrypoint) {
    const { entryName, isMainEntry, isAutoMount, fileSystemRoutes } =
      entrypoint;
    if (isAutoMount) {
      // generate routes file for file system routes entrypoint.
      if (fileSystemRoutes) {
        let initialRoutes: (NestedRoute | PageRoute)[] | RouteLegacy[] = [];
        let nestedRoute: NestedRoute | null = null;
        if (entrypoint.entry) {
          initialRoutes = getRoutes({
            entrypoint,
            srcDirectory,
            srcAlias: internalSrcAlias,
            internalDirectory,
            internalDirAlias,
          });
        }
        if (!isV5 && entrypoint.nestedRoutesEntry) {
          nestedRoute = await walk(
            entrypoint.nestedRoutesEntry,
            entrypoint.nestedRoutesEntry,
            {
              name: internalSrcAlias,
              basename: srcDirectory,
            },
            entrypoint.entryName,
            entrypoint.isMainEntry,
          );
          if (nestedRoute) {
            (initialRoutes as Route[]).unshift(nestedRoute);
          }
        }

        const { routes } = await hookRunners.modifyFileSystemRoutes({
          entrypoint,
          routes: initialRoutes,
        });

        const config = api.useResolvedConfigContext();
        const ssr = getEntryOptions(
          entryName,
          isMainEntry,
          config.server.ssr,
          config.server.ssrByEntries,
          packageName,
        );
        const useSSG = isSSGEntry(config, entryName, entrypoints);

        let mode: SSRMode | undefined;
        if (ssr) {
          mode = typeof ssr === 'object' ? ssr.mode || 'string' : 'string';
        }
        if (mode === 'stream') {
          const hasPageRoute = routes.some(
            route => 'type' in route && route.type === 'page',
          );
          if (hasPageRoute) {
            logger.error(
              'Streaming ssr is not supported when pages dir exists',
            );
            // eslint-disable-next-line no-process-exit
            process.exit(1);
          }
        }

        const { code } = await hookRunners.beforeGenerateRoutes({
          entrypoint,
          code: await templates.fileSystemRoutes({
            routes,
            ssrMode: useSSG ? 'string' : mode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
            splitRouteChunks: config?.output?.splitRouteChunks,
          }),
        });

        // extract nested router loaders
        if (entrypoint.nestedRoutesEntry && isUseSSRBundle(config)) {
          const routesServerFile = getServerLoadersFile(
            internalDirectory,
            entryName,
          );

          const code = templates.routesForServer({
            routes: routes as (NestedRoute | PageRoute)[],
          });

          await fs.ensureFile(routesServerFile);
          await fs.writeFile(routesServerFile, code);
        }

        const serverLoaderCombined = templates.ssrLoaderCombinedModule(
          entrypoints,
          entrypoint,
          config,
          appContext,
        );
        if (serverLoaderCombined) {
          const serverLoaderFile = getServerCombinedModueFile(
            internalDirectory,
            entryName,
          );

          await fs.outputFile(serverLoaderFile, serverLoaderCombined);
        }

        fs.outputFileSync(
          path.resolve(
            internalDirectory,
            `./${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
          ),
          code,
          'utf8',
        );
      }

      // call modifyEntryImports hook
      const { imports } = await hookRunners.modifyEntryImports({
        entrypoint,
        imports: getDefaultImports({
          entrypoint,
          srcDirectory,
          internalSrcAlias,
          internalDirAlias,
          internalDirectory,
        }),
      });
      importsStatemets.set(entryName, imports);

      const entryFile = path.resolve(
        internalDirectory,
        `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
      );
      entrypoint.internalEntry = entryFile;
    }
  }
};

export const generateIndexCode = async ({
  appContext,
  api,
  entrypoints,
  config,
  importsStatemets,
  bundlerConfigs,
}: {
  appContext: IAppContext;
  api: PluginAPI<AppTools<'shared'>>;
  entrypoints: Entrypoint[];
  config: AppNormalizedConfig<'shared'>;
  importsStatemets: Map<string, ImportStatement[]>;
  bundlerConfigs?: webpack.Configuration[] | Rspack.Configuration[];
}) => {
  const hookRunners = api.useHookRunners();
  const { mountId } = config.html;
  const { internalDirectory, packageName } = appContext;

  await Promise.all(
    entrypoints.map(async entrypoint => {
      const {
        entryName,
        isMainEntry,
        isAutoMount,
        customBootstrap,
        fileSystemRoutes,
      } = entrypoint;
      if (isAutoMount) {
        // call modifyEntryRuntimePlugins hook
        const { plugins } = await hookRunners.modifyEntryRuntimePlugins({
          entrypoint,
          plugins: [],
          bundlerConfigs: bundlerConfigs as any,
        });

        // call modifyEntryRenderFunction hook
        const { code: renderFunction } =
          await hookRunners.modifyEntryRenderFunction({
            entrypoint,
            code: templates.renderFunction({
              plugins,
              customBootstrap,
              fileSystemRoutes,
            }),
          });

        // call modifyEntryExport hook
        const { exportStatement } = await hookRunners.modifyEntryExport({
          entrypoint,
          exportStatement: 'export default AppWrapper;',
        });

        const imports = importsStatemets.get(entryName)!;

        const code = templates.index({
          mountId: mountId as string,
          imports: createImportStatements(imports),
          renderFunction,
          exportStatement,
        });

        const entryFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );
        // generate entry file.
        if (config.source.enableAsyncEntry) {
          let rawAsyncEntryCode = `import('./${ENTRY_BOOTSTRAP_FILE_NAME}');`;
          const ssr = getEntryOptions(
            entryName,
            isMainEntry,
            config.server.ssr,
            config.server.ssrByEntries,
            packageName,
          );
          if (ssr) {
            rawAsyncEntryCode = `
        export const ${SERVER_RENDER_FUNCTION_NAME} = async (...args) => {
          let entry = await ${rawAsyncEntryCode};
          if (entry.default instanceof Promise){
            entry = await entry.default;
            return entry.default.${SERVER_RENDER_FUNCTION_NAME}.apply(null, args);
          }
          return entry.${SERVER_RENDER_FUNCTION_NAME}.apply(null, args);
        };
        if(typeof window!=='undefined'){
          ${rawAsyncEntryCode}
        }
        `;
          }
          const { code: asyncEntryCode } = await hookRunners.modifyAsyncEntry({
            entrypoint,
            code: rawAsyncEntryCode,
          });
          fs.outputFileSync(entryFile, asyncEntryCode, 'utf8');

          const bootstrapFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_BOOTSTRAP_FILE_NAME}`,
          );
          fs.outputFileSync(bootstrapFile, code, 'utf8');
        } else {
          fs.outputFileSync(entryFile, code, 'utf8');
        }
      }
    }),
  );
};
