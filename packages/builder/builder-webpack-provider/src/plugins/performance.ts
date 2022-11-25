import type { BuilderPlugin, NormalizedConfig, WebpackChain } from '../types';

function applyProfile({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
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
export const PluginPerformance = (): BuilderPlugin => ({
  name: 'builder-plugin-performance',

  setup(api) {
    api.modifyWebpackChain(chain => {
      const config = api.getNormalizedConfig();

      applyProfile({ chain, config });
    });
  },
});
