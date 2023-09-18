import {
  debug,
  logger,
  formatStats,
  TARGET_ID_MAP,
  getProgressColor,
} from '@modern-js/builder-shared';
import type { Context, RspackConfig } from '../types';
import chalk from '@modern-js/utils/chalk';
import prettyTime from '@modern-js/builder-shared/pretty-time';

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
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    if (!stats.hasErrors()) {
      obj.children?.forEach((c, index) => {
        if (c.time) {
          const color = chalk[getProgressColor(index)];
          const time = prettyTime([0, c.time * 10 ** 6], 1);
          const target = Array.isArray(context.target)
            ? context.target[index]
            : context.target;
          const name = TARGET_ID_MAP[target || 'web'];
          logger.log(color(`✔ ${name}  compiled in`, time));
        }
      });
    }

    const { message, level } = formatStats(stats);

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
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
