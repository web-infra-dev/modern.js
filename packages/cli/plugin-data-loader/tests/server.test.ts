import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import qs from 'querystring';
import { createWebRequest, sendResponse } from '@modern-js/server-core/node';
import type { ServerRoute } from '@modern-js/types';
import request from 'supertest';
import { LOADER_ID_PARAM } from '../src/common/constants';
import { handleRequest } from '../src/runtime';

describe('handleRequest', () => {
  const serverLoaders = path.join(
    __dirname,
    './fixtures',
    'server',
    'bundles',
    'three-server-loaders/index.js',
  );
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
      logger: {
        info() {},
        warn() {},
        error() {},
        debug() {},
        log() {},
      },
      reporter: {
        init() {},
        reportTiming() {},
        reportError() {},
        reportInfo() {},
        reportWarn() {},
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
      const { routes } = await import(serverLoaders);
      const request = createWebRequest(req, res);
      const response = await handleRequest({
        request,
        context,
        serverRoutes,
        routes,
      });
      if (!res.headersSent && response) {
        await sendResponse(response, res);
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
      `/three?${LOADER_ID_PARAM}=user/profile/layout`,
    );

    expect(res.status).toBe(403);
  });

  test.skip('should return directly when routeId not exist', async () => {
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
      `/three/user/profile?${LOADER_ID_PARAM}=user/profile/layout`,
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

    const res = await request(handler).get(
      `/three/user?${LOADER_ID_PARAM}=user/layout`,
    );
    expect(res.status).toBe(404);
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
      `/three/user/${id}?${LOADER_ID_PARAM}=user/[id]/layout`,
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
      `/three/user/profile/name?${LOADER_ID_PARAM}=user.profile.name/layout`,
    );
    expect(res.status).toBe(500);
    expect(
      res.headers['content-type'].includes('application/json'),
    ).toBeTruthy();
    expect(res.body.message).toBe('throw error by loader4');
  });
});
