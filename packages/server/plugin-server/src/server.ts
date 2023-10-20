import type { ServerPlugin } from '@modern-js/server-core';
import type { MiddlewareContext, NextFunction } from '@modern-js/types';
import { isProd, logger } from '@modern-js/utils';
import { Hook, Middleware, loadMiddleware, loadServerMod } from './utils';

export { loadMiddleware, loadServerMod };
export type { Hook, Middleware };

enum HOOKS {
  AFTER_MATCH = 'afterMatch',
  AFTER_RENDER = 'afterRender',
}

class Storage {
  public middlewares: Middleware[] = [];

  public hooks: Record<string, Hook> = {};

  reset() {
    this.middlewares = [];
    this.hooks = {};
  }
}

const createTransformAPI = (storage: Storage) =>
  new Proxy(
    {},
    {
      get(target: any, name: string) {
        if (name === 'addMiddleware') {
          return (fn: Middleware) => storage.middlewares.push(fn);
        }
        return (fn: Hook) => {
          logger.warn(
            'declare hook in default export is to be deprecated, use named export instead',
          );
          storage.hooks[name] = fn;
        };
      },
    },
  );

export const compose = (middlewares: Middleware[]) => {
  return (
    ctx: MiddlewareContext,
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: any) => void,
  ) => {
    let i = 0;
    const dispatch: NextFunction = () => {
      const handler = middlewares[i++];
      if (!handler) {
        return resolve();
      }

      return (handler(ctx, dispatch) as any)?.catch?.(reject);
    };
    return dispatch;
  };
};

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-server',

  setup: api => {
    const { appDirectory, distDirectory } = api.useAppContext();
    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);
    const pwd = isProd() ? distDirectory : appDirectory;

    const loadMod = () => {
      const { middleware: unstableMiddleware } = loadMiddleware(pwd);
      const { defaultExports, hooks, middleware } = loadServerMod(pwd);
      if (defaultExports) {
        defaultExports(transformAPI);
      }

      if (hooks) {
        // named export hooks will overrides hooks in default export function
        Object.values(HOOKS).forEach(key => {
          const fn = hooks[key];
          if (fn) {
            storage.hooks[key] = fn;
          }
        });
      }

      if (middleware) {
        storage.middlewares = ([] as Middleware[]).concat(middleware);
      }
      storage.middlewares = storage.middlewares.concat(unstableMiddleware);
    };

    return {
      prepare() {
        loadMod();
      },
      reset() {
        storage.reset();
        loadMod();
      },
      gather({ addWebMiddleware }) {
        storage.middlewares.forEach(mid => {
          addWebMiddleware(mid);
        });
      },
      afterMatch(context, next) {
        if (!storage.hooks.afterMatch) {
          return next();
        }
        return storage.hooks.afterMatch(context, next);
      },
      afterRender(context, next) {
        if (!storage.hooks.afterRender) {
          return next();
        }
        return storage.hooks.afterRender(context, next);
      },
      prepareWebServer({ config }) {
        const { middleware } = config;
        const factory = compose(middleware);

        return ctx => {
          const {
            source: { res },
          } = ctx;
          return new Promise<void>((resolve, reject) => {
            res.on('finish', (err: Error) => {
              if (err) {
                return reject(err);
              }
              return resolve();
            });

            const dispatch = factory(ctx, resolve, reject);
            dispatch();
          });
        };
      },
    };
  },
});
