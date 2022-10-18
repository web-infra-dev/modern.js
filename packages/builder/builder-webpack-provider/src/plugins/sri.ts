import type { BuilderPlugin } from '../types';
import { SubresourceIntegrityPlugin } from '../../compiled/webpack-subresource-integrity';

export const PluginSRI = (): BuilderPlugin => ({
  name: 'builder-plugin-sri',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      const subresourceIntegrityOptions =
        api.getNormalizedConfig().security.sri;
      if (!subresourceIntegrityOptions) {
        return;
      }

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
