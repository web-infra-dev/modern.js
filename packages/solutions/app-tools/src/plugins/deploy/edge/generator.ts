import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  fs as fse,
  getMeta,
} from '@modern-js/utils';
import type { AppToolsNormalizedConfig } from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';
import { type PluginItem, getPluginsCode, normalizePath } from '../utils';
import { resolveESMDependency } from './utils';

export const serverAppContenxtTemplate = (appContext: AppToolsContext) => {
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

export const getServerConfigPath = (meta: string) =>
  `"${normalizePath(path.join(SERVER_DIR, `${meta}.server`))}"`;

const generatePluginCode = (plugins: PluginItem[]) => {
  const pluginCode = plugins.map(
    ([name], index) =>
      `import * as plugin_${index}_ns from '${name}';\nconst plugin_${index} = plugin_${index}_ns.default || plugin_${index}_ns;`,
  );
  return pluginCode.join('\n');
};

export const generateHandler = async (
  template: string,
  appContext: AppToolsContext,
  config: AppToolsNormalizedConfig,
  depCode: string,
  serverType: string,
) => {
  const { distDirectory, serverPlugins, metaName } = appContext;

  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fse.readJSONSync(routeJSON);

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const serverConfig = {
    bff: {
      prefix: config?.bff?.prefix,
    },
    output: {
      distPath: {
        root: '.',
      },
    },
  };

  const meta = getMeta(metaName);

  const pluginImportCode = generatePluginCode(plugins || []);
  const dynamicProdOptions = {
    config: serverConfig,
  };

  const serverConfigPath = getServerConfigPath(meta);

  const pluginsCode = getPluginsCode(plugins);

  const serverAppContext = serverAppContenxtTemplate(appContext);

  const prodServerEntry = resolveESMDependency(
    `@modern-js/prod-server/${serverType}`,
  );

  if (!prodServerEntry) {
    throw new Error(`Can not find ${serverType} server entry.`);
  }

  return template
    .replace('p_genDepCode', depCode)
    .replace('p_genPluginImportsCode', pluginImportCode)
    .replace('p_ROUTES', JSON.stringify(routes))
    .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
    .replace('p_plugins', pluginsCode)
    .replace(
      'p_bffRuntimeFramework',
      `"${serverAppContext.bffRuntimeFramework}"`,
    )
    .replace('p_prodServerEntry', prodServerEntry)
    .replace('p_serverDirectory', serverConfigPath)
    .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
    .replace('p_apiDirectory', serverAppContext.apiDirectory)
    .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);
};
