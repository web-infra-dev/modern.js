import {
  EnvConfig,
  Extensions,
  JsMinifyOptions,
  ReactConfig,
  TransformConfig,
} from '@modern-js/swc-plugins';
import {
  CORE_JS_DIR_PATH,
  SWC_HELPERS_DIR_PATH,
} from '@modern-js/builder-plugin-swc-base';

export type { TransformConfig } from '@modern-js/swc-plugins';

export type PartialRecursive<O> = O extends Record<any, any>
  ? O extends any[]
    ? O
    : { [k in keyof O]?: PartialRecursive<O[k]> }
  : O;

export interface PluginSwcOptions {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;

  jsMinify?: boolean | JsMinifyOptions;
  cssMinify?: boolean | CssMinifyOptions;

  extensions?: Extensions;
}

export interface CssMinifyOptions {
  sourceMap?: boolean;
  inlineSourceContent?: boolean;
}

export function applyExtensionsConfig(
  opt: Required<TransformConfig>,
): Required<TransformConfig> {
  // set lockCoreVersion config
  const config = {
    ...opt,
    extensions: {
      ...opt.extensions,
      lockCorejsVersion: {
        ...(opt.extensions?.lockCorejsVersion || {}),
        corejs: CORE_JS_DIR_PATH,
        swcHelpers: SWC_HELPERS_DIR_PATH,
      },
    },
  };

  return config;
}

export function defineConfig(options: TransformConfig): TransformConfig {
  return options;
}
