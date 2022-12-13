import _ from '@modern-js/utils/lodash';
import {
  EnvConfig,
  Extensions,
  JsMinifyOptions,
  ReactConfig,
  TransformConfig,
} from '@modern-js/swc-plugins';

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

  extensions?: Extensions;
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
