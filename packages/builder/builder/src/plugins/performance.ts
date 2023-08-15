import type {
  DefaultBuilderPlugin,
  BundlerChain,
  SharedNormalizedConfig,
} from '@modern-js/builder-shared';

function applyProfile({
  chain,
  config,
}: {
  chain: BundlerChain;
  config: SharedNormalizedConfig;
}) {
  const { profile } = config.performance;
  if (!profile) {
    return;
  }

  chain.profile(profile);
}

/**
 * Apply some configs of builder performance
 */
export const builderPluginPerformance = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-performance',

  setup(api) {
    api.modifyBuilderConfig(builderConfig => {
      if (builderConfig.performance?.profile) {
        // generate stats.json
        if (!builderConfig.performance?.bundleAnalyze) {
          builderConfig.performance ??= {};
          builderConfig.performance.bundleAnalyze = {
            analyzerMode: 'disabled',
            generateStatsFile: true,
          };
        } else {
          builderConfig.performance.bundleAnalyze = {
            generateStatsFile: true,
            ...(builderConfig.performance.bundleAnalyze || {}),
          };
        }
      }
    });
    api.modifyBundlerChain(chain => {
      const config = api.getNormalizedConfig();

      applyProfile({ chain, config });
    });
  },
});
