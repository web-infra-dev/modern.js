import ReactDomServer from 'react-dom/server';
import type { ReactElement } from 'react';

export interface Collector {
  collect: (comopnent: ReactElement) => ReactElement;
  effect: () => void | Promise<void>;
}

class Render {
  private App: ReactElement;

  private collectors: Collector[] = [];

  constructor(App: ReactElement) {
    this.App = App;
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

    // collectors do effect
    await Promise.all(this.collectors.map(component => component.effect()));

    return html;
  }
}

export function createRender(App: ReactElement) {
  return new Render(App);
}
