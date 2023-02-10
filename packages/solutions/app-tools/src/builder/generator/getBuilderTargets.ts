import type { BuilderTarget } from '@modern-js/builder-shared';
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
  const targets: BuilderTarget[] = ['web'];

  const useNodeTarget = isProd()
    ? isUseSSRBundle(normalizedConfig)
    : isSSR(normalizedConfig);

  if (useNodeTarget) {
    targets.push('node');
  }

  const useWorkerTarget = isProd() ? isServiceWorker(normalizedConfig) : false;

  if (useWorkerTarget) {
    targets.push('service-worker');
  }

  return targets;
}
