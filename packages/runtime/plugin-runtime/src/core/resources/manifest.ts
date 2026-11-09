import type { ChunkId } from './types';

/**
 * `resourceStages` in `route-manifest.json`, written by the build
 * (`@modern-js/app-tools` ResourceStagesPlugin, keep the two in sync) and read
 * by the server to add the lists of the matched routes to the HTML.
 */
export interface ResourceStagesManifest {
  version: 1;
  /**
   * Whether route JS is staged by the framework (streaming SSR). String SSR
   * already outputs the scripts of the matched routes, so it skips `rc`, `rs`
   * and uses `u` instead of `ur`.
   */
  routeRule: boolean;
  routes: Record<string, RouteStages>;
}

export interface PreloadItem {
  /** URL. */
  h: string;
  /** `as` of the preload. */
  a: 'script' | 'style';
  /** Low fetch priority. */
  l?: 1;
}

export interface RouteStages {
  /** `critical` declarations of the route. */
  c?: PreloadItem[];
  /** Route JS that is `critical` by the route rule. */
  rc?: PreloadItem[];
  /** Declared stage -> chunk ids. */
  s?: Record<string, ChunkId[]>;
  /** Route JS that the route rule moved to a later stage. */
  rs?: Record<string, ChunkId[]>;
  /** Chunk id -> URLs of its CSS files. */
  k?: Record<string, string[]>;
  /** External payload of `s` when it is too large to inline. */
  u?: string;
  /** External payload of `s` and `rs`. */
  ur?: string;
}
