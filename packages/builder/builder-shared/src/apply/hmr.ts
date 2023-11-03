import { ModifyChainUtils, SharedNormalizedConfig } from '../types';

export function isUsingHMR(
  config: SharedNormalizedConfig,
  { isProd, target }: Pick<ModifyChainUtils, 'isProd' | 'target'>,
) {
  return (
    !isProd &&
    target !== 'node' &&
    target !== 'web-worker' &&
    target !== 'service-worker' &&
    config.dev.hmr
  );
}
