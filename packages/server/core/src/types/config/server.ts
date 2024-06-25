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

type PreloadLink = { url: string; as?: string; rel?: string };
type PreloadInclude = Array<string | PreloadLink>;
interface PreloadAttributes {
  script?: Record<string, boolean | string>;
  style?: Record<string, boolean | string>;
  image?: Record<string, boolean | string>;
  font?: Record<string, boolean | string>;
}
export type SSRPreload = {
  /** Include external preload links to enhance the page's performance by preloading additional resources. */
  include?: PreloadInclude;

  /** Utilize string matching to exclude specific preload links. */
  exclude?: RegExp | string;

  /** Disable preload when the User-Agent is matched.  */
  userAgentFilter?: RegExp | string;

  /** Include additional attributes to the Header Link.  */
  attributes?: PreloadAttributes;
};

export type SSR =
  | boolean
  | {
      forceCSR?: boolean;
      mode?: SSRMode;
      preload?: boolean | SSRPreload;
      inlineScript?: boolean;
      disablePrerender?: boolean;
      unsafeHeaders?: string[];
      scriptLoading?: 'defer' | 'blocking' | 'module' | 'async';
      loaderFailureMode?: 'clientRender' | 'errorBoundary';
    };

export type SSRByEntries = Record<string, SSR>;

export interface ServerUserConfig {
  routes?: Routes;
  publicRoutes?: Record<string, string>;
  ssr?: SSR;
  ssrByEntries?: SSRByEntries;
  baseUrl?: string | string[];
  port?: number;
  enableMicroFrontendDebug?: boolean;
  watchOptions?: WatchOptions;
  compiler?: 'babel' | 'typescript';
  enableFrameworkExt?: boolean;
}

export type ServerNormalizedConfig = ServerUserConfig;
