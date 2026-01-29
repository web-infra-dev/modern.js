import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SERVER_ENTRY_POINT_FILE_NAME } from '@modern-js/utils/cli/constants';
import fse from '@modern-js/utils/fs-extra';
import { SERVER_BUNDLE_DEP_VARNAME } from '@modern-js/utils/universal/constants';
import type { AppToolsContext } from '../../../types/plugin';
import { getServerCombinedModuleFile } from '../../analyze/utils';
import { normalizePath } from '../utils';
import {
  type GenerateHandlerOptions as BaseGenerateHandlerOptions,
  type PluginItem,
  generateHandler as baseGenerateHandler,
} from '../utils/generator';
import { resolveESMDependency } from './utils';

export const serverAppContextTemplate = (appContext: AppToolsContext) => {
  const {
    appDirectory,
    sharedDirectory,
    apiDirectory,
    lambdaDirectory,
    metaName,
    bffRuntimeFramework,
  } = appContext;
  return {
    sharedDirectory: `"${normalizePath(
      path.relative(appDirectory, sharedDirectory),
    )}"`,
    apiDirectory: `"${normalizePath(path.relative(appDirectory, apiDirectory))}"`,
    lambdaDirectory: `"${normalizePath(
      path.relative(appDirectory, lambdaDirectory),
    )}"`,
    metaName,
    bffRuntimeFramework: bffRuntimeFramework || 'hono',
  };
};

const generatePluginCode = (plugins: PluginItem[]) => {
  const pluginCode = plugins.map(
    ([name], index) =>
      `import * as plugin_${index}_ns from '${name}';\nconst plugin_${index} = plugin_${index}_ns.default || plugin_${index}_ns;`,
  );
  return pluginCode.join('\n');
};

export interface GenerateHandlerOptions extends BaseGenerateHandlerOptions {
  depCode: string;
  serverType: string;
}

export const generateHandler = async (options: GenerateHandlerOptions) => {
  const { appContext, depCode, serverType } = options;
  const { serverRoutes, internalDirectory } = appContext;

  const routesCode: string[] = [];
  for (const route of serverRoutes) {
    if (!route.isSSR) {
      continue;
    }
    const bundleEntry = path.join(
      internalDirectory,
      route.entryName!,
      SERVER_ENTRY_POINT_FILE_NAME,
    );
    const serverLoadersEntry = getServerCombinedModuleFile(
      internalDirectory,
      route.entryName!,
    );
    const hasServerLoaders = await fse.pathExists(serverLoadersEntry);
    const serverLoadersCode = hasServerLoaders
      ? `serverLoadersContent: () => import(${JSON.stringify(pathToFileURL(serverLoadersEntry))}).then(x => x.default || x),`
      : '';
    const baseRouteCode = JSON.stringify(route);
    routesCode.push(`${baseRouteCode.substring(0, baseRouteCode.length - 1)},
      bundleContent: () => import(${JSON.stringify(pathToFileURL(bundleEntry))}).then(x => x.default || x),
      ${serverLoadersCode}
    }`);
  }

  const prodServerEntry = resolveESMDependency(
    serverType === 'node'
      ? '@modern-js/prod-server'
      : `@modern-js/prod-server/${serverType}`,
  );

  if (!prodServerEntry) {
    throw new Error(`Can not find ${serverType} server entry.`);
  }

  const code = await baseGenerateHandler({
    ...options,
    genAppContextTemplate: serverAppContextTemplate,
    genPluginImports: generatePluginCode,
    routesCode: routesCode.length ? `[${routesCode.join(',\n')}]` : '[]',
  });

  return code
    .replace('p_genDepCode', depCode)
    .replace('p_bundleDepVarName', JSON.stringify(SERVER_BUNDLE_DEP_VARNAME))
    .replace(
      'p_prodServerEntry',
      String(pathToFileURL(normalizePath(prodServerEntry))),
    );
};
