import * as tapable from 'tapable';
import { Source, ILibuilder, Chunk } from '../types';
export declare function createTransformHook(compiler: ILibuilder): tapable.AsyncSeriesWaterfallHook<Source, tapable.UnsetAdditionalOptions>;
export declare function createProcessAssetHook(compiler: ILibuilder): tapable.AsyncSeriesWaterfallHook<Chunk, tapable.UnsetAdditionalOptions>;
//# sourceMappingURL=utils.d.ts.map