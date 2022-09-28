import path from 'path';
import { validAlias } from '@modern-js/utils';
import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import type { ModuleToolsHooks } from '../types/hooks';
import type { BuildCommandOptions } from '../types/command';

export interface IValideOption {
  modernConfig: NormalizedConfig;
  tsconfigPath: string;
}

export const valideBeforeTask = (
  api: PluginAPI<ModuleToolsHooks>,
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
