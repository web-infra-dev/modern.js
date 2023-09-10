import { ITransformContext, CacheValue } from '../types';
import { SourcemapContext } from './sourcemap';
export declare class TransformContext extends SourcemapContext implements ITransformContext {
    private enableCache?;
    private cachedTransformResult;
    constructor(enableCache?: boolean | undefined, enableSourceMap?: boolean);
    addTransformResult(pluginId: number, result: CacheValue): void;
    getValidCache(pluginId: number, code: string): CacheValue | undefined;
}
//# sourceMappingURL=transform.d.ts.map