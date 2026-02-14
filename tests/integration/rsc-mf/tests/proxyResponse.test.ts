import { createSafeProxyResponse } from '../shared/proxyResponse';

describe('rsc-mf proxy response helper', () => {
  it('removes hop-by-hop response headers while preserving payload', async () => {
    const upstream = new Response('proxied-body', {
      status: 202,
      statusText: 'Accepted-Proxy',
      headers: {
        'content-type': 'application/javascript',
        'content-length': '999',
        'content-encoding': 'gzip',
        connection:
          'keep-alive, x-custom-hop-header, "x-quoted-hop-header", "x-spaced-hop-header"',
        'keep-alive': 'timeout=5',
        'x-custom-hop-header': 'remove-me',
        'x-quoted-hop-header': 'remove-me',
        'x-spaced-hop-header': 'remove-me',
        'proxy-connection': 'keep-alive',
        'proxy-authenticate': 'Basic realm=test',
        'proxy-authorization': 'Basic dGVzdA==',
        te: 'trailers',
        trailer: 'x-trailer-a',
        upgrade: 'websocket',
        'transfer-encoding': 'chunked',
      },
    });

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.status).toBe(202);
    expect(proxied.statusText).toBe('Accepted-Proxy');
    expect(proxied.headers.get('content-type')).toBe('application/javascript');
    expect(proxied.headers.get('content-length')).toBeNull();
    expect(proxied.headers.get('content-encoding')).toBeNull();
    expect(proxied.headers.get('connection')).toBeNull();
    expect(proxied.headers.get('keep-alive')).toBeNull();
    expect(proxied.headers.get('x-custom-hop-header')).toBeNull();
    expect(proxied.headers.get('x-quoted-hop-header')).toBeNull();
    expect(proxied.headers.get('x-spaced-hop-header')).toBeNull();
    expect(proxied.headers.get('proxy-connection')).toBeNull();
    expect(proxied.headers.get('proxy-authenticate')).toBeNull();
    expect(proxied.headers.get('proxy-authorization')).toBeNull();
    expect(proxied.headers.get('te')).toBeNull();
    expect(proxied.headers.get('trailer')).toBeNull();
    expect(proxied.headers.get('upgrade')).toBeNull();
    expect(proxied.headers.get('transfer-encoding')).toBeNull();
    await expect(proxied.text()).resolves.toBe('proxied-body');
  });

  it('keeps unrelated response headers intact', () => {
    const upstream = new Response('ok', {
      status: 200,
      headers: {
        'cache-control': 'public,max-age=31536000',
        etag: '"abc123"',
      },
    });

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.headers.get('cache-control')).toBe(
      'public,max-age=31536000',
    );
    expect(proxied.headers.get('etag')).toBe('"abc123"');
  });

  it('normalizes mixed-case quoted connection tokens', () => {
    const upstream = new Response('ok', {
      status: 200,
      headers: {
        connection: '"X-Mixed-Hop-Header", Keep-Alive',
        'x-mixed-hop-header': 'remove-me',
        'Keep-Alive': 'timeout=5',
        'x-safe-header': 'preserve-me',
      },
    });

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.headers.get('x-mixed-hop-header')).toBeNull();
    expect(proxied.headers.get('keep-alive')).toBeNull();
    expect(proxied.headers.get('x-safe-header')).toBe('preserve-me');
  });

  it('ignores empty connection tokens after quote normalization', async () => {
    const upstream = new Response('ok', {
      status: 200,
      headers: {
        connection: ' , "", "   ", "x-trimmed-hop-header" ',
        'x-trimmed-hop-header': 'remove-me',
        'x-safe-header': 'preserve-me',
      },
    });

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.headers.get('x-trimmed-hop-header')).toBeNull();
    expect(proxied.headers.get('x-safe-header')).toBe('preserve-me');
    await expect(proxied.text()).resolves.toBe('ok');
  });

  it('forces empty body for no-content status responses', async () => {
    const upstream = {
      status: 204,
      statusText: 'No Content',
      headers: new Headers({
        'content-type': 'application/javascript',
      }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('should-not-be-forwarded'),
          );
          controller.close();
        },
      }),
    } as unknown as Response;

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.status).toBe(204);
    expect(proxied.statusText).toBe('No Content');
    await expect(proxied.text()).resolves.toBe('');
  });

  it.each([
    { status: 205, statusText: 'Reset Content' },
    { status: 304, statusText: 'Not Modified' },
  ])(
    'forces empty body for status $status ($statusText)',
    async ({ status, statusText }) => {
      const upstream = {
        status,
        statusText,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('discard-body'));
            controller.close();
          },
        }),
      } as unknown as Response;

      const proxied = createSafeProxyResponse(upstream);

      expect(proxied.status).toBe(status);
      expect(proxied.statusText).toBe(statusText);
      await expect(proxied.text()).resolves.toBe('');
    },
  );
});
