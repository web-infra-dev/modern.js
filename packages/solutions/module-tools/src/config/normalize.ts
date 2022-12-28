import path from 'path';
import type { PluginAPI } from '@modern-js/core';
import type {
  ModuleUserConfig,
  BaseBuildConfig,
  BuildPreset,
  PartialBuildConfig,
  PartialBaseBuildConfig,
  ModuleContext,
  BuildCommandOptions,
  ModuleTools,
} from '../types';

export const transformBuildPresetToBaseConfigs = async (
  options: {
    context: ModuleContext;
    buildCmdOptions: BuildCommandOptions;
  },
  preset?: BuildPreset,
): Promise<BaseBuildConfig[]> => {
  const { BuildInPreset, presetList } = await import(
    '../constants/build-presets'
  );
  const { addInputToPreset } = await import('../utils/input');

  if (typeof preset === 'function') {
    const partialBuildConfig = await preset({ preset: BuildInPreset });

    if (!partialBuildConfig) {
      throw new Error(
        'The `buildPreset` function does not allow no return value',
      );
    }

    return transformBuildConfigToBaseConfigs(partialBuildConfig, options);
  }

  const inPresetList = (p: string): p is keyof typeof presetList =>
    p in presetList;

  if (preset && inPresetList(preset)) {
    return transformBuildConfigToBaseConfigs(
      await addInputToPreset(presetList[preset], options.context),
      options,
    );
  }

  // buildConfig and buildPreset is undefined
  return transformBuildConfigToBaseConfigs(
    await addInputToPreset(presetList['npm-library'], options.context),
    options,
  );
};

export const transformBuildConfigToBaseConfigs = async (
  config: PartialBuildConfig,
  options: {
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
): Promise<BaseBuildConfig[]> => {
  const { validPartialBuildConfig } = await import('../utils/config');
  validPartialBuildConfig(config);
  const { buildCmdOptions } = options;
  const { ensureArray } = await import('@modern-js/utils');
  const { assignTsConfigPath } = await import('../utils/dts');
  const partialConfigs = ensureArray(config);
  const configs = await Promise.all(
    partialConfigs.map(async config => {
      let newConfig = await requiredBuildConfig(config, options.context);
      newConfig = await assignTsConfigPath(newConfig, buildCmdOptions);
      newConfig = await transformToAbsPath(newConfig, options);
      return newConfig;
    }),
  );
  return configs;
};

export const requiredBuildConfig = async (
  partialBuildConfig: PartialBaseBuildConfig,
  context: ModuleContext,
): Promise<BaseBuildConfig> => {
  const { mergeDefaultBaseConfig } = await import('../utils/config');
  const mergedConfig = await mergeDefaultBaseConfig(
    partialBuildConfig,
    context,
  );
  return mergedConfig;
};

export const transformToAbsPath = async (
  baseConfig: BaseBuildConfig,
  options: { context: ModuleContext; buildCmdOptions: BuildCommandOptions },
) => {
  const { slash } = await import('@modern-js/utils');
  const newConfig = baseConfig;
  const { normalizeInput } = await import('../utils/input');
  const { context } = options;

  newConfig.outDir = path.isAbsolute(newConfig.outDir)
    ? newConfig.outDir
    : path.join(context.appDirectory, newConfig.outDir);

  newConfig.sourceDir = slash(
    path.resolve(context.appDirectory, baseConfig.sourceDir),
  );
  newConfig.input = await normalizeInput(newConfig, {
    appDirectory: context.appDirectory,
  });

  // dts path
  if (newConfig.dts) {
    newConfig.dts.distPath = path.join(
      newConfig.outDir,
      newConfig.dts.distPath,
    );
    newConfig.dts.tsconfigPath = path.join(
      context.appDirectory,
      newConfig.dts.tsconfigPath,
    );
  }

  // Maybe need transform 'config.copy'

  return newConfig;
};

export const checkConfig = async (config: ModuleUserConfig) => {
  const { buildConfig, buildPreset } = config;
  if (buildConfig && buildPreset) {
    const { logger } = await import('@modern-js/utils');
    logger.warn(
      `因为同时出现 'buildConfig' 和 'buildPreset' 配置，因此仅 'buildConfig' 配置生效`,
    );
  }
};

export const normalizeBuildConfig = async (
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
  buildCmdOptions: BuildCommandOptions,
): Promise<BaseBuildConfig[]> => {
  const config = api.useResolvedConfigContext() as unknown as ModuleUserConfig;
  const { buildConfig, buildPreset } = config;

  await checkConfig(config);

  let baseConfigs: BaseBuildConfig[];

  // buildConfig High priority
  if (buildConfig) {
    baseConfigs = await transformBuildConfigToBaseConfigs(buildConfig, {
      buildCmdOptions,
      context,
    });
  } else {
    baseConfigs = await transformBuildPresetToBaseConfigs(
      {
        context,
        buildCmdOptions,
      },
      buildPreset,
    );
  }

  return baseConfigs;
};
