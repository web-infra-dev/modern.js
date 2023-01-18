import type { JestConfig } from '@modern-js/core';
import type { AcceptedPlugin as PostCSSPlugin } from 'postcss';
import type { LessConfig, SassConfig } from '../config';

export type PostCSSOptions = {
  to?: string;
  from?: string;
  map?: any;
  syntax?: any;
  parser?: any;
  plugins?: PostCSSPlugin[];
  stringifier?: any;
};

export type PostCSSLoaderOptions = {
  /**
   * Enable PostCSS Parser support in CSS-in-JS. If you use JS styles the postcss-js parser, add the execute option.
   */
  execute?: boolean;
  /**
   * By default generation of source maps depends on the devtool option. All values enable source map generation except eval and false value.
   */
  sourceMap?: boolean;
  /**
   * The special implementation option determines which implementation of PostCSS to use.
   */
  implementation?: unknown;
  /**
   * Allows to set PostCSS options and plugins.
   */
  postcssOptions?: PostCSSOptions;
};

export type PostCSSConfigUtils = {
  addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
};

interface ToolsConfig {
  speedy?: any | ((config: any) => any);
}

export type PostCSSFunction = (
  options: PostCSSLoaderOptions,
  utils: PostCSSConfigUtils,
) => PostCSSLoaderOptions | void;

export type ToolsLegacyUserConfig = {
  babel?: any;
  less?: LessConfig;
  lodash?: any;
  postcss?: PostCSSLoaderOptions | PostCSSFunction;
  sass?: SassConfig;
  speedy?: ToolsConfig['speedy'] | Array<NonNullable<ToolsConfig['speedy']>>;
  /**
   * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  tailwindcss?:
    | Record<string, any>
    | ((options: Record<string, any>) => Record<string, any> | void);
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
};
