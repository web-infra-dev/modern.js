import React from 'react';
import { createApp, createPlugin } from '@modern-js/runtime-core';
import { render } from '@testing-library/react';
import createRouterPlugin from '../src/runtime';

describe('@modern-js/plugin-router', () => {
  it('base usage', () => {
    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({}),
      ],
    })(App);

    interface Props {
      test: number;
    }
    function App({ test }: Props) {
      return <div>App:{test}</div>;
    }

    const { container } = render(<AppWrapper test={1} />);
    expect(container.firstChild?.textContent).toBe('App:1');
    expect(container.innerHTML).toBe('<div>App:1</div>');
  });

  it('pages', () => {
    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({
          routesConfig: { routes: [{ path: '/', component: App as any }] },
        }),
      ],
    })(App);

    interface Props {
      test: number;
    }
    function App({ test }: Props) {
      return <div>App:{test}</div>;
    }

    const { container } = render(<AppWrapper test={1} />);
    expect(container.firstChild?.textContent).toBe('App:1');
    expect(container.innerHTML).toBe('<div>App:1</div>');
  });
});
