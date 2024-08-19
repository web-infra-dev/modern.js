import { relative, resolve } from 'path';
import { chalk, logger, fastGlob, slash } from '@modern-js/utils';
import type {
  RollupOutput,
  OutputChunk,
} from '../../compiled/rollup/types/rollup';
import {
  buildSuccessText,
  reportFile1LineText,
  reportFile2LineText,
} from '../constants/log';
import type { Chunk } from '../types';

type Files = {
  name: string;
  size: number;
};

export const bundleFiles: Files[] = [];

export const bundlelessFiles: Files[] = [];

export const addOutputChunk = (
  outputChunk: Map<string, Chunk>,
  appDirectory: string,
  isBundle: boolean,
) => {
  const files = Array.from(outputChunk).map(val => {
    const [path, chunk] = val;
    return {
      name: relative(appDirectory, path),
      size: chunk.contents.length,
    };
  });
  if (isBundle) {
    bundleFiles.push(...files);
  } else {
    bundlelessFiles.push(...files);
  }
};

export const addRollupChunk = (
  rollupOutput: RollupOutput,
  appDirectory: string,
  distDir: string,
) => {
  const { output } = rollupOutput;
  bundleFiles.push(
    ...output.map(o => {
      return {
        name: relative(appDirectory, resolve(distDir, o.fileName)),
        // only d.ts, is outputChunk not outputAsset
        size: (o as OutputChunk).code.length,
      };
    }),
  );
};

export const addDtsFiles = async (distDir: string, appDirectory: string) => {
  const files = await fastGlob(`${slash(distDir)}/**/*.d.ts`, {
    stats: true,
  });
  bundlelessFiles.push(
    ...files.map(file => {
      return {
        name: relative(appDirectory, file.path),
        size: file.stats.size,
      };
    }),
  );
};

export const printFileSize = () => {
  printBundlelessInfo();
  printBundleFiles();
};

export const printSucceed = (totalDuration: number) => {
  const time = chalk.cyan(`${(totalDuration / 1000).toFixed(1)}s`);
  logger.info(`${buildSuccessText} in ${time}`);
};

const prettyBytes = (bytes: number) => {
  if (bytes === 0) {
    return '0 B';
  }
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** exp).toFixed(1)} ${unit[exp]}`;
};

const printBundleFiles = () => {
  if (bundleFiles.length === 0) {
    return;
  }
  const longestFileLength = bundleFiles.reduce(
    (max, str) => Math.max(max, str.name.length),
    reportFile1LineText.length,
  );

  logger.info(`Bundle generated ${bundleFiles.length} files\n`);

  const headerRow =
    reportFile1LineText +
    ' '.repeat(longestFileLength - 10) +
    reportFile2LineText;
  logger.log(chalk.bold(chalk.green(headerRow)));

  bundleFiles.forEach(({ name, size }) => {
    const infoRow = `${name}${' '.repeat(
      longestFileLength - name.length + 2,
    )}${prettyBytes(size)}`;
    logger.log(infoRow);
  });
};

const printBundlelessInfo = () => {
  if (bundlelessFiles.length === 0) {
    return;
  }

  const count = bundlelessFiles.length;
  const totalSize = bundlelessFiles.reduce((total, file) => {
    return total + file.size;
  }, 0);
  const info = `Bundleless generated ${count} files, the total size is ${chalk.cyan(
    prettyBytes(totalSize),
  )}`;
  logger.info(info);
};
