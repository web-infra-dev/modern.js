import {
  type LoaderFunctionArgs,
  RouterProvider,
  createMemoryRouter,
} from '@modern-js/runtime-utils/router';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React, { act } from 'react';
import { InternalRuntimeContext } from '../../src/core/context';
import { Link, NavLink } from '../../src/router';

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

const renderLink = (element: React.ReactElement, reactStrictMode = false) => {
  const router = createMemoryRouter([
    { ...mockRoutes[0], element },
    mockRoutes[1],
  ]);
  return render(<RouterProvider router={router} />, { reactStrictMode });
};

const mockIntersectionObserver = () => {
  const observers: MockIntersectionObserver[] = [];

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds = [];
    readonly observe = rstest.fn();
    readonly disconnect = rstest.fn();
    readonly unobserve = rstest.fn();

    constructor(
      private callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin || '0px';
      observers.push(this);
    }

    takeRecords() {
      return [];
    }

    intersect(isIntersecting: boolean) {
      this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
    }
  }

  rstest.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  return observers;
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

  afterEach(() => {
    cleanup();
    rstest.useRealTimers();
    rstest.unstubAllGlobals();
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

      fireEvent[event](container.firstChild!);

      act(() => {
        rstest.runAllTimers();
      });

      expect(global.__webpack_chunk_load_test__).toBeCalledTimes(1);
      const dataHref = document
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
      const dataHref = document
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    unmount();
  });

  test('support viewport', async () => {
    const observers = mockIntersectionObserver();
    rstest.useRealTimers();
    const { container, unmount } = renderLink(
      <Link to="aa" prefetch="viewport" />,
    );

    expect(observers).toHaveLength(1);
    const observer = observers[0];
    expect(observer.observe).toHaveBeenCalledWith(container.firstChild);
    expect(observer.rootMargin).toBe('200px');
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();

    act(() => {
      observer.intersect(false);
    });
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();

    await act(async () => {
      observer.intersect(true);
    });

    await waitFor(() => {
      expect(global.__webpack_chunk_load_test__).toBeCalledTimes(1);
      const dataHref = document
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    expect(observer.disconnect).toHaveBeenCalled();

    unmount();
  });

  test('disconnect viewport observer on unmount before intersection', () => {
    const observers = mockIntersectionObserver();
    const { unmount } = renderLink(<Link to="aa" prefetch="viewport" />);

    expect(observers).toHaveLength(1);
    unmount();

    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
  });

  test('start and stop observing when viewport prefetch changes', () => {
    const observers = mockIntersectionObserver();
    let setPrefetch: React.Dispatch<React.SetStateAction<'none' | 'viewport'>>;
    const TestLink = () => {
      const [prefetch, updatePrefetch] = React.useState<'none' | 'viewport'>(
        'none',
      );
      setPrefetch = updatePrefetch;
      return <Link to="aa" prefetch={prefetch} />;
    };
    const { container } = renderLink(<TestLink />);

    expect(observers).toHaveLength(0);
    act(() => setPrefetch('viewport'));
    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledWith(container.firstChild);

    act(() => setPrefetch('none'));
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
  });

  test('leave viewport prefetch disabled without IntersectionObserver', () => {
    rstest.stubGlobal('IntersectionObserver', undefined);
    renderLink(<Link to="aa" prefetch="viewport" />);

    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
  });

  test('clean up the previous callback when the forwarded ref changes', () => {
    const firstCleanup = rstest.fn();
    const secondCleanup = rstest.fn();
    const firstRef = rstest.fn(() => firstCleanup);
    const secondRef = rstest.fn(() => secondCleanup);
    let replaceRef: (ref: React.Ref<HTMLAnchorElement>) => void;
    const TestLink = () => {
      const [ref, setRef] = React.useState<React.Ref<HTMLAnchorElement>>(
        () => firstRef,
      );
      replaceRef = nextRef => setRef(() => nextRef);
      return <Link to="aa" ref={ref} />;
    };
    const { container, unmount } = renderLink(<TestLink />);

    act(() => replaceRef(secondRef));

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(firstRef).toHaveBeenCalledTimes(1);
    expect(secondRef).toHaveBeenCalledWith(container.firstChild);
    expect(secondCleanup).not.toHaveBeenCalled();

    unmount();
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).toHaveBeenCalledTimes(1);
  });

  test('clean up every Strict Mode observer and callback ref attachment', () => {
    const observers = mockIntersectionObserver();
    const refCleanups: Array<() => void> = [];
    const ref = rstest.fn(() => {
      const refCleanup = rstest.fn();
      refCleanups.push(refCleanup);
      return refCleanup;
    });
    const { container, unmount } = renderLink(
      <Link to="aa" prefetch="viewport" ref={ref} />,
      true,
    );

    expect(observers.length).toBeGreaterThanOrEqual(2);
    expect(observers.at(-1)?.observe).toHaveBeenCalledWith(
      container.firstChild,
    );
    unmount();

    for (const observer of observers) {
      expect(observer.disconnect).toHaveBeenCalledTimes(1);
    }
    expect(refCleanups).toHaveLength(ref.mock.calls.length);
    for (const refCleanup of refCleanups) {
      expect(refCleanup).toHaveBeenCalledTimes(1);
    }
  });

  [Link, NavLink].forEach(Component => {
    test(`${Component.displayName} does not render again to store its anchor`, () => {
      const onRender = rstest.fn();
      const observers = mockIntersectionObserver();
      renderLink(
        <React.Profiler id="link" onRender={onRender}>
          <Component to="aa" />
        </React.Profiler>,
      );

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(observers).toHaveLength(0);
      expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
    });

    test(`${Component.displayName} preserves callback ref cleanup`, () => {
      const refCleanup = rstest.fn();
      const ref = rstest.fn(() => refCleanup);
      const { container, unmount } = renderLink(
        <Component to="aa" ref={ref} />,
      );

      expect(ref).toHaveBeenCalledTimes(1);
      expect(ref).toHaveBeenCalledWith(container.firstChild);
      unmount();

      expect(refCleanup).toHaveBeenCalledTimes(1);
      expect(ref).toHaveBeenCalledTimes(1);
    });

    test(`${Component.displayName} clears callback refs without cleanup`, () => {
      const ref = rstest.fn();
      const { container, unmount } = renderLink(
        <Component to="aa" ref={ref} />,
      );

      expect(ref).toHaveBeenCalledWith(container.firstChild);
      unmount();

      expect(ref).toHaveBeenLastCalledWith(null);
    });

    test(`${Component.displayName} clears object refs`, () => {
      const ref = React.createRef<HTMLAnchorElement>();
      const { container, unmount } = renderLink(
        <Component to="aa" ref={ref} />,
      );

      expect(ref.current).toBe(container.firstChild);
      unmount();

      expect(ref.current).toBeNull();
    });
  });
});
