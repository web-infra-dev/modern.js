import {
  InternalRuntimeContext,
  getInitialContext,
  setGlobalContext,
} from '@modern-js/runtime/context';
import { registerPlugin } from '@modern-js/runtime/plugin';
import { createRoot } from '@modern-js/runtime/react';
import type { AnyRouter } from '@tanstack/react-router';
import { useMatches } from '@tanstack/react-router';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React, { act } from 'react';
import { tanstackRouterPlugin } from '../../src/runtime/plugin';

const activeHistories = new Set<AnyRouter['history']>();
let fixtureId = 0;
let finishPendingHydration: (() => void) | undefined;

beforeEach(() => {
  fixtureId++;
  setGlobalContext({ entryName: 'main', enableRsc: false });
  window.history.replaceState(null, '', '/');
  delete window.$_TSR;
});

afterEach(async () => {
  await act(async () => {
    finishPendingHydration?.();
    cleanup();
  });
  finishPendingHydration = undefined;
  for (const history of [...activeHistories].reverse()) {
    history.destroy();
  }
  activeHistories.clear();
  delete window.$_TSR;
});

function Page() {
  const matches = useMatches();
  const data = matches.find(match => match.loaderData)?.loaderData;
  return <div data-testid="page">{JSON.stringify(data)}</div>;
}

describe('TanStack client lifecycle', () => {
  test('calls hydration hooks once around completed router hydration', async () => {
    const currentFixture = fixtureId;
    let finishHydration!: () => void;
    const hydration = new Promise<void>(resolve => {
      finishHydration = resolve;
    });
    finishPendingHydration = finishHydration;
    const beforeCreate = rstest.fn();
    const afterCreate = rstest.fn();
    const beforeHydrate = rstest.fn();
    const afterHydrate = rstest.fn();
    const clientLoader = rstest.fn(() => ({ origin: 'client' }));
    const serverData = { origin: 'server', message: 'hydrated loader data' };
    let router!: AnyRouter;
    let hydrationCompleted = false;
    window.$_TSR = { buffer: [] } as typeof window.$_TSR;

    registerPlugin([
      tanstackRouterPlugin({
        createRoutes: () => [
          { id: 'page', path: '/', loader: clientLoader, Component: Page },
        ],
      }),
      {
        name: 'observe-client-hydration',
        setup: api => {
          api.onBeforeCreateRouter(beforeCreate);
          api.onAfterCreateRouter(context => {
            if (currentFixture !== fixtureId) {
              return;
            }
            afterCreate(context);
            router = context.router as AnyRouter;
            activeHistories.add(router.history);
            const matches = router.matchRoutes(router.state.location);
            window.$_TSR!.router = {
              matches: matches.map(match => ({
                i: match.id,
                l: serverData,
                s: 'success',
                ssr: true,
                u: Date.now(),
              })),
              lastMatchId: matches.at(-1)!.id,
            };
            router.update({
              hydrate: async () => {
                await hydration;
                hydrationCompleted = true;
              },
            });
          });
          api.onBeforeHydrateRouter(context => {
            beforeHydrate(context);
            expect((context.router as AnyRouter).state.matches).toEqual([]);
          });
          api.onAfterHydrateRouter(context => {
            afterHydrate({
              completed: hydrationCompleted,
              loaderData: (context.router as AnyRouter).state.matches.map(
                match => match.loaderData,
              ),
              content: screen.queryByTestId('page')?.textContent,
            });
          });
        },
      },
    ]);
    const App = createRoot();
    const context = getInitialContext(true);
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <React.StrictMode>
          <InternalRuntimeContext.Provider value={context}>
            <App />
          </InternalRuntimeContext.Provider>
        </React.StrictMode>,
      );
    });

    expect(beforeHydrate).toHaveBeenCalledTimes(1);
    expect(afterHydrate).not.toHaveBeenCalled();
    expect(screen.queryByTestId('page')).toBeNull();

    await act(async () => {
      finishHydration();
      await hydration;
    });
    await waitFor(() => {
      expect(afterHydrate).toHaveBeenCalledTimes(1);
    });
    expect(afterHydrate).toHaveBeenLastCalledWith({
      completed: true,
      loaderData: router.state.matches.map(() => serverData),
      content: JSON.stringify(serverData),
    });
    expect(clientLoader).not.toHaveBeenCalled();

    view.rerender(
      <React.StrictMode>
        <InternalRuntimeContext.Provider value={{ ...context }}>
          <App />
        </InternalRuntimeContext.Provider>
      </React.StrictMode>,
    );
    expect(beforeCreate).toHaveBeenCalledTimes(1);
    expect(afterCreate).toHaveBeenCalledTimes(1);
    expect(beforeHydrate).toHaveBeenCalledTimes(1);
    expect(afterHydrate).toHaveBeenCalledTimes(1);
  });

  test.each([true, false])(
    'reuses owned history when the runtime basepath changes (html5: %s)',
    async supportHtml5History => {
      const currentFixture = fixtureId;
      const addListener = rstest.spyOn(window, 'addEventListener');
      const beforeCreate = rstest.fn();
      const routers: AnyRouter[] = [];
      registerPlugin([
        tanstackRouterPlugin({
          supportHtml5History,
          createRoutes: () => [{ id: 'page', path: '/', Component: Page }],
        }),
        {
          name: 'observe-client-history',
          setup: api => {
            api.onBeforeCreateRouter(beforeCreate);
            api.onAfterCreateRouter(context => {
              if (currentFixture !== fixtureId) {
                return;
              }
              const router = context.router as AnyRouter;
              routers.push(router);
              activeHistories.add(router.history);
            });
          },
        },
      ]);
      const App = createRoot();
      const context = getInitialContext(true);
      context._internalRouterBaseName = '/a';
      let view!: ReturnType<typeof render>;
      await act(async () => {
        view = render(
          <InternalRuntimeContext.Provider value={context}>
            <App />
          </InternalRuntimeContext.Provider>,
        );
      });
      await waitFor(() => expect(routers).toHaveLength(1));
      const history = routers[0].history;
      const pushState = window.history.pushState;
      const historyListenerCount = () =>
        addListener.mock.calls.filter(([name]) =>
          ['popstate', 'beforeunload'].includes(name),
        ).length;
      const listenerCount = historyListenerCount();
      expect(listenerCount).toBe(2);

      await act(async () => {
        view.rerender(
          <InternalRuntimeContext.Provider
            value={{ ...context, _internalRouterBaseName: '/b' }}
          >
            <App />
          </InternalRuntimeContext.Provider>,
        );
      });

      expect(routers).toHaveLength(2);
      expect(routers[1]).not.toBe(routers[0]);
      expect(routers[1].history).toBe(history);
      expect(window.history.pushState).toBe(pushState);
      expect(historyListenerCount()).toBe(listenerCount);
      expect(beforeCreate).toHaveBeenCalledTimes(2);
    },
  );
});
