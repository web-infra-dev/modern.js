import type { BuilderConfig, BuilderPlugin, WebpackChain } from '../types';

function applyProfile({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
}) {
  const profile = config.performance?.profile;
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
      const config = api.getBuilderConfig();

      applyProfile({ chain, config });
    });
  },
});
