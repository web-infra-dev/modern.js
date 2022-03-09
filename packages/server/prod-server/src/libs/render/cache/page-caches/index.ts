import { PageCachesInterface } from '../type';
import { LRUCaches } from './lru';

export async function createPageCaches(
  max: number,
): Promise<PageCachesInterface> {
  const constructorOptions = { max };
  const cacheInstance = new LRUCaches(constructorOptions);
  await cacheInstance.init();
  return cacheInstance;
}
