import { describe, expect, it } from '@rstest/core';
import {
  omitDeferredPending,
  restoreDeferredPending,
  settleDeferredLoaderData,
} from '../../src/router/runtime/deferredData';

const later = <T>(value: T, ms: number): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

describe('settleDeferredLoaderData', () => {
  it('replaces promises that resolve in time with their values and lists the rest', async () => {
    const loaderData: Record<string, unknown> = {
      layout: {
        user: Promise.resolve({ name: 'a' }),
        slow: later('late', 200),
        broken: Promise.reject(new Error('boom')),
        plain: 1,
      },
      page: { list: later([1, 2], 5) },
    };
    const pending = await settleDeferredLoaderData(loaderData, 50);
    expect(pending).toEqual({ layout: ['slow', 'broken'] });
    expect((loaderData.layout as Record<string, unknown>).user).toEqual({
      name: 'a',
    });
    expect((loaderData.layout as Record<string, unknown>).plain).toBe(1);
    expect((loaderData.page as Record<string, unknown>).list).toEqual([1, 2]);
  });

  it('waits for every promise when no timeout is set', async () => {
    const loaderData: Record<string, unknown> = {
      page: { slow: later('x', 30) },
    };
    expect(await settleDeferredLoaderData(loaderData)).toEqual({});
    expect((loaderData.page as Record<string, unknown>).slow).toBe('x');
  });

  it('leaves non-object loader data and responses alone', async () => {
    const response = new Response('ok');
    const loaderData: Record<string, unknown> = {
      a: null,
      b: 'text',
      c: response,
    };
    expect(await settleDeferredLoaderData(loaderData, 10)).toEqual({});
    expect(loaderData.c).toBe(response);
  });
});

describe('omitDeferredPending', () => {
  it('drops pending keys from a copy, keeping the original intact for rendering', () => {
    const slow = new Promise(() => undefined);
    const loaderData = { layout: { user: 'a', slow } };
    const copy = omitDeferredPending(loaderData, { layout: ['slow'] });
    expect(copy).toEqual({ layout: { user: 'a' } });
    expect(loaderData.layout.slow).toBe(slow);
  });
});

describe('restoreDeferredPending', () => {
  it('feeds every pending key of a route from one call to its loader', async () => {
    const calls: { url: string; params: unknown }[] = [];
    const routes = [
      {
        id: 'layout',
        loader: async ({
          request,
          params,
        }: {
          request: Request;
          params: unknown;
        }) => {
          calls.push({ url: request.url, params });
          return { user: 'fresh', slow: 'value', other: Promise.resolve(2) };
        },
        children: [{ id: 'page' }],
      },
    ];
    const data = restoreDeferredPending(
      { layout: { user: 'server' } },
      { layout: ['slow', 'other'] },
      routes,
      { url: 'https://app.test/chat?a=1', params: () => ({ id: '1' }) },
    ) as Record<string, Record<string, unknown>>;

    expect(data.layout.user).toBe('server');
    await expect(data.layout.slow).resolves.toBe('value');
    await expect(data.layout.other).resolves.toBe(2);
    expect(calls).toEqual([
      { url: 'https://app.test/chat?a=1', params: { id: '1' } },
    ]);
  });

  it('rejects only the pending values when the route loader fails', async () => {
    const routes = [
      {
        id: 'layout',
        loader: async () => {
          throw new Error('offline');
        },
      },
    ];
    const data = restoreDeferredPending(
      { layout: { user: 'server' } },
      { layout: ['slow'] },
      routes,
      { url: 'https://app.test/', params: () => ({}) },
    ) as Record<string, Record<string, unknown>>;
    expect(data.layout.user).toBe('server');
    await expect(data.layout.slow).rejects.toThrow('offline');
  });

  it('returns the data unchanged when nothing is pending', () => {
    const loaderData = { layout: { user: 'a' } };
    expect(
      restoreDeferredPending(loaderData, undefined, [], {
        url: 'https://app.test/',
        params: () => ({}),
      }),
    ).toBe(loaderData);
  });
});
