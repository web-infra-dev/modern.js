import EventEmitter from 'events';
import { Readable } from 'stream';
import httpMocks from 'node-mocks-http';
import { createContext } from '../src/libs/context';

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
});
