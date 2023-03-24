import _ from '@modern-js/utils/lodash';
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

/// default swc configuration
function getDefaultSwcConfig(): TransformConfig {
  return {
    cwd: process.cwd(),
    jsc: {
      target: 'es5',
      externalHelpers: true,
      parser: {
        tsx: true,
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      preserveAllComments: true,
    },
    minify: false, // for loader, we don't need to minify, we do minification using plugin
    sourceMaps: true,
    env: {
      targets: '> 0.01%, not dead, not op_mini all',
      mode: 'usage',
    },
    exclude: [],
    inlineSourcesContent: true,
    extensions: {},
  };
}

export function normalizeConfig(
  opt: TransformConfig,
): Required<TransformConfig> {
  // set lockCoreVersion config
  opt.extensions!.lockCorejsVersion ??= {
    corejs: CORE_JS_DIR_PATH,
    swcHelpers: SWC_HELPERS_DIR_PATH,
  };

  // complete default config
  const config: Required<TransformConfig> = _.merge(
    getDefaultSwcConfig(),
    opt,
  ) as unknown as Required<TransformConfig>;

  return config;
}

export function defineConfig(options: TransformConfig): TransformConfig {
  return options;
}
