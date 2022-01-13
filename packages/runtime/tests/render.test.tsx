import React from 'react';
import ReactDOM from 'react-dom/server';
import { initialRender, createRuntime } from '../src';

describe('render', () => {
  it('server', async () => {
    const runtime = createRuntime();
    const render = initialRender(
      [
        runtime.createPlugin(() => ({
          server: ({ App: App1 }) => ({
            markup: ReactDOM.renderToStaticMarkup(<App1 />),
          }),
        })),
      ],
      runtime,
    );

    function App() {
      return <div>App</div>;
    }

    const result = await render.serverRender({ App });

    expect(result).toStrictEqual({ markup: '<div>App</div>' });
  });
});
