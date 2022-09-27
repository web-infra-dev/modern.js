import type { BuilderPlugin, RemOptions, PxToRemOptions } from '../types';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const PluginRem = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-rem',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { output: { convertToRem } = {} } = api.getBuilderConfig();

      if (!convertToRem) {
        return;
      }

      const userOptions = {
        ...defaultOptions,
        ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
      };

      // handle css
      const { default: PxToRemPlugin } = (await import(
        '../../compiled/postcss-pxtorem'
      )) as {
        default: (_opts: PxToRemOptions) => any;
      };

      [CHAIN_ID.RULE.CSS, CHAIN_ID.RULE.LESS, CHAIN_ID.RULE.SASS].forEach(
        name => {
          chain.module.rules.has(name) &&
            chain.module
              .rule(name)
              .use(CHAIN_ID.USE.POSTCSS)
              .tap((options = {}) => ({
                ...options,
                postcssOptions: {
                  ...(options.postcssOptions || {}),
                  plugins: [
                    ...(options.postcssOptions?.plugins || []),
                    PxToRemPlugin({
                      rootValue: userOptions.rootFontSize,
                      unitPrecision: 5,
                      propList: ['*'],
                      ...(userOptions.pxtorem || {}),
                    }),
                  ],
                },
              }));
        },
      );

      // handle runtime (html)
      if (!userOptions.enableRuntime) {
        return;
      }

      const { AutoSetRootFontSizePlugin } = await import(
        '../webpackPlugins/AutoSetRootFontSizePlugin'
      );

      const entries = Object.keys(chain.entryPoints.entries() || {});

      chain
        .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
        .use(AutoSetRootFontSizePlugin, [userOptions, entries]);
    });
  },
});
