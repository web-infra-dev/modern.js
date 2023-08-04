import { SourceMap, ISourcemapContext } from '../types';
import { mergeMaps } from '../utils/remapping';

export class SourcemapContext implements ISourcemapContext {
  private sourceMapChain: (SourceMap | undefined)[] = [];

  private sourceMapDirty = false;

  private cachedInlineSourceMap = '';

  private cachedSourceMap: undefined | SourceMap;

  private pluginIdMap = new Map<string, number>();

  constructor(private enableSourceMap?: boolean) {}

  private markSourceMapStatus(dirty: boolean) {
    this.sourceMapDirty = dirty;
  }

  public addSourceMap(pluginId: number, map?: SourceMap) {
    if (this.enableSourceMap && this.sourceMapChain[pluginId] !== map) {
      this.sourceMapChain[pluginId] = map;
      this.markSourceMapStatus(true);
      // console.log('sourcemap dirty')
    }
  }

  public getInlineSourceMap() {
    if (this.sourceMapDirty && this.enableSourceMap) {
      const effectMapList = this.getSourceMapChain().reverse();
      if (effectMapList.length > 0) {
        this.cachedInlineSourceMap = mergeMaps(effectMapList).toComment();
      } else {
        this.cachedInlineSourceMap = '';
      }
      this.markSourceMapStatus(false);
    }
    return this.cachedInlineSourceMap;
  }

  public getSourceMap() {
    if (this.sourceMapDirty && this.enableSourceMap) {
      const effectMapList = this.getSourceMapChain().reverse();
      if (effectMapList.length > 0) {
        this.cachedSourceMap = mergeMaps(effectMapList).toMap();
      }
      this.markSourceMapStatus(false);
    }
    return this.cachedSourceMap;
  }

  public getSourceMapChain() {
    return this.sourceMapChain.filter((m): m is SourceMap => !!(m && m.mappings));
  }

  public genPluginId(name: string) {
    if (this.pluginIdMap.has(name)) {
      return this.pluginIdMap.get(name)!;
    }
    const id = this.sourceMapChain.length;
    this.pluginIdMap.set(name, id);
    return id;
  }
}
