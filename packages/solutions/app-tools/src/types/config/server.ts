import type { WatchOptions } from '@modern-js/utils';

export type Route =
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
      mode?: 'string' | 'stream';
    };

export type SSRByEntries = Record<string, SSR>;

export type ServerUserConfig = {
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
  disableFrameworkExt?: boolean;
};

export type ServerNormalizedConfig = ServerUserConfig;
