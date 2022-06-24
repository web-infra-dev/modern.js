import * as path from 'path';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

describe('lambda-mode', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  const pwd = path.join(__dirname, './fixtures/lambda-mode');
  let apiHandler: any;

  beforeAll(async () => {
    serverManager.usePlugin(APIPlugin).usePlugin(plugin);
    const runner = await serverManager.init();
    apiHandler = await runner.prepareApiServer({
      pwd,
      mode: 'framework',
      prefix: '/',
    });
  });

  test('should works', async () => {
    try {
      const res = await request(apiHandler).get('/hello');
      expect(res.status).toBe(200);
    } catch (error) {
      console.error(error);
    }
  });

  test('should support controller', async () => {
    try {
      const res = await request(apiHandler).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toBe('modernjs');
    } catch (error) {
      console.error(error);
    }
  });

  test('should works with query', async () => {
    const res = await request(apiHandler).get(`/nest/user?id=${id}`);
    expect(res.status).toBe(200);
    expect(res.body.query.id).toBe(id);
  });

  test('should works with body', async () => {
    const res = await request(apiHandler).post('/nest/user').send(foo);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(foo);
  });

  test('should works with dynamic route', async () => {
    const res = await request(apiHandler).post(`/nest/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id });
  });

  test('should works with context', async () => {
    const res = await request(apiHandler).post(`/nest/user?id=${id}`).send(foo);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(foo);
    expect(res.body.query.id).toBe(id);
  });

  test('should support cookies', async () => {
    const res = await request(apiHandler)
      .post(`/nest/user?id=${id}`)
      .set('Cookie', [`id=${id};name=${name}`]);
    expect(res.status).toBe(200);
    expect(res.body.cookies.id).toBe(id);
    expect(res.body.cookies.name).toBe(name);
  });

  test('should works with schema', async () => {
    const res = await request(apiHandler).patch('/nest/user').send({
      id: 777,
      name: 'xxx',
    });
    expect(res.status).toBe(200);

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
