import { Import, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-sass',

  setup: api => {
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
    const GLOBAL_SASS_REGEX = /\.global\.s(a|c)ss$/;

    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-sass'];
      },
      config() {
        return {
          tools: {
            webpack: (config, { chain }) => {
              const options = api.useResolvedConfigContext();

              const {
                output: { disableCssModuleExtension },
              } = options;

              const sassOptions = cssConfig.getSassConfig(options);

              const loaders = chain.module.rule('loaders');

              loaders
                .oneOf('sass')
                .before('fallback')
                .merge({
                  // when disableCssModuleExtension is true,
                  // only transfer *.global.sa(c)ss in sass-loader
                  test: disableCssModuleExtension
                    ? GLOBAL_SASS_REGEX
                    : SASS_REGEX,
                  exclude: SASS_MODULE_REGEX,
                  use: [
                    ...loaders.oneOf('css').toConfig().use,
                    {
                      loader: require.resolve('sass-loader'),
                      options: sassOptions,
                    },
                  ],
                });

              loaders
                .oneOf('sass-modules')
                .before('fallback')
                .merge({
                  test: disableCssModuleExtension
                    ? SASS_REGEX
                    : SASS_MODULE_REGEX,
                  exclude: [/node_modules/, GLOBAL_SASS_REGEX],
                  use: [
                    ...loaders.oneOf('css-modules').toConfig().use,
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
      moduleSassConfig: msc.moduleSassConfig,
    };
  },
});
