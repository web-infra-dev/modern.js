import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react';
import type { Fetcher } from '../../src/runtime/dataMutation';
import {
  Form,
  useFetcher,
} from '../../src/runtime/dataMutation';

type RouteHandler = (args: {
  request: Request;
  params: Record<string, string>;
  context?: unknown;
}) => Promise<unknown> | unknown;

let currentRouter: any;

rstest.mock('@tanstack/react-router', () => ({
  useRouter: () => currentRouter,
}));

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

function createRouter(handler: {
  action?: RouteHandler;
  loader?: RouteHandler;
  invalidate?: () => Promise<void>;
}) {
  return {
    buildLocation: ({ to }: { to?: string }) => ({
      pathname: typeof to === 'string' ? to : '/',
    }),
    getParsedLocationHref: (location: { pathname: string }) =>
      location.pathname,
    getMatchedRoutes: () => ({
      foundRoute: {
        options: {
          staticData: {
            modernRouteAction: handler.action,
            modernRouteLoader: handler.loader,
          },
        },
      },
      routeParams: {},
    }),
    navigate: rstest.fn(async () => undefined),
    invalidate: rstest.fn(handler.invalidate || (async () => undefined)),
  };
}

function formatFetcherError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error == null) {
    return '';
  }
  return JSON.stringify(error);
}

describe('tanstack data mutation fetcher', () => {
  let latestFetcher: Fetcher | undefined;
  const states: string[] = [];

  function FetcherHarness() {
    const fetcher = useFetcher();
    latestFetcher = fetcher;

    React.useEffect(() => {
      states.push(fetcher.state);
    }, [fetcher.state]);

    return (
      <div>
        <div data-testid="state">{fetcher.state}</div>
        <div data-testid="data">
          {fetcher.data === undefined
            ? 'undefined'
            : JSON.stringify(fetcher.data)}
        </div>
        <div data-testid="error">{formatFetcherError(fetcher.error)}</div>
      </div>
    );
  }

  beforeEach(() => {
    latestFetcher = undefined;
    states.length = 0;
  });

  test('tracks submitting and loading phases for mutation submit', async () => {
    const actionResult = createDeferred<Response>();
    const invalidateResult = createDeferred<void>();

    currentRouter = createRouter({
      action: async () => actionResult.promise,
      invalidate: async () => invalidateResult.promise,
    });

    render(<FetcherHarness />);
    expect(screen.getByTestId('state').textContent).toBe('idle');

    let submitPromise: Promise<void> | undefined;
    act(() => {
      submitPromise = latestFetcher!.submit(
        { amount: 2 },
        { method: 'post', action: '/mutation' },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    actionResult.resolve(
      new Response(JSON.stringify({ count: 2 }), {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('loading');
    });

    invalidateResult.resolve();

    await act(async () => {
      await submitPromise;
    });

    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('{"count":2}');
    expect(states).toEqual(['idle', 'submitting', 'loading', 'idle']);
  });

  test('defaults fetcher submit without method to mutation state', async () => {
    const actionResult = createDeferred<Response>();
    const invalidateResult = createDeferred<void>();
    const action = rstest.fn(async () => actionResult.promise);
    const loader = rstest.fn(async () => ({ count: 0 }));

    currentRouter = createRouter({
      action,
      loader,
      invalidate: async () => invalidateResult.promise,
    });

    render(<FetcherHarness />);
    expect(screen.getByTestId('state').textContent).toBe('idle');

    let submitPromise: Promise<void> | undefined;
    act(() => {
      submitPromise = latestFetcher!.submit(
        { amount: 1 },
        { action: '/mutation' },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(loader).not.toHaveBeenCalled();

    actionResult.resolve(
      new Response(JSON.stringify({ count: 1 }), {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('loading');
    });

    invalidateResult.resolve();

    await act(async () => {
      await submitPromise;
    });

    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('{"count":1}');
    expect(states).toEqual(['idle', 'submitting', 'loading', 'idle']);
  });

  test('surfaces non-2xx action responses as fetcher errors', async () => {
    const actionResult = createDeferred<Response>();
    currentRouter = createRouter({
      action: async () => actionResult.promise,
    });

    render(<FetcherHarness />);

    let thrownError: unknown;
    let submitPromise: Promise<void> | undefined;
    act(() => {
      submitPromise = latestFetcher!.submit(
        { amount: 'not-a-number' },
        { method: 'post', action: '/mutation' },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    actionResult.resolve(
      new Response(JSON.stringify({ message: 'invalid amount' }), {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await act(async () => {
      try {
        await submitPromise;
      } catch (error) {
        thrownError = error;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('error').textContent).toContain('422');
    expect(currentRouter.invalidate).not.toHaveBeenCalled();
    expect(states).toEqual(['idle', 'submitting', 'idle']);
  });

  test('uses loading state for loader fetches', async () => {
    const loaderResult = createDeferred<{ count: number }>();

    currentRouter = createRouter({
      loader: async () => loaderResult.promise,
    });

    render(<FetcherHarness />);

    let submitPromise: Promise<void> | undefined;
    act(() => {
      submitPromise = latestFetcher!.submit(
        {},
        { method: 'get', action: '/mutation' },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('loading');
    });

    loaderResult.resolve({ count: 7 });

    await act(async () => {
      await submitPromise;
    });

    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('{"count":7}');
    expect(currentRouter.invalidate).not.toHaveBeenCalled();
    expect(states).toEqual(['idle', 'loading', 'idle']);
  });

  test('keeps non-idle state while overlapping mutation submits are still active', async () => {
    const actionResults = [
      createDeferred<Response>(),
      createDeferred<Response>(),
    ];
    const invalidateResults = [createDeferred<void>(), createDeferred<void>()];
    let actionCallIndex = 0;
    let invalidateCallIndex = 0;

    currentRouter = createRouter({
      action: async () => {
        const current = actionResults[actionCallIndex];
        actionCallIndex += 1;
        return current.promise;
      },
      invalidate: async () => {
        const current = invalidateResults[invalidateCallIndex];
        invalidateCallIndex += 1;
        return current.promise;
      },
    });

    render(<FetcherHarness />);

    let firstSubmit: Promise<void> | undefined;
    let secondSubmit: Promise<void> | undefined;

    act(() => {
      firstSubmit = latestFetcher!.submit(
        { amount: 1 },
        { method: 'post', action: '/mutation' },
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    act(() => {
      secondSubmit = latestFetcher!.submit(
        { amount: 2 },
        { method: 'post', action: '/mutation' },
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    actionResults[0].resolve(
      new Response(JSON.stringify({ count: 1 }), {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
    await waitFor(() => {
      expect(currentRouter.invalidate).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    invalidateResults[0].resolve();
    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('submitting');
    });

    actionResults[1].resolve(
      new Response(JSON.stringify({ count: 3 }), {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
    await waitFor(() => {
      expect(currentRouter.invalidate).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('state').textContent).toBe('loading');
    });

    invalidateResults[1].resolve();
    await act(async () => {
      await Promise.all([firstSubmit, secondSubmit]);
    });

    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('{"count":3}');
  });

  test('does not throw for Form submit with non-2xx response and still invalidates', async () => {
    const action = rstest.fn(
      async () =>
        new Response(JSON.stringify({ message: 'invalid amount' }), {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
    );
    currentRouter = createRouter({
      action,
    });

    render(
      <Form method="post" action="/mutation">
        <button type="submit">submit</button>
      </Form>,
    );

    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
      expect(currentRouter.invalidate).toHaveBeenCalledTimes(1);
    });
  });
});
