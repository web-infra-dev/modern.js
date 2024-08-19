import { ServerStyleSheet } from 'styled-components';
import type { ReactElement } from 'react';
import type { ChunkSet, Collector } from './types';

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
