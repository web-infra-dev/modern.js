import { useHeaders } from '@modern-js/runtime-utils/node';
import nodeFetch from 'node-fetch';
import { type Key, compile, pathToRegexp } from 'path-to-regexp';
import { stringify } from 'query-string';
import { handleRes } from './handleRes';
import type {
  BFFRequestPayload,
  IOptions,
  RequestCreator,
  Sender,
  UploadCreator,
} from './types';
import { getUploadPayload } from './utiles';

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

export const createRequest: RequestCreator<typeof nodeFetch> = ({
  path,
  method,
  port,
  httpMethodDecider = 'functionName', // 后续可能要修改，暂时先保留
  fetch = originFetch,
}) => {
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

export const createUploader: UploadCreator = ({ path }) => {
  const sender: Sender = (...args) => {
    const fetcher = realRequest || originFetch;
    const { body, headers } = getUploadPayload(args);
    return fetcher(path, { method: 'POST', body, headers });
  };

  return sender;
};
