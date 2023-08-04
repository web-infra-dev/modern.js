import { ITransformContext, CacheValue } from '../types';
import { SourcemapContext } from './sourcemap';

export class TransformContext extends SourcemapContext implements ITransformContext {
  private cachedTransformResult: Map<number, CacheValue> = new Map<number, CacheValue>();

  constructor(private enableCache?: boolean, enableSourceMap?: boolean) {
    super(enableSourceMap);
  }

  public addTransformResult(pluginId: number, result: CacheValue) {
    if (result.cache !== false && this.enableCache) {
      this.cachedTransformResult.set(pluginId, result);
    }
    this.addSourceMap(pluginId, result.map);
  }

  public getValidCache(pluginId: number, code: string) {
    if (this.enableCache) {
      const cache = this.cachedTransformResult.get(pluginId);
      if (cache && cache.originCode === code) {
        return cache;
      }
      // else {
      //   console.log('miss cache')
      // }
    }
  }
}
