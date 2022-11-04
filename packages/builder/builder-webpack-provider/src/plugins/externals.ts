import { BuilderPlugin } from '../types';

export function PluginExternals(): BuilderPlugin {
  return {
    name: 'builder-plugin-externals',
    setup(api) {
      api.modifyWebpackChain(chain => {
        const externalOptions = api.getNormalizedConfig().output.externals;
        externalOptions && chain.externals(externalOptions);
      });
    },
  };
}
