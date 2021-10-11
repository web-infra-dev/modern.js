import * as path from 'path';
import request from 'supertest';
import { serverManager } from '@modern-js/server-plugin';
import { INTROSPECTION_ROUTE_PATH } from '@modern-js/bff-utils';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/function-mode');

describe('function-mode', () => {
  const id = '666';
  const name = 'modern';
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
    });
  });

  test('should works', async () => {
    const res = await request(apiHandler).get('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'hello' });
  });

  test('should works with string result', async () => {
    const res = await request(apiHandler).post('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toEqual('hello');
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

  test('introspection', async () => {
    const res = await request(apiHandler).get(INTROSPECTION_ROUTE_PATH);
    expect(res.status).toBe(200);
    expect(res.body.protocol).toBe('Farrow-API');
  });
});
