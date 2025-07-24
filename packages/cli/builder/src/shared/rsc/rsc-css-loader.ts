import type { Rspack } from '@rsbuild/core';
import { setRscBuildInfo } from './common';

export default function rscCssLoader(
  this: Rspack.LoaderContext<unknown>,
  source: string,
) {
  this._module &&
    setRscBuildInfo(this._module, {
      isCssModule: true,
    });
  return source;
}
