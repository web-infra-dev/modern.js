import { info, error, formatWebpackStats, log } from '../shared';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { WebpackConfig } from '../types';

const webpackBuild = async (webpackConfigs: WebpackConfig[]) => {
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
            log(message);
            reject(new Error('Webpack build failed!'));
          } else {
            if (level === 'warning') {
              log(message);
            }
            resolve();
          }
        });
      });
    });
  });
};

export async function build(options: InitConfigsOptions) {
  const { context } = options;
  const { webpackConfigs } = await initConfigs(options);

  await context.hooks.onBeforeBuildHook.call({
    webpackConfigs,
  });
  await webpackBuild(webpackConfigs);
  await context.hooks.onAfterBuildHook.call();
}
