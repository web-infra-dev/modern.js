import { createApp } from '@modern-js/runtime';
import type { RuntimePluginFuture } from '@modern-js/runtime/plugin';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { useHistory } from '../src';
import createRouterPlugin, {
  type RouteProps,
  useLocation,
} from '../src/runtime';
import { DefaultNotFound } from '../src/runtime/DefaultNotFound';

const testPlugin: RuntimePluginFuture = {
  name: 'test',
  setup: api => {
    api.wrapRoot(App1 => App1);
  },
};
describe('@modern-js/plugin-router-v5', () => {
  it('base usage', () => {
    const AppWrapper = createApp({
      plugins: [testPlugin, createRouterPlugin({}) as any],
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
        testPlugin,
        createRouterPlugin({
          routesConfig: {
            routes: [{ path: '/', component: App as any }],
            globalApp: App,
          },
        }) as any,
      ],
    })();

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

    const AppWrapper = createApp({
      plugins: [
        testPlugin,
        createRouterPlugin({
          routesConfig: {
            routes: [
              { path: '/', component: App as any },
              { path: '/home', component: Home as any },
            ],
          },
          supportHtml5History: false, // use hash router
        }) as any,
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

    const AppWrapper = createApp({
      plugins: [
        {
          name: 'test',
          setup: (api: any) => {
            api.wrapRoot((App1: any) => App1);
            api.modifyRoutes((routes: RouteProps[]) => {
              return modifyFn?.(routes);
            });
          },
        } as any,
        createRouterPlugin({
          routesConfig: { routes: [{ path: '/' }] },
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
    expect(container.innerHTML).toBe(expectedText);
  });
});
