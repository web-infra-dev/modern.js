/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import path from 'path';
import chalk from '@modern-js/utils/chalk';
import { logger } from '@modern-js/builder-shared';
import type { BuilderPlugin, webpack } from '../types';

/** Filter source map files */
export const filterAsset = (asset: string) => !/\.map$/.test(asset);

const getAssetColor = (size: number) => {
  if (size > 300 * 1000) {
    return chalk.bold.red;
  }
  if (size > 100 * 1000) {
    return chalk.yellow;
  }
  return chalk.green;
};

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

  logger.log(chalk.bold(chalk.blue(headerRow)));
}

async function printFileSizes(
  stats: webpack.Stats | webpack.MultiStats,
  distPath: string,
) {
  const { fs, filesize, gzipSize, stripAnsi } = await import(
    '@modern-js/utils'
  );

  const formatAsset = (asset: webpack.StatsAsset) => {
    const contents = fs.readFileSync(path.join(distPath, asset.name));
    const size = contents.length;
    const gzippedSize = gzipSize.sync(contents);

    return {
      size,
      folder: path.join(path.basename(distPath), path.dirname(asset.name)),
      name: path.basename(asset.name),
      gzippedSize,
      sizeLabel: filesize(size),
      gzipSizeLabel: getAssetColor(gzippedSize)(filesize(gzippedSize)),
    };
  };

  const multiStats = 'stats' in stats ? stats.stats : [stats];
  const assets = multiStats
    .map(stats => {
      const origin = stats.toJson({
        all: true,
        assets: true,
        groupAssetsByInfo: false,
        groupAssetsByPath: false,
        groupAssetsByChunk: false,
        groupAssetsByExtension: false,
        groupAssetsByEmitStatus: false,
      });
      const filteredAssets = origin.assets!.filter(asset =>
        filterAsset(asset.name),
      );

      return filteredAssets.map(formatAsset);
    })
    .reduce((single, all) => all.concat(single), []);

  if (assets.length === 0) {
    return;
  }

  assets.sort((a, b) => b.size - a.size);

  const longestLabelLength = Math.max(
    ...assets.map(a => stripAnsi(a.sizeLabel).length),
  );
  const longestFileLength = Math.max(
    ...assets.map(a => stripAnsi(a.folder + path.sep + a.name).length),
  );

  logger.info(`File sizes after production build:\n`);

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

    logger.log(`  ${fileNameLabel}    ${sizeLabel}    ${gzipSizeLabel}`);
  });

  logger.log('');
}

export const PluginFileSize = (): BuilderPlugin => ({
  name: 'builder-plugin-file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats }) => {
      if (stats) {
        await printFileSizes(stats, api.context.distPath);
      }
    });
  },
});
