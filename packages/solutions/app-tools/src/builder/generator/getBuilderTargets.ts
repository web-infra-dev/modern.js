import type { RsbuildTarget } from '@rsbuild/shared';
import {
  isProd,
  isServiceWorker,
  isSSR,
  isUseSSRBundle,
} from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';

export function getBuilderTargets(
  normalizedConfig: AppNormalizedConfig<'shared'>,
) {
  const targets: RsbuildTarget[] = ['web'];

  const useNodeTarget = isProd()
    ? isUseSSRBundle(normalizedConfig)
    : isSSR(normalizedConfig);

  if (useNodeTarget) {
    targets.push('node');
  }

  const useWorkerTarget = isServiceWorker(normalizedConfig);

  if (useWorkerTarget) {
    targets.push('service-worker');
  }

  return targets;
}
