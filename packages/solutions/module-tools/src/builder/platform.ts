import { PluginAPI } from '@modern-js/core';
import { chalk, logger } from '@modern-js/utils';
import { ModuleContext } from '../types/context';
import { BuildCommandOptions, ModuleTools } from '../types';
import { blue, gray } from '../constants/color';

export const buildPlatform = async (
  options: BuildCommandOptions,
  api: PluginAPI<ModuleTools>,
  context: ModuleContext,
) => {
  const runner = api.useHookRunners();
  const platformBuilders = await runner.registerBuildPlatform();
  if (platformBuilders.length === 0) {
    if (options.platform === true) {
      logger.info('No executable platform build tasks');
    } else if (
      Array.isArray(options.platform) &&
      options.platform.length === 1
    ) {
      logger.info(
        `No build tasks with platform "${options.platform[0]}" found`,
      );
    } else if (Array.isArray(options.platform) && options.platform.length > 1) {
      logger.info(
        `No build tasks with platform ${options.platform.join(',')} found`,
      );
    } else {
      logger.info('Unknown platform', JSON.stringify(options.platform));
    }

    return;
  }

  await runner.beforeBuildPlatform(platformBuilders);
  let errorMsg: string | Error | null = null;
  try {
    if (options.platform === true) {
      for (const platformBuilder of platformBuilders) {
        const currentPlatform = Array.isArray(platformBuilder.platform)
          ? platformBuilder.platform[0]
          : platformBuilder.platform;

        logger.info(
          chalk.underline.rgb(...blue)(
            `Running [${currentPlatform}] build task:`,
          ),
        );

        await runner.buildPlatform({ platform: currentPlatform });
        await platformBuilder.build(currentPlatform, {
          isTsProject: context.isTsProject,
        });

        logger.info(chalk.rgb(...gray)(`Done for [${currentPlatform}] task`));
      }
    } else if (
      Array.isArray(options.platform) &&
      options.platform.length === 1
    ) {
      const targetPlatform = options.platform[0];
      const selectPlatformBuilder = platformBuilders.find(builder => {
        if (Array.isArray(builder.platform)) {
          return builder.platform.includes(targetPlatform);
        }

        return builder.platform === targetPlatform;
      });

      if (!selectPlatformBuilder) {
        logger.info(`The specified "${targetPlatform}" build does not exist`);
        return;
      }

      logger.info(
        chalk.underline.rgb(...blue)(`Running [${targetPlatform}] build task:`),
      );

      await runner.buildPlatform({ platform: targetPlatform });
      await selectPlatformBuilder.build(targetPlatform, {
        isTsProject: context.isTsProject,
      });

      logger.info(chalk.rgb(...gray)(`Done for [${targetPlatform}] task`));
    } else if (Array.isArray(options.platform) && options.platform.length > 1) {
      for (const platform of options.platform) {
        const foundBuilder = platformBuilders.find(builder => {
          if (Array.isArray(builder.platform)) {
            return builder.platform.includes(platform);
          }

          return builder.platform === platform;
        });

        if (!foundBuilder) {
          logger.info(`skip ${platform} build, because it does not exist`);
          continue;
        }

        logger.info(
          chalk.underline.rgb(...blue)(`Running [${platform}] build task:`),
        );

        await runner.buildPlatform({ platform });
        await foundBuilder.build(platform, {
          isTsProject: context.isTsProject,
        });

        logger.info(chalk.rgb(...gray)(`Done for [${platform}] task`));
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      errorMsg = e;
    } else {
      errorMsg = String(e);
    }
  }

  await runner.afterBuildPlatform({
    status: errorMsg === null ? 'success' : 'fail',
    message: errorMsg,
  });
};
