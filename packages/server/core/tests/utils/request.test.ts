import {
  parseHeaders,
  parseQuery,
  getPathname,
  getHost,
} from '../../src/utils';

describe('test utils.request', () => {
  it('should parse query correctly', () => {
    const request = {
      url: 'http://localhost:8080/?q=q1&word=hello',
    };
    const query = parseQuery(request as Request);
    expect(query).toEqual({
      q: 'q1',
      word: 'hello',
    });

    const request1 = {
      url: 'http://localhost:8080/?q=q1',
    };
    const query1 = parseQuery(request1 as Request);
    expect(query1).toEqual({
      q: 'q1',
    });

    const request2 = {
      url: 'http://localhost:8080/',
    };
    const query2 = parseQuery(request2 as Request);
    expect(query2).toEqual({});

    const request3 = {
      url: 'http://localhost:8080/?',
    };
    const query3 = parseQuery(request3 as Request);
    expect(query3).toEqual({});
  });

  it('should parse header correctly', () => {
    const headers = parseHeaders({
      headers: new Headers({
        foo: 'bar',
      }),
    } as Request);

    expect(headers).toEqual({
      foo: 'bar',
    });
  });

  it('should get pathname correctly', () => {
    expect(getPathname({ url: 'http://localhost:8080/abc' } as Request)).toBe(
      '/abc',
    );

    expect(getPathname({ url: 'http://localhost:8080/' } as Request)).toBe('/');

    expect(getPathname({ url: 'http://localhost:8080' } as Request)).toBe('/');

    expect(getPathname({ url: 'http://localhost:8080/abc/' } as Request)).toBe(
      '/abc/',
    );
  });

  it('should get host correctly', () => {
    expect(getHost({ headers: new Headers({}) } as Request)).toBe('undefined');

    expect(
      getHost({
        headers: new Headers({
          host: 'localhost:8080',
        }),
      } as Request),
    ).toBe('localhost:8080');

    expect(
      getHost({
        headers: new Headers({
          host: 'localhost:8080',
          'x-forwarded-host': 'localhost:9090',
        }),
      } as Request),
    ).toBe('localhost:9090');
  });
});
