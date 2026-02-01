import path from 'path';
import type { CacheOption, Container } from '@modern-js/types';
import { SERVER_DIR } from '@modern-js/utils';
import type { CacheConfig } from '../../../types';
import { getBundledDep } from './getBundledDep';

const CACHE_FILENAME = 'cache';

interface CacheMod {
  customContainer?: Container;
  cacheOption?: CacheOption;
}

export async function loadBundledCacheConfig(
  deps?: Record<string, Promise<any>>,
): Promise<CacheConfig | undefined> {
  const serverCacheFilepath = path.join(SERVER_DIR, CACHE_FILENAME);
  const mod: CacheMod | undefined = await getBundledDep(
    serverCacheFilepath,
    deps,
    false,
  );

  if (mod?.cacheOption) {
    return {
      strategy: mod.cacheOption,
      container: mod.customContainer,
    };
  }

  return undefined;
}
