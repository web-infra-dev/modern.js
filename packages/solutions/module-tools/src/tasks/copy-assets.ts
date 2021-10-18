import * as path from 'path';
import { fs, watch, WatchChangeType, Import } from '@modern-js/utils';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';
import type { ModuleToolsOutput } from '../types';

const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const glob: typeof import('glob') = Import.lazy('glob', require);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const copyUtils: typeof import('../utils/copy') = Import.lazy(
  '../utils/copy',
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

const taskMain = ({
  modernConfig,
  appContext,
}: {
  modernConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<{ watch?: boolean }>({});
  const { appDirectory } = appContext;
  const {
    jsPath = 'js',
    assetsPath = 'styles',
    path: outputPath = 'dist',
  } = modernConfig.output as ModuleToolsOutput;
  const srcDir = path.join(appDirectory, SRC_DIRS);
  const outputDirToSrc = path.join(
    appDirectory,
    outputPath,
    jsPath,
    assetsPath,
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

(async () => {
  const { resolved: modernConfig, appContext } = await core.cli.init();
  core.manager.run(() => {
    try {
      taskMain({ modernConfig, appContext });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
