import path from 'path';
import { createMiddlewareCollecter } from './middleware';
import { requireModule } from './requireModule';

const API_DIR_PATH = 'api';
const API_APP_NAME = '_app';
const SERVER_DIR_PATH = 'server';
const WEB_APP_NAME = 'index';

export const gather = (pwd: string) => {
  const { getMiddlewares, addAPIMiddleware, addWebMiddleware } =
    createMiddlewareCollecter();

  const apiPath = path.resolve(pwd, API_DIR_PATH);
  const apiAppPath = path.resolve(apiPath, API_APP_NAME);
  const serverPath = path.resolve(pwd, SERVER_DIR_PATH);
  const webAppPath = path.resolve(serverPath, WEB_APP_NAME);

  const apiAttacher = requireModule(apiAppPath);
  if (apiAttacher) {
    apiAttacher({ addMiddleware: addAPIMiddleware });
  }

  const webAttacher = requireModule(webAppPath);
  if (webAttacher) {
    webAttacher({ addMiddleware: addWebMiddleware });
  }

  return getMiddlewares();
};
