import { Application } from 'egg';
import type { Middleware as KoaMiddleware } from 'koa';
import { compatRequire } from '@modern-js/utils';

type Middleware = KoaMiddleware | string | [KoaMiddleware, Record<string, any>];

const registerMiddleware = (app: Application, middleware: Middleware) => {
  if (!app) {
    throw new Error('can not found app instance');
  }

  if (!Array.isArray(middleware)) {
    throw new Error(`middleware must be a array, but found ${middleware}`);
  }

  for (const middlewareItem of middleware) {
    let middlewareFunc: any = middlewareItem;
    let config = null;
    if (Array.isArray(middlewareItem)) {
      middlewareFunc = middlewareItem[0];
      config = middlewareItem[1];
    }
    if (typeof middlewareFunc === 'string') {
      middlewareFunc = compatRequire(middlewareFunc);
    }
    if (middlewareFunc) {
      if (config) {
        app.use(middlewareFunc(config));
      } else {
        app.use(middlewareFunc());
      }
    }
  }
};

export default registerMiddleware;
