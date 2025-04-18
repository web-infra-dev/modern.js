import type { ServerPluginLegacy } from '@modern-js/server-core';
import type {
  MiddlewareContext,
  NextFunction,
  UnstableMiddleware,
} from '@modern-js/types';
import { isProd, logger } from '@modern-js/utils';
import {
  type Hook,
  type Middleware,
  checkServerMod,
  loadMiddleware,
  loadServerMod,
} from './utils';

export { loadMiddleware, loadServerMod };
export type { Hook, Middleware };

enum HOOKS {
  AFTER_MATCH = 'afterMatch',
  AFTER_RENDER = 'afterRender',
}

class Storage {
  public middlewares: Middleware[] = [];

  public unstableMiddlewares: UnstableMiddleware[] = [];

  public hooks: Record<string, Hook> = {};

  reset() {
    this.middlewares = [];
    this.unstableMiddlewares = [];
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

function getFactory(storage: Storage) {
  const { middlewares } = storage;

  const factory = compose(middlewares);

  return factory;
}

export default (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-server',

  setup: api => {
    const { appDirectory, distDirectory } = api.useAppContext();
    const storage = new Storage();
    const transformAPI = createTransformAPI(storage);
    const pwd = isProd() ? distDirectory : appDirectory;

    const loadMod = async () => {
      // TODO：future, Modern.js removes the Hook concept, and `_middleware` file conventions can also be removed
      const { middleware: unstableMiddleware } = await loadMiddleware(pwd);
      const {
        defaultExports,
        hooks,
        middleware,
        unstableMiddleware: unstableMiddlewares,
      } = await loadServerMod(pwd);
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

      storage.unstableMiddlewares.push(...(unstableMiddlewares || []));
    };

    let factory: ReturnType<typeof compose>;

    return {
      async prepare() {
        const { metaName } = api.useAppContext();
        await checkServerMod(metaName, pwd);
        await loadMod();
      },
      async reset() {
        storage.reset();
        await loadMod();
        factory = getFactory(storage);
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
      prepareWebServer() {
        const { unstableMiddlewares } = storage;

        if (unstableMiddlewares.length > 0) {
          /**
           * In prod mode, we just return unstableMiddlewares directly.
           * In dev mode, we will return a new array with length of maxLen in the first time,
           * The new Array will execute the storage.unstableMiddlewares[index] by index, when the middleware is not exist, we will execute next().
           * It's the logic for hot reload, when unstableMiddlewares is changed, it will execute the new middleware.
           */
          if (isProd()) {
            return unstableMiddlewares;
          } else {
            const gap = 10;
            const baseLen =
              unstableMiddlewares.length < gap
                ? gap
                : unstableMiddlewares.length;
            const maxLen = baseLen + gap;
            return new Array(maxLen).fill(0).map((_, index) => {
              return (ctx, next) => {
                const unstableMiddleware = storage.unstableMiddlewares[index];
                if (unstableMiddleware) {
                  return unstableMiddleware(ctx, next);
                } else {
                  return next();
                }
              };
            });
          }
        }

        factory = getFactory(storage);

        return ctx => {
          const {
            source: { res },
          } = ctx;

          return new Promise<void>((resolve, reject) => {
            // res is not exist in other js runtime.
            res?.on('finish', (err: Error) => {
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
