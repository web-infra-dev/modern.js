import { renderNestedRoute } from '../../src/browser/nestedRoutes';

// A rejected promise whose rejection is only "handled" once something attaches
// a rejection handler to it; `.catch(fn)` goes through `.then(undefined, fn)`.
const createTrackedRejection = () => {
  const error = Object.assign(new Error('Loading chunk page failed.'), {
    name: 'ChunkLoadError',
  });
  const promise = Promise.reject(error);
  const state = { handled: false };
  const then = promise.then.bind(promise);
  promise.then = ((onFulfilled, onRejected) => {
    if (onRejected) {
      state.handled = true;
    }
    return then(onFulfilled, onRejected);
  }) as typeof promise.then;
  // Keep the test runner itself from reporting the rejection if the code under
  // test leaves it unhandled; the assertion below is what checks that.
  then(undefined, () => {});
  return { promise, state };
};

// Not `rs.fn`: mock functions attach their own handlers to returned promises
// to record settled results, which would mark the rejection as handled.
const createLazyImport = (promise: Promise<never>) => {
  const lazyImport = () => {
    lazyImport.calls += 1;
    return promise;
  };
  lazyImport.calls = 0;
  return lazyImport;
};

describe('renderNestedRoute loader preload', () => {
  it('handles a failed preload for a route without a loader', async () => {
    const { promise, state } = createTrackedRejection();
    const lazyImport = createLazyImport(promise);
    const element = renderNestedRoute({
      id: 'page',
      type: 'nested',
      lazyImport,
    });

    const result = await element.props.loader({});

    expect(lazyImport.calls).toBe(1);
    expect(result).toBeNull();
    expect(state.handled).toBe(true);
  });

  it('handles a failed preload for a route with a loader', async () => {
    const { promise, state } = createTrackedRejection();
    const lazyImport = createLazyImport(promise);
    const loader = rs.fn(async () => 'data');
    const element = renderNestedRoute({
      id: 'page',
      type: 'nested',
      lazyImport,
      loader,
    });

    const result = await element.props.loader({});

    expect(lazyImport.calls).toBe(1);
    expect(result).toBe('data');
    expect(state.handled).toBe(true);
  });
});
