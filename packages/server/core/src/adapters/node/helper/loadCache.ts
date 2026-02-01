import path from 'path';
import type { CacheOption, Container } from '@modern-js/types';
import {
  SERVER_DIR,
  normalizeToPosixPath,
  requireExistModule,
} from '@modern-js/utils';
import type { CacheConfig } from '../../../types';
import { getBundledDep } from './getBundledDep';

const CACHE_FILENAME = 'cache';

interface CacheMod {
  customContainer?: Container;
  cacheOption?: CacheOption;
}

export async function loadCacheConfig(
  pwd: string,
): Promise<CacheConfig | undefined> {
  const serverCacheFilepath = path.resolve(pwd, SERVER_DIR, CACHE_FILENAME);
  const mod: CacheMod | undefined = await requireExistModule(
    serverCacheFilepath,
    {
      interop: false,
    },
  );

  if (mod?.cacheOption) {
    return {
      strategy: mod.cacheOption,
      container: mod.customContainer,
    };
  }

  return undefined;
}

export async function loadBundledCacheConfig(
  deps?: Record<string, Promise<any>>,
): Promise<CacheConfig | undefined> {
  const serverCacheFilepath = path
    .join(SERVER_DIR, CACHE_FILENAME)
    .replace(/\\/g, '/');
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
