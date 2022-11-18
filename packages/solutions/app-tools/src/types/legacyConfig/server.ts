import type { WatchOptions } from '@modern-js/utils';

export type LegacyServerUserConfig = {
  routes?: Record<
    string,
    | string
    | string[]
    | {
        route?: string | string[];
        disableSpa?: boolean;
        resHeaders?: Record<string, unknown>;
      }
  >;
  publicRoutes?: { [filepath: string]: string };
  ssr?:
    | boolean
    | {
        mode?: 'string' | 'stream';
        [property: string]: unknown;
      };
  ssrByEntries?: Record<
    string,
    | boolean
    | {
        mode?: 'string' | 'stream';
        [property: string]: unknown;
      }
  >;
  baseUrl?: string | Array<string>;
  port?: number;
  logger?: boolean | Record<string, any>;
  metrics?: boolean | Record<string, any>;
  enableMicroFrontendDebug?: boolean;
  watchOptions?: WatchOptions;
  compiler?: 'babel' | 'typescript';
  disableFrameworkExt?: boolean;
};
