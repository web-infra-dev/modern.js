import path from 'path';
import { defaultsConfig, NormalizedConfig } from '@modern-js/core';
import { ModernServerContext, NextFunction } from '@modern-js/types';
import createServer, { Server } from '../src';
import { ModernServer } from '../src/server/modern-server';

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
      config: defaultsConfig as NormalizedConfig,
      pwd: path.join(__dirname, './fixtures/pure'),
    });
    expect(server instanceof Server).toBe(true);
  });

  describe('shoule get production modern server instance', () => {
    const appDirectory = path.join(__dirname, './fixtures/pure');

    test('should init server correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as NormalizedConfig,
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
      expect(conf).toBe(defaultsConfig);
      expect(handlers).toBeDefined();
      expect(isDev).toBeFalsy();
      expect(staticGenerate).toBeFalsy();
      expect(presetRoutes).toBeUndefined();
    });

    test('should add handler correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as NormalizedConfig,
        pwd: appDirectory,
      });
      const modernServer = (server as any).server;

      const len = modernServer.handlers.length;

      const syncHandler = (ctx: ModernServerContext, next: NextFunction) => {
        console.info(ctx.url);
        next();
      };
      modernServer.addHandler(syncHandler);

      const newLen = modernServer.handlers.length;
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

    test('should get request handler correctly', async () => {
      const server = await createServer({
        config: defaultsConfig as NormalizedConfig,
        pwd: appDirectory,
      });

      const modernServer: ModernServer = (server as any).server;
      const handler = modernServer.getRequestHandler();
      expect(typeof handler === 'function').toBeTruthy();
    });
  });
});
