import EventEmitter from 'events';
import { Readable } from 'stream';
import httpMocks from 'node-mocks-http';
import { createContext } from '../src/libs/context';

const Etag = 'W/"c8e8-KIdhFJWJkiBDAQ+6qEnlCiVlE7c"';

describe('test server context', () => {
  test('should route api work correctly', () => {
    const req = httpMocks.createRequest({
      url: '/pathname?foo=baz',
      headers: {
        host: 'modernjs.com',
      },
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const context = createContext(req, res);
    const {
      method,
      url,
      origin,
      host,
      path,
      href,
      query,
      querystring,
      protocol,
      params,
    } = context;

    expect(method).toBe('GET');
    expect(url).toBe('/pathname?foo=baz');
    expect(origin).toBe('http://modernjs.com');
    expect(host).toBe('modernjs.com');
    expect(path).toBe('/pathname');
    expect(href).toBe('http://modernjs.com/pathname?foo=baz');
    expect(query).toEqual({ foo: 'baz' });
    expect(querystring).toBe('foo=baz');
    expect(protocol).toBe('http');
    expect(params).toEqual({});

    expect(context.serverData).toEqual({});
    context.setServerData('foo', {
      name: 'foo',
    });
    expect(context.serverData).toEqual({
      foo: {
        name: 'foo',
      },
    });
  });

  test('should fresh work correctly', () => {
    const req = httpMocks.createRequest({
      url: '/',
      headers: {},
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const context = createContext(req, res);
    expect(context.fresh).toBeFalsy();

    req.headers['if-none-match'] = Etag;
    expect(context.fresh).toBeFalsy();

    res.setHeader('etag', Etag);
    expect(context.fresh).toBeTruthy();

    res.setHeader('etag', Etag.replace('c', 'd'));
    expect(context.fresh).toBeFalsy();

    res.setHeader('etag', Etag);
    delete req.headers['if-none-match'];
    expect(context.fresh).toBeFalsy();
  });

  test('should etag work correctly', () => {
    const req = httpMocks.createRequest({
      url: '/',
      headers: {},
      eventEmitter: Readable,
      method: 'GET',
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const context = createContext(req, res, { etag: true });

    res.send('hello jupiter');
    expect(context.status).toBe(200);
    const etag = context.res.getHeader('ETag');
    expect(etag).toBeDefined();

    req.headers['if-none-match'] = etag as string;
    res.send('hello jupiter');
    expect(context.status).toBe(304);
  });
});
