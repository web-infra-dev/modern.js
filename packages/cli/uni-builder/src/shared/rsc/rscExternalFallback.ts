import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';

/**
 * Add RSC external fallback when RSC is disabled.
 * When RSC is disabled, provide an empty fallback for react-server-dom-webpack
 * to avoid build errors while still allowing projects that may have conditional imports.
 */
export function addRscExternalFallback(
  rsbuildConfig: RsbuildConfig,
  rsbuildPlugins: RsbuildPlugin[],
): void {
  const existingExternals = rsbuildConfig.output?.externals;
  rsbuildConfig.output ??= {};
  const externalsArray = Array.isArray(existingExternals)
    ? existingExternals
    : existingExternals
      ? [existingExternals]
      : [];

  rsbuildConfig.output.externals = [
    ...externalsArray,
    {
      'react-server-dom-webpack': '__REACT_SERVER_DOM_WEBPACK_EMPTY__',
    },
  ];

  rsbuildConfig.source ??= {};
  rsbuildConfig.source.define ??= {};
  if (!('__REACT_SERVER_DOM_WEBPACK_EMPTY__' in rsbuildConfig.source.define)) {
    rsbuildConfig.source.define.__REACT_SERVER_DOM_WEBPACK_EMPTY__ = '{}';
  }
}
