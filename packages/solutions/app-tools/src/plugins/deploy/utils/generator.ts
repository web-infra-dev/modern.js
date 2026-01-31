import path from 'node:path';
import type { ProdServerOptions } from '@modern-js/prod-server';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  fs as fse,
  getMeta,
} from '@modern-js/utils';
import { merge } from '@modern-js/utils/lodash';
import { normalizePath } from '.';
import type { AppToolsNormalizedConfig } from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';

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
    sharedDirectory: `path.join(__dirname, "${normalizePath(
      path.relative(appDirectory, sharedDirectory),
    )}")`,
    apiDirectory: `path.join(__dirname, "${normalizePath(
      path.relative(appDirectory, apiDirectory),
    )}")`,
    lambdaDirectory: `path.join(__dirname, "${normalizePath(
      path.relative(appDirectory, lambdaDirectory),
    )}")`,
    metaName,
    bffRuntimeFramework: bffRuntimeFramework || 'hono',
  };
};

export type PluginItem = [string, Record<string, any> | undefined];

export const genPluginImportsCode = (plugins: PluginItem[], isESM = false) => {
  return plugins
    .map(([name, options], index) => {
      const im = isESM
        ? `import * as plugin_${index}_ns from '${name}'`
        : `const plugin_${index}_ns = require('${name}')`;
      return `${im};const plugin_${index} = plugin_${index}_ns.default || plugin_${index}_ns`;
    })
    .join(';\n');
};

export const getPluginsCode = (plugins: PluginItem[]) => {
  return `[${plugins
    .map(
      ([, options], index) =>
        `plugin_${index}(${options ? JSON.stringify(options) : ''})`,
    )
    .join(',')}]`;
};

export const getServerConfigPath = (meta: string) =>
  `"${normalizePath(path.join(SERVER_DIR, `${meta}.server`))}"`;

export interface GenerateHandlerOptions {
  template: string;
  appContext: AppToolsContext;
  config: AppToolsNormalizedConfig;
  serverConfig?: Partial<ProdServerOptions>;
  genAppContextTemplate?: typeof serverAppContextTemplate;
  genPluginImports?: typeof genPluginImportsCode;
  routesCode?: string;
  isESM?: boolean;
}
export const generateHandler = async ({
  template,
  appContext,
  config,
  serverConfig: modifyServerConfig,
  genAppContextTemplate = serverAppContextTemplate,
  genPluginImports = genPluginImportsCode,
  routesCode,
  isESM,
}: GenerateHandlerOptions) => {
  const { serverPlugins, metaName, serverRoutes } = appContext;

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const serverConfig = merge(
    {
      bff: {
        prefix: config?.bff?.prefix,
      },
      output: {
        distPath: {
          root: '.',
        },
      },
    },
    modifyServerConfig || {},
  );

  const meta = getMeta(metaName);

  const pluginImportCode = genPluginImports(plugins || [], Boolean(isESM));
  const dynamicProdOptions = {
    config: serverConfig,
  };

  const serverConfigPath = getServerConfigPath(meta);

  const pluginsCode = getPluginsCode(plugins);

  const serverAppContext = genAppContextTemplate(appContext);

  return template
    .replace('p_genPluginImportsCode', pluginImportCode)
    .replace('p_ROUTE_SPEC_FILE', `"${ROUTE_SPEC_FILE}"`)
    .replace('p_ROUTES', routesCode || JSON.stringify(serverRoutes))
    .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
    .replace('p_plugins', pluginsCode)
    .replace(
      'p_bffRuntimeFramework',
      `"${serverAppContext.bffRuntimeFramework}"`,
    )
    .replace('p_serverDirectory', serverConfigPath)
    .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
    .replace('p_apiDirectory', serverAppContext.apiDirectory)
    .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);
};
