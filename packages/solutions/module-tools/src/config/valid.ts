import path from 'path';
import { fs } from '@modern-js/utils';
import type { PartialBuildConfig, PartialBaseBuildConfig } from '../types';

export const validPartialBuildConfig = (
  config: PartialBuildConfig,
  appDirectory: string,
) => {
  if (Array.isArray(config)) {
    for (const c of config) {
      validBuildConfig(c, appDirectory);
    }
  } else {
    validBuildConfig(config, appDirectory);
  }
};

export const validBuildConfig = (
  config: PartialBaseBuildConfig,
  appDirectory: string,
) => {
  // valid format
  if (
    config.buildType === 'bundleless' &&
    ['iife', 'umd'].includes(config.format ?? '')
  ) {
    throw new Error(
      `when buildType is bundleless, the format must be equal to one of the allowed values: (cjs, esm)`,
    );
  }

  // valid tsconfigPath
  if (
    config.tsconfig &&
    !fs.existsSync(path.resolve(appDirectory, config.tsconfig))
  ) {
    throw new Error(`${config.tsconfig} does not exist in your project`);
  }
};
