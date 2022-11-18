import { PluginAPI } from '@modern-js/core';
import { ModuleContext } from '../types/context';
import { BuildCommandOptions, ModuleToolsHooks } from '../types';

export const buildPlatform = async (
  options: BuildCommandOptions,
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
) => {
  const { chalk } = await import('@modern-js/utils');
  const { blue, gray } = await import('../constants/colors');
  const runner = api.useHookRunners();
  const platformBuilders = await runner.registerBuildPlatform();
  if (platformBuilders.length === 0) {
    if (options.platform === true) {
      console.info('No executable platform build tasks');
    } else if (
      Array.isArray(options.platform) &&
      options.platform.length === 1
    ) {
      console.info(`没有发现 platform 为 "${options.platform[0]}" 的构建任务`);
    } else if (Array.isArray(options.platform) && options.platform.length > 1) {
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

      console.info(
        chalk.underline.rgb(...blue)(
          `Running [${currentPlatform}] build task:`,
        ),
      );

      await runner.buildPlatform({ platform: currentPlatform });
      await platformBuilder.build(currentPlatform, {
        isTsProject: context.isTsProject,
      });

      console.info(chalk.rgb(...gray)(`Done for [${currentPlatform}] task`));
    }
  } else if (Array.isArray(options.platform) && options.platform.length === 1) {
    const targetPlatform = options.platform[0];
    const selectPlatformBuilder = platformBuilders.find(builder => {
      if (Array.isArray(builder.platform)) {
        return builder.platform.includes(targetPlatform);
      }

      return builder.platform === targetPlatform;
    });

    if (!selectPlatformBuilder) {
      console.info(`指定的 "${targetPlatform}" 构建不存在`);
      return;
    }

    console.info(
      chalk.underline.rgb(...blue)(`Running [${targetPlatform}] build task:`),
    );

    await runner.buildPlatform({ platform: targetPlatform });
    await selectPlatformBuilder.build(targetPlatform, {
      isTsProject: context.isTsProject,
    });

    console.info(chalk.rgb(...gray)(`Done for [${targetPlatform}] task`));
  } else if (Array.isArray(options.platform) && options.platform.length > 1) {
    for (const platform of options.platform) {
      const foundBuilder = platformBuilders.find(builder => {
        if (Array.isArray(builder.platform)) {
          return builder.platform.includes(platform);
        }

        return builder.platform === platform;
      });

      if (!foundBuilder) {
        console.info(`跳过 ${platform} 构建, 因为它不存在`);
        continue;
      }

      console.info(
        chalk.underline.rgb(...blue)(`Running [${platform}] build task:`),
      );

      await runner.buildPlatform({ platform });
      await foundBuilder.build(platform, { isTsProject: context.isTsProject });

      console.info(chalk.rgb(...gray)(`Done for [${platform}] task`));
    }
  }

  await runner.afterBuildPlatform();
};
