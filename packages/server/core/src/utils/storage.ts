import * as ah from 'async_hooks';

const getGlobalStorage = (globalKey: string): ah.AsyncLocalStorage<any> => {
  // Share one AsyncLocalStorage per process for this key, even when several
  // copies of this module are loaded at once (e.g. pnpm peer-variant
  // duplication resolving two @modern-js/server-core instances). The context
  // written through one copy must stay visible to the others; a module-scoped
  // instance would silently split the store per copy.
  const registry = globalThis as unknown as Record<
    symbol,
    ah.AsyncLocalStorage<any> | undefined
  >;
  const key = Symbol.for(globalKey);
  let storage = registry[key];
  if (!storage) {
    storage = new ah.AsyncLocalStorage();
    registry[key] = storage;
  }
  return storage;
};

const createStorage = <T>(globalKey?: string) => {
  let storage: ah.AsyncLocalStorage<any>;

  if (typeof ah.AsyncLocalStorage !== 'undefined') {
    storage = globalKey
      ? getGlobalStorage(globalKey)
      : new ah.AsyncLocalStorage();
  }

  const run = <O>(context: T, cb: () => O | Promise<O>): Promise<O> => {
    if (!storage) {
      throw new Error(`Unable to use async_hook, please confirm the node version >= 12.17
        `);
    }

    return new Promise<O>((resolve, reject) => {
      storage.run(context, () => {
        try {
          return resolve(cb());
        } catch (error) {
          return reject(error);
        }
      });
    });
  };

  const useHonoContext: () => T = () => {
    if (!storage) {
      throw new Error(`Unable to use async_hook, please confirm the node version >= 12.17
        `);
    }
    const context = storage.getStore();
    if (!context) {
      throw new Error(`Can't call useContext out of server scope`);
    }

    return context;
  };

  return {
    run,
    useHonoContext,
  };
};

export { createStorage };
