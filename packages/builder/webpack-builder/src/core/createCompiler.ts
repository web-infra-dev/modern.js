import { log, debug, formatWebpackStats } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { webpack } from '../types';

export async function createCompiler(options: InitConfigsOptions) {
  const { context } = options;
  const { webpackConfigs } = await initConfigs(options);

  debug('create compiler');

  await context.hooks.onBeforeCreateCompilerHooks.call({
    webpackConfigs,
  });

  const { default: webpack } = await import('webpack');

  const compiler = webpack(webpackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats: unknown) => {
    const { message, level } = await formatWebpackStats(
      stats as webpack.Stats,
      isFirstCompile,
    );

    if (level === 'error') {
      log(message);
    }
    if (level === 'warning') {
      log(message);
    }

    await context.hooks.onDevCompileDoneHook.call({
      isFirstCompile,
    });

    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompilerHooks.call();
  debug('create compiler done');

  return compiler;
}
