/**
 * @jest-environment jsdom
 */
import nock from 'nock';
import 'isomorphic-fetch';
import { configure, createRequest } from '../src/browser';

describe('configure', () => {
  const url = 'http://localhost:8080';
  const path = '/api';
  const method = 'GET';
  const response = {
    code: 200,
    data: {
      message: 'hello Modernjs',
    },
  };

  // TODO: 如果 disableNetConnect 之后，会影响到其他的 testcase 偶发性的出现 NetConnectNotAllowedError: Nock: Disallowed net connect for "127.0.0.1:49552/" 的错误
  // beforeEach(() => {
  //   nock.disableNetConnect();
  // });

  // afterEach(() => {
  //   nock.cleanAll();
  // });

  test('should support custom request', async () => {
    nock(url).get(path).reply(200, response);

    const customRequest = jest.fn((requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return fetch(finalUrl);
    });

    configure({ request: customRequest });
    const request = createRequest(path, method, 8080, undefined);
    const res = await request();
    const data = await res.json();

    expect(customRequest).toHaveBeenCalledTimes(1);
    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });

  test('query should support array', async () => {
    nock(url)
      .get(path)
      .query({
        users: ['foo', 'bar'],
      })
      .reply(200, response);

    const customRequest = jest.fn((requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return fetch(finalUrl);
    });

    configure({ request: customRequest });
    const request = createRequest(path, method, 8080, undefined);
    const res = await request({
      query: {
        users: ['foo', 'bar'],
      },
    });
    const data = await res.json();

    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });

  test('should support interceptor', async () => {
    nock(url).get(path).reply(200, response);

    const interceptor = jest.fn(request => (requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return request(finalUrl);
    });

    configure({ interceptor });
    const request = createRequest(path, method, 8080, undefined);
    const res = await request();
    const data = await res.json();

    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });

  test('should has correct order', async () => {
    nock(url).get(path).reply(200, response);

    const customRequest = jest.fn((requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return fetch(finalUrl);
    });

    const interceptor = jest.fn(request => (requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return request(finalUrl);
    });

    configure({ request: customRequest, interceptor });
    const request = createRequest(path, method, 8080, undefined);
    const res = await request();
    const data = await res.json();

    expect(interceptor).toHaveBeenCalledTimes(0);
    expect(customRequest).toHaveBeenCalledTimes(1);
    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });

  test('should support params', async () => {
    nock(url).get(`${path}/modernjs`).reply(200, response);

    const interceptor = jest.fn(request => (requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return request(finalUrl);
    });

    configure({ interceptor });

    const request = createRequest(`${path}/:id`, method, 8080, undefined);
    const res = await request('modernjs');
    const data = await res.json();
    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });

  test('should support params with schema', async () => {
    nock(url).get(`${path}/modernjs`).reply(200, response);

    const interceptor = jest.fn(request => (requestPath: RequestInfo) => {
      const finalUrl = `${url}${requestPath as string}`;
      return request(finalUrl);
    });

    configure({ interceptor });

    const request = createRequest(`${path}/:id`, method, 8080, undefined);
    const res = await request({
      params: {
        id: 'modernjs',
      },
    });
    const data = await res.json();
    expect(res instanceof Response).toBe(true);
    expect(data).toStrictEqual(response);
  });
});
