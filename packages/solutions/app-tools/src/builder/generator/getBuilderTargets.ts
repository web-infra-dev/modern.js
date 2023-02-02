import type { BuilderTarget } from '@modern-js/builder-shared';
import { isProd, isSSR, isUseSSRBundle } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';

export function getBuilderTargets(normalizedConfig: AppNormalizedConfig) {
  const targets: BuilderTarget[] = ['web'];

  const useNodeTarget = isProd()
    ? isUseSSRBundle(normalizedConfig)
    : isSSR(normalizedConfig);

  if (useNodeTarget) {
    targets.push('node');
  }

  return targets;
}
