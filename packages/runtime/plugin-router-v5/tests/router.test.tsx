import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { createBrowserHistory } from 'history';
import { createApp } from '@modern-js/runtime';
import { createRuntime } from '@modern-js/runtime/plugin';
import createRouterPlugin, { RouteProps, useLocation } from '../src/runtime';
import { useHistory } from '../src';
import { DefaultNotFound } from '../src/runtime/DefaultNotFound';

describe('@modern-js/plugin-router-v5', () => {
  it('base usage', () => {
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
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
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
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
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [{ path: '/', component: RouterApp as any }],
            globalApp: App,
          },
        }),
      ],
    })();

    render(<AppWrapper />);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('custom history', () => {
    const history = createBrowserHistory();
    const customHistory = {
      ...history,
      push: jest.fn(),
    };
    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
        })),
        createRouterPlugin({
          history: customHistory,
        }),
      ],
    })(App);

    interface Props {
      test: number;
    }
    function App({ test }: Props) {
      const _history = useHistory();
      return (
        <div>
          App:{test}
          <button
            type="button"
            onClick={() => {
              _history.push('/');
            }}
            data-testid="nav"
          >
            Go
          </button>
        </div>
      );
    }

    const { container } = render(<AppWrapper test={1} />);
    expect(container.firstChild?.textContent).toContain('App:1');
    fireEvent.click(screen.getByTestId('nav'));
  });

  it('hash router could work', async () => {
    function App({ test }: any) {
      const _history = useHistory();
      const location = useLocation();
      return (
        <div>
          App:{test}
          <button
            type="button"
            data-testid="go"
            onClick={() => {
              _history.push('/home');
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
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
        })),
        createRouterPlugin({
          routesConfig: {
            routes: [
              { path: '/', component: App as any },
              { path: '/home', component: Home as any },
            ],
          },
          supportHtml5History: false, // use hash router
        }),
      ],
    })(App);

    render(<AppWrapper test={1} />);
    expect(screen.getByText(/App:1/i)).toBeTruthy();
    expect(screen.getByTestId('location-display').innerHTML).toEqual('/');
    // change router
    fireEvent.click(screen.getByTestId('go'));
    expect(screen.getByText(/home/i)).toBeTruthy();
    expect(screen.getByTestId('location-display').innerHTML).toEqual('/home');
  });
  it('DefaultNotFound', () => {
    const { container } = render(<DefaultNotFound />);
    expect(container.firstChild?.textContent).toEqual('404');
  });

  it('support modify routes', () => {
    type ModifyRoutesFn = (routes: RouteProps[]) => RouteProps[];
    const expectedText = 'modify routes';
    let modifyFn: ModifyRoutesFn | null = null;
    const modifyRoutes = (fn: ModifyRoutesFn) => {
      modifyFn = fn;
    };

    modifyRoutes(routes => {
      routes[0].component = function () {
        return <>{expectedText}</>;
      };
      return routes;
    });

    const runtime = createRuntime();
    const AppWrapper = createApp({
      runtime,
      plugins: [
        runtime.createPlugin(() => ({
          hoc: ({ App: App1, config }, next) => next({ App: App1, config }),
          modifyRoutes(routes: RouteProps[]) {
            return modifyFn?.(routes);
          },
        })),
        createRouterPlugin({
          routesConfig: { routes: [{ path: '/', component: App as any }] },
        }),
      ],
    })(App);

    interface Props {
      children: React.ReactNode;
    }
    function App({ children }: Props) {
      return <div>{children}</div>;
    }
    const { container } = render(<AppWrapper test={1} />);

    expect(container.firstChild?.textContent).toBe(`${expectedText}`);
    expect(container.innerHTML).toBe(`<div>${expectedText}</div>`);
  });
});
