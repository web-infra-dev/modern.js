import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { logger, type BuildOptions } from '@modern-js/builder-shared';
import type {
  Stats,
  MultiStats,
  Compiler,
  MultiCompiler,
  Configuration as WebpackConfig,
} from 'webpack';

export interface BuildExecuter {
  (compiler: Compiler): Promise<{ stats: Stats }>;
  (compiler: MultiCompiler): Promise<{ stats: MultiStats }>;
  (compiler: Compiler | MultiCompiler): Promise<{ stats: Stats | MultiStats }>;
}

export interface WebpackBuildError extends Error {
  stats?: Stats | MultiStats;
}

/**
 * @throws {WebpackBuildError}
 */
export const webpackBuild: BuildExecuter = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        closeErr && logger.error(closeErr);
        if (err || !stats || stats.hasErrors()) {
          const buildError: WebpackBuildError =
            err || new Error('Webpack build failed!');
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
