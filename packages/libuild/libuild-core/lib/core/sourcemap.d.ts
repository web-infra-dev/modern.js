import { SourceMap, ISourcemapContext } from '../types';
export declare class SourcemapContext implements ISourcemapContext {
    private enableSourceMap?;
    private sourceMapChain;
    private sourceMapDirty;
    private cachedInlineSourceMap;
    private cachedSourceMap;
    private pluginIdMap;
    constructor(enableSourceMap?: boolean | undefined);
    private markSourceMapStatus;
    addSourceMap(pluginId: number, map?: SourceMap): void;
    getInlineSourceMap(): string;
    getSourceMap(): SourceMap | undefined;
    getSourceMapChain(): SourceMap[];
    genPluginId(name: string): number;
}
//# sourceMappingURL=sourcemap.d.ts.map