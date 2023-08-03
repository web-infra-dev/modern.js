import type {
  EnvConfig,
  Extensions,
  JsMinifyOptions,
  ReactConfig,
  TransformConfig,
} from '@modern-js/swc-plugins';
import type { lodash as _ } from '@modern-js/utils';

export type {
  Output,
  TransformConfig,
  JsMinifyOptions,
  TerserCompressOptions,
} from '@modern-js/swc-plugins';

export type OuterExtensions = Omit<
  Extensions,
  'ssrLoaderId' | 'configRoutes'
> & {
  /**
   * @deprecated
   */
  // for backwards compatibility
  modernjsSsrLoaderId?: boolean;
};

export interface ObjPluginSwcOptions<T extends 'inner' | 'outer' = 'inner'>
  extends TransformConfig {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;

  jsMinify?: boolean | JsMinifyOptions;
  cssMinify?: boolean | CssMinifyOptions;

  extensions?: T extends 'inner' ? Extensions : OuterExtensions;

  overrides?: Override<T>[];
}

export type Override<T extends 'inner' | 'outer'> = Omit<
  ObjPluginSwcOptions<T>,
  'test' | 'include' | 'exclude'
> & {
  test?: RegExp;
  include?: RegExp[];
  exclude?: RegExp[];
};

export type FnPluginSwcOptions = (
  config: TransformConfig,
  utilities: Utilities,
) => void | TransformConfig;

export type PluginSwcOptions<T extends 'inner' | 'outer' = 'inner'> =
  | ObjPluginSwcOptions<T>
  | FnPluginSwcOptions;

interface Utilities {
  mergeConfig: typeof _.merge;
  setConfig: typeof _.set;
}

export interface CssMinifyOptions {
  sourceMap?: boolean;
  inlineSourceContent?: boolean;
}
