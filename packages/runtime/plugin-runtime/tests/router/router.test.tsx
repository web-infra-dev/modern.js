import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { fetch, Request, Response } from '@remix-run/web-fetch';
import { createApp } from '../../src/core';
import createRouterPlugin, {
  Outlet,
  useLocation,
} from '../../src/router/runtime';
import { useNavigate } from '../../src/router';
import { DefaultNotFound } from '../../src/router/runtime/DefaultNotFound';
import { createRuntime } from '../../src/core/plugin';

beforeAll(() => {
  // use React 18
  process.env.IS_REACT18 = 'true';

  // reference: https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/__tests__/setup.ts
  // https://react.dev/blog/2022/03/08/react-18-upgrade-guide#configuring-your-testing-environment
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
    const runtime = createRuntime();
    const AppWrapper = createApp({
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
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
    const runtime = createRuntime();
    const AppWrapper = createApp({
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
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
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App, config }, next) => next({ App, config }),
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
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App, config }, next) => next({ App, config }),
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
    await waitFor(() => {
      expect(screen.getByText(/^App$/i)).toBeTruthy();
      expect(screen.getByTestId('location-display').innerHTML).toEqual('/');
    });
    await waitFor(() => {
      // change router
      fireEvent.click(screen.getByTestId('go'));
      expect(screen.getByText(/^home$/i)).toBeTruthy();
      expect(screen.getByTestId('location-display').innerHTML).toEqual('/home');
    });
  });
  it('DefaultNotFound', () => {
    const { container } = render(<DefaultNotFound />);
    expect(container.firstChild?.textContent).toEqual('404');
  });

  it('modifyRoutes hook', async () => {
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(
          () =>
            ({
              modifyRoutes: (routes: any) => {
                routes[0].element = <App2>{routes[0].element}</App2>;
                return routes;
              },
            } as any),
        ),
        createRouterPlugin({
          routesConfig: {
            routes: [
              {
                path: '/',
                component: App1 as any,
                type: 'nested',
                _component: '',
              },
            ],
          },
        }),
      ],
    })();

    function App1() {
      return <div>App1</div>;
    }

    function App2(props: any) {
      const { children } = props;
      return (
        <div>
          <div> App2 </div>
          <div>{children}</div>
        </div>
      );
    }

    const { container } = render(<AppWrapper />);
    await waitFor(() => {
      expect(container.innerHTML).toMatch('App2');
    });
  });
});
