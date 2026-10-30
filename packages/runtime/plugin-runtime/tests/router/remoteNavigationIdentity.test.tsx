import React, { useEffect, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from '@modern-js/runtime-utils/router';
import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import {
  useBridgeRouter,
  type BridgeNavigation,
  type CreateReactRemoteOptions,
} from '@module-federation/bridge-react/base';
import { ReactRemote } from '../../src/mf/remote';

it.each([false, true])(
  'preserves props and adapter updates but replaces the provider when basename changes (Modern Router: %s)',
  async withRouter => {
    function App({ label }: { label: string }) {
      const routing = useBridgeRouter();
      const [count, setCount] = useState(0);
      useEffect(
        () => routing?.navigation?.subscribe(() => {}),
        [routing?.navigation],
      );
      return (
        <>
          <button
            data-testid="counter"
            onClick={() => setCount(value => value + 1)}
          >
            {label}: {count}
          </button>
          <p data-testid="location">
            {routing?.navigation?.getLocation() || 'memory'}
          </p>
        </>
      );
    }
    const producer = createBridgeComponent({ rootComponent: App });
    const destroyed = rstest.fn();
    const factory = rstest.fn(() => {
      const provider = producer();
      return {
        ...provider,
        destroy: (info: Parameters<typeof provider.destroy>[0]) => {
          destroyed();
          provider.destroy(info);
        },
      };
    });
    const loadRemote = rstest.fn(async () => ({ default: factory }));
    const instance = {
      registerPlugins: rstest.fn(),
      remoteHandler: {
        getRemoteModuleAndOptions: async () => ({
          remoteMatchInfo: {
            expose: './App',
            remoteSnapshot: {
              modules: [{ modulePath: './App', render: 'bridge' }],
            },
          },
        }),
        loadRemote,
      },
    } as unknown as NonNullable<CreateReactRemoteOptions['instance']>;
    const listeners = new Set<() => void>();
    const custom: BridgeNavigation = {
      getLocation: () => '/custom',
      subscribe: listener => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      navigate: rstest.fn(),
    };
    const original = window.location.href;
    window.history.replaceState(null, '', '/inventory/detail/42');
    const element = (
      routing: Pick<
        CreateReactRemoteOptions,
        'basename' | 'memoryRoute' | 'navigation'
      >,
      label = 'first',
    ) => {
      const remote = (
        <ReactRemote
          remote="shop/App"
          instance={instance}
          {...routing}
          props={{ label }}
        />
      );
      return withRouter ? (
        <MemoryRouter initialEntries={['/inventory/detail/42']}>
          {remote}
        </MemoryRouter>
      ) : (
        remote
      );
    };
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(element({ basename: '/inventory' }));
    });
    try {
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('first: 0'),
      );
      act(() => view.getByTestId('counter').click());
      expect(view.getByTestId('location').textContent).toBe(
        '/inventory/detail/42',
      );
      view.rerender(
        element({ basename: '/inventory', navigation: custom }, 'custom'),
      );
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('custom: 1'),
      );
      expect(view.getByTestId('location').textContent).toBe('/custom');
      expect(listeners.size).toBe(1);
      view.rerender(element({ basename: '/inventory' }, 'automatic'));
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('automatic: 1'),
      );
      expect(view.getByTestId('location').textContent).toBe(
        '/inventory/detail/42',
      );
      expect(listeners.size).toBe(0);
      view.rerender(
        element(
          { basename: '/inventory', memoryRoute: { entryPath: '/' } },
          'memory',
        ),
      );
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('memory: 1'),
      );
      expect(view.getByTestId('location').textContent).toBe('memory');
      view.rerender(element({ basename: '/inventory' }, 'restored'));
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('restored: 1'),
      );
      expect(factory).toHaveBeenCalledTimes(1);
      expect(loadRemote).toHaveBeenCalledTimes(1);
      expect(destroyed).not.toHaveBeenCalled();
      view.rerender(element({ basename: '/inventory/' }, 'normalized'));
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('normalized: 1'),
      );
      expect(factory).toHaveBeenCalledTimes(1);
      view.rerender(
        element({ basename: '/inventory', navigation: custom }, 'old mount'),
      );
      await waitFor(() => expect(listeners.size).toBe(1));
      view.rerender(element({ basename: '/warehouse' }, 'new mount'));
      await waitFor(() =>
        expect(view.getByTestId('counter').textContent).toBe('new mount: 0'),
      );
      expect(factory).toHaveBeenCalledTimes(2);
      expect(destroyed).toHaveBeenCalledTimes(1);
      expect(listeners.size).toBe(0);
    } finally {
      await act(async () => {
        view.unmount();
      });
      window.history.replaceState(null, '', original);
    }
    expect(listeners.size).toBe(0);
    expect(destroyed).toHaveBeenCalledTimes(2);
  },
);
