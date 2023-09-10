import { RawSourceMap } from '@ampproject/remapping/dist/types/types';
import { SourceMap } from '../types';
interface Options {
    needSourceMap: boolean;
}
export declare function normalizeSourceMap(map: string | RawSourceMap | undefined, opts?: Options): SourceMap | undefined;
export {};
//# sourceMappingURL=normalizeSourceMap.d.ts.map