import type { ReactElement } from 'react';
import type { RenderLevel } from '../../constants';

export interface Collector {
  collect?: (comopnent: ReactElement) => ReactElement;
  effect: () => void | Promise<void>;
}

export type ChunkSet = {
  renderLevel: RenderLevel;
  ssrScripts: string;
  jsChunk: string;
  cssChunk: string;
};
