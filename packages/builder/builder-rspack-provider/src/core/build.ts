import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  BuildOptions,
  Stats,
  MultiStats,
} from '@modern-js/builder-shared';
import type { Compiler, MultiCompiler, RspackConfig } from '../types';

export interface BuildExecuter {
  (compiler: Compiler): Promise<{ stats: Stats }>;
  (compiler: MultiCompiler): Promise<{ stats: MultiStats }>;
  (compiler: Compiler | MultiCompiler): Promise<{ stats: Stats | MultiStats }>;
}

export interface RspackBuildError extends Error {
  stats?: Stats | MultiStats;
}

/**
 * @throws {RspackBuildError}
 */
export const rspackBuild: BuildExecuter = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run((err: any, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(() => {
        if (err || !stats || stats.hasErrors()) {
          const buildError: RspackBuildError =
            err || new Error('Rspack build failed!');
          buildError.stats = stats;
          reject(buildError);
        } else {
          // Assert type of stats must align to compiler.
          resolve({ stats: stats as any });
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
  let bundlerConfigs: RspackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler as any as Compiler | MultiCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(initOptions);
    compiler = await createCompiler({
      context,
      rspackConfigs,
    });
    bundlerConfigs = rspackConfigs;
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
