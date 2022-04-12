import { logger, Import, chalk } from '@modern-js/utils';
import type { Configuration } from 'webpack';

const wp: typeof import('./utils/webpack') = Import.lazy(
  './utils/webpack',
  require,
);
const gen: typeof import('./utils/generate-files') = Import.lazy(
  './utils/generate-files',
  require,
);

export async function build(
  appDirectory: string,
  tmpDir: string,
  files: string[],
  webpackConfig: Configuration,
  isDev: boolean,
) {
  const meta = await gen.generateFiles(appDirectory, tmpDir, files, isDev);
  try {
    await wp.runWebpack(webpackConfig);
    logger.log(chalk.green('build docs successful'));
    return meta;
  } catch (err: any) {
    logger.error('failed to build docs');
    logger.error(err);
    return null;
  }
}
