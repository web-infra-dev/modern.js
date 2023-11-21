import {
  debug,
  logger,
  prettyTime,
  formatStats,
  TARGET_ID_MAP,
} from '@modern-js/builder-shared';
import type { Context, RspackConfig } from '../types';
import { Stats, MultiStats } from '@rspack/core';

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

  const compiler =
    rspackConfigs.length === 1
      ? rspack(rspackConfigs[0])
      : rspack(rspackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats: Stats | MultiStats) => {
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    const printTime = (c: typeof obj, index: number) => {
      if (c.time) {
        const time = prettyTime([0, c.time * 10 ** 6]);
        const target = Array.isArray(context.target)
          ? context.target[index]
          : context.target;
        const name = TARGET_ID_MAP[target || 'web'];
        logger.ready(`${name} compiled in ${time}`);
      }
    };

    if (!stats.hasErrors()) {
      if (obj.children) {
        obj.children.forEach((c, index) => {
          printTime(c, index);
        });
      } else {
        printTime(obj, 0);
      }
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
