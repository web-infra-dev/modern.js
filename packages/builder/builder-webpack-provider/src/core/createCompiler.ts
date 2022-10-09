import { logger, debug } from '@modern-js/builder-shared';
import { formatWebpackStats } from '../shared';
import type { Context, WebpackConfig } from '../types';
import type { Stats } from 'webpack';

export async function createCompiler({
  watch = true,
  context,
  webpackConfigs,
}: {
  watch?: boolean;
  context: Context;
  webpackConfigs: WebpackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHooks.call({
    bundlerConfigs: webpackConfigs,
  });

  const { default: webpack } = await import('webpack');

  const compiler =
    webpackConfigs.length === 1
      ? webpack(webpackConfigs[0])
      : webpack(webpackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats: unknown) => {
    const { message, level } = await formatWebpackStats(stats as Stats);

    if (level === 'error') {
      logger.log(message);
    }
    if (level === 'warning') {
      logger.log(message);
    }

    if (watch) {
      await context.hooks.onDevCompileDoneHook.call({
        isFirstCompile,
      });
      isFirstCompile = false;
    }
  });

  await context.hooks.onAfterCreateCompilerHooks.call({ compiler });
  debug('create compiler done');

  return compiler;
}
