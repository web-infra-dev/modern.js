import { ServerStyleSheet } from 'styled-components';
import { ReactElement } from 'react';
import type { RenderResult } from './type';
import type { Collector } from './renderToString';

class StyledCollector implements Collector {
  sheet: ServerStyleSheet = new ServerStyleSheet();

  result: RenderResult;

  constructor(result: RenderResult) {
    this.result = result;
  }

  collect(comopnent: ReactElement) {
    return this.sheet.collectStyles(comopnent);
  }

  effect() {
    const css = this.sheet.getStyleTags();

    this.result.chunksMap.css += css;
  }
}

export function createStyledCollector(result: RenderResult) {
  return new StyledCollector(result);
}
