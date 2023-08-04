import convertSourceMap from 'convert-source-map';
import ampremapping from '@ampproject/remapping';
import type { SourceMap } from '../types';

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
