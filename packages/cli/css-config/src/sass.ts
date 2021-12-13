import type { NormalizedConfig } from '@modern-js/core';
import type { LegacyFileOptions } from 'sass';
import { applyOptionsChain } from '@modern-js/utils';

export interface SassOption {
  sassOptions?: LegacyFileOptions<'sync'>;
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
