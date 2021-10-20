import {
  useContext,
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { Loader, LoaderStatus } from './loaderManager';
import { RuntimeReactContext } from '@/runtime-context';

export interface LoaderOptions<
  Params = any,
  TData = any,
  TError extends Error = any,
> {
  /**
   * Revoke when loader excuted successfully.
   */
  onSuccess?: (data: TData) => void;

  /**
   * Revoke when loader ended with error
   */
  onError?: (error: TError) => void;

  /**
   * initialData to display once loader is ready.
   */
  initialData?: TData;

  /**
   * wheather skip loader
   * if true, the loader will not exec.
   */
  skip?: boolean;

  /**
   * User params, it will bypass to loader's second parameter.
   */
  params?: Params;

  /**
   * wheather loader can exec on build phase.
   */
  static?: boolean;
}

// todo: SSRContext
type LoaderFn<P = any, T = any> = (context: any, params: P) => Promise<T>;

const useLoader = <TData = any, Params = any, E = any>(
  loaderFn: LoaderFn<Params, TData>,
  options: LoaderOptions<Params> = { params: undefined } as any,
) => {
  const context = useContext(RuntimeReactContext);
  const isSSRSecRender = Boolean(context.ssr);

  const { loaderManager } = context;
  const loaderRef = useRef<Loader>();
  const unlistenLoaderChangeRef = useRef<(() => void) | null>(null);

  const reload = useCallback(
    (params?: Params) => {
      if (typeof params === 'undefined') {
        return loaderRef.current?.load();
      }

      const id = loaderManager.add(
        () => {
          try {
            const res = loaderFn(context, params);

            if (res instanceof Promise) {
              return res;
            }

            return Promise.resolve(res);
          } catch (e) {
            return Promise.reject(e instanceof Error ? e.message : e);
          }
        },
        {
          ...options,
          params,
        },
      );

      loaderRef.current = loaderManager.get(id)!;

      if (isSSRSecRender) {
        unlistenLoaderChangeRef.current?.();
        return undefined;
      }

      // skip this loader, then try to unlisten loader change
      if (options.skip) {
        unlistenLoaderChangeRef.current?.();
        return undefined;
      }

      const res = loaderRef.current.load();

      // unlisten old loader, and subsribe to new loader
      unlistenLoaderChangeRef.current?.();
      unlistenLoaderChangeRef.current = loaderRef.current?.onChange(
        (_status, _result) => {
          setResult(_result);

          if (_status === LoaderStatus.fulfilled) {
            options?.onSuccess?.(result.data);
          }

          if (_status === LoaderStatus.rejected) {
            options?.onError?.(result.data);
          }
        },
      );

      return res;
    },
    [options.skip],
  );

  useEffect(
    () => () => {
      unlistenLoaderChangeRef.current?.();
    },
    [],
  );

  useMemo(() => {
    const p = options.params ?? (loaderFn as any).id;

    if (!p) {
      throw new Error('Params is required in useLoader');
    }
    reload(p);
  }, [options.params]);

  const [result, setResult] = useState<{
    loading: boolean;
    reloading: boolean;
    data: TData;
    error: E;
  }>(loaderRef.current!.result);

  return {
    ...result,
    reload,
  };
};

export default useLoader;
