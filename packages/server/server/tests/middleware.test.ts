import path from 'path';
import { EventEmitter, Readable } from 'stream';
import webpack from 'webpack';
import { getDefaultConfig, NormalizedConfig } from '@modern-js/core';
import httpMocks from 'node-mocks-http';
import createServer from '../src';
import { DevMiddlewareAPI } from '../src/types';

(global as any).setImmediate = () => false;
const appDirectory = path.join(__dirname, './fixtures/pure');
describe('test dev server middleware', () => {
  test('should use custom devMiddleware correctly', async () => {
    const middlewareCbFn = jest.fn(async (_req, _res, next) => {
      next();
    }) as unknown as DevMiddlewareAPI;

    middlewareCbFn.close = jest.fn();

    const middlewareFn = jest.fn(() => middlewareCbFn);

    const compiler = webpack({});

    const server = await createServer({
      config: {
        ...getDefaultConfig(),
        output: {
          path: 'test-dist',
        },
      } as unknown as NormalizedConfig,
      pwd: appDirectory,
      dev: {
        devMiddleware: {
          writeToDisk: false,
        },
        hot: false,
      },
      compiler,
      devMiddleware: middlewareFn,
    });

    const modernServer: any = (server as any).server;
    const handler = modernServer.getRequestHandler();

    expect(middlewareFn).toBeCalledWith(compiler, {
      writeToDisk: false,
      stats: false,
    });

    expect(middlewareCbFn).not.toBeCalled();

    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    handler(req, res);
    const html = await new Promise((resolve, _reject) => {
      res.on('finish', () => {
        resolve(res._getData());
      });
    });

    expect(html).toMatch('<div>Modern.js</div>');
    expect(middlewareCbFn).toBeCalled();

    await server.close();
  });

  test('should use default devMiddleware correctly', async () => {
    const compiler = webpack({});

    const server = await createServer({
      config: {
        ...getDefaultConfig(),
        output: {
          path: 'test-dist',
        },
      } as unknown as NormalizedConfig,
      pwd: appDirectory,
      dev: {
        hot: false,
      },
      compiler,
    });

    const modernServer: any = (server as any).server;
    const handler = modernServer.getRequestHandler();

    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    handler(req, res);
    const html = await new Promise((resolve, _reject) => {
      res.on('finish', () => {
        resolve(res._getData());
      });
      res.end('xxx');
    });

    expect(html).toMatch('xxx');

    await server.close();
  });

  test('should historyApiFallback work correctly', async () => {
    const server = await createServer({
      config: {
        ...getDefaultConfig(),
        output: {
          path: 'test-dist',
        },
      } as unknown as NormalizedConfig,
      pwd: appDirectory,
      dev: {
        historyApiFallback: {
          rewrites: [{ from: /xxx/, to: '/test' }],
        },
        hot: false,
      },
      compiler: null,
    });

    const modernServer: any = (server as any).server;
    const handler = modernServer.getRequestHandler();

    const req = httpMocks.createRequest({
      url: '/xxx',
      headers: {
        host: 'modernjs.com',
        accept: 'text/html, */*',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    handler(req, res);
    const html = await new Promise((resolve, _reject) => {
      res.on('finish', () => {
        resolve(res._getData());
      });
    });

    expect(html).toMatch('<div>test</div>');

    await server.close();
  });

  test('should setupMiddlewares work correctly', async () => {
    const middlewareFn = jest.fn();

    const server = await createServer({
      config: {
        ...getDefaultConfig(),
        output: {
          path: 'test-dist',
        },
      } as unknown as NormalizedConfig,
      pwd: appDirectory,
      dev: {
        setupMiddlewares: [
          (middlewares, server) => {
            expect(() => server.sockWrite('content-changed')).not.toThrow();

            middlewares.unshift((req, res, next) => {
              middlewareFn('run unshift');
              next();
            });

            middlewares.push((req, res, next) => {
              middlewareFn('run push');
              next();
            });
          },
        ],
        before: [
          async (req, res, next) => {
            middlewareFn('run before');
            next();
          },
        ],
        after: [
          async (req, res, next) => {
            middlewareFn('run after');
            next();
          },
        ],
        hot: false,
      },
      compiler: null,
    });

    const modernServer: any = (server as any).server;
    const handler = modernServer.getRequestHandler();

    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    handler(req, res);
    const html = await new Promise((resolve, _reject) => {
      res.on('finish', () => {
        resolve(res._getData());
      });
      res.end('xxx');
    });

    expect(html).toMatch('xxx');

    // test middleware order
    expect(middlewareFn.mock.calls).toEqual([
      ['run before'],
      ['run unshift'],
      ['run push'],
      ['run after'],
    ]);

    await server.close();
  });
});
