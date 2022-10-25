import type { webpack } from '../types';

export default function (this: webpack.LoaderContext<unknown>, source: string) {
  this?.cacheable(true);

  // if the source code include '___CSS_LOADER_EXPORT___'
  // It is not a CSS modules file because exportOnlyLocals is enabled,
  // so we don't need to preserve it.
  if (source.includes('___CSS_LOADER_EXPORT___')) {
    return '';
  }

  // Preserve css modules export for SSR.
  return source;
}
