import EventEmitter from 'events';
import { Readable } from 'stream';
import httpMocks from 'node-mocks-http';
import {
  base,
  createAfterMatchContext,
  createAfterRenderContext,
  createMiddlewareContext,
  createAfterStreamingRenderContext,
} from '../src/libs/hook-api';
import { createContext } from '../src/libs/context';
import { createDoc } from './helper';

describe('test hook api', () => {
  test('should base context work correctly', resolve => {
    const cookie = 'a=b; c=d';
    const req = httpMocks.createRequest({
      url: '/home?id=12345',
      headers: {
        host: 'modernjs.com',
        cookie,
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const context = base(createContext(req, res));
    const { request, response } = context;

    // request data
    expect(request.cookie).toBe(cookie);
    expect(request.cookies.get!('a')).toBe('b');
    expect(request.headers.host).toBe('modernjs.com');
    expect(request.pathname).toBe('/home');
    expect(request.query.id).toBe('12345');

    // response data
    response.cookies.set('name', 'modern');
    expect(res.getHeader('set-cookie')).toMatch('name=modern');
    response.cookies.set('age', '18');
    expect(res.getHeader('set-cookie')).toEqual(['name=modern', 'age=18']);
    response.cookies.set('foo', 'bar');
    expect(res.getHeader('set-cookie')).toEqual([
      'name=modern',
      'age=18',
      'foo=bar',
    ]);

    response.cookies.clear();
    expect(res.getHeader('set-cookie')).toBeUndefined();

    response.set('x-modern-test', 'foo');
    expect(response.get('x-modern-test')).toBe('foo');

    response.status(404);
    expect(res.statusCode).toBe(404);

    res.on('finish', () => {
      expect(res._getData()).toBe('Hello Modern');
      resolve();
    });
    response.raw('Hello Modern', {
      status: 200,
      headers: { 'x-modern-test': 'bar' },
    });
    expect(res.getHeader('x-modern-test')).toBe('bar');
    expect(res.statusCode).toBe(200);
  });

  test('should after match context work correctly', () => {
    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const { router } = createAfterMatchContext(createContext(req, res), 'main');

    expect(router.current).toBe('main');
    router.rewrite('home');
    expect(router.current).toBe('home');
    router.use('main');
    expect(router.current).toBe('main');
    router.redirect('https://modernjs.com', 301);
    expect(router.url).toBe('https://modernjs.com');
    expect(router.status).toBe(301);
  });

  test('should after render context work correctly', () => {
    const content = createDoc();
    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const { template } = createAfterRenderContext(
      createContext(req, res),
      {},
      content,
    );
    const initialTemplateContent = template.get();

    expect(template.get()).toMatch(content);
    template.appendBody('after body');
    template.prependBody('before body');
    template.appendHead('after head');
    template.prependHead('before head');

    const newContent = template.get();
    expect(newContent).toMatch('<head>before head');
    expect(newContent).toMatch('<body>before body');
    expect(newContent).toMatch('after head</head>');
    expect(newContent).toMatch('after body</body>');

    template.set('<div>empty</div>');
    expect(template.get()).toBe('<div>empty</div>');

    template.set(
      initialTemplateContent
        .replace('<head>', '<head tag="head">')
        .replace('<body>', '<body tag="body">'),
    );

    template.appendBody('after body');
    template.prependBody('before body');
    template.appendHead('after head');
    template.prependHead('before head');

    const nextContent = template.get();
    expect(nextContent).toMatch('<head tag="head">before head');
    expect(nextContent).toMatch('<body tag="body">before body');
    expect(nextContent).toMatch('after head</head>');
    expect(nextContent).toMatch('after body</body>');
  });

  test('should middleware context worke correctly', () => {
    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const locals = { name: 'modern' };
    res.locals = locals;
    const { source, response } = createMiddlewareContext(
      createContext(req, res),
    );

    expect(source.req).toBe(req);
    expect(source.res).toBe(res);
    expect(response.locals).toEqual(locals);

    response.locals.foo = 'bar';
    expect((locals as any).foo).toBe('bar');
  });

  test('should after streaming render context work correctly', () => {
    const content = createDoc();
    const req = httpMocks.createRequest({
      url: '/',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const afterStreamingRenderContext = createAfterStreamingRenderContext(
      createContext(req, res),
      {},
    );

    const context = afterStreamingRenderContext(content);

    expect(context.chunk).toMatch(content);
  });
});
