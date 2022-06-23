import * as path from 'path';
import request from 'supertest';
import Koa from 'koa';
import { serverManager } from '@modern-js/server-core';
import Router from 'koa-router';
import koaBody from 'koa-body';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';

const pwd = path.join(__dirname, './fixtures/lambda-mode');
const API_DIR = './api';
const MockKoa = Koa;
const MockRouter = Router;
const MockKoaBody = koaBody;

describe('lambda-mode', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  const prefix = '/api';
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
      .attach('file', path.join(__dirname, './fixtures/assets/index.html'))
      .end(async (err, res) => {
        if (err) {
          throw err;
        }
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('success');
        expect(res.body.formData).not.toBeUndefined();
        done();
      });
  });
});

describe('add middlewares', () => {
  let runner: any;

  beforeAll(async () => {
    runner = await serverManager.clone().usePlugin(APIPlugin, plugin).init();
  });

  test('should works', async () => {
    const foo = 'foo';
    const fakeMiddleware = jest.fn(async (ctx: any, next: any) => {
      await next();
      ctx.body = foo;
    });
    const fakeMiddleware2 = jest.fn(async (ctx: any, next: any) => {
      await next();
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
          mock_fakeMiddleware2,
          mock_fakeMiddleware2,
        ],
      },
      prefix: '/',
    });

    const res = await request(apiHandler).get('/user');
    expect(fakeMiddleware.mock.calls.length).toBe(1);
    expect(fakeMiddleware2.mock.calls.length).toBe(2);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(foo);
  });
});

describe('support use koaBody in app.ts', () => {
  const id = '666';
  const name = 'modernjs';
  const foo = { id, name };

  let runner: any;

  beforeAll(async () => {
    runner = await serverManager.clone().usePlugin(APIPlugin, plugin).init();
  });

  test('support use koaBody', async () => {
    const mock_foo = foo;
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = new MockKoa();
        // test app takes effect
        app.use(async (ctx, next) => {
          ctx.request.query = mock_foo;
          await next();
        });

        app.use(MockKoaBody());

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
    const res = await request(apiHandler).post('/nest/user').send(foo);
    expect(res.status).toBe(200);
    expect(res.body.query).toEqual(foo);
    expect(res.body.data).toEqual(foo);
  });
});

describe('support app.ts in lambda mode', () => {
  const name = 'modernjs';

  let runner: any;

  beforeAll(async () => {
    runner = await serverManager.clone().usePlugin(APIPlugin, plugin).init();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  test('support es module', async () => {
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = new MockKoa();
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
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = new MockKoa();
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
    const mock_name = name;
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = new MockKoa();
        app.use(async (ctx, next) => {
          ctx.query.name = mock_name;
          await next();
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
    jest.mock(
      path.join(pwd, API_DIR, 'app.ts'),
      () => {
        const app = new MockKoa();
        const router = new MockRouter();
        router.get('/hello', ctx => {
          ctx.body = `foo`;
        });

        app.use(router.routes());
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
