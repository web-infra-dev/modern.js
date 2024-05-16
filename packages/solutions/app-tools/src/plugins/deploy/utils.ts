import path from 'path';
import { ROUTE_SPEC_FILE, fs as fse, isDepExists } from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import { IAppContext } from '@modern-js/core';

export type ServerAppContext = {
  sharedDirectory: string;
  apiDirectory: string;
  lambdaDirectory: string;
  metaName: string;
};

export const serverAppContenxtTemplate = (appContext: IAppContext) => {
  const {
    appDirectory,
    sharedDirectory,
    apiDirectory,
    lambdaDirectory,
    metaName,
  } = appContext;
  return {
    sharedDirectory: `path.join(__dirname, "${path.relative(
      appDirectory,
      sharedDirectory,
    )}")`,
    apiDirectory: `path.join(__dirname, "${path.relative(
      appDirectory,
      apiDirectory,
    )}")`,
    lambdaDirectory: `path.join(__dirname, "${path.relative(
      appDirectory,
      lambdaDirectory,
    )}")`,
    metaName,
  };
};

export const getPluginsCode = (plugins: string[]) =>
  `[${plugins.map((_, index) => `plugin_${index}()`).join(',')}]`;

export const genPluginImportsCode = (plugins: string[]) => {
  return plugins
    .map(
      (plugin, index) => `
      let plugin_${index} = require('${plugin}')
      plugin_${index} = plugin_${index}.default || plugin_${index}
      `,
    )
    .join(';\n');
};

export const getProjectUsage = (
  appDirectory: string,
  distDirectory: string,
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
  const useWebServer = isDepExists(appDirectory, '@modern-js/plugin-server');
  return { useSSR, useAPI, useWebServer };
};
