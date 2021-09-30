import { NormalizedConfig } from '@modern-js/core';
import { getSassConfig, SassOption } from '@modern-js/css-config';
import { SassOptions as ResolvedSassOption } from '@modern-js/style-compiler';

export const moduleSassConfig = ({
  modernConfig,
}: {
  modernConfig: NormalizedConfig;
}): ResolvedSassOption => {
  const sassConfig = getSassConfig(modernConfig) as SassOption;
  return {
    ...(sassConfig.sassOptions || {}),
    sourceMap: sassConfig.sourceMap,
  };
};
