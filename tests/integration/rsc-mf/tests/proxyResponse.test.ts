import { createSafeProxyResponse } from '../shared/proxyResponse';

describe('rsc-mf proxy response helper', () => {
  it('removes hop-by-hop response headers while preserving payload', async () => {
    const upstream = new Response('proxied-body', {
      status: 202,
      headers: {
        'content-type': 'application/javascript',
        'content-length': '999',
        'content-encoding': 'gzip',
        connection: 'keep-alive, x-custom-hop-header',
        'keep-alive': 'timeout=5',
        'x-custom-hop-header': 'remove-me',
        te: 'trailers',
        trailer: 'x-trailer-a',
        upgrade: 'websocket',
        'transfer-encoding': 'chunked',
      },
    });

    const proxied = createSafeProxyResponse(upstream);

    expect(proxied.status).toBe(202);
    expect(proxied.headers.get('content-type')).toBe('application/javascript');
    expect(proxied.headers.get('content-length')).toBeNull();
    expect(proxied.headers.get('content-encoding')).toBeNull();
    expect(proxied.headers.get('connection')).toBeNull();
    expect(proxied.headers.get('keep-alive')).toBeNull();
    expect(proxied.headers.get('x-custom-hop-header')).toBeNull();
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
});
