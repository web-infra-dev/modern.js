import { basename, join, extname, relative, dirname, win32 } from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import type { Loader } from 'esbuild';
import { LibuildPlugin, ILibuilder, Asset } from '../types';

export const assetExt = [
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',
  '.mp3',
  '.mp4',
  '.webm',
  '.ogg',
  '.wav',
  '.flac',
  '.aac',
  '.mov',
];
export const assetsPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:asset';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.load.tapPromise(pluginName, async (args) => {
        if (assetExt.find((ext) => ext === extname(args.path))) {
          const { originalFilePath } = resolvePathAndQuery(args.path);
          const { bundle, outdir, outbase } = compiler.config;
          const rebaseFrom = bundle ? outdir : join(outdir, relative(outbase, dirname(args.path)));

          const { contents, loader } = await getAssetContents.apply(compiler, [originalFilePath, rebaseFrom, true]);
          return {
            contents,
            loader,
          };
        }
      });
    },
  };
};

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSVG(buffer: Buffer) {
  return (
    encodeURIComponent(
      buffer
        .toString('utf-8')
        // strip newlines and tabs
        .replace(/[\n\r]/gim, '')
        .replace(/\t/gim, ' ')
        // strip comments
        .replace(/<!--(.*(?=-->))-->/gim, '')
        // replace
        .replace(/'/gim, '\\i')
    )
      // encode brackets
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
  );
}

/**
 *
 * @param this Compiler
 * @param assetPath Absolute path of the asset
 * @param rebaseFrom Absolute path of the file which use asset
 * @param calledOnLoad called in load hooks
 * @returns dataurl or path
 */
export async function getAssetContents(
  this: ILibuilder,
  assetPath: string,
  rebaseFrom: string,
  calledOnLoad?: boolean
) {
  const fileContent = await fs.promises.readFile(assetPath);
  const { bundle } = this.config;
  const { name: assetName, limit, rebase, outdir, publicPath } = this.config.asset;
  const outputFileName = getOutputFileName(assetPath, fileContent, assetName);
  const outputFilePath = join(this.config.outdir, outdir, outputFileName);
  const relativePath = relative(rebaseFrom, outputFilePath);
  const normalizedRelativePath = normalizeSlashes(relativePath.startsWith('..') ? relativePath : `./${relativePath}`);
  const normalizedPublicPath = `${
    typeof publicPath === 'function' ? publicPath(assetPath) : publicPath
  }${outdir}/${outputFileName}`;
  let emitAsset = true;
  let contents: string | Buffer = normalizedPublicPath;
  let loader: Loader = 'text';
  if (bundle) {
    // inline base64
    if (fileContent.length <= limit) {
      const mimetype = (await import('mime-types')).default.lookup(assetPath);
      const isSVG = mimetype === 'image/svg+xml';
      const data = isSVG ? encodeSVG(fileContent) : fileContent.toString('base64');
      const encoding = isSVG ? '' : ';base64';
      contents = `data:${mimetype}${encoding},${data}`;
      loader = 'text';
      emitAsset = false;
    } else if (rebase) {
      contents = calledOnLoad ? fileContent : normalizedRelativePath;
      loader = calledOnLoad ? 'copy' : 'text';
      emitAsset = !calledOnLoad;
    }
  } else {
    contents = normalizedRelativePath;
  }
  if (emitAsset) {
    this.emitAsset(outputFilePath, {
      type: 'asset',
      fileName: outputFilePath,
      contents: fileContent,
      originalFileName: assetPath,
    });
  }
  return {
    contents,
    loader,
  };
}

export function getOutputFileName(filePath: string, content: Buffer, assetName: Required<Asset['name']>): string {
  const format = typeof assetName === 'function' ? assetName(filePath) : assetName;
  const fileBaseNameArray = basename(filePath).split('.');
  const extname = fileBaseNameArray.pop();
  const fileBaseName = fileBaseNameArray.join('.');
  const outputFileName = format.replace(/(\[[^\]]*\])/g, (str: string, match: string): string => {
    if (match === '[name]') {
      return fileBaseName;
    }
    if (match === '[ext]') {
      return extname as string;
    }
    if (match === '[hash]' || match === '[contenthash]') {
      return getHash(content, null).slice(0, 8);
    }
    return match;
  });

  return outputFileName;
}

export function getHash(content: Buffer | string, encoding: any, type = 'md5'): string {
  return createHash(type).update(content.toString(), encoding).digest('hex');
}

function normalizeSlashes(file: string) {
  return file.split(win32.sep).join('/');
}
