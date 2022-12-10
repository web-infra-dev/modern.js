import inner from '@rspack/dev-middleware';
import type { ModernDevServerOptions } from '@modern-js/server';

import type { Compiler } from '@rspack/core';

type DevMiddlewareOptions = ModernDevServerOptions['devMiddleware'];

export function getHotRuntimeEntries(compiler: Compiler) {
  const hot = compiler.options.devServer?.hot ?? true;
  const refresh = compiler.options.builtins?.react?.refresh ?? true;
  const entries: string[] = [];

  if (hot) {
    if (refresh) {
      const reactRefreshEntryPath = require.resolve(
        '@rspack/dev-client/react-refresh',
      );
      entries.push(reactRefreshEntryPath);
    }
  }

  return entries;
}

type IHookCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

const setupHooks = (compiler: Compiler, hookCallbacks: IHookCallbacks) => {
  const addHooks = (compiler: Compiler) => {
    if (compiler.name === 'server') {
      return;
    }

    const { compile, invalid, done } = compiler.hooks;

    compile.tap('modern-dev-server', hookCallbacks.onInvalid);
    invalid.tap('modern-dev-server', hookCallbacks.onInvalid);
    done.tap('modern-dev-server', hookCallbacks.onDone);
  };

  addHooks(compiler);
};

function applyHMREntry(compiler: Compiler, clientPath: string) {
  const hotRuntimeEntires = getHotRuntimeEntries(compiler);

  const entires = [
    ...hotRuntimeEntires,
    // TODO: temp hack. https://github.com/speedy-js/rspack/issues/1337
    // compat webpack module variables.
    require.resolve('./hmr-client-hack'),
    // TODO: rspack resolve bug
    // clientPath.slice(0, clientPath.indexOf('?')),
    clientPath,
  ];

  for (const key in compiler.options.entry) {
    compiler.options.entry[key].import.unshift(...entires);
  }
}

export const getDevMiddleware: (compiler: Compiler) => DevMiddlewareOptions =
  compiler => options => {
    const { hmrClientPath, callbacks, ...restOptions } = options;

    applyHMREntry(compiler, hmrClientPath);

    // register hooks for each compilation, update socket stats if recompiled
    setupHooks(compiler, callbacks);

    // @ts-expect-error
    return inner(compiler, restOptions);
  };
