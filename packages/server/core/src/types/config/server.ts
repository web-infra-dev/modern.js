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
    };

export type SSRByEntries = Record<string, SSR>;

export type CompressEncoding = 'br' | 'gzip';

export type CompressOptions = {
  /**
   * @description responses smaller than this size (in bytes) are not compressed
   * @default 1024
   */
  threshold?: number;
  /**
   * @description supported encodings, in order of server preference
   * @default ['br', 'gzip']
   */
  encodings?: CompressEncoding[];
};

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
   * @description compress responses of the production server with brotli or gzip
   * @default true for the Node.js production server
   */
  compress?: boolean | CompressOptions;
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
