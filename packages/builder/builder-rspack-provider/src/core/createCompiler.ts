import { logger, debug, formatStats } from '@modern-js/builder-shared';
import type { Context, RspackConfig } from '../types';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: Context;
  rspackConfigs: RspackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: rspackConfigs,
  });

  const { rspack } = await import('@rspack/core');
  const { isDev } = await import('@modern-js/utils');

  const compiler = rspack(rspackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async stats => {
    const { message, level } = await formatStats(stats);

    if (level === 'error' || level === 'warning') {
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
