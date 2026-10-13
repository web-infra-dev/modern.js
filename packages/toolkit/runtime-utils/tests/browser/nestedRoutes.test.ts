import type { NestedRoute } from '@modern-js/types';
import type { LoaderFunction } from 'react-router';
import { transformNestedRoutes } from '../../src/browser/nestedRoutes';

const getLoader = (route: Partial<NestedRoute>) => {
  const [result] = transformNestedRoutes([
    { id: 'test-route', path: '/', type: 'nested', ...route },
  ]);
  return result.loader as LoaderFunction;
};

const args = {
  request: new Request('http://localhost/'),
  params: {},
  context: undefined,
};

describe('nested route module loading', () => {
  it.each([false, true])(
    'handles preload rejection without failing the data loader (data loader: %s)',
    async hasDataLoader => {
      const error = new Error('Route module initialization failed');
      const loader = getLoader({
        lazyImport: () => Promise.reject(error),
        ...(hasDataLoader && { loader: async () => 'route data' }),
      });

      await expect(Promise.resolve(loader(args))).resolves.toBe(
        hasDataLoader ? 'route data' : null,
      );
    },
  );

  it('returns data while the module preload is still pending', async () => {
    const modulePromise = new Promise(() => {});
    const dataLoader = rstest.fn(async () => 'route data');
    const loader = getLoader({
      lazyImport: () => modulePromise,
      loader: dataLoader,
    });

    await expect(loader(args)).resolves.toBe('route data');
    expect(dataLoader).toHaveBeenCalledWith(args);
  });

  it('returns synchronously without a data loader while preloading', () => {
    const lazyImport = rstest.fn(() => new Promise(() => {}));
    const loader = getLoader({ lazyImport });
    expect(loader(args)).toBeNull();
    expect(lazyImport).toHaveBeenCalledTimes(1);
  });

  it('preserves data loader failures while the module is loading', async () => {
    const error = new Error('Route data failed');
    const loader = getLoader({
      lazyImport: () => new Promise(() => {}),
      loader: () => {
        throw error;
      },
    });

    await expect(loader(args)).rejects.toBe(error);
  });
});
