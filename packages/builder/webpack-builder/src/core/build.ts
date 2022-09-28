import assert from 'assert';
import { log, info, error, formatWebpackStats } from '../shared';
import type { Context, webpack, WebpackConfig } from '../types';

export const webpackBuild = async (
  context: Context,
  webpackConfigs: WebpackConfig[],
) => {
  const { default: webpack } = await import('webpack');
  const compiler = webpack(webpackConfigs);
  await context.hooks.onAfterCreateCompilerHooks.call({ compiler });

  return new Promise<{ stats: webpack.MultiStats }>((resolve, reject) => {
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
