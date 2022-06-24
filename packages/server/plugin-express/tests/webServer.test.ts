import * as path from 'path';
import { Buffer } from 'buffer';
import { Request, Response } from 'express';
import request from 'supertest';
import { serverManager } from '@modern-js/server-core';
import plugin from '../src/plugin';
import './common';

const pwd = path.join(__dirname, './fixtures/function-mode');

describe('webServer', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  let webHandler: any;
  let runner: any;

  beforeAll(async () => {
    serverManager.usePlugin(plugin);
    runner = await serverManager.init();
  });

  test('support buffer', async () => {
    const middleware = (req: Request, res: Response) => {
      res.type('html');
      res.send(Buffer.from(name));
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware] },
    });

    const res = await request(webHandler).get('/');
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.text).toContain(name);
  });

  test('should support Multiple middleware', async () => {
    const middleware1 = (req: Request, res: Response, next: any) => {
      req.query.id = id;
      next();
    };

    const middleware2 = (req: Request, res: Response) => {
      const queryId = req.query.id;
      if (queryId && queryId === id) {
        res.send(foo);
      } else {
        res.send('');
      }
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware1, middleware2] },
    });

    const res = await request(webHandler).get('/');
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual(foo);
  });
});

describe('support as async handler', () => {
  const id = '666';
  const name = 'foo';
  const foo = { id, name };
  let webHandler: any;
  let runner: any;

  beforeAll(async () => {
    serverManager.usePlugin(plugin);
    runner = await serverManager.init();
  });

  test('support res end by outer', async () => {
    const order: number[] = [];
    const middleware1 = async (req: Request, res: Response, next: any) => {
      await new Promise(resolve => {
        setTimeout(() => {
          order.push(1);
          resolve(true);
        }, 50);
      });
      order.push(2);
      req.query.id = id;
      next();
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware1] },
    });

    const serveHandler = (req: Request, res: Response) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(name);
      } else {
        res.end(name);
      }
    };

    const asyncHandler = async (req: Request, res: Response) => {
      await webHandler(req, res);
      order.push(3);
      serveHandler(req, res);
    };
    const res = await request(asyncHandler).get('/');
    expect(order).toEqual([1, 2, 3]);
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('text/html');
  });

  test('support call res send', async () => {
    const order: number[] = [];
    const middleware1 = async (req: Request, res: Response, next: any) => {
      await new Promise(resolve => {
        setTimeout(() => {
          order.push(1);
          resolve(true);
        }, 50);
      });
      order.push(2);
      req.query.id = id;
      next();
    };

    const middleware2 = (req: Request, res: Response) => {
      const queryId = req.query.id;
      if (queryId && queryId === id) {
        res.send(foo);
      } else {
        res.send('');
      }
    };

    webHandler = await runner.prepareWebServer({
      pwd,
      config: { middleware: [middleware1, middleware2] },
    });

    const asyncHandler = async (req: Request, res: Response) => {
      await webHandler(req, res);
      order.push(3);
    };
    const res = await request(asyncHandler).get('/');
    expect(order).toEqual([1, 2, 3]);
    expect(res.status).toBe(200);
    expect(res.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual(foo);
  });
});
