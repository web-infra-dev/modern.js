import type { BuilderConfig } from '@modern-js/builder';
import type { SSGConfig, SSGMultiEntryOptions } from '@modern-js/types';
import type { UnwrapBuilderConfig } from '../utils';

export interface OutputUserConfig extends UnwrapBuilderConfig<
  BuilderConfig,
  'output'
> {
  /**
   * Enable SSG for self-controlled routing or conventional routing.
   * @default false
   */
  ssg?: SSGConfig;
  /**
   * Specify SSG configuration by entries for multi-entry apps.
   * Takes precedence over `ssg` when provided.
   */
  ssgByEntries?: SSGMultiEntryOptions;
  /**
   * When using convention-based routing, the framework will split js and css based on the route to load on demand.
   * If your project does not want to split js and css based on routes, you can set this option to false.
   * @default true
   */
  splitRouteChunks?: boolean;
  /**
   * Used to control whether to inject convention-based routing information into the HTML.
   * @default true
   */
  enableInlineRouteManifests?: boolean;
  /**
   * Used to control whether to inject convention-based routing information into the HTML.
   * @default false
   */
  disableInlineRouteManifests?: boolean;
  /**
   * Which CSS of a convention-based route is recorded in the route manifest
   * and injected by streaming SSR into the HTML shell.
   * - `descendants`: the CSS of the route chunk and of all chunks it loads
   *   lazily (dynamic import / React.lazy), at any depth.
   * - `direct`: only the CSS of the route chunk itself. The CSS of lazy chunks
   *   is loaded with their JS on the client.
   * @default 'descendants'
   */
  routeCssScope?: 'descendants' | 'direct';
  /**
   * Specify the temporary directory for framework generated files.
   */
  tempDir?: string;
}

export type {
  SSGRouteOptions,
  SSGSingleEntryOptions,
  SSGMultiEntryOptions,
  SSGConfig,
} from '@modern-js/types';
