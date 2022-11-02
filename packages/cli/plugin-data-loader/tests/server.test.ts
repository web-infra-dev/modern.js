// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/no-unsupported-features/node-builtins */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/prefer-global/url */
import { IncomingMessage, ServerResponse } from 'http';
import qs from 'querystring';
import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import request from 'supertest';
import { handleRequest, getPathWithoutEntry } from '../src/server';

describe('handleRequest', () => {
  const distDir = path.join(__dirname, './fixtures', 'server');
  const createContext = (
    req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
  ) => {
    const context = {
      req,
      res,
      params,
      get headers() {
        return req.headers;
      },
      get method() {
        return req.method!;
      },
      get url() {
        return req.url!;
      },
      get host() {
        return req.headers.host!;
      },
      get protocol() {
        return 'http';
      },
      get origin() {
        return `${this.protocol}://${this.host}`;
      },
      get href() {
        return `${this.origin}${this.url}`;
      },
      get parsedURL() {
        const url = new URL(req.url!, this.origin);
        return url;
      },
      get path() {
        return this.parsedURL.pathname;
      },
      get querystring() {
        return this.parsedURL.search.replace(/^\?/, '') || '';
      },
      get query() {
        const str = this.querystring;
        return qs.parse(str);
      },
    };
    return context;
  };

  const createHandler = (
    serverRoutes: ServerRoute[],
    params: Record<string, string>,
  ) => {
    return async (req: IncomingMessage, res: ServerResponse) => {
      const context = createContext(req, res, params);
      await handleRequest({
        context,
        serverRoutes,
        distDir,
      });
      if (!res.headersSent) {
        res.end();
      }
    };
  };

  test('should return 403 when routeId not match url', async () => {
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {},
    );
    const res = await request(handler).get(
      '/three?_loader=user/profile/layout',
    );
    expect(res.status).toBe(403);
  });

  test('should return directly when routeId not exist', async () => {
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {},
    );

    const realHandler = async (req: IncomingMessage, res: ServerResponse) => {
      res.statusCode = 404;
      await handler(req, res);
    };

    const res = await request(realHandler).get('/three/user/profile');
    expect(res.status).toBe(404);
  });

  test('support return data directly', async () => {
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {},
    );

    const res = await request(handler).get(
      '/three/user/profile?_loader=user/profile/layout',
    );
    expect(res.status).toBe(200);
    expect(
      res.headers['content-type'].includes('application/json'),
    ).toBeTruthy();
    expect(res.body.message).toBe('loader0');
  });

  test('support return response directly', async () => {
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {},
    );

    const res = await request(handler).get('/three/user?_loader=user/layout');
    expect(res.status).toBe(200);
    expect(res.headers['content-type'].includes('text/plain')).toBeTruthy();
    expect(res.text).toBe('loader1');
  });

  test('support params', async () => {
    const id = '123';
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {
        id,
      },
    );
    const res = await request(handler).get(
      `/three/user/${id}?_loader=user/[id]/layout`,
    );

    expect(res.status).toBe(200);
    expect(
      res.headers['content-type'].includes('application/json'),
    ).toBeTruthy();
    expect(res.text).toBe(JSON.stringify(id));
  });

  test('support error', async () => {
    const handler = createHandler(
      [
        {
          urlPath: '/three',
          entryName: 'three',
          entryPath: 'html/three/index.html',
          isSPA: true,
          isSSR: true,
        },
      ],
      {},
    );

    const res = await request(handler).get(
      '/three/user/profile/name?_loader=user.profile.name/layout',
    );
    expect(res.status).toBe(500);
    expect(res.headers['content-type'].includes('text/plain')).toBeTruthy();
    expect(res.text).toBe('Error: throw error by loader4');
  });

  test('getPathWithoutEntry', () => {
    expect(getPathWithoutEntry('/user/profile', '/')).toEqual('/user/profile');
    expect(getPathWithoutEntry('/entry/user/profile', '/entry')).toEqual(
      '/user/profile',
    );
  });
});
