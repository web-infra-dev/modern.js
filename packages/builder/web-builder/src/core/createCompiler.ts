import { log, formatWebpackStats } from '../shared';
import type { Context, webpack, WebpackConfig } from '../types';

export async function createCompiler({
  context,
  webpackConfigs,
}: {
  context: Context;
  webpackConfigs: WebpackConfig[];
}) {
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

    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompilerHooks.call();

  return compiler;
}
