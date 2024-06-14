import { promisify } from 'util';
import type { LoaderContext } from 'webpack';
import { logger } from '@modern-js/utils/logger';
import { generateClient } from './generateClient';

type Context = {
  mapFile: string;
  loaderId: string;
  clientData?: boolean;
  action: boolean;
  inline: boolean;
  routeId: string;
};

export default async function loader(
  this: LoaderContext<Context>,
  source: string,
) {
  this.cacheable();
  const target = this._compiler?.options.target;
  if (target === 'node' || (Array.isArray(target) && target.includes('node'))) {
    return source;
  }
  if (
    target === 'webworker' ||
    (Array.isArray(target) && target.includes('webworker'))
  ) {
    return source;
  }

  const { resourceQuery } = this;
  // parse options from resouceQuery
  const options = resourceQuery
    .slice(1)
    .split('&')
    .reduce((pre, cur) => {
      const [key, value] = cur.split('=');
      if (key && value) {
        // eslint-disable-next-line no-nested-ternary
        pre[key] = value === 'true' ? true : value === 'false' ? false : value;
      }
      return pre;
    }, {} as Record<string, any>);

  if (!options.loaderId) {
    return source;
  }

  if (options.clientData) {
    const readFile = promisify(this.fs.readFile);
    try {
      const clientDataPath = this.resourcePath.includes('.loader.')
        ? this.resourcePath.replace('.loader.', '.data.client.')
        : this.resourcePath.replace('.data.', '.data.client.');

      this.addDependency(clientDataPath);

      const clientDataContent = await readFile(clientDataPath);
      return clientDataContent;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(
          `Failed to read the clientData file ${options.clientData}`,
        );
      }
    }
  }

  const code = generateClient({
    inline: options.inline,
    action: options.action,
    routeId: options.routeId,
  });

  return code;
}
