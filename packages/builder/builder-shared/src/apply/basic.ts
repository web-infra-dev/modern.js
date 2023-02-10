import { SharedBuilderPluginAPI } from '../types';

export function applyBuilderBasicPlugin(api: SharedBuilderPluginAPI) {
  api.modifyBundlerChain((chain, { isProd }) => {
    // The base directory for resolving entry points and loaders from the configuration.
    chain.context(api.context.rootPath);

    chain.mode(isProd ? 'production' : 'development');

    chain.merge({
      infrastructureLogging: {
        // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
        level: 'error',
      },
    });
  });
}
