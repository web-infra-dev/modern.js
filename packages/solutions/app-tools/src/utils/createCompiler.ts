import webpack, { Configuration, StatsCompilation } from 'webpack';
import { IAppContext, NormalizedConfig, mountHook } from '@modern-js/core';
import {
  chalk,
  logger,
  formatWebpackMessages,
  clearConsole,
} from '@modern-js/utils';
import { printInstructions } from './printInstructions';

const prettyTime = (stats: StatsCompilation) =>
  Math.max(...(stats.children?.map(child => child.time || 0) || []));

export const createCompiler = async ({
  webpackConfigs,
  // TODO: params
  userConfig,
  appContext,
}: {
  webpackConfigs: Configuration[];
  userConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  try {
    await (mountHook() as any).beforeCreateCompiler({ webpackConfigs });
    const compiler = webpack(webpackConfigs);

    await (mountHook() as any).afterCreateCompiler({ compiler });

    let isFirstCompile = true;

    compiler.hooks.invalid.tap('invalid', () => {
      clearConsole();
      logger.log('Compiling...');
    });

    compiler.hooks.done.tap('done', async (stats: any) => {
      clearConsole();

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
        await (mountHook() as any).afterDev();
        if (warnings.length) {
          logger.log(chalk.yellow(`Compiled with warnings.\n`));
          logger.log(warnings.join('\n\n'));
          logger.log();
        } else {
          logger.log(
            chalk.green(
              `Compiled successfully in ${prettyTime(statsData)} ms.\n`,
            ),
          );
        }
        await printInstructions(appContext, userConfig);
      }
      // eslint-disable-next-line require-atomic-updates
      isFirstCompile = false;
    });

    return compiler;
  } catch (err) {
    logger.log(chalk.red(`Failed to compile.`));
    logger.log();
    logger.log(err as any);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
