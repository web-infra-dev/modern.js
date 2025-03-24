import type { UniBuilderInstance } from '@modern-js/uni-builder';
import { merge } from '@modern-js/utils/lodash';
import type { ModernDevServerOptions } from '../types';
import { getDefaultDevOptions } from './constants';

export const getDevOptions = (options: ModernDevServerOptions) => {
  const devOptions = options.dev;
  const defaultOptions = getDefaultDevOptions();
  return merge(defaultOptions, devOptions);
};

export const getDevAssetPrefix = (builder?: UniBuilderInstance) => {
  return new Promise<string>(resolve => {
    if (!builder) {
      return resolve('');
    }

    builder?.onAfterCreateCompiler(params => {
      let webCompiler: typeof params.compiler;
      if ('compilers' in params.compiler) {
        webCompiler = params.compiler.compilers.find(c => {
          return c.name === 'web';
        })!;
      } else {
        webCompiler = params.compiler;
      }

      const publicPath = webCompiler.options.output.publicPath;
      if (publicPath && typeof publicPath === 'string') {
        // remove host and port
        const formatPublicPath = publicPath.replace(/^https?:\/\/[^/]+/, '');
        return resolve(formatPublicPath);
      }

      return resolve('');
    });
  });
};
