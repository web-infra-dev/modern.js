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
const NODE_MODULES_LESS_REGEX = /node_modules[\\/].+\.less$/;

export default (): CliPlugin => ({
  name: '@modern-js/plugin-less',

  setup: api => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-less'];
    },
    config() {
      return {
        tools: {
          webpackChain: (chain, { CHAIN_ID }) => {
            const { RULE, ONE_OF } = CHAIN_ID;
            const options = api.useResolvedConfigContext();

            const {
              output: { disableCssModuleExtension },
            } = options;

            const lessOptions = cssConfig.getLessConfig(options);

            const loaders = chain.module.rule(RULE.LOADERS);

            loaders
              .oneOf(ONE_OF.LESS)
              .before(ONE_OF.FALLBACK)
              // when disableCssModuleExtension is true,
              // only transfer *.global.less and node_modules/**/*.less
              .test(
                disableCssModuleExtension
                  ? [GLOBAL_LESS_REGEX, NODE_MODULES_LESS_REGEX]
                  : LESS_REGEX,
              )
              .merge({
                exclude: LESS_MODULE_REGEX,
                use: [
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error webpack-chain missing type
                  ...loaders.oneOf(ONE_OF.CSS).toConfig().use,
                  {
                    loader: require.resolve('less-loader'),
                    options: lessOptions,
                  },
                ],
              });

            loaders
              .oneOf(ONE_OF.LESS_MODULES)
              .before(ONE_OF.FALLBACK)
              .merge({
                test: disableCssModuleExtension
                  ? LESS_REGEX
                  : LESS_MODULE_REGEX,
                exclude: [/node_modules/, GLOBAL_LESS_REGEX],
                use: [
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error webpack-chain missing type
                  ...loaders.oneOf(ONE_OF.CSS_MODULES).toConfig().use,
                  {
                    loader: require.resolve('less-loader'),
                    options: lessOptions,
                  },
                ],
              });

            loaders
              .oneOf(ONE_OF.FALLBACK)
              .exclude.add(LESS_REGEX)
              .add(LESS_MODULE_REGEX);
          },
        },
      };
    },
    moduleLessConfig: mlc.moduleLessConfig as any,
  }),
});
