import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  fs as fse,
  getMeta,
} from '@modern-js/utils';

export type ServerAppContext = {
  sharedDirectory: string;
  apiDirectory: string;
  lambdaDirectory: string;
  metaName: string;
  bffRuntimeFramework: string;
};

export const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/');

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

export const getTemplatePath = (file: string) =>
  path.join(__dirname, '../platforms/templates', file);
export const readTemplate = async (file: string) =>
  (await fse.readFile(getTemplatePath(file))).toString();
