import path from 'path';
import { ensureArray } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';
import { internalPreset, presetList } from '../constants/preset';
import type {
  BaseBuildConfig,
  BuildCommandOptions,
  BuildPreset,
  ModuleContext,
  ModuleLegacyUserConfig,
  ModuleUserConfig,
  PartialBaseBuildConfig,
  PartialBuildConfig,
} from '../types';
import { isLegacyUserConfig, mergeDefaultBaseConfig } from './merge';
import { validPartialBuildConfig } from './valid';

export const presetToConfig = async (preset?: BuildPreset) => {
  if (typeof preset === 'function') {
    const extendPreset = (
      presetName: keyof typeof internalPreset,
      extendConfig: PartialBaseBuildConfig,
    ) => {
      const originalBuildConfig = internalPreset[presetName];
      if (!originalBuildConfig) {
        throw new Error(`**${presetName}** is not internal buildPreset`);
      }
      return originalBuildConfig.map(config => {
        return _.merge(config, extendConfig);
      });
    };

    const partialBuildConfig = await preset({
      preset: internalPreset,
      extendPreset,
    });

    if (!partialBuildConfig) {
      throw new Error(
        'The `buildPreset` function does not allow no return value',
      );
    }

    return partialBuildConfig;
  }

  const inPresetList = (p: string): p is keyof typeof presetList =>
    p in presetList;

  return preset && inPresetList(preset) ? presetList[preset] : undefined;
};

export const mergeConfig = (
  low?: PartialBaseBuildConfig[],
  high = {} as PartialBuildConfig,
): PartialBaseBuildConfig[] => {
  if (!low) {
    return ensureArray(high);
  }
  return Array.isArray(high)
    ? [...low, ...high]
    : low.map(config => {
        return _.merge(config, high);
      });
};

export const normalizeBuildConfig = async (
  resolvedConfig: ModuleUserConfig,
  context: ModuleContext,
  buildCmdOptions: BuildCommandOptions,
): Promise<BaseBuildConfig[]> => {
  let config = resolvedConfig;

  if (isLegacyUserConfig(config as { legacy?: boolean })) {
    const { createUserConfigFromLegacy } = await import(
      './transformLegacyConfig'
    );
    config = await createUserConfigFromLegacy(config as ModuleLegacyUserConfig);
  }

  const { buildConfig, buildPreset } = config;

  const configFromPreset = await presetToConfig(buildPreset);

  const mergedConfig = mergeConfig(configFromPreset, buildConfig ?? {});

  validPartialBuildConfig(mergedConfig, context.appDirectory);

  const normalizedConfig = await Promise.all(
    mergedConfig.map(async config => {
      let newConfig = await mergeDefaultBaseConfig(config, {
        context,
        buildCmdOptions,
      });
      newConfig = await transformToAbsPath(newConfig, {
        context,
        buildCmdOptions,
      });
      return newConfig;
    }),
  );

  return normalizedConfig;
};

export const transformToAbsPath = async (
  baseConfig: BaseBuildConfig,
  options: { context: ModuleContext; buildCmdOptions: BuildCommandOptions },
) => {
  const newConfig = baseConfig;
  const { context } = options;

  newConfig.outDir = path.resolve(context.appDirectory, newConfig.outDir);

  newConfig.sourceDir = path.resolve(
    context.appDirectory,
    baseConfig.sourceDir,
  );

  newConfig.tsconfig = path.resolve(context.appDirectory, newConfig.tsconfig);

  // resolve.tsConfig
  if (newConfig.resolve.tsConfig) {
    newConfig.resolve.tsConfig.configFile = path.resolve(
      context.appDirectory,
      newConfig.resolve.tsConfig.configFile,
    );
  }

  // dts path
  if (newConfig.dts) {
    newConfig.dts.distPath = path.resolve(
      newConfig.outDir,
      newConfig.dts.distPath,
    );
    if (newConfig.dts.tsconfigPath) {
      newConfig.dts.tsconfigPath = path.resolve(
        context.appDirectory,
        newConfig.dts.tsconfigPath,
      );
    }
  }

  return newConfig;
};
