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
const msc: typeof import('./module-sass-config') = Import.lazy(
  './module-sass-config',
  require,
);

const SASS_REGEX = /\.s(a|c)ss$/;

const SASS_MODULE_REGEX = /\.module\.s(a|c)ss$/;

export default core.createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-sass'];
    },
    config() {
      return {
        tools: {
          webpack: (config: Configuration, { chain }: { chain: Chain }) => {
            const options = core.useResolvedConfigContext();

            const {
              output: { disableCssModuleExtension },
            } = options;

            const sassOptions = cssConfig.getSassConfig(options);

            const loaders = chain.module.rule('loaders');

            if (!disableCssModuleExtension) {
              loaders
                .oneOf('sass')
                .before('fallback')
                .merge({
                  test: SASS_REGEX,
                  exclude: SASS_MODULE_REGEX,
                  use: [
                    ...(loaders.oneOf('css') as any).toConfig().use,
                    {
                      loader: require.resolve('sass-loader'),

                      options: sassOptions,
                    },
                  ],
                });
            }

            loaders
              .oneOf('sass-modules')
              .before('fallback')
              .merge({
                test: disableCssModuleExtension
                  ? SASS_REGEX
                  : SASS_MODULE_REGEX,
                exclude: [/node_modules/, /\.global\.sass$/],
                use: [
                  ...(loaders.oneOf('css-modules') as any).toConfig().use,
                  {
                    loader: require.resolve('sass-loader'),
                    options: sassOptions,
                  },
                ],
              });

            loaders
              .oneOf('fallback')
              .exclude.add(SASS_REGEX)
              .add(SASS_MODULE_REGEX);
          },
        },
      };
    },
    moduleSassConfig: msc.moduleSassConfig as any,
  }),
  { name: '@modern-js/plugin-sass' },
) as any;
