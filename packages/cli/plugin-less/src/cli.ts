import { Import, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

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

const GLOBAL_LESS_REGEX = /\.global\.less$/;

export default (): CliPlugin => ({
  name: '@modern-js/plugin-less',

  setup: api => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-less'];
    },
    config() {
      return {
        tools: {
          webpackChain: chain => {
            const options = api.useResolvedConfigContext();

            const {
              output: { disableCssModuleExtension },
            } = options;

            const lessOptions = cssConfig.getLessConfig(options);

            const loaders = chain.module.rule('loaders');

            loaders
              .oneOf('less')
              .before('fallback')
              .merge({
                // when disableCssModuleExtension is true,
                // only transfer *.global.less in less-loader
                test: disableCssModuleExtension
                  ? GLOBAL_LESS_REGEX
                  : LESS_REGEX,
                exclude: LESS_MODULE_REGEX,
                use: [
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error webpack-chain missing type
                  ...loaders.oneOf('css').toConfig().use,
                  {
                    loader: require.resolve('less-loader'),
                    options: lessOptions,
                  },
                ],
              });

            loaders
              .oneOf('less-modules')
              .before('fallback')
              .merge({
                test: disableCssModuleExtension
                  ? LESS_REGEX
                  : LESS_MODULE_REGEX,
                exclude: [/node_modules/, GLOBAL_LESS_REGEX],
                use: [
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error webpack-chain missing type
                  ...loaders.oneOf('css-modules').toConfig().use,
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
});
