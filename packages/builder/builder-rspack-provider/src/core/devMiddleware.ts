import inner from '@rspack/dev-middleware';
import type { ModernDevServerOptions } from '@modern-js/server';
import { setupServerHooks } from '@modern-js/builder-shared';

import type { Compiler } from '@rspack/core';

type DevMiddlewareOptions = ModernDevServerOptions['devMiddleware'];

export function getHotRuntimeEntries(compiler: Compiler) {
  const hot = compiler.options.devServer?.hot ?? true;
  const refresh = compiler.options.builtins?.react?.refresh ?? true;

  if (hot && refresh) {
    const reactRefreshEntryPath = require.resolve(
      '@rspack/dev-client/react-refresh',
    );
    return [reactRefreshEntryPath];
  }

  return [];
}

function applyHMREntry(compiler: Compiler, clientPath: string) {
  const hotRuntimeEntires = getHotRuntimeEntries(compiler);

  const entires = [
    ...hotRuntimeEntires,
    // TODO: temp hack. https://github.com/speedy-js/rspack/issues/1337
    // compat webpack module variables.
    require.resolve('./hmr-client-hack'),
    clientPath,
  ];

  for (const key in compiler.options.entry) {
    compiler.options.entry[key].import.unshift(...entires);
  }
}

export const getDevMiddleware: (compiler: Compiler) => DevMiddlewareOptions =
  compiler => options => {
    const { hmrClientPath, callbacks, ...restOptions } = options;

    hmrClientPath && applyHMREntry(compiler, hmrClientPath);

    // register hooks for each compilation, update socket stats if recompiled
    setupServerHooks(compiler, callbacks);

    // @ts-expect-error
    return inner(compiler, restOptions);
  };
