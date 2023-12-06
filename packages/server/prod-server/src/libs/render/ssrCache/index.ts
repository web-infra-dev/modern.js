import { IncomingMessage } from 'http';
import { Transform, type Readable } from 'stream';
import { ModernServerContext } from '@modern-js/types';
import {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
  RenderFunction,
  SSRServerContext,
} from '../type';
import { CacheManager } from './manager';

type ServerRender = RenderFunction;

export async function ssrCache(
  req: IncomingMessage,
  serverContext: ModernServerContext,
  serverRender: ServerRender,
  ssrContext: SSRServerContext,
  cacheOption?: CacheOption,
): Promise<string | Readable> {
  const cacheControl = matchCacheControl(req, cacheOption);
  const asyncRender = serverRender(ssrContext);

  if (cacheControl) {
    return new CacheManager().getCacheResult(req, cacheControl, asyncRender);
  } else {
    const renderResult = await asyncRender;
    if (typeof renderResult === 'string') {
      return renderResult;
    } else {
      const stream = new Transform({
        write(chunk, _, callback) {
          this.push(chunk);
          callback();
        },
      });
      return renderResult(stream);
    }
  }
}

function matchCacheControl(
  req: IncomingMessage,
  cacheOption?: CacheOption,
): CacheControl | undefined {
  if (!cacheOption) {
    return undefined;
  } else if (isCacheControl(cacheOption)) {
    return cacheOption;
  } else if (isCacheOptionProvider(cacheOption)) {
    return cacheOption(req);
  } else {
    const url = req.url!;
    const options = Object.entries(cacheOption);

    for (const [key, option] of options) {
      if (key === '*' || new RegExp(key).test(url)) {
        if (typeof option === 'function') {
          return option(req);
        } else {
          return option;
        }
      }
    }

    return undefined;
  }

  function isCacheOptionProvider(
    option: CacheOption,
  ): option is CacheOptionProvider {
    return typeof option === 'function';
  }

  function isCacheControl(option: CacheOption): option is CacheControl {
    return typeof option === 'object' && option !== null && 'maxAge' in option;
  }
}
