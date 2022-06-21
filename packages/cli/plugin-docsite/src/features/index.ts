import path from 'path';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { fs, glob, Import, logger } from '@modern-js/utils';
import type { Configuration } from 'webpack';
import { valid } from './utils/valid';

const buildFeat: typeof import('./build') = Import.lazy('./build', require);
const devFeat: typeof import('./dev') = Import.lazy('./dev', require);
const wp: typeof import('./utils/webpack') = Import.lazy(
  './utils/webpack',
  require,
);

const DEFAULT_PORT = 5000;

interface IBuildDocsParams {
  appContext: IAppContext;
  modernConfig: NormalizedConfig;
  webpackConfig?: Configuration;
  isDev?: boolean;
  port?: number;
}
export async function buildDocs({
  appContext,
  modernConfig,
  isDev = false,
  port = DEFAULT_PORT,
}: IBuildDocsParams) {
  const { appDirectory, internalDirectory } = appContext;
  if (!valid({ appDirectory, docsDir: 'docs' })) {
    return;
  }
  const docsDir = path.resolve(appDirectory, 'docs');
  if (!fs.pathExistsSync(docsDir)) {
    return;
  }
  const files = glob.sync('**/*.{md,mdx}', {
    cwd: docsDir,
    ignore: '**/_*',
  });
  if (files.length === 0) {
    logger.warn('not find md(x) files');
    return;
  }
  const tmpDir = path.join(internalDirectory, './docs');
  fs.ensureDirSync(tmpDir);
  const finalWebpackConfig = wp.generatorWebpackConfig(
    appContext,
    modernConfig,
    tmpDir,
    isDev,
  );
  if (!isDev) {
    logger.info('build docs');
    await buildFeat.build(
      appDirectory,
      tmpDir,
      files,
      finalWebpackConfig,
      false,
    );
  } else {
    await devFeat.dev(
      appDirectory,
      tmpDir,
      files,
      finalWebpackConfig,
      true,
      port,
    );
  }
}
