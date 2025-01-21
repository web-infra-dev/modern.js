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
      disablePrerender?: boolean;
      unsafeHeaders?: string[];
      scriptLoading?: 'defer' | 'blocking' | 'module' | 'async';
      loaderFailureMode?: 'clientRender' | 'errorBoundary';
    };

export type SSRByEntries = Record<string, SSR>;

export interface ServerUserConfig {
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
  compiler?: 'babel' | 'typescript';
  /**
   * @description use json script tag instead of inline script
   * @default false
   */
  useJsonScript?: boolean;
}

export type ServerNormalizedConfig = ServerUserConfig;
