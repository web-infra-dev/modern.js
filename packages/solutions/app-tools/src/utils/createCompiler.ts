import type webpack from '@modern-js/builder-webpack-provider/webpack';
import type { PluginAPI } from '@modern-js/core';
import { chalk, logger, clearConsole } from '@modern-js/utils';
import type { AppHooks } from '../hooks';
import createBuilder, { BuilderOptions } from '../builder';
import { printInstructions } from './printInstructions';

export const createDevCompiler = async ({
  api,
  target,
  normalizedConfig,
  appContext,
}: {
  api: PluginAPI<AppHooks>;
} & BuilderOptions): Promise<webpack.Compiler | webpack.MultiCompiler> => {
  try {
    const hookRunners = api.useHookRunners();

    const builder = await createBuilder({
      target,
      normalizedConfig,
      appContext,
      compatPluginConfig: {
        async onDevCompileDone({ isFirstCompile }) {
          if (process.stdout.isTTY || isFirstCompile) {
            hookRunners.afterDev();

            await printInstructions(hookRunners, appContext, normalizedConfig);
          }
        },
        async onBeforeCreateCompiler() {
          // run modernjs framework `beforeCreateCompiler` hook
          await hookRunners.beforeCreateCompiler();
        },
        async onAfterCreateCompiler({ compiler }) {
          compiler.hooks.invalid.tap('invalid', () => {
            clearConsole();
            logger.log('Compiling...');
          });
          // run modernjs framework afterCreateCompiler hooks
          await hookRunners.afterCreateCompiler({ compiler });
        },
      },
    });

    return builder.createCompiler();
  } catch (err) {
    logger.log(chalk.red(`Failed to compile.`));
    logger.log();
    logger.log(err as any);
    // FIXME: 这里最好抛出异常，执行 process.exit 的地方尽可能少或者控制在几个统一的地方比较合适
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};
