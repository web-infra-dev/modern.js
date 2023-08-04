import _importLazy from 'import-lazy';

// https://github.com/microsoft/rushstack/blob/2dab02aa5f2989c4fc2ba276e929f179c857420c/libraries/node-core-library/src/Import.ts#L175
// https://github.com/sindresorhus/import-lazy#usage-with-bundlers
// Usage: const webpackBundleAnalyzer: typeof import('webpack-bundle-analyzer') = importLazy(() => require('webpack-bundle-analyzer'));
export function importLazy(getMod: () => any): any {
  // @ts-ignore
  return _importLazy(getMod)();
}
