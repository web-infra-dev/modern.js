import type { IncomingHttpHeaders } from 'http';
import type { Monitors } from '@modern-js/types';
import * as ah from 'async_hooks';

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

  const useContext: () => T = () => {
    if (!storage) {
      throw new Error(`Unable to use async_hook, please confirm the node version >= 12.17
        `);
    }
    const context = storage?.getStore();
    if (!context) {
      throw new Error(
        `Can't call useContext out of scope, make sure @modern-js/runtime-utils is a single version in node_modules`,
      );
    }

    return context;
  };

  return {
    run,
    useContext,
  };
};

const storage = createStorage<{
  monitors?: Monitors;
  headers?: IncomingHttpHeaders;
  request?: Request;
  responseProxy?: {
    headers: Record<string, string>;
    status: number;
  };
  activeDeferreds?: Map<string, unknown>;
  serverPayload?: unknown;
}>();

type Storage = typeof storage;

export { storage, type Storage };

export const getAsyncLocalStorage = async (): Promise<Storage> => {
  return storage;
};
