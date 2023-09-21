import { basename, join, extname, relative, dirname, resolve } from 'path';
import fs from 'fs';
import type { Loader } from 'esbuild';
import { createFilter } from '@rollup/pluginutils';
import { transform } from '@svgr/core';
import svgo from '@svgr/plugin-svgo';
import jsx from '@svgr/plugin-jsx';
import { ICompiler, LoadResult, SvgrOptions } from '../../types';
import { assetExt } from '../../constants/file';
import { normalizeSlashes, getHash } from '../../utils';

const name = 'asset';
const SVG_REGEXP = /\.svg$/;

export const asset = {
  name,
  apply(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (assetExt.find(ext => ext === extname(args.path))) {
        const { buildType, outDir, sourceDir, asset } = compiler.config;

        const svgrResult = await loadSvgr(args.path, asset.svgr);
        if (svgrResult) {
          return svgrResult;
        }

        const rebaseFrom =
          buildType === 'bundle'
            ? outDir
            : join(outDir, relative(sourceDir, dirname(args.path)));

        const { contents, loader } = await getAssetContents.apply(compiler, [
          args.path,
          rebaseFrom,
          true,
        ]);
        return {
          contents,
          loader,
        };
      }
    });
  },
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
        .replace(/'/gim, '\\i'),
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
  this: ICompiler,
  assetPath: string,
  rebaseFrom: string,
  calledOnLoad?: boolean,
) {
  const fileContent = await fs.promises.readFile(assetPath);
  const { buildType, format, outDir } = this.config;
  const { limit, path, publicPath } = this.config.asset;
  const hash = getHash(fileContent, null).slice(0, 8);

  const outputFileName = basename(assetPath).split('.').join(`.${hash}.`);
  const outputFilePath = resolve(outDir, path, outputFileName);
  const relativePath = relative(rebaseFrom, outputFilePath);
  const normalizedRelativePath = normalizeSlashes(
    relativePath.startsWith('..') ? relativePath : `./${relativePath}`,
  );
  const normalizedPublicPath = `${
    typeof publicPath === 'function' ? publicPath(assetPath) : publicPath
  }${path}/${outputFileName}`;

  let emitAsset = true;
  let contents: string | Buffer = normalizedPublicPath;
  let loader: Loader = 'text';
  if (buildType === 'bundle') {
    // inline base64
    if (fileContent.length <= limit) {
      const mimetype = (await import('mime-types')).default.lookup(assetPath);
      const isSVG = mimetype === 'image/svg+xml';
      const data = isSVG
        ? encodeSVG(fileContent)
        : fileContent.toString('base64');
      const encoding = isSVG ? '' : ';base64';
      contents = `data:${mimetype}${encoding},${data}`;
      loader = 'text';
      emitAsset = false;
    } else if ((format === 'esm' || format === 'cjs') && !publicPath) {
      contents = calledOnLoad ? fileContent : normalizedRelativePath;
      loader = calledOnLoad ? 'copy' : 'text';
      emitAsset = !calledOnLoad;
    }
  } else {
    // bundleless
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

export async function loadSvgr(
  path: string,
  options: boolean | SvgrOptions,
): Promise<LoadResult | undefined> {
  if (!options) {
    return;
  }

  const config = typeof options === 'boolean' ? {} : options;

  const filter = createFilter(config.include || SVG_REGEXP, config.exclude);
  if (!filter(path)) {
    return;
  }
  const loader = 'jsx';
  const text = fs.readFileSync(path, 'utf8');
  const jsCode = await transform(text, config, {
    filePath: path,
    caller: {
      name: 'svgr',
      defaultPlugins: [svgo, jsx],
    },
  });
  return {
    contents: jsCode,
    loader,
  };
}
