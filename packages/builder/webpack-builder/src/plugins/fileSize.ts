/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import path from 'path';
import chalk from '@modern-js/utils/chalk';
import { info, log } from '../shared';
import type { BuilderPlugin, webpack } from '../types';

type PrevFileSize = {
  root: string;
  sizes: Record<string, number[]>;
};

export const filterAsset = (asset: string) => /\.(js|css)$/.test(asset);

export const removeFileNameHash = (distPath: string, fileName: string) =>
  fileName
    .replace(distPath, '')
    .replace(/\\/g, '/')
    .replace(
      /\/?(.*)(\.[0-9a-f]+)(\.chunk)?(\.js|\.css)/,
      (match, p1: string, p2, p3, p4: string) => p1 + p4,
    );

async function getPrevFileSizes(distPath: string): Promise<PrevFileSize> {
  const { fs, gzipSize, recursiveReaddir } = await import('@modern-js/utils');

  return new Promise(resolve => {
    recursiveReaddir(distPath, (err, fileNames) => {
      let sizes: Record<string, number[]> = {};

      if (!err && fileNames) {
        sizes = fileNames
          .filter(filterAsset)
          .reduce<Record<string, [number, number]>>((memo, fileName) => {
            const contents = fs.readFileSync(fileName);
            const key = removeFileNameHash(distPath, fileName);
            // save both the original size and gzip size
            memo[key] = [contents.length, gzipSize.sync(contents)];
            return memo;
          }, {});
      }

      resolve({
        root: distPath,
        sizes,
      });
    });
  });
}

// Input: 1024, 2048
// Output: "(+1 KB)"
export function getDiffLabel(
  currentSize: number,
  prevSize: number,
  getFilesize: (bytes: number) => string,
) {
  const FIFTY_KILOBYTES = 1024 * 50;
  const difference = currentSize - prevSize;
  const fileSize = !Number.isNaN(difference) ? getFilesize(difference) : 0;

  if (difference >= FIFTY_KILOBYTES) {
    return chalk.red(`+${fileSize}`);
  }
  if (difference < FIFTY_KILOBYTES && difference > 0) {
    return chalk.yellow(`+${fileSize}`);
  }
  if (difference < 0) {
    return chalk.green(fileSize);
  }
  return '';
}

async function printHeader(
  longestFileLength: number,
  longestLabelLength: number,
) {
  const longestLengths = [longestFileLength, longestLabelLength];
  const headerRow = ['File', 'Size', 'Gzipped'].reduce((prev, cur, index) => {
    const length = longestLengths[index];
    let curLabel = cur;
    if (length) {
      curLabel =
        cur.length < length ? cur + ' '.repeat(length - cur.length) : cur;
    }
    return `${prev + curLabel}    `;
  }, '  ');

  log(chalk.bold(chalk.blue(headerRow)));
}

async function printFileSizes(
  stats: webpack.Stats | webpack.MultiStats,
  { root, sizes }: PrevFileSize,
  distPath: string,
) {
  const { fs, filesize, gzipSize, stripAnsi } = await import(
    '@modern-js/utils'
  );

  const formatAsset = (asset: webpack.StatsAsset) => {
    const contents = fs.readFileSync(path.join(root, asset.name));
    const size = contents.length;
    const gzippedSize = gzipSize.sync(contents);
    const [prevSize, prevGzipSize] =
      sizes[removeFileNameHash(root, asset.name)] || [];
    const sizeDiff = getDiffLabel(size, prevSize, filesize);
    const gzipSizeDiff = getDiffLabel(gzippedSize, prevGzipSize, filesize);

    return {
      size,
      folder: path.join(path.basename(distPath), path.dirname(asset.name)),
      name: path.basename(asset.name),
      gzippedSize,
      sizeLabel: filesize(size) + (sizeDiff ? ` (${sizeDiff})` : ''),
      gzipSizeLabel:
        filesize(gzippedSize) + (gzipSizeDiff ? ` (${gzipSizeDiff})` : ''),
    };
  };

  const multiStats = 'stats' in stats ? stats.stats : [stats];
  const assets = multiStats
    .map(stats => {
      const filteredAssets = stats
        .toJson({ all: false, assets: true })
        .assets!.filter(asset => filterAsset(asset.name));

      return filteredAssets.map(formatAsset);
    })
    .reduce((single, all) => all.concat(single), []);

  assets.sort((a, b) => b.size - a.size);

  const longestLabelLength = Math.max(
    ...assets.map(a => stripAnsi(a.sizeLabel).length),
  );
  const longestFileLength = Math.max(
    ...assets.map(a => stripAnsi(a.folder + path.sep + a.name).length),
  );

  info(`File sizes after production build:\n`);
  printHeader(longestFileLength, longestLabelLength);

  assets.forEach(asset => {
    let { sizeLabel } = asset;
    const { name, folder, gzipSizeLabel } = asset;
    const fileNameLength = stripAnsi(folder + path.sep + name).length;
    const sizeLength = stripAnsi(sizeLabel).length;

    if (sizeLength < longestLabelLength) {
      const rightPadding = ' '.repeat(longestLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }

    let fileNameLabel =
      chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name);

    if (fileNameLength < longestFileLength) {
      const rightPadding = ' '.repeat(longestFileLength - fileNameLength);
      fileNameLabel += rightPadding;
    }

    log(`  ${fileNameLabel}    ${sizeLabel}    ${chalk.yellow(gzipSizeLabel)}`);
  });

  log('');
}

export const PluginFileSize = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-file-size',

  setup(api) {
    let prevFileSizes: PrevFileSize;

    api.onBeforeBuild(async () => {
      prevFileSizes = await getPrevFileSizes(api.context.distPath);
    });

    api.onAfterBuild(async ({ stats }) => {
      if (stats) {
        await printFileSizes(stats, prevFileSizes, api.context.distPath);
      }
    });
  },
});
