import ReactDomServer from 'react-dom/server';
import type { ReactElement } from 'react';
import ReactHelmet from 'react-helmet';
import { RenderResult } from '../types';

export interface Collector {
  collect: (comopnent: ReactElement) => ReactElement;
  effect: () => void | Promise<void>;
}

class Render {
  private App: ReactElement;

  private renderResult: RenderResult;

  private collectors: Collector[] = [];

  constructor(App: ReactElement, result: RenderResult) {
    this.App = App;
    this.renderResult = result;
  }

  addCollector(collector: Collector): this {
    this.collectors.push(collector);
    return this;
  }

  async finish(): Promise<string> {
    // collectors do collect
    const App = this.collectors.reduce(
      (pre, collector) => collector.collect(pre),
      this.App,
    );

    // react render to string
    const html = ReactDomServer.renderToString(App);

    const helmetData = ReactHelmet.renderStatic();

    this.renderResult.helmet = helmetData;

    // collectors do effect
    await Promise.all(this.collectors.map(component => component.effect()));

    return html;
  }
}

export function createRender(App: ReactElement, result: RenderResult) {
  return new Render(App, result);
}
