import nodeFetch from 'node-fetch';
import { compile, pathToRegexp, Key } from 'path-to-regexp';
import { useHeaders } from '@modern-js/utils/runtime-node';
import { stringify } from 'query-string';
import { handleRes } from './handleRes';
import type {
  BFFRequestPayload,
  Sender,
  RequestCreator,
  IOptions,
} from './types';

type Fetch = typeof nodeFetch;

let realRequest: Fetch;
let realAllowedHeaders: string[] = [];
const originFetch = (...params: Parameters<typeof nodeFetch>) => {
  const [, init] = params;

  if (init?.method?.toLowerCase() === 'get') {
    init.body = undefined;
  }

  return nodeFetch(...params).then(handleRes);
};

export const configure = (options: IOptions<typeof nodeFetch>) => {
  const { request, interceptor, allowedHeaders } = options;
  realRequest = (request as Fetch) || originFetch;
  if (interceptor && !request) {
    realRequest = interceptor(nodeFetch);
  }
  if (Array.isArray(allowedHeaders)) {
    realAllowedHeaders = allowedHeaders;
  }
};

export const createRequest: RequestCreator<typeof nodeFetch> = (
  path: string,
  method: string,
  port: number,
  httpMethodDecider = 'functionName',
  // 后续可能要修改，暂时先保留
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetch = nodeFetch,
) => {
  const getFinalPath = compile(path, { encode: encodeURIComponent });
  const keys: Key[] = [];
  pathToRegexp(path, keys);

  const sender: Sender = (...args) => {
    const webRequestHeaders = useHeaders();
    let body;
    let headers: Record<string, any>;
    let url: string;

    if (httpMethodDecider === 'inputParams') {
      url = path;
      body = args as any;
      headers = {
        'Content-Type': 'application/json',
      };
    } else {
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

      const plainPath = getFinalPath(payload.params);
      const finalPath = payload.query
        ? `${plainPath}?${stringify(payload.query)}`
        : plainPath;
      headers = payload.headers || {};
      for (const key of realAllowedHeaders) {
        if (typeof webRequestHeaders[key] !== 'undefined') {
          headers[key] = webRequestHeaders[key];
        }
      }

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
        // need multipart boundary auto attached by node-fetch when multipart is true
        // headers['Content-Type'] = 'multipart/form-data';
      } else if (payload.formUrlencoded) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof payload.formUrlencoded === 'object') {
          body = stringify(payload.formUrlencoded);
        } else {
          body = payload.formUrlencoded;
        }
      }

      url = `http://127.0.0.1:${port}${finalPath}`;
    }

    const fetcher = realRequest || originFetch;

    if (method.toLowerCase() === 'get') {
      body = undefined;
    }

    headers.accept = `application/json,*/*;q=0.8`;

    return fetcher(url, { method, body, headers });
  };

  return sender;
};
