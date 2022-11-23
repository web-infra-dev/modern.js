import inner from '@rspack/dev-middleware';
import type { Compiler } from '@rspack/core';

function getHotRuntimeEntries(hot: boolean, reactRefresh: boolean) {
  const entries: string[] = [];

  if (hot) {
    const hotUpdateEntryPath = require.resolve('@rspack/dev-client/devServer');
    entries.push(hotUpdateEntryPath);
    const cssHotEntryPath = require.resolve('@rspack/dev-client/css');
    entries.push(cssHotEntryPath);
    if (reactRefresh) {
      const reactRefreshEntryPath = require.resolve(
        '@rspack/dev-client/react-refresh',
      );
      entries.push(reactRefreshEntryPath);
    }
  }

  const devClientEntryPath = require.resolve('./hmr-client/entry.js');
  entries.push(devClientEntryPath);
  return entries;
}

function rdm(compiler: Compiler, options: Record<string, any>): any {
  const hot = compiler.options.devServer?.hot ?? true;
  const refresh = compiler.options.builtins?.react?.refresh ?? true;
  const hotRuntimeEntires = getHotRuntimeEntries(hot, refresh);

  for (const key in compiler.options.entry) {
    compiler.options.entry[key].unshift(...hotRuntimeEntires);
  }

  // @ts-expect-error
  return inner(compiler, options);
}

export { rdm };
