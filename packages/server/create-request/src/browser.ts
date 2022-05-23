import { compile, pathToRegexp, Key } from 'path-to-regexp';
import qs from 'query-string';
import { handleRes } from './handleRes';
import type {
  BFFRequestPayload,
  RequestCreator,
  Sender,
  IOptions,
} from './types';

let realRequest: typeof fetch;
let realAllowedHeaders: string[];
const originFetch = (...params: Parameters<typeof fetch>) =>
  fetch(...params).then(handleRes);

export const configure = (options: IOptions) => {
  const { request, interceptor, allowedHeaders } = options;
  realRequest = (request as typeof fetch) || originFetch;
  if (interceptor && !request) {
    realRequest = interceptor(fetch) as typeof fetch;
  }
  if (Array.isArray(allowedHeaders)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    realAllowedHeaders = allowedHeaders;
  }
};

export const createRequest: RequestCreator = (
  path,
  method,
  port,
  // 后续可能要修改，暂时先保留
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetch = originFetch,
) => {
  const getFinalPath = compile(path, { encode: encodeURIComponent });
  const keys: Key[] = [];
  pathToRegexp(path, keys);

  const sender: Sender = async (...args) => {
    const fetcher = realRequest || originFetch;

    const payload: BFFRequestPayload =
      typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};
    payload.params = payload.params || {};

    const requestParams = args[0];
    // 这种场景下是使用 schema，所以 params 要从 args[0] 中获取
    if (typeof requestParams === 'object' && requestParams.params) {
      const { params } = requestParams;
      keys.forEach(key => {
        payload.params![key.name] = params[key.name];
      });
    } else {
      keys.forEach((key, index) => {
        payload.params![key.name] = args[index];
      });
    }

    const finalPath = getFinalPath(payload.params);

    const finalURL = payload.query
      ? `${finalPath}?${qs.stringify(payload.query)}`
      : finalPath;
    const headers = payload.headers || {};
    let body: any =
      payload.data && typeof payload.data === 'object'
        ? JSON.stringify(payload.data)
        : payload.body;

    if (payload.data) {
      headers['Content-Type'] = 'application/json';

      body =
        typeof payload.data === 'object'
          ? JSON.stringify(payload.data)
          : payload.body;
    } else if (payload.body) {
      headers['Content-Type'] = 'text/plain';
      // eslint-disable-next-line prefer-destructuring
      body = payload.body;
    } else if (payload.formData) {
      body = payload.formData;
      // https://stackoverflow.com/questions/44919424/bad-content-type-header-no-multipart-boundary-nodejs
      // need multipart boundary aotu attached by browser when multipart is true
      // headers['Content-Type'] = 'multipart/form-data';
    } else if (payload.formUrlencoded) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      if (
        typeof payload.formUrlencoded === 'object' &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line node/prefer-global/url-search-params,node/no-unsupported-features/node-builtins
        !(payload.formUrlencoded instanceof URLSearchParams)
      ) {
        body = qs.stringify(payload.formUrlencoded);
      } else {
        body = payload.formUrlencoded;
      }
    }

    return fetcher(finalURL, {
      method,
      body,
      headers,
    });
  };

  return sender;
};
