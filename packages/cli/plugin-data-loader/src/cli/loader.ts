// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @babel/no-invalid-this */
import type { LoaderContext } from 'webpack';
import { generateClient } from './generateClient';

export default async function loader(
  this: LoaderContext<{
    mapFile: string;
    loaderId?: string;
  }>,
  source: string,
) {
  this.cacheable();
  const target = this._compiler?.options.target;
  if (target === 'node') {
    return source;
  }
  if (target === 'webworker') {
    return source;
  }
  const { resourceQuery } = this;

  // parse options from resouceQuery
  const options = resourceQuery
    .slice(1)
    .split('&')
    .map(item => {
      return item.split('=');
    })
    .reduce((pre, cur) => {
      const [key, value] = cur;
      if (!key || !value) {
        return pre;
      }
      pre[key] = value;
      return pre;
    }, {} as Record<string, any>) as { mapFile: string; loaderId?: string };

  // if we can not parse mapFile from resourceQuery, it means the with no need for data-loader handle.
  if (!options.mapFile) {
    return source;
  }

  const code = generateClient({
    mapFile: options.mapFile,
    loaderId: options.loaderId,
  });
  return code;
}
