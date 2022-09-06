import type { BuilderPlugin } from '../types';
import { SubresourceIntegrityPlugin } from '../../compiled/webpack-subresource-integrity';

export const PluginSubresourceIntegrity = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-subresource-integrity',
  setup(api) {
    const sirOptions = api.getBuilderConfig().security?.sri;
    if (!sirOptions) {
      return;
    }
    api.modifyWebpackChain(chain => {
      chain.output.crossOriginLoading('anonymous');
      chain
        .plugin('subresource-integrity')
        .use(new SubresourceIntegrityPlugin(sirOptions));
    });
  },
});
