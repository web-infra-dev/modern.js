import {
  EnvConfig,
  Extensions,
  JsMinifyOptions,
  ReactConfig,
} from '@modern-js/swc-plugins';

export type {
  TransformConfig,
  Output,
  JsMinifyOptions,
} from '@modern-js/swc-plugins';

type OuterExtensions = Omit<Extensions, 'ssrLoaderId' | 'configRoutes'> & {
  /**
   * @deprecated
   */
  // for backwards compatibility
  modernjsSsrLoaderId?: boolean;
};
export interface PluginSwcOptions<T extends 'inner' | 'outer' = 'inner'> {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;

  jsMinify?: boolean | JsMinifyOptions;
  cssMinify?: boolean | CssMinifyOptions;

  extensions?: T extends 'inner' ? Extensions : OuterExtensions;
}

export interface CssMinifyOptions {
  sourceMap?: boolean;
  inlineSourceContent?: boolean;
}
