import path from 'path';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';
import type { Container } from '@modern-js/types';
import type { CacheOption } from './render/type';

const CACHE_FILENAME = 'cache';
type CacheMod = {
  customContainer?: Container;
  cacheOption?: CacheOption;
};

export function loadServerCacheMod(pwd: string = process.cwd()) {
  const serverCacheFilepath = path.resolve(pwd, SERVER_DIR, CACHE_FILENAME);

  const mod: CacheMod = requireExistModule(serverCacheFilepath, {
    interop: false,
  });

  const { customContainer, cacheOption } = mod;

  return {
    customContainer,
    cacheOption,
  };
}
