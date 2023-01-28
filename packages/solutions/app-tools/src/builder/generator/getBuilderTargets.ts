import type { BuilderTarget } from '@modern-js/builder-shared';
import { isProd, isSSR, isUseSSRBundle, isWorker } from '@modern-js/utils';
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

  const useWorkerTarget = isProd() ? isWorker(normalizedConfig) : false;

  if (useWorkerTarget) {
    targets.push('web-worker');
  }

  return targets;
}
