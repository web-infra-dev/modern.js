import { PluginAPI } from '@modern-js/core';
import { ModuleContext } from '../types/context';
import { BuildCommandOptions, ModuleToolsHooks } from '../types';

export const buildPlatform = async (
  options: BuildCommandOptions,
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
) => {
  const runner = api.useHookRunners();
  const platformBuilders = await runner.registerBuildPlatform();
  if (platformBuilders.length === 0) {
    if (options.platform === true) {
      console.info('没有其他构建任务');
    } else if (typeof options.platform === 'string') {
      console.info(`没有发现 platform 名字为 ${options.platform} 的构建任务`);
    } else if (Array.isArray(options.platform)) {
      console.info(
        `没有发现 platform 为 ${options.platform.join(',')} 的构建任务`,
      );
    } else {
      console.info('未知的 platform 数据类型');
    }
    return;
  }

  await runner.beforeBuildPlatform(platformBuilders);

  if (options.platform === true) {
    for (const platformBuilder of platformBuilders) {
      const currentPlatform = Array.isArray(platformBuilder.platform)
        ? platformBuilder.platform[0]
        : platformBuilder.platform;

      await runner.buildPlatform({ platform: currentPlatform });
      await platformBuilder.build(currentPlatform, {
        isTsProject: context.isTsProject,
      });
    }
  } else if (typeof options.platform === 'string') {
    const selectPlatformBuilder = platformBuilders.find(builder => {
      if (Array.isArray(builder.platform)) {
        return builder.platform.includes(options.platform as string);
      }

      return builder.platform === (options.platform as string);
    });
    if (!selectPlatformBuilder) {
      console.info(`指定的 ${selectPlatformBuilder} 构建不存在`);
      return;
    }

    await runner.buildPlatform({ platform: options.platform });
    await selectPlatformBuilder.build(options.platform, {
      isTsProject: context.isTsProject,
    });
  } else if (Array.isArray(options.platform)) {
    for (const platform of options.platform) {
      const foundBuilder = platformBuilders.find(builder => {
        if (Array.isArray(builder.platform)) {
          return builder.platform.includes(platform);
        }

        return builder.platform === platform;
      });

      if (!foundBuilder) {
        console.info(`跳过 ${foundBuilder} 构建, 因为它不存在`);
        continue;
      }
      await runner.buildPlatform({ platform });
      await foundBuilder.build(platform, { isTsProject: context.isTsProject });
    }
  }

  await runner.afterBuildPlatform();
};
