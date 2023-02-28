import { ModifyChainUtils, SharedNormalizedConfig } from '../types';

export function isUsingHMR(
  config: SharedNormalizedConfig,
  { isProd, target }: ModifyChainUtils,
) {
  return (
    !isProd &&
    target !== 'node' &&
    target !== 'web-worker' &&
    target !== 'service-worker' &&
    config.dev.hmr
  );
}
