import path from 'path';
import { fs } from '@modern-js/utils';
import { Entrypoint, Route } from '@modern-js/types';
import {
  AppNormalizedConfig,
  AppTools,
  IAppContext,
  PluginAPI,
} from '@modern-js/app-tools-v2';
import { ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME } from '../../cli/constants';
import { FILE_SYSTEM_ROUTES_FILE_NAME, NESTED_ROUTES_DIR } from './constants';
import { hasNestedRoutes } from './route';
import { walk } from './nestedRoutes';
import * as templates from './template';

export async function generatorRoutes({
  appContext,
  api,
  entrypoints,
  config,
}: {
  appContext: IAppContext;
  api: PluginAPI<AppTools<'shared'>>;
  entrypoints: Entrypoint[];
  config: AppNormalizedConfig<'shared'>;
}) {
  const hookRunners = api.useHookRunners();
  const { internalSrcAlias, srcDirectory, internalDirectory } = appContext;
  return await Promise.all(
    entrypoints.map(async entrypoint => {
      const { isAutoMount } = entrypoint;
      if (!isAutoMount) {
        return entrypoint;
      }
      const isHasNestedRoutes = hasNestedRoutes(entrypoint.absoluteEntryDir!);
      if (!isHasNestedRoutes) {
        return entrypoint;
      }
      entrypoint.nestedRoutesEntry = path.join(
        entrypoint.absoluteEntryDir!,
        NESTED_ROUTES_DIR,
      );
      const initialRoutes: Route[] = [];
      let nestedRoutes = await walk(
        entrypoint.nestedRoutesEntry,
        entrypoint.nestedRoutesEntry,
        {
          name: internalSrcAlias,
          basename: srcDirectory,
        },
        entrypoint.entryName,
        entrypoint.isMainEntry,
      );
      if (nestedRoutes) {
        if (!Array.isArray(nestedRoutes)) {
          nestedRoutes = [nestedRoutes];
        }
        for (const route of nestedRoutes) {
          initialRoutes.unshift(route);
        }
      }

      const { routes } = await hookRunners.modifyFileSystemRoutes({
        entrypoint,
        routes: initialRoutes as any,
      });
      const { code } = await hookRunners.beforeGenerateRoutes({
        entrypoint,
        code: await templates.fileSystemRoutes({
          routes,
          // ssrMode: useSSG ? 'string' : mode,
          nestedRoutesEntry: entrypoint.nestedRoutesEntry,
          entryName: entrypoint.entryName,
          internalDirectory,
          splitRouteChunks: config?.output?.splitRouteChunks,
        }),
      });
      generatorRouteCode(internalDirectory, entrypoint.entryName, code);
      return entrypoint;
    }),
  );
}

export function generatorRouteCode(
  internalDirectory: string,
  entryName: string,
  code: string,
) {
  fs.outputFileSync(
    path.resolve(
      internalDirectory,
      `./${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
    ),
    code,
    'utf8',
  );
}

export function generatorRegisterCode(
  internalDirectory: string,
  entryName: string,
  code: string,
) {
  fs.outputFileSync(
    path.resolve(
      internalDirectory,
      `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}`,
    ),
    code,
    'utf8',
  );
}
