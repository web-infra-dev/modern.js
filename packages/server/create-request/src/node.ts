import qs from 'querystring';
import nodeFetch from 'node-fetch';
import { compile, pathToRegexp, Key } from 'path-to-regexp';
import { useHeaders } from '@modern-js/plugin-ssr/node';
import type { BFFRequestPayload, Sender, RequestCreator } from '.';

export const createRequest: RequestCreator = (
  path: string,
  method: string,
  port: number,
  fetch = nodeFetch as any,
  headerWhiteList: string[] = [],
  // eslint-disable-next-line max-params
) => {
  const getFinalPath = compile(path, { encode: encodeURIComponent });
  const keys: Key[] = [];
  pathToRegexp(path, keys);

  // eslint-disable-next-line max-statements
  const sender: Sender = (...args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const webRequestHeaders = useHeaders();

    const payload: BFFRequestPayload =
      typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};
    payload.params = payload.params || {};
    keys.forEach((key, index) => {
      payload.params![key.name] = args[index];
    });

    const plainPath = getFinalPath(payload.params);
    const finalPath = payload.query
      ? `${plainPath}?${qs.stringify(payload.query)}`
      : plainPath;
    const headers = payload.headers || {};
    let body: any;

    // BFF 内网请求需要携带 SSR 请求中的 cookie 和 traceId, 如果有压测头，则添加压测头
    for (const key of headerWhiteList) {
      headers[key] = webRequestHeaders[key];
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
        body = qs.stringify(payload.formUrlencoded);
      } else {
        body = payload.formUrlencoded;
      }
    }

    const url = `http://localhost:${port}${finalPath}`;

    // eslint-disable-next-line promise/prefer-await-to-then
    return fetch(url, { method, body, headers }).then(res => res.json());
  };

  return sender;
};
