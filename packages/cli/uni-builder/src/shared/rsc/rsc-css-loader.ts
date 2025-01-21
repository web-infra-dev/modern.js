import type { LoaderContext } from 'webpack';
import { setRscBuildInfo } from './common';

export default function rscCssLoader(this: LoaderContext<any>, source: string) {
  this._module &&
    setRscBuildInfo(this._module, {
      isCssModule: true,
    });
  return source;
}
