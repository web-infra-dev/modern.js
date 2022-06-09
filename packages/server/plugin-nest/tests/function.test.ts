import * as path from 'path';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/server';
import { AppModule } from './fixtures/function/api/_app';
import { APIPlugin } from './helpers';

const pwd = path.join(__dirname, './fixtures/function');

describe('function-mode', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  let apiHandler: any;

  beforeAll(async () => {
    const runner = await serverManager
      .clone()
      .usePlugin(APIPlugin, plugin)
      .init();

    apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'function',
      config: { middleware: [AppModule] },
      prefix: '/',
    });
  });

  it('should works', async () => {
    const res = await request(apiHandler).get('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ name: 'modernjs' });
  });

  it('should works with string result', async () => {
    const res = await request(apiHandler).post('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toBe('modernjs');
  });

  it('should works with body', async () => {
    const res = await request(apiHandler)
      .post('/nest/user?test=true')
      .send(foo);
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      data: foo,
      query: { test: 'true' },
    });
  });

  it('should works with schema', async () => {
    const res = await request(apiHandler).patch('/nest/user').send({
      id: 777,
      name: 'xxx',
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(777);
  });

  test('should support upload file', done => {
    request(apiHandler)
      .post('/upload')
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

  // TODO: 后续修复（目前在 btsm + esbuild 的时候无法正常运行，缺少 ReflectMeta 的支持）
  // it('should works with middleware', async () => {
  //   const res = await request(apiHandler).get('/cats');
  //   expect(res.status).toBe(200);
  // });
});
