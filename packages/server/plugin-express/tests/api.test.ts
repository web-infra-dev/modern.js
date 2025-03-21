import path from 'path';
import request from 'supertest';
import plugin from '../src/plugin';
import { APIPlugin, serverInit } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/operator');

describe('support api function', () => {
  let apiHandler: any;
  const prefix = '/api';
  beforeAll(async () => {
    const hooks = await serverInit({
      plugins: [APIPlugin, plugin()],
    });

    apiHandler = await hooks.prepareApiServer.call({
      pwd,
      prefix,
    });
  });

  test('should support Request Operator', async () => {
    const res = await request(apiHandler)
      .post(`${prefix}/user?user=modernjs@github.com`)
      .set('x-header', 'modernjs-header')
      .send({
        message: 'modernjs',
      });

    const data = res.body as Record<string, any>;

    expect(data.query).toEqual({
      user: 'modernjs@github.com',
    });
    expect(data.data).toEqual({
      message: 'modernjs',
    });
    expect(data.headers['x-header']).toEqual('modernjs-header');
    expect(data.hasOwnProperty('data')).toBe(true);
    expect(data.hasOwnProperty('headers')).toBe(true);
  });

  test('should support validate', async () => {
    const res = await request(apiHandler)
      .post(`${prefix}/user?user=modernjs`)
      .set('x-header', 'modernjs-header')
      .send({
        message: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body.hasOwnProperty('message')).toBe(true);
  });

  test('should support Response Operator', async () => {
    const res = await request(apiHandler).get(`${prefix}/hello`);
    expect(res.status).toBe(201);
    expect(res.headers['x-header']).toBe('x-header');
    expect(res.body).toEqual({ message: 'hello' });
  });

  test('should support Redirect Operator', async () => {
    const res = await request(apiHandler).get(`${prefix}/user`);
    expect(res.status).toBe(302);
    expect(res.redirect).toBe(true);
  });

  test('should support Middleware Operator', async () => {
    const expectedData = {
      message: 'modernjs',
    };
    const res = await request(apiHandler)
      .post(`${prefix}/middleware`)
      .send(expectedData);

    expect(res.body).toEqual(expectedData);
  });

  describe('should support Pipe Operator', () => {
    const expectedData = {
      message: 'modernjs',
    };

    test('basic usage', async () => {
      const res = await request(apiHandler)
        .post(`${prefix}/pipe?user=modernjs@github.com`)
        .send(expectedData);
      expect(res.status).toBe(200);
      const body = res.body as Record<string, any>;
      expect(body).toHaveProperty('headers');
      expect(body.data).toEqual(expectedData);
    });

    test('end function should works correctly when received a value', async () => {
      const res = await request(apiHandler)
        .post(`${prefix}/pipe?user=end@github.com`)
        .send(expectedData);
      expect(res.status).toBe(200);
      const body = res.body as Record<string, any>;
      expect(body).toEqual(expectedData);
    });

    test('end function should works correctly when received a function', async () => {
      const res = await request(apiHandler)
        .post(`${prefix}/pipe?user=function@github.com`)
        .send(expectedData);
      expect(res.status).toBe(400);
      const body2 = res.body as Record<string, any>;
      expect(body2.message).toBe('name and message must be modernjs');
    });
  });
});
