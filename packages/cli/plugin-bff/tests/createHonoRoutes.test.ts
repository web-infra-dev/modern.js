import { Api, HttpCode, SetHeaders } from '@modern-js/bff-core';
import { Hono } from '@modern-js/server-core';
import { rs } from '@rstest/core';
import createHonoRoutes from '../src/utils/createHonoRoutes';

function createApp(handlerInfos: any[]) {
  const app = new Hono();
  for (const { method, path, handler } of createHonoRoutes(handlerInfos)) {
    (app as any)[method](path, handler);
  }
  return app;
}

function createRequest(path: string, init?: RequestInit) {
  const request = new Request(`http://localhost${path}`, init);
  // `c.req.json()` reads the raw body through `text()`.
  const text = rs.spyOn(request, 'text');
  return { request, text };
}

describe('createHonoRoutes', () => {
  it('passes path params and a null body to GET handlers without parsing the body', async () => {
    const handler = rs.fn(async (org: string, repo: string) => ({ org, repo }));
    const app = createApp([
      { routePath: '/api/:org/repo/:repo', httpMethod: 'GET', handler },
    ]);

    for (const name of ['modern', 'rsbuild']) {
      const { request, text } = createRequest(
        `/api/web-infra/repo/${name}?a=1`,
      );
      const res = await app.request(request);

      expect(await res.json()).toEqual({ org: 'web-infra', repo: name });
      expect(text).not.toHaveBeenCalled();
    }

    expect(handler).toHaveBeenCalledTimes(2);
    const [org, repo, input] = handler.mock.calls[1] as any[];
    expect([org, repo]).toEqual(['web-infra', 'rsbuild']);
    expect(input).toMatchObject({
      params: { org: 'web-infra', repo: 'rsbuild' },
      query: { a: '1' },
      body: null,
    });
    expect(input).not.toHaveProperty('data');
  });

  it('does not parse the body of GET requests with a JSON content type', async () => {
    const handler = rs.fn(async () => ({ ok: true }));
    const app = createApp([
      { routePath: '/api/foo', httpMethod: 'GET', handler },
    ]);

    const { request, text } = createRequest('/api/foo', {
      headers: { 'content-type': 'application/json' },
    });
    await app.request(request);

    expect(text).not.toHaveBeenCalled();
    const [input] = handler.mock.calls[0] as any[];
    expect(input.body).toBeNull();
    expect(input).not.toHaveProperty('data');
  });

  it('does not parse the body of HEAD requests', async () => {
    const handler = rs.fn(async () => ({ ok: true }));
    const app = createApp([
      { routePath: '/api/foo', httpMethod: 'GET', handler },
    ]);

    const { request, text } = createRequest('/api/foo', { method: 'HEAD' });
    const res = await app.request(request);

    expect(res.status).toBe(200);
    expect(text).not.toHaveBeenCalled();
    expect((handler.mock.calls[0] as any[])[0].body).toBeNull();
  });

  it('keeps parsing form content types of GET requests', async () => {
    const handler = rs.fn(async () => ({ ok: true }));
    const app = createApp([
      { routePath: '/api/foo', httpMethod: 'GET', handler },
    ]);

    await app.request('/api/foo', {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    const [input] = handler.mock.calls[0] as any[];
    expect(input.formUrlencoded).toEqual({});
    expect(input).not.toHaveProperty('body');
  });

  it('parses the bodies of POST requests by content type', async () => {
    const handler = rs.fn(async (input: any) => ({ ok: true }));
    const app = createApp([
      { routePath: '/api/foo', httpMethod: 'POST', handler },
    ]);
    const post = async (body: BodyInit, contentType?: string) => {
      handler.mockClear();
      await app.request('/api/foo', {
        method: 'POST',
        body,
        headers: contentType ? { 'content-type': contentType } : {},
      });
      return (handler.mock.calls[0] as any[])[0];
    };

    const json = await post(
      JSON.stringify({ name: 'modern' }),
      'application/json; charset=utf-8',
    );
    expect(json.data).toEqual({ name: 'modern' });
    expect(json).not.toHaveProperty('body');

    const formData = new FormData();
    formData.append('file', 'content');
    const multipart = await post(formData);
    expect(multipart.formData).toEqual({ file: 'content' });
    expect(multipart).not.toHaveProperty('body');

    const urlencoded = await post(
      'a=1&b=2',
      'application/x-www-form-urlencoded',
    );
    expect(urlencoded.formUrlencoded).toEqual({ a: '1', b: '2' });
    expect(urlencoded).not.toHaveProperty('body');

    expect((await post('{"a":1}', 'text/plain')).body).toEqual({ a: 1 });
    expect((await post('not json', 'text/plain')).body).toBeNull();
  });

  it('falls back to a null body for other requests without a body', async () => {
    const handler = rs.fn(async (id: string) => ({ id }));
    const app = createApp([
      { routePath: '/api/foo/:id', httpMethod: 'DELETE', handler },
    ]);

    const res = await app.request('/api/foo/1', { method: 'DELETE' });

    expect(await res.json()).toEqual({ id: '1' });
    const [, input] = handler.mock.calls[0] as any[];
    expect(input.body).toBeNull();
  });

  it('applies the response metadata of Api handlers', async () => {
    const handler = Api(
      HttpCode(202),
      SetHeaders({ 'x-bff': 'modern' }),
      async ({ query }: any) => ({ query }),
    );
    const app = createApp([
      { routePath: '/api/meta', httpMethod: 'GET', handler },
    ]);

    for (let i = 0; i < 2; i++) {
      const { request, text } = createRequest(`/api/meta?i=${i}`);
      const res = await app.request(request);

      expect(res.status).toBe(202);
      expect(res.headers.get('x-bff')).toBe('modern');
      expect(await res.json()).toEqual({ query: { i: String(i) } });
      expect(text).not.toHaveBeenCalled();
    }
  });
});
