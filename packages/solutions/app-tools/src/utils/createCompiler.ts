import { BuilderTarget } from '@modern-js/builder';
import type webpack from '@modern-js/builder-webpack-provider/webpack';
import type { IAppContext, NormalizedConfig, PluginAPI } from '@modern-js/core';
import {
  chalk,
  logger,
  formatWebpackMessages,
  clearConsole,
} from '@modern-js/utils';
import type { AppHooks } from '../hooks';
import { printInstructions } from './printInstructions';
import createBuilder from './createBuilder';

export type CreateCompilerOptions = {
  target?: BuilderTarget | BuilderTarget[];
  appContext: IAppContext;
  userConfig: NormalizedConfig;
};

export const createDevCompiler = async ({
  api,
  target,
  userConfig,
  appContext,
}: {
  api: PluginAPI<AppHooks>;
} & CreateCompilerOptions): Promise<
  webpack.Compiler | webpack.MultiCompiler
> => {
  try {
    const hookRunners = api.useHookRunners();

    await hookRunners.beforeCreateCompiler();

    const builder = await createBuilder({
      target,
      normalizedConfig: userConfig,
      appContext,
    });
    const compiler = await builder.createCompiler({ watch: undefined });

    await hookRunners.afterCreateCompiler({ compiler });

    let isFirstCompile = true;

    compiler.hooks.invalid.tap('invalid', () => {
      clearConsole();
      logger.log('Compiling...');
    });

    compiler.hooks.done.tap('done', async (stats: any) => {
      const statsData = stats.toJson({
        preset: 'errors-warnings',
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

export const createBuildCompiler = async ({
  target,
  appContext,
  userConfig,
}: CreateCompilerOptions): Promise<
  webpack.Compiler | webpack.MultiCompiler
> => {
  const builder = await createBuilder({
    target,
    normalizedConfig: userConfig,
    appContext,
  });
  return builder.createCompiler({ watch: undefined });
};
