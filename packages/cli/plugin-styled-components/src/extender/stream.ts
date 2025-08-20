import type { ReactElement } from 'react';
import { ServerStyleSheet } from 'styled-components';

export class StreamStyledExtender {
  private sheet: any | null = null;
  private rootElement: ReactElement | null = null;
  private forceStream2String = false;

  init(params: {
    rootElement: ReactElement;
    forceStream2String: boolean;
  }) {
    this.sheet = new ServerStyleSheet();
    this.rootElement = this.sheet.collectStyles(params.rootElement);
    this.forceStream2String = params.forceStream2String;
  }

  modifyRootElement(rootElement: ReactElement) {
    return this.rootElement || rootElement;
  }

  getStyleTags() {
    return this.forceStream2String && this.sheet
      ? this.sheet.getStyleTags()
      : '';
  }

  processStream(stream: NodeJS.ReadWriteStream) {
    return this.sheet ? this.sheet.interleaveWithNodeStream(stream) : stream;
  }
}
