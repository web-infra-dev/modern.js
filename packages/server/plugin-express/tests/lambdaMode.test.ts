import path from 'path';
import express from 'express';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/lambda-mode');
const API_DIR = './api';

describe('lambda-mode', () => {
  const id = '666';
  const name = 'modern';
  const prefix = '/api';
  const foo = { id, name };
  let apiHandler: any;

  beforeAll(async () => {
    const runner = await serverManager
      .clone()
      .usePlugin(APIPlugin, plugin)
      .init();

    apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix,
    });
  });

  test('should works', async () => {
    const res = await request(apiHandler).get(`${prefix}/hello`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'hello' });
  });

  test('should works with query', async () => {
    const res = await request(apiHandler).get(`${prefix}/nest/user?id=${id}`);
    expect(res.status).toBe(200);
    expect(res.body.query.id).toBe(id);
  });

  test('should works with body', async () => {
    const res = await request(apiHandler).post(`${prefix}/nest/user`).send(foo);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(foo);
  });

  test('should works with dynamic route ', async () => {
    const res = await request(apiHandler).post(`${prefix}/nest/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id });
  });

  test('should works with context', async () => {
    const res = await request(apiHandler)
      .post(`${prefix}/nest/user?id=${id}`)
      .send(foo);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(foo);
    expect(res.body.query.id).toBe(id);
  });

  test('should support cookies', async () => {
    const res = await request(apiHandler)
      .post(`${prefix}/nest/user?id=${id}`)
      .set('Cookie', [`id=${id};name=${name}`]);
    expect(res.status).toBe(200);
    expect(res.body.cookies.id).toBe(id);
    expect(res.body.cookies.name).toBe(name);
  });

  test('should works with schema', async () => {
    const res = await request(apiHandler).patch(`${prefix}/nest/user`).send({
      id: 777,
      name: 'xxx',
    });
    expect(res.status).toBe(200);

    const res2 = await request(apiHandler).patch(`${prefix}/nest/user`).send({
      id: 'aaa',
      name: 'xxx',
    });
    expect(res2.status).toBe(400);

    const res3 = await request(apiHandler).patch(`${prefix}/nest/user`).send({
      id: '777',
      name: 'xxx',
    });
    expect(res3.status).toBe(500);
  });

  test('should support upload file', done => {
    request(apiHandler)
      .post(`${prefix}/upload`)
      .field('my_field', 'value')
      .attach('file', __filename)
      .end(async (err, res) => {
        if (err) {
          throw err;
        }
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('success');
        done();
      });
  });
});

describe('add middlewares', () => {
  let runner: any;

  beforeAll(async () => {
    serverManager.usePlugin(plugin);
    runner = await serverManager.init();
  });

  test('should support add by function', async () => {
    const foo = 'foo';

    const fakeMiddleware = jest.fn((req, res, next) => {
      next();
    });
    const fakeMiddleware2 = jest.fn((req, res) => {
      res.send(foo);
    });
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [mock_fakeMiddleware, mock_fakeMiddleware2] = [
      fakeMiddleware,
      fakeMiddleware2,
    ];
    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      config: {
        middleware: [
          mock_fakeMiddleware,
          mock_fakeMiddleware,
          mock_fakeMiddleware2,
        ],
      },
    });

    const res = await request(apiHandler).get('/user');
    expect(fakeMiddleware.mock.calls.length).toBe(2);
    expect(fakeMiddleware2.mock.calls.length).toBe(1);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });

  test('should support add by string', async () => {
    const foo = 'foo';

    const middleware1 = jest.fn((req, res, next) => {
      next();
    });
    const middleware2 = jest.fn((req, res) => {
      res.send(foo);
    });

    const [mock_middleware1, mock_middleware2] = [middleware1, middleware2];
    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware1'),
      () => ({
        __esModule: true,
        default: mock_middleware1,
      }),
    );

    jest.mock(
      path.resolve(__dirname, './fixtures/middlewares/middleware2'),
      () => ({
        __esModule: true,
        default: mock_middleware2,
      }),
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      config: {
        middleware: [
          require.resolve('./fixtures/middlewares/middleware1'),
          require.resolve('./fixtures/middlewares/middleware1'),
          require.resolve('./fixtures/middlewares/middleware2'),
        ],
      },
    });

    const res = await request(apiHandler).get('/user');
    expect(middleware1.mock.calls.length).toBe(2);
    expect(middleware2.mock.calls.length).toBe(1);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });
});

describe('support app.ts in lambda mode', () => {
  serverManager.usePlugin(APIPlugin, plugin);
  let runner: any;

  beforeAll(async () => {
    runner = await serverManager.init();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  test('support es module', async () => {
    const name = `modernjs`;
    const mock_express = express;
    jest.mock(
      path.join(pwd, 'app.ts'),
      () => {
        const app = mock_express();
        return {
          __esModule: true,
          default: app,
        };
      },
      { virtual: true },
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix: '/',
    });

    const res = await request(apiHandler).get(`/nest/user?name=${name}`);
    expect(res.status).toBe(200);
    expect(res.body.query.name).toBe(name);
  });

  test('support commonjs module', async () => {
    const name = `modernjs`;
    const mock_express = express;
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = mock_express();
        return app;
      },
      { virtual: true },
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix: '/',
    });

    const res = await request(apiHandler).get(`/nest/user?name=${name}`);
    expect(res.status).toBe(200);
    expect(res.body.query.name).toBe(name);
  });

  test('support use middleware', async () => {
    const name = `modernjs`;
    const mock_express = express;
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = mock_express();
        app.use((req, res, next) => {
          req.query.name = name;
          next();
        });
        return app;
      },
      { virtual: true },
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix: '/',
    });

    const res = await request(apiHandler).get(`/nest/user`);
    expect(res.status).toBe(200);
    expect(res.body.query.name).toBe(name);
  });

  test('support use router', async () => {
    const name = `modernjs`;
    const mock_express = express;
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = mock_express();
        app.get('/hello', (req, res) => {
          res.send(`foo`);
          res.end();
        });

        return app;
      },
      { virtual: true },
    );

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix: '/',
    });

    const res1 = await request(apiHandler).get(`/hello`);
    expect(res1.status).toBe(200);
    expect(res1.text).toBe('foo');

    const res2 = await request(apiHandler).get(`/nest/user?name=${name}`);
    expect(res2.status).toBe(200);
    expect(res2.body.query.name).toBe(name);
  });
});

describe('support as async handler', () => {
  let runner: any;

  beforeAll(async () => {
    serverManager.usePlugin(plugin);
    runner = await serverManager.init();
  });

  test('API handler should works', async () => {
    const foo = 'foo';
    const order: number[] = [];

    const wrapMiddleware = jest.fn(async (req, res) => {
      await new Promise(resolve => {
        setTimeout(() => {
          order.push(1);
          resolve(true);
        }, 50);
      });
      order.push(2);
      res.send(foo);
    });

    const apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      config: { middleware: [wrapMiddleware] },
    });

    const asyncHandler = async (req: any, res: any) => {
      await apiHandler(req, res);
      order.push(3);
    };

    const res = await request(asyncHandler).get('/user');
    expect(wrapMiddleware.mock.calls.length).toBe(1);
    expect(order).toEqual([1, 2, 3]);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });
});
