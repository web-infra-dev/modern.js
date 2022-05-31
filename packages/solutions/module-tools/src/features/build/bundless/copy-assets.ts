import * as path from 'path';
import { fs, watch, glob, WatchChangeType, Import } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { NormalizedBundlessBuildConfig } from '../types';

const copyUtils: typeof import('../../../utils/copy') = Import.lazy(
  '../../../utils/copy',
  require,
);

const STYLE_DIRS = 'styles';
const SRC_DIRS = 'src';

const copyAssets = ({
  targetDir,
  outputDir,
}: {
  targetDir: string;
  outputDir: string;
}) => {
  const assetsFiles = glob.sync(`${targetDir}/**/*.*`, {
    ignore: ['**/*.{js,jsx,ts,tsx,d.ts,scss,less,css,sass}'],
  });

  if (assetsFiles.length > 0) {
    fs.ensureDirSync(outputDir);
  }

  for (const resource of assetsFiles) {
    const file = path.relative(targetDir, resource);
    fs.ensureDirSync(path.dirname(path.resolve(outputDir, file)));
    fs.copyFileSync(resource, path.resolve(outputDir, file));
  }
};

const watchAssets = ({
  targetDir,
  outputDir,
}: {
  targetDir: string;
  outputDir: string;
}) => {
  watch(
    `${targetDir}/**/*.*`,
    ({ changeType, changedFilePath }) => {
      if (changeType === WatchChangeType.UNLINK) {
        const removeFile = path.normalize(
          `${outputDir}/${path.relative(targetDir, changedFilePath)}`,
        );
        fs.removeSync(removeFile);
        return;
      }
      const file = path.relative(targetDir, changedFilePath);
      fs.copyFileSync(changedFilePath, path.resolve(outputDir, file));
    },
    ['**/*.{js,jsx,ts,tsx,d.ts,scss,less,css,sass}'],
  );
};

export const copyStaticAssets = (
  api: PluginAPI,
  config: NormalizedBundlessBuildConfig,
) => {
  const appContext = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory } = appContext;
  const { assetsPath = 'styles', path: distPath = 'dist' } =
    modernConfig.output;
  const { outputPath } = config;
  const srcDir = path.join(appDirectory, SRC_DIRS);
  const outputDirToSrc = path.join(
    appDirectory,
    distPath,
    outputPath,
    'static',
  );

  const styleDir = path.join(appDirectory, STYLE_DIRS);
  const outputDirToStyle = path.join(appDirectory, outputPath, assetsPath);
  copyAssets({ targetDir: srcDir, outputDir: outputDirToSrc });
  copyAssets({ targetDir: styleDir, outputDir: outputDirToStyle });
  copyUtils.copyTask({ modernConfig, appContext });
  if (config.watch) {
    watchAssets({ targetDir: srcDir, outputDir: outputDirToSrc });
    watchAssets({ targetDir: styleDir, outputDir: outputDirToStyle });
  }
};
