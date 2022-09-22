import PxToRemPlugin from 'postcss-pxtorem';
import type { BuilderPlugin } from '../types';
import { mergeBuilderConfig } from '../shared/utils';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { AutoSetRootFontSizePlugin } from '../webpackPlugins/AutoSetRootFontSizePlugin';

const defaultOptions = {
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

    api.modifyBuilderConfig(config => {
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

      chain
        .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
        .use(AutoSetRootFontSizePlugin, [userOptions, entries]);
    });
  },
});
