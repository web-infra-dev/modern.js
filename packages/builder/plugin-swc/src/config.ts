import _ from '@modern-js/utils/lodash';
import { TransformConfig } from '@modern-js/swc-plugins';

export type { TransformConfig } from '@modern-js/swc-plugins';

export type PartialRecursive<O> = O extends Record<any, any>
  ? O extends any[]
    ? O
    : { [k in keyof O]?: PartialRecursive<O[k]> }
  : O;

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
      targets: '',
      mode: 'usage',
    },
    test: '',
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
