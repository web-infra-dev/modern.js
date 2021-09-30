import type { NormalizedConfig } from '@modern-js/core';
import type { Options } from 'sass';
import { applyOptionsChain } from '@modern-js/utils';

export interface SassOption {
  sassOptions?: Options;
  sourceMap?: boolean;
  implementation?: string;
  additionalData?: string | ((content: string, filename: string) => string);
}

export const getSassConfig = (
  config: NormalizedConfig,
  options: SassOption = {},
) =>
  applyOptionsChain(
    {
      sourceMap: false,
      ...options,
    },
    (config.tools as any).sass,
  );
