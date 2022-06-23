import * as path from 'path';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/server';
import { APIPlugin } from './helpers';

describe('framework', () => {
  describe('get app by function', () => {
    const id = '666';
    const name = 'foo';
    const foo = { id, name };
    const pwd = path.join(__dirname, './fixtures/framework');
    let apiHandler: any;

    beforeAll(async () => {
      const runner = await serverManager
        .clone()
        .usePlugin(APIPlugin, plugin)
        .init();
      apiHandler = await runner.prepareApiServer({
        pwd,
        mode: 'framework',
        prefix: '/',
      });
    });

    test('should works', async () => {
      const res = await request(apiHandler).get('/hello');
      expect(res.status).toBe(200);
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

    test('should works with context', async () => {
      const res = await request(apiHandler)
        .post(`/nest/user?id=${id}`)
        .send(foo);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(foo);
      expect(res.body.query.id).toBe(id);
    });

    test('should works with schema', async () => {
      const res = await request(apiHandler).patch('/nest/user').send({
        id: 777,
        name: 'xxx',
      });
      expect(res.status).toBe(200);
    });
  });

  describe('get app by function', () => {
    const id = '666';
    const name = 'foo';
    const foo = { id, name };
    const pwd = path.join(__dirname, './fixtures/framework-01');
    let apiHandler: any;
    beforeAll(async () => {
      const runner = await serverManager
        .clone()
        .usePlugin(APIPlugin, plugin)
        .init();
      apiHandler = await runner.prepareApiServer({
        pwd,
        mode: 'framework',
        prefix: '/',
      });
    });

    test('should works', async () => {
      const res = await request(apiHandler).get('/hello');
      expect(res.status).toBe(200);
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

    test('should works with context', async () => {
      const res = await request(apiHandler)
        .post(`/nest/user?id=${id}`)
        .send(foo);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(foo);
      expect(res.body.query.id).toBe(id);
    });

    test('should works with schema', async () => {
      const res = await request(apiHandler).patch('/nest/user').send({
        id: 777,
        name: 'xxx',
      });
      expect(res.status).toBe(200);
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
  });
});
