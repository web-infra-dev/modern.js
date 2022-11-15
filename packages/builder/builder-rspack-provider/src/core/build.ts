import assert from 'assert';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  type BuildOptions,
  type PromiseOrNot,
} from '@modern-js/builder-shared';
import type { Compiler } from '@rspack/core';
import { RspackConfig, Stats } from '../types';

// todo: MultiCompiler MultiStats
export type BuildExecuter = (
  compiler: Compiler,
) => PromiseOrNot<{ stats: Stats } | void>;

export const rspackBuild: BuildExecuter = async compiler => {
  return new Promise<{ stats: Stats }>((resolve, reject) => {
    compiler.run((err: any, stats: Stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(() => {
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

  let compiler: Compiler;
  let bundlerConfigs: RspackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(initOptions);
    compiler = await createCompiler({
      watch,
      context,
      rspackConfigs,
    });
    // assign webpackConfigs
    bundlerConfigs = rspackConfigs;
  }

  await context.hooks.onBeforeBuildHook.call({ bundlerConfigs });

  if (watch) {
    compiler.watch({}, (err: any) => {
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
