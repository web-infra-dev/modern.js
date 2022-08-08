import 'isomorphic-fetch';
import { isNodeJS } from '@modern-js/utils';

export type InitFetchOptions = {
  context?: any;
  defaultHost?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  headerWhiteList?: string[];
};

export type ModernFetch = (
  url: RequestInfo,
  init?: RequestInit,
) => Promise<Response>;

const DEFAULT_NODE_HOST = `http://localhost:${Number(
  process.env.PORT || 8080,
)}`;

export const initFetch = (options: InitFetchOptions): ModernFetch => {
  const {
    context,
    params = {},
    headerWhiteList,
    defaultHost: customHost,
  } = options;

  const defaultHost =
    customHost || isNodeJS() ? DEFAULT_NODE_HOST : window.location.origin;

  const { headers = {} } = options;

  if (isNodeJS()) {
    if (context?.request?.headers) {
      for (const key in context.request.headers) {
        if (headerWhiteList?.includes(key)) {
          headers[key] = context.request.headers[key];
        }
      }
    }
  }

  return (input, init = {}) => {
    const request = typeof input === 'string' ? new Request(input) : input;
    const { url } = request;
    const finalURL = isAbsoluteUrl(url) ? url : defaultHost + url;
    // eslint-disable-next-line node/no-unsupported-features/node-builtins,node/prefer-global/url
    const urlObj = new URL(finalURL);

    for (const key in params) {
      urlObj.searchParams.append(key, params[key]);
    }

    return fetch(urlObj.toString(), {
      ...init,
      headers: { ...headers, ...init.headers },
    });
  };
};

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;

// Windows paths like `c:\`
const WINDOWS_PATH_REGEX = /^[a-zA-Z]:\\/;

export const isAbsoluteUrl = (url: string) => {
  if (typeof url !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof url}\``);
  }

  if (WINDOWS_PATH_REGEX.test(url)) {
    return false;
  }

  return ABSOLUTE_URL_REGEX.test(url);
};
