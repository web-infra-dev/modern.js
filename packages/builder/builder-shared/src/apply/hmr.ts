import { BuilderTarget, SharedNormalizedConfig } from '../types';

export function isUsingHMR(
  config: SharedNormalizedConfig,
  isProd: boolean,
  target: BuilderTarget,
) {
  return (
    !isProd &&
    target !== 'node' &&
    target !== 'web-worker' &&
    target !== 'service-worker' &&
    config.dev.hmr
  );
}
