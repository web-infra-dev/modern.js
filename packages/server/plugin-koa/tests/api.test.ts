import path from 'path';
import request from 'supertest';
import plugin from '../src/plugin';
import { APIPlugin, createPluginManager } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/operator');

describe('support Api function', () => {
  let apiHandler: any;
  const prefix = '/api';
  beforeAll(async () => {
    const pluginManager = createPluginManager({
      serverConfig: {
        bff: {
          enableHandleWeb: true,
        },
      },
    });

    pluginManager.addPlugins([APIPlugin, plugin()]);

    const runner = await pluginManager.init();

    apiHandler = await runner.prepareApiServer({
      pwd,
      prefix,
      render: async req => {
        if (req.url === '/render-page') {
          return new Response('Hello Modern Render', {
            status: 200,
            headers: new Headers({
              'content-type': 'text/html; charset=UTF-8',
            }),
          });
        } else {
          return new Response(null, {
            status: 200,
            headers: new Headers({
              'content-type': 'text/html; charset=UTF-8',
            }),
          });
        }
      },
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

  // FIXME: apiHandler params
  test.skip('should support render web', async () => {
    const res = await request(apiHandler).get(`/render-page`);
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello Modern Render');
  });
});
