import { promisify } from 'util';
import { logger } from '@modern-js/utils/logger';
import type { Rspack } from '@rsbuild/core';
import { generateClient } from './generateClient';

type Context = {
  mapFile: string;
  loaderId: string;
  clientData?: boolean;
  action: boolean;
  inline: boolean;
  routeId: string;
  retain: boolean;
};

export default async function loader(
  this: Rspack.LoaderContext<Context>,
  source: string,
) {
  this.cacheable();
  const { target, output } = this._compiler?.options || {};

  const shouldSkip = (compileTarget: string) => {
    return (
      target === compileTarget ||
      (Array.isArray(target) && (target as string[]).includes(compileTarget))
    );
  };

  if (
    shouldSkip('node') ||
    shouldSkip('webworker') ||
    shouldSkip('async-node') ||
    // edge environment set target to es2020, but it actually runs on the server, use chunkLoading to detect
    // @see solutions/app-tools/src/plugins/deploy/edge/config/apply.ts
    output?.chunkLoading === 'edgeChunkLoad'
  ) {
    return source;
  }

  const { resourceQuery } = this;
  // parse options from resouceQuery
  const options = resourceQuery
    .slice(1)
    .split('&')
    .reduce(
      (pre, cur) => {
        const [key, value] = cur.split('=');
        if (key && value) {
          pre[key] =
            value === 'true' ? true : value === 'false' ? false : value;
        }
        return pre;
      },
      {} as Record<string, any>,
    );

  if (!options.loaderId || options.retain) {
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
