import {
  type LoaderFunctionArgs,
  RouterProvider,
  createMemoryRouter,
} from '@modern-js/runtime-utils/router';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React, { act } from 'react';
import { InternalRuntimeContext } from '../../src/core/context';
import { Link } from '../../src/router';

declare global {
  var __webpack_chunk_load_test__:
    | ((chunkId: string) => Promise<void>)
    | undefined;
  var _SSR_DATA: unknown;
}

const mockRoutes = [
  {
    id: 'root',
    path: '/',
    element: <Link {...{ to: 'aa', prefetch: 'intent' }} />,
  },
  {
    id: 'aa',
    path: 'aa',
    loader: ({ request }: LoaderFunctionArgs) => null,
    element: <h1>idk</h1>,
  },
];

rstest.mock('react', () => {
  const originalModule = rstest.requireActual('react');
  const originContext = originalModule.useContext;
  const mockedUseContext = (context: unknown) => {
    // Mock both contexts using string comparison as fallback
    const contextString = context.toString();

    if (
      context === InternalRuntimeContext ||
      contextString.includes('InternalRuntimeContext')
    ) {
      return {
        routes: mockRoutes,
        routeManifest: mockRouteManifest,
      };
    }

    return originContext(context);
  };
  return {
    ...originalModule,
    useContext: mockedUseContext,
    default: {
      ...originalModule,
      useContext: mockedUseContext,
    },
  };
});

const mockRouteManifest = {
  routeAssets: {
    root: {
      chunkIds: ['root'],
      assets: ['root'],
    },
    aa: {
      chunkIds: ['aa'],
      assets: ['aa'],
    },
  },
};

describe('prefetch', () => {
  const intentEvents = ['focus', 'mouseEnter', 'touchStart'] as const;
  beforeEach(() => {
    rstest.useFakeTimers();
    rstest.resetModules();
    rstest.clearAllMocks();
    global.__webpack_chunk_load_test__ = rstest.fn();
    global._SSR_DATA = {};
  });

  intentEvents.forEach(event => {
    test(`support intent on ${event}`, async () => {
      let router;
      act(() => {
        router = createMemoryRouter(mockRoutes);
      });
      const { container, unmount } = render(
        <RouterProvider router={router as any} />,
      );

      fireEvent.mouseEnter(container.firstChild!);

      act(() => {
        rstest.runAllTimers();
      });

      expect(global.__webpack_chunk_load_test__).toBeCalledTimes(1);
      const dataHref = document.head
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
      unmount();
    });
  });

  test('support render', async () => {
    const mockRoutes = [
      {
        id: 'root',
        path: '/',
        element: <Link {...{ to: 'aa', prefetch: 'render' }} />,
      },
      {
        id: 'aa',
        path: 'aa',
        loader: ({ request }: LoaderFunctionArgs) => null,
        element: <h1>idk</h1>,
      },
    ];

    let router;
    act(() => {
      router = createMemoryRouter(mockRoutes);
    });
    const { container, unmount } = render(
      <RouterProvider router={router as any} />,
    );

    act(() => {
      rstest.runAllTimers();
    });

    rstest.useRealTimers();

    await waitFor(() => {
      expect(global.__webpack_chunk_load_test__).toBeCalledTimes(1);
      const dataHref = document.head
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    unmount();
  });

  test('support viewport', async () => {
    const originalIntersectionObserver = global.IntersectionObserver;
    const observeMock = rstest.fn();
    const disconnectMock = rstest.fn();
    let observerCallback: IntersectionObserverCallback | undefined;
    rstest.useRealTimers();

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '200px';
      readonly thresholds: ReadonlyArray<number> = [];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      disconnect() {
        disconnectMock();
      }

      observe(target: Element) {
        observeMock(target);
      }

      takeRecords() {
        return [];
      }

      unobserve() {}
    }

    global.IntersectionObserver = MockIntersectionObserver;

    const mockRoutes = [
      {
        id: 'root',
        path: '/',
        element: <Link {...{ to: 'aa', prefetch: 'viewport' }} />,
      },
      {
        id: 'aa',
        path: 'aa',
        loader: ({ request }: LoaderFunctionArgs) => null,
        element: <h1>idk</h1>,
      },
    ];

    let router;
    act(() => {
      router = createMemoryRouter(mockRoutes);
    });
    const { container, unmount } = render(
      <RouterProvider router={router as any} />,
    );

    await waitFor(() => {
      expect(observeMock).toHaveBeenCalledWith(container.firstChild);
    });
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();

    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(global.__webpack_chunk_load_test__).toBeCalledTimes(1);
      const dataHref = document.head
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    expect(disconnectMock).toHaveBeenCalled();

    unmount();
    global.IntersectionObserver = originalIntersectionObserver;
  });
});
