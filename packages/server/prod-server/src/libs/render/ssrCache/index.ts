import { IncomingMessage } from 'http';
import { Transform, type Readable } from 'stream';
import {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
} from '@modern-js/types';
import { createMemoryStorage } from '@modern-js/runtime-utils/storage';
import { RenderFunction, SSRServerContext } from '../type';
import { cacheMod } from './cacheMod';
import { CacheManager } from './manager';

const cacheStorage = createMemoryStorage<string>('__ssr__cache');

export async function ssrCache(
  req: IncomingMessage,
  render: RenderFunction,
  ssrContext: SSRServerContext,
): Promise<string | Readable> {
  if (!cacheMod.loaded) {
    cacheMod.loadServerCacheMod();
  }
  const { customContainer, cacheOption } = cacheMod;
  const cacheControl = matchCacheControl(req, cacheOption);
  const cacheManager = new CacheManager(
    customContainer ? customContainer : cacheStorage,
  );

  if (cacheControl) {
    return cacheManager.getCacheResult(req, cacheControl, render, ssrContext);
  } else {
    const renderResult = await render(ssrContext);
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
