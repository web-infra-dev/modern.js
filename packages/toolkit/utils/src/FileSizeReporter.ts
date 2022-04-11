/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */

// Modified by Chao Xu (xuchaobei)
'use strict';

import fs from 'fs';
import path from 'path';
import {
  chalk,
  filesize,
  stripAnsi,
  gzipSize,
  recursiveReaddir,
} from './compiled';
import { logger } from './logger';

function canReadAsset(asset: string) {
  return (
    /\.(js|css)$/.test(asset) &&
    !/service-worker\.js/.test(asset) &&
    !/precache-manifest\.[0-9a-f]+\.js/.test(asset)
  );
}

// Prints a detailed summary of build files.
function printFileSizesAfterBuild(
  webpackStats: any,
  previousSizeMap: { root: string; sizes: Record<string, number[]> },
  buildFolder: string,
  maxBundleGzipSize: number,
  maxChunkGzipSize: number,
) {
  var root = previousSizeMap.root;
  var sizes = previousSizeMap.sizes;
  var assets = (webpackStats.stats || [webpackStats])
    .map((stats: any) =>
      stats
        .toJson({ all: false, assets: true })
        .assets.filter((asset: any) => canReadAsset(asset.name))
        .map((asset: any) => {
          var fileContents = fs.readFileSync(path.join(root, asset.name));
          var size = fileContents.length;
          var gzippedSize = gzipSize.sync(fileContents);
          var [previousSize, previousGzipSize] =
            sizes[removeFileNameHash(root, asset.name)] || [];
          var sizeDifference = getDifferenceLabel(size, previousSize);
          var gzipSizeDifference = getDifferenceLabel(
            gzippedSize,
            previousGzipSize,
          );
          return {
            folder: path.join(
              path.basename(buildFolder),
              path.dirname(asset.name),
            ),
            name: path.basename(asset.name),
            gzippedSize: gzippedSize,
            sizeLabel:
              filesize(size) +
              (sizeDifference ? ' (' + sizeDifference + ')' : ''),
            gzipSizeLabel:
              filesize(gzippedSize) +
              (gzipSizeDifference ? ' (' + gzipSizeDifference + ')' : ''),
          };
        }),
    )
    .reduce((single: any, all: any) => all.concat(single), []);
  assets.sort((a: any, b: any) => b.size - a.size);
  var longestSizeLabelLength = Math.max.apply(
    null,
    assets.map((a: any) => stripAnsi(a.sizeLabel).length),
  );
  var longestFileNameLength = Math.max.apply(
    null,
    assets.map((a: any) => stripAnsi(a.folder + path.sep + a.name).length),
  );

  printFileSizesHeader(longestFileNameLength, longestSizeLabelLength);

  var suggestBundleSplitting = false;
  assets.forEach((asset: any) => {
    var { folder, name, sizeLabel, gzipSizeLabel, gzippedSize } = asset;
    var fileNameLength = stripAnsi(folder + path.sep + name).length;
    var sizeLength = stripAnsi(sizeLabel).length;
    if (sizeLength < longestSizeLabelLength) {
      var rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }
    var fileNameLabel =
      chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name);
    if (fileNameLength < longestFileNameLength) {
      var rightPadding = ' '.repeat(longestFileNameLength - fileNameLength);
      fileNameLabel += rightPadding;
    }
    var isMainBundle = asset.name.indexOf('main.') === 0;
    var maxRecommendedSize = isMainBundle
      ? maxBundleGzipSize
      : maxChunkGzipSize;
    var isLarge = maxRecommendedSize && gzippedSize > maxRecommendedSize;
    if (isLarge && path.extname(asset.name) === '.js') {
      suggestBundleSplitting = true;
    }
    logger.log(
      '  ' +
        fileNameLabel +
        '    ' +
        sizeLabel +
        '    ' +
        (isLarge ? chalk.yellow(gzipSizeLabel) : gzipSizeLabel),
    );
  });
  if (suggestBundleSplitting) {
    logger.log();
    logger.warn('The bundle size is significantly larger than recommended.');
  }
}

function printFileSizesHeader(
  longestFileNameLength: number,
  longestSizeLabelLength: number,
) {
  const longestLengths = [longestFileNameLength, longestSizeLabelLength];
  const headerRow = ['File', 'Size', 'Gzipped'].reduce((prev, cur, index) => {
    const length = longestLengths[index];
    let curLabel = cur;
    if (length) {
      curLabel =
        cur.length < length ? cur + ' '.repeat(length - cur.length) : cur;
    }
    return prev + curLabel + '    ';
  }, '  ');

  logger.log(chalk.bold(chalk.blue(headerRow)));
}

function removeFileNameHash(buildFolder: string, fileName: string) {
  return fileName
    .replace(buildFolder, '')
    .replace(/\\/g, '/')
    .replace(
      /\/?(.*)(\.[0-9a-f]+)(\.chunk)?(\.js|\.css)/,
      (match, p1, p2, p3, p4) => p1 + p4,
    );
}

// Input: 1024, 2048
// Output: "(+1 KB)"
function getDifferenceLabel(currentSize: number, previousSize: number) {
  var FIFTY_KILOBYTES = 1024 * 50;
  var difference = currentSize - previousSize;
  var fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
  if (difference >= FIFTY_KILOBYTES) {
    return chalk.red('+' + fileSize);
  } else if (difference < FIFTY_KILOBYTES && difference > 0) {
    return chalk.yellow('+' + fileSize);
  } else if (difference < 0) {
    return chalk.green(fileSize);
  } else {
    return '';
  }
}

function measureFileSizesBeforeBuild(
  buildFolder: string,
): Promise<{ root: string; sizes: Record<string, number[]> }> {
  return new Promise(resolve => {
    recursiveReaddir(buildFolder, (err, fileNames) => {
      var sizes;
      if (!err && fileNames) {
        sizes = fileNames
          .filter(canReadAsset)
          .reduce<Record<string, [number, number]>>((memo, fileName) => {
            var contents = fs.readFileSync(fileName);
            var key = removeFileNameHash(buildFolder, fileName);
            // save both the original size and gzip size
            memo[key] = [contents.length, gzipSize.sync(contents)];
            return memo;
          }, {});
      }
      resolve({
        root: buildFolder,
        sizes: sizes || {},
      });
    });
  });
}

export { measureFileSizesBeforeBuild, printFileSizesAfterBuild };
/* eslint-enable */
