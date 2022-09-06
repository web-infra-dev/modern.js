import type { BuilderPlugin } from '../types';
import { SubresourceIntegrityPlugin } from '../../compiled/webpack-subresource-integrity';

export const PluginSRI = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-sri',
  setup(api) {
    const subresourceIntegrityOptions = api.getBuilderConfig().security?.sri;
    if (!subresourceIntegrityOptions) {
      return;
    }
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      chain.output.crossOriginLoading('anonymous');
      chain
        .plugin(CHAIN_ID.PLUGIN.SUBRESOURCE_INTEGRITY)
        .use(SubresourceIntegrityPlugin, [
          typeof subresourceIntegrityOptions === 'object'
            ? subresourceIntegrityOptions
            : undefined,
        ]);
    });
  },
});
