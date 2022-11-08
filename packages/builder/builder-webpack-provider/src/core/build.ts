import assert from 'assert';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  type BuildOptions,
  type PromiseOrNot,
} from '@modern-js/builder-shared';
import type {
  Stats,
  MultiStats,
  Compiler,
  MultiCompiler,
  Configuration as WebpackConfig,
} from 'webpack';

export type BuildExecuter = (
  compiler: Compiler | MultiCompiler,
) => PromiseOrNot<{ stats: Stats | MultiStats } | void>;

export const webpackBuild: BuildExecuter = async compiler => {
  return new Promise<{ stats: Stats | MultiStats }>((resolve, reject) => {
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
  { mode = 'production', watch, compiler: customCompiler }: BuildOptions = {},
  executer?: BuildExecuter,
) => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode;
  }

  const { context } = initOptions;

  let compiler: Compiler | MultiCompiler;
  let bundlerConfigs: WebpackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { webpackConfigs } = await initConfigs(initOptions);
    compiler = await createCompiler({
      watch,
      context,
      webpackConfigs,
    });

    // assign webpackConfigs
    bundlerConfigs = webpackConfigs;
  }

  await context.hooks.onBeforeBuildHook.call({
    bundlerConfigs,
  });

  if (watch) {
    compiler.watch({}, err => {
      if (err) {
        logger.error(err);
      }
    });
  } else {
    const executeResult = await executer?.(compiler);
    await context.hooks.onAfterBuildHook.call({
      stats: executeResult?.stats,
    });
  }
};
