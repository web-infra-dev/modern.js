/**
 * @jest-environment jsdom
 */
import {
  type LoaderFunctionArgs,
  RouterProvider,
  createMemoryRouter,
} from '@modern-js/runtime-utils/router';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React, { act } from 'react';
import {
  InternalRuntimeContext,
  type TInternalRuntimeContext,
} from '../../src/core/context';
import { Link } from '../../src/router';

declare global {
  var __webpack_chunk_load__: ((chunkId: string) => Promise<void>) | undefined;
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

jest.mock('react', () => {
  const originalModule = jest.requireActual('react');
  const originContext = originalModule.useContext;
  return {
    ...originalModule,
    useContext: (context: unknown) => {
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
    jest.useFakeTimers();
    jest.resetModules();
    jest.clearAllMocks();
    global.__webpack_chunk_load__ = jest.fn();
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
        jest.runAllTimers();
      });

      expect(global.__webpack_chunk_load__).toBeCalledTimes(1);
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

    jest.mock('react', () => {
      const originalModule = jest.requireActual('react');
      const originContext = originalModule.useContext;
      return {
        ...originalModule,
        useContext: (context: unknown) => {
          if (context === InternalRuntimeContext) {
            return {
              routes: mockRoutes,
              routeManifest: mockRouteManifest,
            };
          }
          return originContext(context);
        },
      };
    });

    let router;
    act(() => {
      router = createMemoryRouter(mockRoutes);
    });
    const { container, unmount } = render(
      <RouterProvider router={router as any} />,
    );

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(global.__webpack_chunk_load__).toBeCalledTimes(1);
      const dataHref = document.head
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    unmount();
  });
});
