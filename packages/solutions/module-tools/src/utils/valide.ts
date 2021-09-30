import { validAlias } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

export interface IValideOption {
  modernConfig: NormalizedConfig;
  tsconfigPath: string;
}

export const valideBeforeTask = ({
  modernConfig,
  tsconfigPath,
}: IValideOption) => {
  const modernConfigValidResult = modernConfigValid(modernConfig, {
    tsconfigPath,
  });
  if (modernConfigValidResult) {
    console.error(modernConfigValidResult);
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
};

export const modernConfigValid = (
  modernConfig: NormalizedConfig,
  option: { tsconfigPath: string },
) => {
  const valids = [validAlias];

  for (const validFn of valids) {
    const result = validFn(modernConfig, option);
    if (result) {
      return result;
    }
  }

  return null;
};
