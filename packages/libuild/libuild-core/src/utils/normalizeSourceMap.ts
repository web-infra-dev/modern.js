import { RawSourceMap } from '@ampproject/remapping/dist/types/types';
import { SourceMap } from '../types';

interface Options {
  needSourceMap: boolean;
}

export function normalizeSourceMap(map: string | RawSourceMap | undefined, opts?: Options): SourceMap | undefined {
  if (opts?.needSourceMap === false || !map) {
    return undefined;
  }
  if (typeof map === 'string') {
    return JSON.parse(map);
  }
  return map;
}
