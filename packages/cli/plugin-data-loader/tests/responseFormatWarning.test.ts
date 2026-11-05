import { createRequest } from '../src/cli/createRequest';
import { CONTENT_TYPE_DEFERRED } from '../src/common/constants';

const callLoader = (routeId: string, url = 'http://localhost:8080/user') =>
  createRequest(routeId)({ params: {}, request: new Request(url) });

describe('createRequest response format warning', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.NODE_ENV;
  let warnSpy: ReturnType<typeof rstest.spyOn>;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    warnSpy = rstest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalEnv;
    warnSpy.mockRestore();
  });

  const mockFetch = (res: Response) => {
    global.fetch = rstest.fn(async () => res) as unknown as typeof fetch;
  };

  test('warns once per route and keeps the response when the response is not from the data loader', async () => {
    const html = new Response('<!doctype html><html></html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    mockFetch(html);

    const result = await callLoader('warn-html/layout');
    expect(result).toBe(html);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain('warn-html/layout');
    expect(message).toContain('X-Modernjs-Response');
    expect(message).toContain('text/html');

    mockFetch(
      new Response('<html></html>', {
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    await callLoader('warn-html/layout');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test('does not warn when the response has X-Modernjs-Response', async () => {
    const json = new Response(JSON.stringify({ a: 1 }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Modernjs-Response': 'yes',
      },
    });
    mockFetch(json);
    const result = await callLoader('ok-json/layout');
    expect(result).toBe(json);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('does not warn for redirect, error, catch and deferred responses', async () => {
    mockFetch(
      new Response(null, {
        status: 204,
        headers: { 'X-Modernjs-Redirect': '/login' },
      }),
    );
    await expect(callLoader('redirect/layout')).rejects.toBeInstanceOf(
      Response,
    );

    mockFetch(
      new Response(JSON.stringify({ message: 'boom' }), {
        status: 500,
        headers: {
          'X-Modernjs-Error': 'yes',
          'Content-Type': 'application/json',
        },
      }),
    );
    await expect(callLoader('error/layout')).rejects.toThrow('boom');

    mockFetch(
      new Response('nope', {
        status: 404,
        headers: { 'X-Modernjs-Catch': 'yes' },
      }),
    );
    await expect(callLoader('catch/layout')).rejects.toBeInstanceOf(Response);

    mockFetch(
      new Response('{"a":1}\n\n', {
        headers: { 'Content-Type': `${CONTENT_TYPE_DEFERRED}; charset=UTF-8` },
      }),
    );
    await expect(callLoader('deferred/layout')).resolves.toEqual({ a: 1 });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('does not warn in production', async () => {
    process.env.NODE_ENV = 'production';
    const html = new Response('<html></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
    mockFetch(html);
    const result = await callLoader('prod-html/layout');
    expect(result).toBe(html);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
