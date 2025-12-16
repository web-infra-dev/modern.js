import type { BuilderInstance } from '@modern-js/builder';
import type { DevServerOptions } from '../types';

export const getDevOptions = (devOptions: DevServerOptions) => {
  const defaultOptions: DevServerOptions = {
    https: false,
    server: {},
  };
  return {
    ...defaultOptions,
    ...devOptions,
  };
};

export const getDevAssetPrefix = (builder?: BuilderInstance) => {
  return new Promise<string>(resolve => {
    if (!builder) {
      return resolve('');
    }

    builder?.onAfterCreateCompiler(params => {
      let webCompiler: typeof params.compiler;
      if ('compilers' in params.compiler) {
        webCompiler = params.compiler.compilers.find(c => {
          return c.name === 'web' || c.name === 'client';
        })!;
      } else {
        webCompiler = params.compiler;
      }

      const publicPath = webCompiler?.options?.output?.publicPath;
      if (publicPath && typeof publicPath === 'string') {
        // remove host and port
        const formatPublicPath = publicPath.replace(/^https?:\/\/[^/]+/, '');
        return resolve(formatPublicPath);
      }

      return resolve('');
    });
  });
};
