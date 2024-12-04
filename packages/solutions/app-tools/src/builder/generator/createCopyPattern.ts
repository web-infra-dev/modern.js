import { removeTailSlash } from '@modern-js/utils';
import type { Rspack, RspackChain } from '@rsbuild/core';
import type { AppNormalizedConfig, Bundler } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { createCopyInfo } from '../shared';

const minifiedJsRexExp = /\.min\.js/;
const info = (file: { sourceFilename: string }) => ({
  // If the file name ends with `.min.js`, we assume it's a compressed file.
  // So we don't want copy-webpack-plugin to minify it.
  // ref: https://github.com/webpack-contrib/copy-webpack-plugin#info
  minimized: minifiedJsRexExp.test(file.sourceFilename),
});

export function createPublicPattern<B extends Bundler>(
  appContext: AppToolsContext<B>,
  config: AppNormalizedConfig,
  chain: RspackChain,
) {
  const { publicDir } = createCopyInfo(appContext, config);
  return {
    info,
    from: '**/*',
    to: 'public',
    context: publicDir,
    noErrorOnMissing: true,
    transform: (content: Buffer, absoluteFrom: string) => {
      if (!/\.html?$/.test(absoluteFrom)) {
        return content;
      }

      return content
        .toString('utf8')
        .replace(
          /<%=\s*assetPrefix\s*%>/g,
          removeTailSlash(chain.output.get('publicPath')),
        );
    },
  };
}

export function createUploadPattern<B extends Bundler>(
  appContext: AppToolsContext<B>,
  config: AppNormalizedConfig<B>,
): Rspack.CopyRspackPluginOptions['patterns']['0'] {
  const { uploadDir } = createCopyInfo<B>(appContext, config);
  return {
    // rspack copy info structure is inconsistent with webpack, it only used in webpack mode
    // @ts-expect-error
    info,
    from: '**/*',
    to: 'upload',
    context: uploadDir,
    noErrorOnMissing: true,
  };
}
