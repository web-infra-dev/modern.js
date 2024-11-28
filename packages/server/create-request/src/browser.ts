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

let realRequest: typeof fetch;
let realAllowedHeaders: string[];

const originFetch = (...params: Parameters<typeof fetch>) => {
  const [url, init] = params;

  if (init?.method?.toLowerCase() === 'get') {
    init.body = undefined;
  }

  return fetch(url, init).then(handleRes);
};

export const configure = (options: IOptions) => {
  const { request, interceptor, allowedHeaders } = options;
  realRequest = request || originFetch;
  if (interceptor && !request) {
    realRequest = interceptor(fetch);
  }
  if (Array.isArray(allowedHeaders)) {
    realAllowedHeaders = allowedHeaders;
  }
};

export const createRequest: RequestCreator = ({
  path,
  method,
  port,
  httpMethodDecider = 'functionName', // 后续可能要修改，暂时先保留
  fetch = originFetch,
  domain,
}) => {
  const getFinalPath = compile(path, { encode: encodeURIComponent });
  const keys: Key[] = [];
  pathToRegexp(path, keys);

  const sender: Sender = async (...args) => {
    const fetcher = realRequest || originFetch;
    let body;
    let finalURL: string;
    let headers: Record<string, any>;

    if (httpMethodDecider === 'inputParams') {
      finalURL = path;
      body = JSON.stringify({
        args,
      });
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

      const finalPath = getFinalPath(payload.params);

      finalURL = payload.query
        ? `${finalPath}?${stringify(payload.query)}`
        : finalPath;
      headers = payload.headers || {};
      body =
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
          // @ts-expect-error
          !(payload.formUrlencoded instanceof URLSearchParams)
        ) {
          body = stringify(payload.formUrlencoded);
        } else {
          body = payload.formUrlencoded;
        }
      }
    }

    headers.accept = `application/json,*/*;q=0.8`;

    if (domain) {
      finalURL = `${domain}${finalURL}`;
    }
    return fetcher(finalURL, {
      method,
      body,
      headers,
    });
  };

  return sender;
};

export const createUploader: UploadCreator = ({ path, domain }) => {
  const sender: Sender = (...args) => {
    const fetcher = realRequest || originFetch;
    const { body, headers } = getUploadPayload(args);
    return fetcher(domain ? `${domain}${path}` : path, {
      method: 'POST',
      body,
      headers,
    });
  };

  return sender;
};
