import type { SSRMode } from '@modern-js/types';
import type { WatchOptions } from '@modern-js/utils';

type Route =
  | string
  | string[]
  | {
      route?: string | string[];
      disableSpa?: boolean;
      resHeaders?: Record<string, unknown>;
    };
export type Routes = Record<string, Route>;

export type SSR =
  | boolean
  | {
      forceCSR?: boolean;
      mode?: SSRMode;
      inlineScript?: boolean;
      unsafeHeaders?: string[];
      loaderFailureMode?: 'clientRender' | 'errorBoundary';
      /**
       * String SSR only. Loaders may return an object whose values are promises
       * (deferred data). The server waits up to this many milliseconds for them before
       * rendering: settled values are rendered and serialized as usual, values that are
       * still pending or rejected are fetched again by the browser for their route, so
       * only the `<Await>` regions that use them render later.
       * Without a value the server waits for every promise.
       */
      deferredDataTimeout?: number;
    };

export type SSRByEntries = Record<string, SSR>;

export interface ServerUserConfig {
  publicDir?: string | string[];
  routes?: Routes;
  /**
   * Experimenal, it is not recommended to use it now
   */
  ssrByRouteIds?: string[];
  publicRoutes?: Record<string, string>;
  ssr?: SSR;
  ssrByEntries?: SSRByEntries;
  rsc?: boolean;
  baseUrl?: string | string[];
  port?: number;
  watchOptions?: WatchOptions;
  compiler?: 'typescript';
  /**
   * @description use json script tag instead of inline script
   * @default false
   */
  useJsonScript?: boolean;
  logger?: boolean | Record<string, unknown>;
  /**
   * @description disable hook middleware for performance
   * @default false
   */
  disableHook?: boolean;
  /**
   * Path to the tsconfig used by all server-side TypeScript stages:
   * BFF/api compile, custom server compile, runtime ts-node register,
   * and downstream runtimes.
   *
   * @default <appDirectory>/tsconfig.json
   */
  tsconfigPath?: string;
}

export type ServerNormalizedConfig = ServerUserConfig;
