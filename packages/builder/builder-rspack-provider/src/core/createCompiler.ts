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

  // always return compiler when no second parameter(callback)
  // https://github.com/web-infra-dev/rspack/blob/37ad034eec06d711eb59b181a0b6232589387e13/packages/rspack/src/rspack.ts#L155
  const compiler = rspack(rspackConfigs)!;

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async stats => {
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    if (!stats.hasErrors()) {
      obj.children?.forEach(c => {
        c.time &&
          logger.success(`${c.name} compiled successfully in`, c.time, 'ms');
      });
    }

    const { message, level } = formatStats(stats);

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
