// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @babel/no-invalid-this */
import type { LoaderContext } from 'webpack';
import { generateClient } from './generate-client';

export default async function loader(
  this: LoaderContext<{
    routesDir: string;
    entryName: string;
    mapFile: string;
  }>,
  source: string,
) {
  this.cacheable();
  const target = this._compiler?.options.target;
  if (target === 'node') {
    return source;
  }
  const options = this.getOptions();
  const code = generateClient({
    mapFile: options.mapFile,
  });
  return code;
}
