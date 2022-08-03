import { error, warn } from '../shared';
import type { Context, WebpackConfig } from '../types';

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
  const { chalk, formatWebpackMessages } = await import('@modern-js/utils');

  const compiler = webpack(webpackConfigs);

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats: any) => {
    const statsData = stats.toJson({
      all: false,
      errors: true,
      timings: true,
      warnings: true,
    });

    const { errors, warnings } = formatWebpackMessages(statsData);

    if (errors.length) {
      error(chalk.red(`Failed to compile.\n`));
      error(`${errors.join('\n\n')}\n`);
    } else if (isFirstCompile || process.stdout.isTTY) {
      if (warnings.length) {
        warn(chalk.yellow(`Compiled with warnings.\n`));
        warn(`${warnings.join('\n\n')}\n`);
      }
    }

    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompilerHooks.call();

  return compiler;
}
