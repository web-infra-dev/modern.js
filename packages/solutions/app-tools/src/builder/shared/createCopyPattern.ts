import path from 'path';
import { WebpackChain } from '@modern-js/builder-webpack-provider';
import { removeTailSlash } from '@modern-js/utils';
import { AppNormalizedConfig, IAppContext } from '@/types';

export function createCopyPattern(
  appContext: IAppContext,
  config: AppNormalizedConfig,
  patternsType: 'upload' | 'public',
  chain?: WebpackChain,
) {
  const configDir = path.resolve(
    appContext.appDirectory,
    config.source.configDir || './config',
  );
  const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
  const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

  const minifiedJsRexExp = /\.min\.js/;
  const info = (file: { sourceFilename: string }) => ({
    // If the file name ends with `.min.js`, we assume it's a compressed file.
    // So we don't want copy-webpack-plugin to minify it.
    // ref: https://github.com/webpack-contrib/copy-webpack-plugin#info
    minimized: minifiedJsRexExp.test(file.sourceFilename),
  });

  if (patternsType === 'public') {
    if (!chain) {
      throw new Error("expect get a webpackChain, but receive 'undefined'");
    }
    return {
      info,
      from: '**/*',
      to: 'public',
      context: publicDir,
      noErrorOnMissing: true,
      // eslint-disable-next-line node/prefer-global/buffer
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
  } else {
    return {
      info,
      from: '**/*',
      to: 'upload',
      context: uploadDir,
      noErrorOnMissing: true,
    };
  }
}
