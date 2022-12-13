import path from 'path';
import webpack from 'webpack';
import { AGGRED_DIR } from '@modern-js/prod-server';
import { ModernServerContext, NextFunction } from '@modern-js/types';
import Watcher from '../src/dev-tools/watcher';
import { ModernDevServer } from '../src/server/dev-server';
import createServer, { Server } from '../src';

function getDefaultConfig() {
  return {
    output: {},
    tools: {},
    server: {},
    runtime: {},
    source: {},
    html: {},
    bff: {},
  };
}

(global as any).setImmediate = () => false;
const appDirectory = path.join(__dirname, './fixtures/pure');
describe('test dev server', () => {
  test('should throw error when ', resolve => {
    try {
      createServer(null as any);
    } catch (e: any) {
      expect((e as Error).message).toBe('can not start server without options');
      resolve();
    }
  });

  test('shoule get modern server instance', async () => {
    const server = await createServer({
      config: {
        tools: {
          devServer: {
            proxy: {
              '/simple': `http://localhost:8080`,
            },
          },
        } as any,
        output: {},
        source: {},
        server: {},
        runtime: {},
        html: {},
        bff: {},
      },
      pwd: appDirectory,
      dev: true,
      compiler: null as any,
    });
    expect(server instanceof Server).toBe(true);
    await server.close();
  });

  describe('shoule get dev modern server instance', () => {
    test('should init server correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });
      const modernServer = (server as any).server;

      const {
        pwd,
        distDir,
        workDir,
        handlers,
        isDev,
        staticGenerate,
        presetRoutes,
      } = modernServer;
      expect(pwd).toBe(appDirectory);
      expect(distDir).toBe(path.join(appDirectory, 'dist'));
      expect(workDir).toBe(appDirectory);
      // expect(conf).toStrictEqual(getDefaultConfig());
      expect(handlers).toBeDefined();
      expect(isDev).toBeFalsy();
      expect(staticGenerate).toBeFalsy();
      expect(presetRoutes).toBeUndefined();
      await server.close();
    });

    test('should add handler correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
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
      await server.close();
    });

    test('should get request handler correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });

      const modernServer: any = (server as any).server;
      const handler = modernServer.getRequestHandler();
      expect(typeof handler === 'function').toBeTruthy();
      await server.close();
    });

    test('should get request handler correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });

      const modernServer: any = (server as any).server;
      const handler = modernServer.getRequestHandler();
      expect(typeof handler === 'function').toBeTruthy();
      await server.close();
    });

    test('should invoke onrepack correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });

      const modernServer: ModernDevServer = (server as any).server;
      modernServer.onRepack({ routes: [] });

      expect((modernServer as any).router.matchers.length).toBe(0);
      server.close();
    });

    test('should invoke onserver change correctly', async () => {
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });

      const modernServer = (server as any).server;
      modernServer.onServerChange({
        filepath: path.join(appDirectory, AGGRED_DIR.mock),
      });
      expect(modernServer.mockHandler).not.toBeNull();

      modernServer.onServerChange({
        filepath: path.join(appDirectory, 'index.js'),
      });
      expect(modernServer.mockHandler).not.toBeNull();
      server.close();
    });

    test('should compiler work correctly', async () => {
      const compiler = webpack({});
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler,
      });

      expect(server).toBeDefined();
      server.close();
    });

    test('should multi compiler work correctly', async () => {
      const compiler = webpack([{}, { name: 'client' }]);
      const server = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler,
      });

      expect(server).toBeDefined();
      server.close();
    });

    test('should watcher work well', async () => {
      const devServer = await createServer({
        config: getDefaultConfig(),
        pwd: appDirectory,
        dev: true,
        compiler: null as any,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(devServer.server.watcher).toBeInstanceOf(Watcher);
      await devServer.close();
    });
  });
});
