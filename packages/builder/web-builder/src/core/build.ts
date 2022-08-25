import { info, error, warn, formatWebpackStats } from '../shared';
import type { WebpackConfig } from '../types';

export const webpackBuild = async (webpackConfigs: WebpackConfig[]) => {
  const { default: webpack } = await import('webpack');
  const compiler = webpack(webpackConfigs);

  return new Promise<void>((resolve, reject) => {
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

        // eslint-disable-next-line promise/no-promise-in-callback
        formatWebpackStats(stats!).then(({ level, message }) => {
          if (level === 'error') {
            reject(new Error(message));
          } else {
            if (level === 'warning') {
              warn(message);
            }
            resolve();
          }
        });
      });
    });
  });
};
