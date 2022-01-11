/**
 * @jest-environment node
 */
import nock from 'nock';
import { run } from '@modern-js/plugin-ssr/node';
import fetch, { Response } from 'node-fetch';
import { configure, createRequest } from '../src/node';

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

  // beforeEach(() => {
  //   nock.disableNetConnect();
  // });

  // afterEach(() => {
  //   nock.cleanAll();
  // });

  test('should support custom request', done => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const url = 'http://localhost:9090';
    const port = 9090;

    run(
      {
        referer: url,
      },
      async () => {
        nock(url).get(path).reply(200, response);

        const customRequest = jest.fn((requestPath: any) => fetch(requestPath));

        configure({ request: customRequest as unknown as typeof fetch });
        const request = createRequest(path, method, port);
        const res = await request();
        const data = await res.json();

        expect(customRequest).toHaveBeenCalledTimes(1);
        expect(res instanceof Response).toBe(true);
        expect(data).toStrictEqual(response);
        done();
      },
    );
  });

  test('should support interceptor', done => {
    run({}, async () => {
      nock(url).get(path).reply(200, response);

      const interceptor = jest.fn(
        request => (requestPath: any) => request(requestPath),
      );

      configure({ interceptor: interceptor as any });
      const request = createRequest(path, method, 8080);
      const res = await request();
      const data = await res.json();

      expect(res instanceof Response).toBe(true);
      expect(data).toStrictEqual(response);
      done();
    });
  });

  test('should has correct priority', done => {
    run({}, async () => {
      nock(url).get(path).reply(200, response);

      const customRequest = jest.fn((requestPath: any) => fetch(requestPath));

      const interceptor = jest.fn(
        request => (requestPath: any) => request(requestPath),
      );

      configure({
        request: customRequest as unknown as typeof fetch,
        interceptor: interceptor as any,
      });
      const request = createRequest(path, method, 8080);
      const res = await request();
      const data = await res.json();

      expect(interceptor).toHaveBeenCalledTimes(0);
      expect(customRequest).toHaveBeenCalledTimes(1);
      expect(res instanceof Response).toBe(true);
      expect(data).toStrictEqual(response);
      done();
    });
  });

  test('should support custom headers in ssr environment', done => {
    const authKey = 'aaa';

    run(
      {
        authorization: authKey,
      },
      async () => {
        nock(url, {
          reqheaders: {
            authorization: authKey,
          },
        })
          .get(path)
          .reply(200, response);

        configure({ allowedHeaders: ['authorization'] });
        const request = createRequest(path, method, 8080);
        const data = await request();

        expect(data).toStrictEqual(response);
        done();
      },
    );
  });
});
