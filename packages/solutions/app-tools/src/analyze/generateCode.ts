import path from 'path';
import { fs, getEntryOptions, logger } from '@modern-js/utils';
import {
  IAppContext,
  PluginAPI,
  useResolvedConfigContext,
} from '@modern-js/core';
import type {
  Entrypoint,
  Route,
  NestedRoute,
  RouteLegacy,
  PageRoute,
} from '@modern-js/types';
import {
  AppNormalizedConfig,
  AppTools,
  ImportSpecifier,
  ImportStatement,
} from '../types';
import * as templates from './templates';
import { getClientRoutes, getClientRoutesLegacy } from './getClientRoutes';
import {
  FILE_SYSTEM_ROUTES_FILE_NAME,
  ENTRY_POINT_FILE_NAME,
  ENTRY_BOOTSTRAP_FILE_NAME,
} from './constants';
import { getDefaultImports, getServerLoadersFile } from './utils';
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

  const isV5 =
    typeof config.runtime?.router !== 'boolean' &&
    (config?.runtime?.router as { mode?: 'react-router-5' })?.mode ===
      'react-router-5';
  const { mountId } = config.html;
  const getRoutes = isV5 ? getClientRoutesLegacy : getClientRoutes;

  await Promise.all(entrypoints.map(generateEntryCode));

  async function generateEntryCode(entrypoint: Entrypoint) {
    const { entryName, isAutoMount, customBootstrap, fileSystemRoutes } =
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
        if (entrypoint.nestedRoutesEntry) {
          if (!isV5) {
            nestedRoute = await walk(
              entrypoint.nestedRoutesEntry,
              entrypoint.nestedRoutesEntry,
              {
                name: internalSrcAlias,
                basename: srcDirectory,
              },
              entrypoint.entryName,
            );
            if (nestedRoute) {
              (initialRoutes as Route[]).unshift(nestedRoute);
            }
          } else {
            logger.error('Nested routes is not supported in legacy mode.');
            // eslint-disable-next-line no-process-exit
            process.exit(1);
          }
        }

        const { routes } = await hookRunners.modifyFileSystemRoutes({
          entrypoint,
          routes: initialRoutes,
        });

        const config = useResolvedConfigContext();
        const ssr = getEntryOptions(
          entryName,
          config.server.ssr,
          config.server.ssrByEntries,
          packageName,
        );

        let mode: false | 'stream' | 'string';
        if (ssr) {
          mode = typeof ssr === 'object' ? ssr.mode || 'string' : 'string';
        } else {
          mode = false;
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
            ssrMode: mode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
          }),
        });

        // extract nested router loaders
        if (entrypoint.nestedRoutesEntry && mode) {
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
      const { imports: importStatements } =
        await hookRunners.modifyEntryImports({
          entrypoint,
          imports: getDefaultImports({
            entrypoint,
            srcDirectory,
            internalSrcAlias,
            internalDirAlias,
            internalDirectory,
          }),
        });

      // call modifyEntryRuntimePlugins hook
      const { plugins } = await hookRunners.modifyEntryRuntimePlugins({
        entrypoint,
        plugins: [],
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

      const code = templates.index({
        mountId: mountId as string,
        imports: createImportStatements(importStatements),
        renderFunction,
        exportStatement,
      });

      const entryFile = path.resolve(
        internalDirectory,
        `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
      );
      entrypoint.entry = entryFile;

      // generate entry file.
      if (config.source.enableAsyncEntry) {
        const { code: asyncEntryCode } = await hookRunners.modifyAsyncEntry({
          entrypoint,
          code: `import('./${ENTRY_BOOTSTRAP_FILE_NAME}');`,
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
  }
};
