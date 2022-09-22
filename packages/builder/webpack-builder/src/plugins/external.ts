import { BuilderPlugin } from '../types/plugin';

export function PluginExternal(): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-external',
    setup(api) {
      api.modifyWebpackChain(chain => {
        const externalOptions = api.getBuilderConfig().output?.external;
        externalOptions && chain.externals(externalOptions);
      });
    },
  };
}
