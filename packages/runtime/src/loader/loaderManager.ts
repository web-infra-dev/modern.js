import invariant from 'invariant';
import { LoaderOptions } from './useLoader';

/**
 * Calc id from string or object
 */
const createGetId = () => {
  const idCache = new Map();

  return (objectId: NonNullable<any>) => {
    const cachedId = idCache.get(objectId);

    if (cachedId) {
      return cachedId;
    }

    // WARNING: id should be unique after serialize.
    const id = JSON.stringify(objectId);

    invariant(id, 'params should be not null value');

    idCache.set(objectId, id);

    return id;
  };
};

export enum LoaderStatus {
  idle,
  loading,
  fulfilled,
  rejected,
}

export type LoaderResult = {
  loading: boolean;
  reloading: boolean;
  data: any;
  error: any;
};

const createLoader = (
  id: string,
  initialData: Partial<LoaderResult> = {
    loading: false,
    reloading: false,
    data: undefined,
    error: undefined,
  },
  loaderFn: () => Promise<any>,
  skip = false,
) => {
  let promise: Promise<any> | null;
  let status: LoaderStatus = LoaderStatus.idle;
  let { data, error } = initialData;
  let hasLoaded = false;

  const handlers = new Set<
    (status: LoaderStatus, result: LoaderResult) => void
  >();

  const load = async () => {
    if (skip) {
      return promise;
    }

    if (status === LoaderStatus.loading) {
      return promise;
    }

    status = LoaderStatus.loading;
    notify();

    promise = new Promise(resolve => {
      loaderFn()
        // eslint-disable-next-line promise/prefer-await-to-then
        .then(value => {
          data = value;
          error = null;
          status = LoaderStatus.fulfilled;
          notify();
          resolve(value);
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch(e => {
          error = e instanceof Error ? `${e.message}` : e;
          data = null;
          status = LoaderStatus.rejected;
          notify();
          resolve(e);
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .finally(() => {
          promise = null;
          hasLoaded = true;
        });
    });

    return promise;
  };

  const getResult = () => ({
    loading: !hasLoaded && status === LoaderStatus.loading,
    reloading: hasLoaded && status === LoaderStatus.loading,
    data,
    error,
  });

  const notify = () => {
    handlers.forEach(handler => {
      handler(status, getResult());
    });
  };

  const onChange = (
    handler: (status: LoaderStatus, result: LoaderResult) => void,
  ) => {
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  };

  return {
    get result() {
      return getResult();
    },
    get promise() {
      return promise;
    },
    onChange,
    load,
  };
};

type ManagerOption = {
  /**
   * wheather current manage only exec static loader
   */
  skipStatic?: boolean;
  skipNonStatic?: boolean;
};

/**
 * Create loaders manager. It's returned instance will add to context
 * @param initialDataMap used to initialing loader data
 */
export const createLoaderManager = (
  initialDataMap: Record<string, LoaderResult>,
  managerOptions: ManagerOption = {},
) => {
  const { skipStatic = false, skipNonStatic = false } = managerOptions;
  const loadersMap = new Map<string, Loader>();
  const getId = createGetId();

  const add = (loaderFn: () => Promise<any>, loaderOptions: LoaderOptions) => {
    const id = getId(loaderOptions.params);
    let loader = loadersMap.get(id);

    if (!loader) {
      // ignore non-static loader on static phase
      const ignoreNonStatic = skipNonStatic && !loaderOptions.static;

      // ignore static loader on non-static phase
      const ignoreStatic = skipStatic && loaderOptions.static;

      const skipExec = ignoreNonStatic || ignoreStatic;

      loader = createLoader(
        id,
        typeof initialDataMap[id] !== 'undefined'
          ? initialDataMap[id]
          : { data: loaderOptions.initialData },
        loaderFn,
        // Todo whether static loader is exec when CSR
        skipExec,
      );
      loadersMap.set(id, loader);
    }

    return id;
  };

  const get = (id: string) => loadersMap.get(id);

  // check if there has pending loaders
  const hasPendingLoaders = () => {
    for (const loader of loadersMap.values()) {
      const { promise } = loader;

      if (promise instanceof Promise) {
        return true;
      }
    }

    return false;
  };

  // waiting for all pending loaders to be settled
  const awaitPendingLoaders = async () => {
    const pendingLoaders = [];

    for (const [id, loader] of loadersMap) {
      const { promise } = loader;

      if (promise instanceof Promise) {
        pendingLoaders.push([id, loader] as [string, Loader]);
      }
    }

    await Promise.all(pendingLoaders.map(item => item[1].promise));

    return pendingLoaders.reduce<Record<string, LoaderResult>>(
      (res, [id, loader]) => {
        res[id] = loader.result;

        return res;
      },
      {},
    );
  };

  return {
    hasPendingLoaders,
    awaitPendingLoaders,
    add,
    get,
  };
};

export type Loader = ReturnType<typeof createLoader>;
