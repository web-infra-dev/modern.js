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
    };

export type SSRByEntries = Record<string, SSR>;

export interface ServerUserConfig {
  routes?: Routes;
  publicRoutes?: Record<string, string>;
  ssr?: SSR;
  ssrByEntries?: SSRByEntries;
  baseUrl?: string | string[];
  port?: number;
  logger?: boolean | Record<string, any>;
  metrics?: boolean | Record<string, any>;
  enableMicroFrontendDebug?: boolean;
  watchOptions?: WatchOptions;
  compiler?: 'babel' | 'typescript';
  enableFrameworkExt?: boolean;
  worker?: boolean;
}

export type ServerNormalizedConfig = ServerUserConfig;
