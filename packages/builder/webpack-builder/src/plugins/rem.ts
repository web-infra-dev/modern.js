import type { BuilderPlugin, RemOptions, PxToRemOptions } from '../types';
import { mergeBuilderConfig } from '../shared/utils';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const PluginRem = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-rem',

  setup(api) {
    const { output: { convertToRem } = {} } = api.getBuilderConfig();

    if (!convertToRem) {
      return;
    }

    const userOptions = {
      ...defaultOptions,
      ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
    };

    api.modifyBuilderConfig(async config => {
      const { default: PxToRemPlugin } = (await import(
        '../../compiled/postcss-pxtorem'
      )) as {
        default: (_opts: PxToRemOptions) => any;
      };

      return mergeBuilderConfig(config, {
        tools: {
          postcss(_config, { addPlugins }) {
            addPlugins(
              PxToRemPlugin({
                rootValue: userOptions.rootFontSize,
                unitPrecision: 5,
                propList: ['*'],
                ...(userOptions.pxtorem || {}),
              }),
            );
          },
        },
      });
    });

    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      if (!userOptions.enableRuntime) {
        return;
      }

      const entries = Object.keys(chain.entryPoints.entries() || {});

      const { AutoSetRootFontSizePlugin } = await import(
        '../webpackPlugins/AutoSetRootFontSizePlugin'
      );

      chain
        .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
        .use(AutoSetRootFontSizePlugin, [userOptions, entries]);
    });
  },
});
