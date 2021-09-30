import * as path from 'path';
import fs from 'fs';
import request from 'supertest';
import { serverManager } from '@modern-js/server-plugin';
import plugin from '../src/plugin';
import { APIPlugin } from './helpers';
import './common';

const pwd = path.join(__dirname, './fixtures/function-mode');

describe('webServer', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  let webHandler: any;
  let runner: any;

  beforeAll(async () => {
    runner = await serverManager.clone().usePlugin(APIPlugin, plugin).init();
  });

  test('support json', async () => {
    const middleware = (ctx: any) => {
      // ctx.req.url = `${ctx.req.url}?id=${id}`;
      ctx.body = foo;
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware] },
    });

    const res = await request(webHandler).get('/');
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual(foo);
  });

  test('support stream', async () => {
    const middleware = (ctx: any) => {
      ctx.response.set('content-type', 'text/html');
      ctx.body = fs.createReadStream(
        path.resolve(__dirname, './fixtures/assets/index.html'),
      );
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware] },
    });

    const res = await request(webHandler).get('/');
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('text/html');
    expect(res.text).toContain(`hello koa plugin`);
  });

  test('should support Multiple middleware', async () => {
    const middleware1 = async (ctx: any, next: any) => {
      await next();
    };

    const middleware2 = async (ctx: any, next: any) => {
      ctx.response.set('content-type', 'text/html');
      ctx.body = fs.createReadStream(
        path.resolve(__dirname, './fixtures/assets/index.html'),
      );
      await next();
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware1, middleware2] },
    });

    const res = await request(webHandler).get('/');
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('text/html');
    expect(res.text).toContain(`hello koa plugin`);
  });
});
