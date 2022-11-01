import path from 'path';
import { EventEmitter, Readable } from 'stream';
import { defaultsConfig } from '@modern-js/core';
import { ModernServerContext, NextFunction } from '@modern-js/types';
import httpMocks from 'node-mocks-http';
import portfinder from 'portfinder';
import createServer, { Server } from '../src';
import { ModernServer } from '../src/server/modern-server';
import { createContext } from '../src/libs/context';

const appDirectory = path.join(__dirname, './fixtures/pure');
describe('test server', () => {
  test('should throw error when ', resolve => {
    try {
      createServer(null as any);
    } catch (e: any) {
      expect((e as Error).message).toBe(
        'can not start mserver without options',
      );
      resolve();
    }
  });

  test('shoule get modern server instance', async () => {
    const server = await createServer({
      config: defaultsConfig as any,
      pwd: appDirectory,
    });
    const port = await portfinder.getPortPromise();
    expect(server instanceof Server).toBe(true);

    server.listen(port, () => {
      server.close();
    });
  });

  describe('shoule get production modern server instance', () => {
    test('should init server correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
      });
      const modernServer = (server as any).server;

      const {
        pwd,
        distDir,
        workDir,
        conf,
        handlers,
        isDev,
        staticGenerate,
        presetRoutes,
      } = modernServer;
      expect(pwd).toBe(appDirectory);
      expect(distDir).toBe(path.join(appDirectory, 'dist'));
      expect(workDir).toBe(distDir);
      expect(conf).toEqual(defaultsConfig);
      expect(handlers).toBeDefined();
      expect(isDev).toBeFalsy();
      expect(staticGenerate).toBeFalsy();
      expect(presetRoutes).toBeUndefined();
    });

    test('should add handler correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
      });
      const modernServer = (server as any).server;

      const len: number = modernServer.handlers.length;

      const syncHandler = (ctx: ModernServerContext, next: NextFunction) => {
        console.info(ctx.url);
        next();
      };
      modernServer.addHandler(syncHandler);

      const newLen: number = modernServer.handlers.length;
      expect(len + 1).toBe(newLen);
      expect(modernServer.handlers[newLen - 1]).not.toBe(syncHandler);

      const asyncHandler = async (
        ctx: ModernServerContext,
        next: NextFunction,
      ) => {
        console.info(ctx.url);
        next();
      };
      modernServer.addHandler(asyncHandler);
      const nextLen = modernServer.handlers.length;

      expect(newLen + 1).toBe(nextLen);
      expect(modernServer.handlers[nextLen - 1]).toBe(asyncHandler);
    });

    test('should hit favicon fallback', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
      });

      const modernServer: any = (server as any).server;
      const handler = modernServer.getRequestHandler();

      const req = httpMocks.createRequest({
        url: '/favicon.ico',
        headers: {
          host: 'modernjs.com',
        },
        eventEmitter: Readable,
        method: 'GET',
      });

      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      handler(req, res);

      const content = await new Promise((resolve, _reject) => {
        res.on('finish', () => {
          resolve(res._getData());
        });
      });

      expect(content).toBe('');
      expect(res.statusCode).toBe(204);
    });

    test('should get request handler correctly', async () => {
      const server = await createServer({
        config: {
          ...(defaultsConfig as any),
          output: {
            path: 'test-dist',
          },
        },
        pwd: appDirectory,
      });

      const modernServer: ModernServer = (server as any).server;
      const handler = modernServer.getRequestHandler();
      expect(typeof handler === 'function').toBeTruthy();

      const req = httpMocks.createRequest({
        url: '/',
        headers: {
          host: 'modernjs.com',
        },
        eventEmitter: Readable,
        method: 'GET',
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      handler(req, res, () => {
        // empty
      });
      const html = await new Promise((resolve, _reject) => {
        res.on('finish', () => {
          resolve(res._getData());
        });
      });

      expect(html).toMatch('<div>Modern.js</div>');
    });

    test('should error handler correctly with custom entry', async () => {
      const server = await createServer({
        config: {
          ...(defaultsConfig as any),
          output: {
            path: 'test-dist',
          },
        },
        pwd: appDirectory,
      });

      const modernServer: ModernServer = (server as any).server;
      const req = httpMocks.createRequest({
        url: '/',
        headers: {
          host: 'modernjs.com',
        },
        eventEmitter: Readable,
        method: 'GET',
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      const ctx = createContext(req, res);
      ctx.error = () => {
        // empty
      };

      setTimeout(() => {
        (modernServer as any).onError(ctx, new Error('test error'));
      }, 100);
      const html = await new Promise((resolve, _reject) => {
        res.on('finish', () => {
          resolve(res._getData());
        });
      });
      expect(html).toMatch('<div>Modern.js</div>');
    });

    test('should error handler correctly with fallback doc', async () => {
      const server = await createServer({
        config: {
          ...(defaultsConfig as any),
          output: {
            path: 'test-dist',
          },
        },
        pwd: appDirectory,
      });

      const modernServer: ModernServer = (server as any).server;
      const req = httpMocks.createRequest({
        url: '/',
        headers: {
          host: 'modernjs.com',
        },
        eventEmitter: Readable,
        method: 'GET',
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      const ctx = createContext(req, res);
      ctx.error = () => {
        // empty
      };

      setTimeout(() => {
        (modernServer as any).renderErrorPage(ctx, 404);
      }, 100);
      const html = await new Promise((resolve, _reject) => {
        res.on('finish', () => {
          resolve(res._getData());
        });
      });
      expect(html).toMatch('This page could not be found.');
    });
  });

  describe('should split server work correctly', () => {
    test('should init api server correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
        apiOnly: true,
      });
      const modernServer = (server as any).server;
      expect(modernServer.prepareWebHandler()).toBeNull();
      await server.close();
    });

    test('should init ssr server correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
        ssrOnly: true,
      });
      const modernServer = (server as any).server;
      expect(modernServer.prepareAPIHandler()).toBeNull();
      await server.close();
    });

    test('should init web server correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as any,
        pwd: appDirectory,
        webOnly: true,
      });
      const modernServer = (server as any).server;
      const req = httpMocks.createRequest({
        url: '/',
        eventEmitter: Readable,
        method: 'GET',
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      const ctx = createContext(req, res);
      ctx.resHasHandled = () => true;
      ctx.error = () => {
        // empty
      };
      expect(await modernServer.warmupSSRBundle()).toBeNull();
      expect(await modernServer.handleAPI(ctx, {})).toBeUndefined();
      expect(await modernServer.handleWeb(ctx, {})).toBeNull();
    });
  });
});
