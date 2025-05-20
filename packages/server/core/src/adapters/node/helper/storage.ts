import * as ah from 'async_hooks';
import type { Context } from 'hono';

const createStorage = <T>() => {
  let storage: ah.AsyncLocalStorage<any>;

  if (typeof ah.AsyncLocalStorage !== 'undefined') {
    storage = new ah.AsyncLocalStorage();
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

export const { run, useHonoContext } = createStorage<Context>();
