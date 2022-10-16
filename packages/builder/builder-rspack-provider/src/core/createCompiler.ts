import { logger, debug } from '@modern-js/builder-shared';
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
  await context.hooks.onBeforeCreateCompilerHooks.call({
    bundlerConfigs: rspackConfigs,
  });

  const { Rspack } = await import('@rspack/core');

  //todo  support multiple compiler
  const compiler = new Rspack(rspackConfigs[0])

  debug('create compiler done');

  return compiler;
}
