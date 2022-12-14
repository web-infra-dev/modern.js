// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import webpackDevMiddleware from '@modern-js/utils/webpack-dev-middleware';
import type { Compiler, MultiCompiler } from 'webpack';
import type { ModernDevServerOptions } from '@modern-js/server';
import { setupServerHooks } from '@modern-js/builder-shared';

type DevMiddlewareOptions = ModernDevServerOptions['devMiddleware'];

const isClientCompiler = (compiler: Compiler) => {
  const { target } = compiler.options;

  // if target not contains `node`, it's a client compiler
  if (target) {
    if (Array.isArray(target)) {
      return !target.includes('node');
    }
    return target !== 'node';
  }

  return compiler.name === 'client';
};

const applyHMREntry = (
  compiler: Compiler | MultiCompiler,
  clientPath: string,
) => {
  const applyEntry = (clientEntry: string, compiler: Compiler) => {
    new compiler.webpack.EntryPlugin(compiler.context, clientEntry, {
      name: undefined,
    }).apply(compiler);
  };

  // apply dev server to client compiler, add hmr client to entry.
  if ((compiler as MultiCompiler).compilers) {
    (compiler as MultiCompiler).compilers.forEach(target => {
      if (isClientCompiler(target)) {
        applyEntry(clientPath, target);
      }
    });
  } else {
    applyEntry(clientPath, compiler as Compiler);
  }
};

type IHookCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

const setupHooks = (
  compiler: Compiler | MultiCompiler,
  hookCallbacks: IHookCallbacks,
) => {
  if ((compiler as MultiCompiler).compilers) {
    (compiler as MultiCompiler).compilers.forEach(compiler =>
      setupServerHooks(compiler, hookCallbacks),
    );
  } else {
    setupServerHooks(compiler as Compiler, hookCallbacks);
  }
};

export const getDevMiddleware: (
  compiler: Compiler | MultiCompiler,
) => NonNullable<DevMiddlewareOptions> = compiler => options => {
  const { hmrClientPath, callbacks, ...restOptions } = options;

  hmrClientPath && applyHMREntry(compiler, hmrClientPath);

  // register hooks for each compilation, update socket stats if recompiled
  setupHooks(compiler, callbacks);

  return webpackDevMiddleware(compiler, restOptions);
};
