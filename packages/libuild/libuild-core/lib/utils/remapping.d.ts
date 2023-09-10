import type { SourceMap } from '../types';
export type MergeMapResult = {
    toString: () => string;
    toMap: () => SourceMap;
    toComment: () => string;
};
export declare function mergeMaps(mapList: SourceMap[]): MergeMapResult;
//# sourceMappingURL=remapping.d.ts.map