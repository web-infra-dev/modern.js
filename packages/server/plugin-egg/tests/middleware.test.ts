import path from 'path';
import { serverManager } from '@modern-js/server-core';
import request from 'supertest';
// import type { Context } from 'egg';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

jest.setTimeout(60000);
describe('register middleware', () => {
  let runner: any;
  const pwd = path.join(__dirname, './fixtures/function-mode');

  beforeAll(async () => {
    serverManager.usePlugin(APIPlugin, plugin);
    runner = await serverManager.init();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  test('should support add by function', async () => {
    const foo = 'foo';

    const middleware1 = jest.fn(() => async (ctx: any, next: any) => {
      await next();
      ctx.body = foo;
    });

    const middleware2 = jest.fn(() => async (ctx: any, next: any) => {
      await next();
    });

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'function',
      prefix: '/',
      config: { middleware: [middleware1, middleware2, middleware2] },
    });

    const res = await request(apiHandler).get('/user');
    expect(middleware1.mock.calls.length).toBe(1);
    expect(middleware2.mock.calls.length).toBe(2);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });

  test('should support add by string', async () => {
    const foo = 'foo';

    const middleware1 = jest.fn(() => async (ctx: any, next: any) => {
      await next();
      ctx.body = foo;
    });

    const middleware2 = jest.fn(() => async (ctx: any, next: any) => {
      await next();
    });

    const mock_middleware1 = middleware1;
    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware1'),
      () => ({
        __esModule: true,
        default: mock_middleware1,
      }),
    );

    const mock_middleware2 = middleware2;
    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware2'),
      () => ({
        __esModule: true,
        default: mock_middleware2,
      }),
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'function',
      prefix: '/',
      config: {
        middleware: [
          require.resolve('./fixtures/middlewares/middleware1'),
          require.resolve('./fixtures/middlewares/middleware2'),
          require.resolve('./fixtures/middlewares/middleware2'),
        ],
      },
    });

    const res = await request(apiHandler).get('/user');
    expect(middleware1.mock.calls.length).toBe(1);
    expect(middleware2.mock.calls.length).toBe(2);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });

  test(`support config`, async () => {
    const foo = 'foo';
    const options1 = { foo: 1 };
    const options2 = { bar: 2 };
    const finalOptions = Object.create(null);

    const middleware1 = jest.fn(options => async (ctx: any, next: any) => {
      Object.assign(finalOptions, options);
      ctx.body = foo;
      await next();
    });

    const middleware2 = jest.fn(options => async (ctx: any, next: any) => {
      await next();
      Object.assign(finalOptions, options);
    });

    const mock_middleware1 = middleware1;

    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware1'),
      () => ({
        __esModule: true,
        default: mock_middleware1,
      }),
    );

    const mock_middleware2 = middleware2;
    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware2'),
      () => ({
        __esModule: true,
        default: mock_middleware2,
      }),
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'function',
      prefix: '/',
      config: {
        middleware: [
          [require.resolve('./fixtures/middlewares/middleware1'), options1],
          [require.resolve('./fixtures/middlewares/middleware2'), options2],
        ],
      },
    });

    const res = await request(apiHandler).get('/user');
    expect(middleware1.mock.calls.length).toBe(1);
    expect(middleware2.mock.calls.length).toBe(1);
    expect(finalOptions.foo).toBe(options1.foo);
    expect(finalOptions.bar).toBe(options2.bar);
    expect(res.status).toBe(200);
  });
});
