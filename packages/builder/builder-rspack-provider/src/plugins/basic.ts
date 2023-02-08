import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of rspack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      // The base directory for resolving entry points and loaders from the configuration.
      rspackConfig.context = api.context.rootPath;

      rspackConfig.mode = isProd ? 'production' : 'development';

      rspackConfig.infrastructureLogging = {
        // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
        level: 'error',
      };

      // todo: rspack not support configure
      // // if the chunk size exceeds 1MiB, we will throw a warning
      // chain.performance.maxAssetSize(1024 * 1024);
      // chain.performance.maxEntrypointSize(1024 * 1024);

      // // This will be futureDefaults in webpack 6
      // chain.module.parser.merge({
      //   javascript: {
      //     exportsPresence: 'error',
      //   },
      // });
    });
  },
});
