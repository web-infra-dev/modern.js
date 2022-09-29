import { BuilderPlugin } from '../types/plugin';

export function PluginExternals(): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-externals',
    setup(api) {
      api.modifyWebpackChain(chain => {
        const externalOptions = api.getNormalizedConfig().output.externals;
        externalOptions && chain.externals(externalOptions);
      });
    },
  };
}
