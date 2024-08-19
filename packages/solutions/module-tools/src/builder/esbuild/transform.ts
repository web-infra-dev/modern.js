import type { ITransformContext, CacheValue } from '../../types';
import { SourcemapContext } from './sourcemap';

export class TransformContext
  extends SourcemapContext
  implements ITransformContext
{
  private cachedTransformResult: Map<number, CacheValue> = new Map<
    number,
    CacheValue
  >();

  public addTransformResult(pluginId: number, result: CacheValue) {
    this.cachedTransformResult.set(pluginId, result);
    this.addSourceMap(pluginId, result.map);
  }

  public getValidCache(pluginId: number, code: string) {
    const cache = this.cachedTransformResult.get(pluginId);
    if (cache && cache.originCode === code) {
      return cache;
    }
  }
}
