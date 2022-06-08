import { webpack, Configuration } from '@modern-js/webpack';
import type { IAppContext, NormalizedConfig, PluginAPI } from '@modern-js/core';
import {
  chalk,
  logger,
  formatWebpackMessages,
  clearConsole,
} from '@modern-js/utils';
import { printInstructions } from './printInstructions';

export const createCompiler = async ({
  api,
  webpackConfigs,
  // TODO: params
  userConfig,
  appContext,
}: {
  api: PluginAPI;
  webpackConfigs: Configuration[];
  userConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  try {
    const hookRunners = api.useHookRunners();
    await hookRunners.beforeCreateCompiler({ webpackConfigs });
    const compiler = webpack(webpackConfigs);

    await hookRunners.afterCreateCompiler({ compiler });

    let isFirstCompile = true;

    compiler.hooks.invalid.tap('invalid', () => {
      clearConsole();
      logger.log('Compiling...');
    });

    compiler.hooks.done.tap('done', async (stats: any) => {
      const statsData = stats.toJson({
        all: false,
        warnings: true,
        errors: true,
        timings: true,
      });

      const { errors, warnings } = formatWebpackMessages(statsData);

      if (errors.length) {
        logger.log(chalk.red(`Failed to compile.\n`));
        logger.log(errors.join('\n\n'));
        logger.log();
      } else if (process.stdout.isTTY || isFirstCompile) {
        await hookRunners.afterDev();
        if (warnings.length) {
          logger.log(chalk.yellow(`Compiled with warnings.\n`));
          logger.log(warnings.join('\n\n'));
          logger.log();
        }
        await printInstructions(hookRunners, appContext, userConfig);
      }
      isFirstCompile = false;
    });

    return compiler;
  } catch (err) {
    logger.log(chalk.red(`Failed to compile.`));
    logger.log();
    logger.log(err as any);
    // FIXME: 这里最好抛出异常，执行 process.exit 的地方尽可能少或者控制在几个统一的地方比较合适
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
