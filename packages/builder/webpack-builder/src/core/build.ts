import assert from 'assert';
import { createBuildCompiler, createWatchCompiler } from './createCompiler';
import { log, info, error, logger, formatWebpackStats } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Context, PromiseOrNot, webpack, WebpackConfig } from '../types';
import type { Stats, MultiStats } from 'webpack';

export type BuildExecuter = (
  context: Context,
  configs: webpack.Configuration[],
) => PromiseOrNot<{ stats: Stats | MultiStats } | void>;

export type BuildOptions = {
  mode?: 'development' | 'production';
  watch?: boolean;
};

export const webpackBuild = async (
  context: Context,
  webpackConfigs: WebpackConfig[],
) => {
  const compiler = await createBuildCompiler(context, webpackConfigs);

  return new Promise<{ stats: Stats | MultiStats }>((resolve, reject) => {
    log();
    info(`building for production...`);

    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        if (closeErr) {
          error(closeErr);
        }
        if (err) {
          reject(err);
          return;
        }

        assert(stats);
        // eslint-disable-next-line promise/no-promise-in-callback
        formatWebpackStats(stats).then(({ level, message }) => {
          if (level === 'error') {
            log(message);
            reject(new Error('Webpack build failed!'));
          } else {
            if (level === 'warning') {
              log(message);
            }
            resolve({ stats });
          }
        });
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
    webpackConfigs,
  });

  if (watch) {
    const compiler = await createWatchCompiler(context, webpackConfigs);
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
