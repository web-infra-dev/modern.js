import { ConfigValidator } from 'src/config/validate';
import { log, error } from '../shared';
import type { Context, WebpackConfig } from '../types';

const webpackBuild = async (webpackConfigs: WebpackConfig[]) => {
  const { default: webpack } = await import('webpack');
  const { formatWebpackMessages } = await import('@modern-js/utils');
  const compiler = webpack(webpackConfigs);

  return new Promise((resolve, reject) => {
    log(`building for production...`);

    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        if (closeErr) {
          error(closeErr);
        }
        if (err) {
          reject(err);
        } else {
          const messages = formatWebpackMessages(
            stats!.toJson({ all: false, warnings: true, errors: true }),
          );
          if (messages.errors.length) {
            reject(new Error(messages.errors.join('\n\n')));
            return;
          }
          resolve({ warnings: messages.warnings });
        }
      });
    });
  });
};

export async function build({
  context,
  webpackConfigs,
}: {
  context: Context;
  webpackConfigs: WebpackConfig[];
}) {
  const configValidatorTask = ConfigValidator.create().then(validator =>
    validator.validate(context.config, false),
  );
  // some hooks...
  await configValidatorTask;
  // some hooks...
  await context.hooks.onBeforeBuildHook.call({
    webpackConfigs,
  });
  await webpackBuild(webpackConfigs);
  await context.hooks.onAfterBuildHook.call();
}
