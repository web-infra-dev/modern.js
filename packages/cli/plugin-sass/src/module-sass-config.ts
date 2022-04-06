import { getSassConfig } from '@modern-js/css-config';
import type { NormalizedConfig } from '@modern-js/core';
import { SassOptions as ResolvedSassOption } from '@modern-js/style-compiler';

export const moduleSassConfig = ({
  modernConfig,
}: {
  modernConfig: NormalizedConfig;
}): ResolvedSassOption<'sync'> => {
  const sassConfig = getSassConfig(modernConfig);
  return {
    ...(sassConfig.sassOptions || { file: '' }),
    sourceMap: sassConfig.sourceMap,
  };
};
