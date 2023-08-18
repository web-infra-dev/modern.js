import { promisify } from 'util';
import type { LoaderContext } from 'webpack';
import { logger } from '@modern-js/utils/logger';
import { generateClient } from './generateClient';

type Context = {
  mapFile: string;
  loaderId?: string;
  clientData?: string;
};

export default async function loader(
  this: LoaderContext<Context>,
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
    }, {} as Record<string, any>) as Context;

  // if we can not parse mapFile from resourceQuery, it means the with no need for data-loader handle.
  if (!options.mapFile) {
    return source;
  }

  if (options.clientData) {
    const readFile = promisify(this.fs.readFile);
    try {
      const clientDataContent = await readFile(options.clientData);
      return clientDataContent;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Failed to read the clientData of ${options.clientData}`);
      }
    }
  }

  const code = generateClient({
    mapFile: options.mapFile,
    loaderId: options.loaderId,
  });
  return code;
}
