/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { fetch, Request, Response } from '@remix-run/web-fetch';
import { createApp, createPlugin } from '../../src/core';
import createRouterPlugin, {
  Outlet,
  useLocation,
} from '../../src/router/runtime';
import { useNavigate } from '../../src/router';
import { DefaultNotFound } from '../../src/router/runtime/DefaultNotFound';

beforeAll(() => {
  // use React 18
  process.env.IS_REACT18 = 'true';

  // reference: https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/__tests__/setup.ts
  // https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
  // @ts-expect-error
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  if (!globalThis.fetch) {
    // Built-in lib.dom.d.ts expects `fetch(Request | string, ...)` but the web
    // fetch API allows a URL so @remix-run/web-fetch defines
    // `fetch(string | URL | Request, ...)`
    // @ts-expect-error
    globalThis.fetch = fetch;
    // Same as above, lib.dom.d.ts doesn't allow a URL to the Request constructor
    // @ts-expect-error
    globalThis.Request = Request;
    // web-std/fetch Response does not currently implement Response.error()
    // @ts-expect-error
    globalThis.Response = Response;
  }
});

describe('@modern-js/plugin-router', () => {
  it('base usage', () => {
    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [
              {
                path: '/',
                component: App as any,
                type: 'page',
                _component: '',
              },
            ],
          },
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

  it('pages', () => {
    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [
              {
                path: '/',
                component: App as any,
                type: 'page',
                _component: '',
              },
            ],
          },
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

  it('pages with App.init', () => {
    const App = (props: { Component: React.FC }) => {
      const { Component, ...pageProps } = props;
      return (
        <div>
          <Component {...pageProps} />
        </div>
      );
    };

    function RouterApp() {
      return <div>Router App</div>;
    }

    const mockCallback = jest.fn();
    App.init = mockCallback;

    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [
              {
                path: '/',
                component: RouterApp as any,
                type: 'page',
                _component: '',
              },
            ],
            globalApp: App,
          },
        }),
      ],
    })();

    render(<AppWrapper />);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('hash router could work', async () => {
    function App() {
      const navigate = useNavigate();
      const location = useLocation();
      return (
        <div>
          <div>App</div>
          <Outlet />
          <button
            type="button"
            data-testid="go"
            onClick={() => {
              navigate('/home');
            }}
          >
            Go
          </button>
          <div data-testid="location-display">{location.pathname}</div>
        </div>
      );
    }

    function Home() {
      return <div>home</div>;
    }

    const AppWrapper = createApp({
      plugins: [
        createPlugin(() => ({
          hoc: ({ App: App1 }, next) => next({ App: App1 }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [
              {
                id: '/',
                path: '/',
                component: App as any,
                type: 'nested',
                _component: '',
                children: [
                  {
                    id: '/home',
                    path: '/home',
                    component: Home as any,
                    type: 'nested',
                    _component: '',
                  },
                ],
              },
            ],
          },
          supportHtml5History: false, // use hash router
        }),
      ],
    })();

    render(<AppWrapper />);
    expect(screen.getByText(/^App$/i)).toBeTruthy();
    expect(screen.getByTestId('location-display').innerHTML).toEqual('/');
    // change router
    fireEvent.click(screen.getByTestId('go'));
    expect(screen.getByText(/^home$/i)).toBeTruthy();
    expect(screen.getByTestId('location-display').innerHTML).toEqual('/home');
  });
  it('DefaultNotFound', () => {
    const { container } = render(<DefaultNotFound />);
    expect(container.firstChild?.textContent).toEqual('404');
  });
});
/* eslint-enable @typescript-eslint/ban-ts-comment */
