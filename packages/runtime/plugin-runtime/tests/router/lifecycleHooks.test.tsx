import { createSyncHook } from '@modern-js/plugin';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { setGlobalInternalRuntimeContext } from '../../src/core/context';
import type {
  RouteComponentEvent,
  RouteLoaderEvent,
} from '../../src/router/runtime/hooks';
import {
  createRouteComponent,
  createRouteLoader,
  handleRouteModule,
  handleRouteModuleError,
} from '../../src/router/runtime/routerHelper';

const setupRouterHooks = () => {
  const loaderEvents: RouteLoaderEvent[] = [];
  const componentEvents: RouteComponentEvent[] = [];
  const onRouteLoader = createSyncHook<(event: RouteLoaderEvent) => void>();
  const onRouteComponent =
    createSyncHook<(event: RouteComponentEvent) => void>();

  onRouteLoader.tap(event => {
    loaderEvents.push(event);
  });
  onRouteComponent.tap(event => {
    componentEvents.push(event);
  });

  setGlobalInternalRuntimeContext({
    hooks: {
      onRouteLoader,
      onRouteComponent,
    },
  } as any);

  return {
    componentEvents,
    loaderEvents,
  };
};

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

describe('router lifecycle hooks', () => {
  afterEach(() => {
    setGlobalInternalRuntimeContext({
      hooks: {},
    } as any);
  });

  test('emits route loader start and success events', async () => {
    const { loaderEvents } = setupRouterHooks();
    const loader = createRouteLoader('routes/user', async args => {
      return {
        ok: true,
        args,
      };
    });
    const args = { request: new Request('https://modernjs.dev/user') };

    await expect(loader(args)).resolves.toEqual({
      ok: true,
      args,
    });

    expect(loaderEvents.map(event => event.type)).toEqual(['start', 'success']);
    expect(loaderEvents[0]).toMatchObject({
      routeId: 'routes/user',
      args,
    });
    expect(loaderEvents[1]).toMatchObject({
      routeId: 'routes/user',
      result: {
        ok: true,
        args,
      },
    });
  });

  test('emits route loader redirect events', async () => {
    const { loaderEvents } = setupRouterHooks();
    const response = new Response(null, {
      status: 302,
    });
    const loader = createRouteLoader('routes/login', async () => {
      throw response;
    });

    await expect(
      loader({ request: new Request('https://modernjs.dev/login') }),
    ).rejects.toBe(response);

    expect(loaderEvents.map(event => event.type)).toEqual([
      'start',
      'redirect',
    ]);
    expect(loaderEvents[1]).toMatchObject({
      routeId: 'routes/login',
      response,
    });
  });

  test('emits route loader error events', async () => {
    const { loaderEvents } = setupRouterHooks();
    const error = new Error('loader failed');
    const loader = createRouteLoader('routes/error', async () => {
      throw error;
    });

    await expect(
      loader({ request: new Request('https://modernjs.dev/error') }),
    ).rejects.toBe(error);

    expect(loaderEvents.map(event => event.type)).toEqual(['start', 'error']);
    expect(loaderEvents[1]).toMatchObject({
      routeId: 'routes/error',
      error,
    });
  });

  test('emits route component mount events', async () => {
    const { componentEvents } = setupRouterHooks();
    const Component = createRouteComponent('routes/home', () => {
      return <div>home</div>;
    });

    const { unmount } = render(<Component />);

    await waitFor(() => {
      expect(componentEvents).toEqual([
        {
          type: 'mount',
          routeId: 'routes/home',
        },
      ]);
    });
    unmount();
  });

  test('emits route component render error events', async () => {
    const { componentEvents } = setupRouterHooks();
    const error = new Error('render failed');
    const Component = createRouteComponent('routes/home', () => {
      throw error;
    });
    const consoleError = rstest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <TestErrorBoundary>
        <Component />
      </TestErrorBoundary>,
    );

    await waitFor(() => {
      expect(componentEvents).toHaveLength(1);
      expect(componentEvents[0]).toMatchObject({
        type: 'render-error',
        routeId: 'routes/home',
        error,
        componentStack: expect.any(String),
      });
    });
    consoleError.mockRestore();
  });

  test('emits route module load and load error events', () => {
    const { componentEvents } = setupRouterHooks();
    const routeModule = {
      default: () => null,
    };
    const error = new Error('module failed');
    const consoleError = rstest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (window as any)[ROUTE_MODULES] = {};

    expect(handleRouteModule(routeModule as any, 'routes/lazy')).toBe(
      routeModule,
    );
    expect(handleRouteModuleError(error, 'routes/lazy-error')).toBe(null);

    expect(componentEvents).toEqual([
      {
        type: 'module-load',
        routeId: 'routes/lazy',
        routeModule,
      },
      {
        type: 'module-load-error',
        routeId: 'routes/lazy-error',
        error,
      },
    ]);
    consoleError.mockRestore();
  });
});
