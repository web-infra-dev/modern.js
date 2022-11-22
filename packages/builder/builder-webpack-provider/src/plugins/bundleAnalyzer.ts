import { BuilderPlugin } from '../types';

export function PluginBundleAnalyzer(): BuilderPlugin {
  return {
    name: 'builder-plugin-bundle-analyzer',
    setup(api) {
      api.modifyWebpackChain(
        async (chain, { CHAIN_ID, getCompiledPath, target }) => {
          const config = api.getNormalizedConfig();
          // There are two ways to open the bundle analyzer:
          // 1. Set environment variable `BUNDLE_ANALYZE`
          // 2. Set performance.bundleAnalyze config
          if (
            !process.env.BUNDLE_ANALYZE &&
            !config.performance.bundleAnalyze
          ) {
            return;
          }
          const { default: BundleAnalyzer } = await import(
            getCompiledPath('webpack-bundle-analyzer')
          );
          chain
            .plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER)
            .use(BundleAnalyzer.BundleAnalyzerPlugin, [
              {
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: `report-${target}.html`,
                ...(config.performance.bundleAnalyze || {}),
              },
            ]);
        },
      );
    },
  };
}
