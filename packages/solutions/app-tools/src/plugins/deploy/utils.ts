import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  fs as fse,
  getMeta,
} from '@modern-js/utils';
import type { AppToolsContext } from '../../types/plugin';

export type ServerAppContext = {
  sharedDirectory: string;
  apiDirectory: string;
  lambdaDirectory: string;
  metaName: string;
  bffRuntimeFramework: string;
};

export const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/');

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

export const genPluginImportsCode = (plugins: PluginItem[]) => {
  return plugins
    .map(
      ([name, options], index) => `
      let plugin_${index} = require('${name}')
      plugin_${index} = plugin_${index}.default || plugin_${index}
      `,
    )
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

export const getProjectUsage = (
  appDirectory: string,
  distDirectory: string,
  metaName: string,
) => {
  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fse.readJSONSync(routeJSON);

  let useSSR = false;
  let useAPI = false;
  routes.forEach((route: ServerRoute) => {
    if (route.isSSR) {
      useSSR = true;
    }

    if (route.isApi) {
      useAPI = true;
    }
  });

  const meta = getMeta(metaName);
  const serverConfigPath = path.resolve(
    appDirectory,
    SERVER_DIR,
    `${meta}.server`,
  );
  const isServerConfigExists = ['.ts', '.js'].some(ex => {
    return fse.existsSync(`${serverConfigPath}${ex}`);
  });

  return { useSSR, useAPI, useWebServer: isServerConfigExists };
};
