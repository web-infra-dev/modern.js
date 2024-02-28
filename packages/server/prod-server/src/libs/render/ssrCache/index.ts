import { IncomingMessage } from 'http';
import { Transform } from 'stream';
import {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
} from '@modern-js/types';
import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import { RenderFunction, SSRServerContext } from '../type';
import { cacheMod } from './cacheMod';
import { CacheManager, CacheResult } from './manager';

const cacheStorage = createMemoryStorage<string>('__ssr__cache');

export async function ssrCache(
  req: IncomingMessage,
  render: RenderFunction,
  ssrContext: SSRServerContext,
): Promise<CacheResult> {
  const { customContainer, cacheOption } = cacheMod;
  const cacheControl = await matchCacheControl(req, cacheOption);
  const cacheManager = new CacheManager(
    customContainer ? customContainer : cacheStorage,
  );

  if (cacheControl) {
    return cacheManager.getCacheResult(req, cacheControl, render, ssrContext);
  } else {
    const renderResult = await render(ssrContext);
    if (!renderResult) {
      return {
        data: '',
      };
    } else if (typeof renderResult === 'string') {
      return {
        data: renderResult,
      };
    } else {
      const stream = new Transform({
        write(chunk, _, callback) {
          this.push(chunk);
          callback();
        },
      });
      const data = await renderResult(stream);
      return {
        data,
      };
    }
  }
}

async function matchCacheControl(
  req: IncomingMessage,
  cacheOption?: CacheOption,
): Promise<CacheControl | undefined> {
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
