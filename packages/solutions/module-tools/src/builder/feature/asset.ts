import { basename, join, extname, relative, dirname, resolve } from 'path';
import fs from 'fs';
import _ from '@modern-js/utils/lodash';
import type { Loader } from 'esbuild';
import { createFilter } from '@rollup/pluginutils';
import { transform } from '../../../compiled/@svgr/core';
import svgo from '../../../compiled/@svgr/plugin-svgo';
import jsx from '../../../compiled/@svgr/plugin-jsx';
import type { ICompiler, SvgrOptions, Asset } from '../../types';
import { assetExt } from '../../constants/file';
import { normalizeSlashes, getHash } from '../../utils';

const name = 'asset';
const SVG_REGEXP = /\.svg$/;

export const asset = {
  name,
  apply(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (assetExt.find(ext => ext === extname(args.path))) {
        const { buildType, outDir, sourceDir } = compiler.config;

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

const getDefaultSVGRConfig = (): SvgrOptions => ({
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // viewBox is required to resize SVGs with CSS.
            // @see https://github.com/svg/svgo/issues/1128
            removeViewBox: false,
          },
        },
      },
      'prefixIds',
    ],
  },
});

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
  const { limit, path, publicPath, svgr, name } = this.config.asset;
  const hash = getHash(fileContent, null).slice(0, 8);
  const outputFileName = getOutputFileName(assetPath, name, hash);
  const outputFilePath = resolve(outDir, path, outputFileName);
  const relativePath = relative(rebaseFrom, outputFilePath);
  const normalizedRelativePath = normalizeSlashes(
    relativePath.startsWith('..') ? relativePath : `./${relativePath}`,
  );
  const normalizedPublicPath = `${
    typeof publicPath === 'function' ? publicPath(assetPath) : publicPath
  }${path}/${outputFileName}`;

  // default url-loader
  let emitAsset = true;
  let contents: string | Buffer = normalizedPublicPath;
  let loader: Loader = 'text';

  const defaultConfig = getDefaultSVGRConfig();
  const config =
    typeof svgr === 'boolean' ? defaultConfig : _.merge(defaultConfig, svgr);

  const filter = createFilter(config.include || SVG_REGEXP, config.exclude);
  if (svgr && filter(assetPath)) {
    // svgr jsx-loader

    // HACK: only support public path, the same as url-loader of webpack and rollup,
    // in fact, url-loader is not applicable to library scenario except for umd.
    const previousExport =
      config.exportType === 'named'
        ? `export default "${normalizedPublicPath}"`
        : null;
    contents = await transform(fileContent.toString(), config, {
      filePath: assetPath,
      caller: {
        name: 'svgr',
        defaultPlugins: [svgo, jsx],
        previousExport,
      },
    });
    loader = 'jsx';
    // if use url-loader, should copy asset by user, not emit in dist, or copy public dir like webpack.
    emitAsset = false;
  } else if (buildType === 'bundle') {
    // inline base64 text-loader
    if (fileContent.length <= limit) {
      const mimetype = (
        await import('@modern-js/utils/mime-types')
      ).default.lookup(assetPath);
      const isSVG = mimetype === 'image/svg+xml';
      const data = isSVG
        ? encodeSVG(fileContent)
        : fileContent.toString('base64');
      const encoding = isSVG ? '' : ';base64';
      contents = `data:${mimetype}${encoding},${data}`;
      loader = 'text';
      emitAsset = false;
    } else if ((format === 'esm' || format === 'cjs') && !publicPath) {
      // copy-loader
      // in the library scenario, the copy loader takes precedence over the url loader,
      // so we use relative path.
      contents = calledOnLoad ? fileContent : normalizedRelativePath;
      loader = calledOnLoad ? 'copy' : 'text';
      emitAsset = !calledOnLoad;
    }
  } else {
    // bundleless, it will be called in redirect plugin,
    // so we use relative path.
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

function getOutputFileName(
  filePath: string,
  assetName: Required<Asset['name']>,
  hash: string,
) {
  const format =
    typeof assetName === 'function' ? assetName(filePath) : assetName;
  const fileBaseNameArray = basename(filePath).split('.');
  const extname = fileBaseNameArray.pop() ?? '';
  const fileBaseName = fileBaseNameArray.join('.');
  const outputFileName = format.replace(
    /(\[[^\]]*\])/g,
    (str: string, match: string): string => {
      if (match === '[name]') {
        return fileBaseName;
      }
      if (match === '[ext]') {
        return extname;
      }
      if (match === '[hash]') {
        return hash;
      }
      return match;
    },
  );

  return outputFileName;
}
