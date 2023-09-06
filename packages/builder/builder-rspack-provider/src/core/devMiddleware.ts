// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import webpackDevMiddleware from '@modern-js/utils/webpack-dev-middleware';
import type { ModernDevServerOptions } from '@modern-js/server';
import { setupServerHooks, isClientCompiler } from '@modern-js/builder-shared';

import type { Compiler, MultiCompiler } from '@rspack/core';

type DevMiddlewareOptions = ModernDevServerOptions['devMiddleware'];

export function getHotRuntimeEntries(compiler: Compiler) {
  const hot = compiler.options.devServer?.hot ?? true;
  const refresh = compiler.options.builtins?.react?.refresh ?? true;

  if (hot && refresh) {
    const reactRefreshEntryPath = require.resolve(
      '@rspack/dev-client/react-refresh-entry',
    );
    return [reactRefreshEntryPath];
  }

  return [];
}

function applyHMREntry(compiler: Compiler, clientPath: string) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  const hotRuntimeEntires = getHotRuntimeEntries(compiler);

  const entires = [...hotRuntimeEntires, clientPath];

  for (const key in compiler.options.entry) {
    compiler.options.entry[key].import = [
      ...entires,
      ...(compiler.options.entry[key].import || []),
    ];
  }
}

export const getDevMiddleware: (
  compiler: Compiler | MultiCompiler,
) => NonNullable<DevMiddlewareOptions> = compiler => options => {
  const { hmrClientPath, callbacks, ...restOptions } = options;

  if ((compiler as MultiCompiler).compilers) {
    (compiler as MultiCompiler).compilers.forEach(compiler => {
      hmrClientPath && applyHMREntry(compiler, hmrClientPath);

      // register hooks for each compilation, update socket stats if recompiled
      setupServerHooks(compiler, callbacks);
    });
  } else {
    hmrClientPath && applyHMREntry(compiler as Compiler, hmrClientPath);

    // register hooks for each compilation, update socket stats if recompiled
    setupServerHooks(compiler as Compiler, callbacks);
  }

  // @ts-expect-error
  return webpackDevMiddleware(compiler, restOptions);
};
