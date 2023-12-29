import type { UniBuilderConfig } from '@modern-js/uni-builder';
import type { SSGConfig } from '@modern-js/types';
import type { UnwrapBuilderConfig } from '../utils';

export interface OutputUserConfig
  extends UnwrapBuilderConfig<UniBuilderConfig, 'output'> {
  /**
   * Enable SSG for self-controlled routing or conventional routing.
   * @default false
   */
  ssg?: SSGConfig;
  /**
   * When using convention-based routing, the framework will split js and css based on the route to load on demand.
   * If your project does not want to split js and css based on routes, you can set this option to false.
   * @default true
   */
  splitRouteChunks?: boolean;
  /**
   * Used to control whether to inject the polyfill of the Node module into the code.
   * @default true
   */
  disableNodePolyfill?: boolean;
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
