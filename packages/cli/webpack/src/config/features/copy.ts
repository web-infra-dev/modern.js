import path from 'path';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import { CHAIN_ID, fs, removeTailSlash } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyCopyPlugin({ chain, config, appContext }: ChainUtils) {
  const configDir = path.resolve(
    appContext.appDirectory,
    config.source.configDir!,
  );

  const patterns = [...(config.output.copy || [])];
  const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
  const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

  const minifiedJsRexExp = /\.min\.js/;
  const info = (file: { sourceFilename: string }) => ({
    // If the file name ends with `.min.js`, we assume it's a compressed file.
    // So we don't want copy-webpack-plugin to minify it.
    // ref: https://github.com/webpack-contrib/copy-webpack-plugin#info
    minimized: minifiedJsRexExp.test(file.sourceFilename),
  });

  // add the pattern only if the corresponding directory exists,
  // otherwise it will cause the webpack recompile.
  if (fs.existsSync(uploadDir)) {
    patterns.push({
      info,
      from: '**/*',
      to: 'upload',
      context: uploadDir,
      noErrorOnMissing: true,
    });
  }

  if (fs.existsSync(publicDir)) {
    patterns.push({
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

        return lodashTemplate(content.toString('utf8'))({
          assetPrefix: removeTailSlash(chain.output.get('publicPath')),
        });
      },
    });
  }

  // options.patterns should be a non-empty array
  if (patterns.length) {
    const CopyPlugin = require('../../../compiled/copy-webpack-plugin');
    chain.plugin(CHAIN_ID.PLUGIN.COPY).use(CopyPlugin, [{ patterns }]);
  }
}
