import type {
  PartialBaseBuildConfig,
  PartialBuildConfig,
} from '../types/config';

export const validPartialBuildConfig = (config: PartialBuildConfig) => {
  if (Array.isArray(config)) {
    for (const c of config) {
      validBuildTypeAndFormat(c);
    }
  } else {
    validBuildTypeAndFormat(config);
  }
};

export const validBuildTypeAndFormat = (config: PartialBaseBuildConfig) => {
  if (
    config.buildType === 'bundleless' &&
    ['iife', 'umd'].includes(config.format ?? '')
  ) {
    throw new Error(
      `when buildType is bundleless, the format must be equal to one of the allowed values: (cjs, esm)`,
    );
  }
};
