import type { ReactElement } from 'react';
import { ServerStyleSheet } from 'styled-components';

export interface Collector {
  collect?: (comopnent: ReactElement) => ReactElement;
  effect: () => void | Promise<void>;
}

export enum RenderLevel {
  CLIENT_RENDER = 0,
  SERVER_PREFETCH = 1,
  SERVER_RENDER = 2,
}

export type ChunkSet = {
  renderLevel: RenderLevel;
  ssrScripts: string;
  jsChunk: string;
  cssChunk: string;
};

export class StyledCollector implements Collector {
  #sheet: ServerStyleSheet = new ServerStyleSheet();

  #chunkSet: ChunkSet;

  constructor(chunkSet: ChunkSet) {
    this.#chunkSet = chunkSet;
  }

  collect(comopnent: ReactElement) {
    return this.#sheet.collectStyles(comopnent);
  }

  effect() {
    const css = this.#sheet.getStyleTags();

    this.#chunkSet.cssChunk += css;
  }
}
