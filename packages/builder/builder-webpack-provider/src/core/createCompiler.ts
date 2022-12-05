import { debug, formatStats, logger, Stats } from '@modern-js/builder-shared';
import type { Context, WebpackConfig } from '../types';

export async function createCompiler({
  context,
  webpackConfigs,
}: {
  context: Context;
  webpackConfigs: WebpackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: webpackConfigs,
  });

  const { default: webpack } = await import('webpack');
  const { isDev } = await import('@modern-js/utils');

  const compiler =
    webpackConfigs.length === 1
      ? webpack(webpackConfigs[0])
      : webpack(webpackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats: unknown) => {
    const { message, level } = await formatStats(stats as Stats);

    if (level === 'error') {
      logger.log(message);
    }
    if (level === 'warning') {
      logger.log(message);
    }

    if (isDev()) {
      await context.hooks.onDevCompileDoneHook.call({
        isFirstCompile,
      });
    }

    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompilerHook.call({ compiler });
  debug('create compiler done');

  return compiler;
}
