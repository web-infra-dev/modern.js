import * as actualRouter from '@modern-js/runtime-utils/router' with {
  rstest: 'importActual',
};
import { render } from '@testing-library/react';
import type React from 'react';
import { InternalRuntimeContext } from '../../src/core/context';
import { routerPlugin } from '../../src/router/runtime/plugin';
import type { RouterConfig } from '../../src/router/runtime/types';

const routerProviderProps: Array<Record<string, unknown>> = [];

rstest.mock('@modern-js/runtime-utils/router', () => ({
  ...actualRouter,
  RouterProvider: (props: Record<string, unknown>) => {
    routerProviderProps.push(props);
    return null;
  },
}));

rstest.mock('../../src/router/runtime/rsc-router', () => ({
  createClientRouterFromPayload: () => null,
}));

const renderWithRouterConfig = (
  runtimeRouterConfig: Partial<RouterConfig> | undefined,
) => {
  let wrapRoot: ((App: unknown) => React.ComponentType) | undefined;
  const api = {
    onBeforeRender: () => {},
    wrapRoot: (fn: typeof wrapRoot) => {
      wrapRoot = fn;
    },
    getRuntimeConfig: () => ({ router: runtimeRouterConfig }),
    getHooks: () => ({
      modifyRoutes: { call: (routes: unknown) => routes },
    }),
  };

  routerPlugin({
    createRoutes: () => [{ path: '/', element: null }],
  } as Partial<RouterConfig>).setup!(api as any);

  const RouterWrapper = wrapRoot!(undefined);
  render(
    <InternalRuntimeContext.Provider value={{} as any}>
      <RouterWrapper />
    </InternalRuntimeContext.Provider>,
  );

  return routerProviderProps[routerProviderProps.length - 1];
};

describe('router useTransitions', () => {
  beforeEach(() => {
    routerProviderProps.length = 0;
  });

  it('does not pass useTransitions by default', () => {
    expect(renderWithRouterConfig(undefined).useTransitions).toBeUndefined();
  });

  it('passes useTransitions to RouterProvider', () => {
    expect(
      renderWithRouterConfig({ useTransitions: false }).useTransitions,
    ).toBe(false);
    expect(
      renderWithRouterConfig({ useTransitions: true }).useTransitions,
    ).toBe(true);
  });

  it('falls back to future.v7_startTransition', () => {
    expect(
      renderWithRouterConfig({ future: { v7_startTransition: false } })
        .useTransitions,
    ).toBe(false);
    expect(
      renderWithRouterConfig({
        useTransitions: true,
        future: { v7_startTransition: false },
      }).useTransitions,
    ).toBe(true);
  });
});
