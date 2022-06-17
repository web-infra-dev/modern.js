// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-var-requires */
import * as ptr from 'path-to-regexp';
import * as mock_appModule from './app';

// eslint-disable-next-line @typescript-eslint/naming-convention
const mock_replaceUrlWithParams = (
  url: string,
  paramValues: (string | number)[],
  payload: Record<string, any>,
) => {
  const keys: any[] = [];
  ptr.pathToRegexp(url, keys);
  const params = keys.reduce((cur, key, index) => {
    if (paramValues[index]) {
      cur[key.name] = paramValues[index];
    }
    return cur;
  }, {} as Record<string | number, any>);
  const getFinalPath = ptr.compile(url, { encode: encodeURIComponent });
  return getFinalPath({
    ...params,
    ...payload,
  });
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const mock_getParamsAndPayload = (
  args: any[],
): [string[], Record<string, any>] => {
  if (args.length === 0) {
    return [[], {}];
  }

  const head = args[0];
  if (typeof head === 'object') {
    return [[], head];
  } else {
    const latest = args[args.length - 1];
    if (typeof latest === 'object') {
      return [args.slice(0, args.length - 1), latest];
    } else {
      return [args, {}];
    }
  }
};

export default (
  // can't use APIHandlerInfo, https://github.com/aelbore/esbuild-jest/issues/57
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mock_apiInfosByFile: Record<string, any[]>,
  mock_app: any,
) => {
  const files = Object.keys(mock_apiInfosByFile);

  files.forEach(mockedFile => {
    jest.mock(mockedFile, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const supertest = require('supertest');
      return mock_apiInfosByFile[mockedFile].reduce<Record<string, any>>(
        (res, info) => {
          const module = {
            [info.name]: (...args: any[]) => {
              if (mock_appModule.isInHandler()) {
                return info.handler(...args);
              }

              const [params, payload] = mock_getParamsAndPayload(args);
              const { returnHttp } = module[info.name] as any;
              const url = mock_replaceUrlWithParams(
                info.routePath,
                params,
                payload.params,
              );
              let test =
                supertest(mock_app)[info.httpMethod.toLowerCase()](url);

              if (payload.query) {
                test = test.query(payload.query);
              }
              if (payload.body) {
                test = test.send(payload.body);
              }
              if (payload.data) {
                test = test.send(payload.data);
              }
              if (payload.headers) {
                for (const name in payload.headers) {
                  test = test.set(name, payload.headers[name]);
                }
              }
              if (payload.cookies) {
                test = test.set('Cookie', [payload.cookies]);
              }

              if (returnHttp) {
                return test;
              }

              return test.then((value: any) => {
                try {
                  return JSON.parse(value.text);
                } catch {
                  return value.text;
                }
              });
            },
          };

          res[info.name] = module[info.name];

          Object.assign(res[info.name], info.handler);

          res.__esModule = true;

          return res;
        },
        {},
      );
    });
  });
};
