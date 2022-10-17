import assert from 'assert';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  type BuildOptions,
  type PromiseOrNot,
} from '@modern-js/builder-shared';
import type { webpack, Context, WebpackConfig } from '../types';
import type { Stats, MultiStats } from 'webpack';

export type BuildExecuter = (
  context: Context,
  configs: webpack.Configuration[],
) => PromiseOrNot<{ stats: Stats | MultiStats } | void>;

export const webpackBuild = async (
  context: Context,
  webpackConfigs: WebpackConfig[],
) => {
  const compiler = await createCompiler({
    watch: false,
    context,
    webpackConfigs,
  });

  return new Promise<{ stats: Stats | MultiStats }>((resolve, reject) => {
    logger.log();
    logger.info(`building for production...\n`);

    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        if (closeErr) {
          logger.error(closeErr);
        }
        if (err) {
          reject(err);
          return;
        }

        assert(stats);
        if (stats.hasErrors()) {
          reject(new Error('Webpack build failed!'));
        } else {
          resolve({ stats });
        }
      });
    });
  });
};

export const build = async (
  initOptions: InitConfigsOptions,
  { mode = 'production', watch }: BuildOptions = {},
  executer?: BuildExecuter,
) => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode;
  }

  const { context } = initOptions;
  const { webpackConfigs } = await initConfigs(initOptions);

  await context.hooks.onBeforeBuildHook.call({
    bundlerConfigs: webpackConfigs,
  });

  if (watch) {
    const compiler = await createCompiler({
      context,
      webpackConfigs,
    });
    compiler.watch({}, err => {
      if (err) {
        logger.error(err);
      }
    });
  } else {
    const executeResult = await executer?.(context, webpackConfigs);
    await context.hooks.onAfterBuildHook.call({
      stats: executeResult?.stats,
    });
  }
};
