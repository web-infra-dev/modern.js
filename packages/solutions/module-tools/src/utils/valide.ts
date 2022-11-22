import { validAlias } from '@modern-js/utils';
import type { CliNormalizedConfig } from '@modern-js/core';

export interface IValideOption {
  modernConfig: CliNormalizedConfig<any>;
  tsconfigPath: string;
}

export const valideBeforeTask = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  modernConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tsconfigPath,
}: IValideOption) => {
  // const modernConfigValidResult = modernConfigValid(modernConfig, {
  //   tsconfigPath,
  // });
  // if (modernConfigValidResult) {
  //   console.error(modernConfigValidResult);
  //   // eslint-disable-next-line no-process-exit
  //   process.exit(0);
  // }
};

export const modernConfigValid = (
  modernConfig: CliNormalizedConfig<any>,
  option: { tsconfigPath: string },
) => {
  const valids = [validAlias];

  for (const validFn of valids) {
    const result = validFn(modernConfig as any, option);
    if (result) {
      return result;
    }
  }

  return null;
};
