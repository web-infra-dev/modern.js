import { log, debug, formatWebpackStats } from '../shared';
import type { Context, webpack, WebpackConfig } from '../types';

export async function createWatchCompiler(
  context: Context,
  webpackConfigs: WebpackConfig[],
) {
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

  await context.hooks.onAfterCreateCompilerHooks.call({ compiler });
  debug('create compiler done');

  return compiler;
}

export async function createBuildCompiler(
  context: Context,
  webpackConfigs: WebpackConfig[],
) {
  await context.hooks.onBeforeCreateCompilerHooks.call({ webpackConfigs });

  const { default: webpack } = await import('webpack');

  const compiler = webpack(webpackConfigs);
  await context.hooks.onAfterCreateCompilerHooks.call({ compiler });

  return compiler;
}
