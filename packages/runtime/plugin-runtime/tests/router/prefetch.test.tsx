import React from 'react';
import {
  createMemoryRouter,
  LoaderFunctionArgs,
  RouterProvider,
} from 'react-router-dom';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { Link } from '../../src/router';
import { RuntimeReactContext } from '../../src';

declare global {
  // eslint-disable-next-line no-inner-declarations, no-var
  var __webpack_chunk_load__: ((chunkId: string) => Promise<void>) | undefined;
  // eslint-disable-next-line no-inner-declarations, no-var
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      if (context === RuntimeReactContext) {
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
      const dataHref = container
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          if (context === RuntimeReactContext) {
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
      const dataHref = container
        .querySelector('link[rel="prefetch"][as="fetch"]')
        ?.getAttribute('href');
      expect(
        dataHref?.includes('aa?__loader=aa&__ssrDirect=true'),
      ).toBeTruthy();
    });
    unmount();
  });
});
