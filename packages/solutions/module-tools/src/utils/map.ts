import convertSourceMap from 'convert-source-map';
import ampremapping from '@ampproject/remapping';
import type { RawSourceMap } from '@ampproject/remapping';
import type { SourceMap } from '../types';

interface Options {
  needSourceMap: boolean;
}

export function normalizeSourceMap(
  map: string | RawSourceMap | undefined,
  opts?: Options,
): SourceMap | undefined {
  if (opts?.needSourceMap === false || !map) {
    return undefined;
  }
  if (typeof map === 'string') {
    return JSON.parse(map);
  }
  return map;
}

export type MergeMapResult = {
  toString: () => string;
  toMap: () => SourceMap;
  toComment: () => string;
};

export function mergeMaps(mapList: SourceMap[]): MergeMapResult {
  const map = ampremapping(mapList as any, () => null);

  return {
    toMap: () => map as SourceMap,
    toString: () => map.toString(),
    toComment: () => convertSourceMap.fromObject(map).toComment(),
  };
}
