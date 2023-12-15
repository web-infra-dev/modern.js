import path from 'path';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';
import type { CacheOption, Container } from '@modern-js/types';

const CACHE_FILENAME = 'cache';
type CacheMod = {
  customContainer?: Container;
  cacheOption?: CacheOption;
};

class ServerCacheMod {
  customContainer?: Container;

  cacheOption?: CacheOption;

  loadServerCacheMod(pwd: string = process.cwd()) {
    const serverCacheFilepath = path.resolve(pwd, SERVER_DIR, CACHE_FILENAME);
    const mod: CacheMod | undefined = requireExistModule(serverCacheFilepath, {
      interop: false,
    });

    this.customContainer = mod?.customContainer;
    this.cacheOption = mod?.cacheOption;
  }
}

export const cacheMod = new ServerCacheMod();
