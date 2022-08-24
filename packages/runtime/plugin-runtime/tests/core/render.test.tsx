import { noop } from '@modern-js/utils/lodash';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactDOM from 'react-dom';
import { createRuntime } from '../../src/runtime';
import { initialRender } from '../utils';

describe('render', () => {
  it('server', async () => {
    const runtime = createRuntime();
    const render = initialRender(
      [
        runtime.createPlugin(() => ({
          server: ({ App: App1 }) =>
            ReactDOMServer.renderToStaticMarkup(<App1 />),
        })),
      ],
      runtime,
    );

    function App() {
      return <div>App</div>;
    }

    const result = await render.serverRender({ App });

    expect(result).toStrictEqual('<div>App</div>');
  });

  it('client', async () => {
    const root = document.createElement('div');
    const ModernRender = (App: React.ReactNode) => {
      ReactDOM.render(App as any, root);
    };

    const ModernHydrate = (App: React.ReactNode) => {
      noop(App);
    };
    const runtime = createRuntime();
    const render = initialRender([], runtime);
    function App() {
      return <div>App</div>;
    }
    await render.clientRender({ App }, ModernRender, ModernHydrate);
    expect(root.innerHTML).toEqual('<div>App</div>');
  });
});
