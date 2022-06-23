import * as path from 'path';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/function-mode');

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
      prefix: '/',
    });
  });

  test('should works with body', async () => {
    const res = await request(apiHandler).post('/nest/user').send(foo);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(foo);
  });

  test('should works with schema', async () => {
    const res = await request(apiHandler).patch('/nest/user').send({
      id: 777,
      name: 'xxx',
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(777);

    const res2 = await request(apiHandler).patch('/nest/user').send({
      id: 'aaa',
      name: 'xxx',
    });
    expect(res2.status).toBe(400);

    const res3 = await request(apiHandler).patch('/nest/user').send({
      id: '777',
      name: 'xxx',
    });
    expect(res3.status).toBe(500);
  });

  test('should support upload file', done => {
    request(apiHandler)
      .post('/upload')
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
