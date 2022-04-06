import type { NormalizedConfig, SassLoaderOptions } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';

export const getSassConfig = (
  config: NormalizedConfig,
  options: SassLoaderOptions = {},
) =>
  applyOptionsChain(
    {
      sourceMap: false,
      ...options,
    },
    config.tools.sass,
  );
