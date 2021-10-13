import { Import, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { Configuration } from 'webpack';
import type Chain from 'webpack-chain';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const cssConfig: typeof import('@modern-js/css-config') = Import.lazy(
  '@modern-js/css-config',
  require,
);
const mlc: typeof import('./module-less-config') = Import.lazy(
  './module-less-config',
  require,
);

const LESS_REGEX = /\.less$/;

const LESS_MODULE_REGEX = /\.module\.less$/;

export default core.createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-less'];
    },
    config() {
      return {
        tools: {
          webpack: (config: Configuration, { chain }: { chain: Chain }) => {
            const options = core.useResolvedConfigContext();

            const {
              output: { disableCssModuleExtension },
            } = options;

            const lessOptions = cssConfig.getLessConfig(options);

            const loaders = chain.module.rule('loaders');

            if (!disableCssModuleExtension) {
              loaders
                .oneOf('less')
                .before('fallback')
                .merge({
                  test: LESS_REGEX,
                  exclude: LESS_MODULE_REGEX,
                  use: [
                    ...(loaders.oneOf('css') as any).toConfig().use,
                    {
                      loader: require.resolve('less-loader'),
                      options: lessOptions,
                    },
                  ],
                });
            }

            loaders
              .oneOf('less-modules')
              .before('fallback')
              .merge({
                test: disableCssModuleExtension
                  ? LESS_REGEX
                  : LESS_MODULE_REGEX,
                exclude: [/node_modules/, /\.global\.less$/],
                use: [
                  ...(loaders.oneOf('css-modules') as any).toConfig().use,
                  {
                    loader: require.resolve('less-loader'),
                    options: lessOptions,
                  },
                ],
              });

            loaders
              .oneOf('fallback')
              .exclude.add(LESS_REGEX)
              .add(LESS_MODULE_REGEX);
          },
        },
      };
    },
    moduleLessConfig: mlc.moduleLessConfig as any,
  }),
  { name: '@modern-js/plugin-less' },
) as any;
