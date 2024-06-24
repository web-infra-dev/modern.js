import path from 'path';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';
import { CacheOption, Container } from '@modern-js/types';
import { CacheConfig } from '../../../types';

const CACHE_FILENAME = 'cache';

interface CacheMod {
  customContainer?: Container;
  cacheOption?: CacheOption;
}

export function loadCacheConfig(pwd: string): CacheConfig | undefined {
  const serverCacheFilepath = path.resolve(pwd, SERVER_DIR, CACHE_FILENAME);
  const mod: CacheMod | undefined = requireExistModule(serverCacheFilepath, {
    interop: false,
  });

  if (mod?.cacheOption) {
    return {
      strategy: mod.cacheOption,
      container: mod.customContainer,
    };
  }

  return undefined;
}
