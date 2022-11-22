import path from 'path';
import { validAlias } from '@modern-js/utils';
import type { CliNormalizedConfig, PluginAPI } from '@modern-js/core';
import type { ModuleTools } from '../types';
import type { BuildCommandOptions } from '../types/command';

export interface IValideOption {
  modernConfig: CliNormalizedConfig;
  tsconfigPath: string;
}

export const valideBeforeTask = (
  api: PluginAPI<ModuleTools>,
  options: BuildCommandOptions,
) => {
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory } = api.useAppContext();
  const tsconfigPath = path.join(
    appDirectory,
    options.tsconfig ?? 'tsconfig.json',
  );
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
  modernConfig: CliNormalizedConfig<ModuleTools>,
  option: { tsconfigPath: string },
) => {
  const valids = [validAlias];

  for (const validFn of valids) {
    // FIXME: the module-tools userConfig has not source item.
    const result = validFn(
      modernConfig as unknown as {
        source: {
          alias?: any;
        };
      },
      option,
    );
    if (result) {
      return result;
    }
  }

  return null;
};
