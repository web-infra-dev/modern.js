import { logger, debug } from '@modern-js/builder-shared';
import { formatRspackStats } from '../shared';
import type { Context, RspackConfig } from '../types';

export async function createCompiler({
  watch = true,
  context,
  rspackConfigs,
}: {
  watch?: boolean;
  context: Context;
  rspackConfigs: RspackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: rspackConfigs,
  });

  const { rspack } = await import('@rspack/core');

  // todo: support multiple compiler
  const compiler = rspack(rspackConfigs[0]);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async stats => {
    const { message, level } = await formatRspackStats(stats);
    if (level === 'error' || level === 'warning') {
      logger.log(message);
    }

    if (watch) {
      await context.hooks.onDevCompileDoneHook.call({
        isFirstCompile,
      });
      isFirstCompile = false;
    }
  });

  // await context.hooks.onAfterCreateCompilerHook.call({ compiler });
  debug('create compiler done');

  return compiler;
}
