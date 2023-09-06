import { BaseSSRServerContext } from '@modern-js/types';
import cookieTool from 'cookie';
import { SSRServerContext } from './serverRender/types';

export const isReact18 = () => process.env.IS_REACT18 === 'true';

export const formatServer = (
  request: BaseSSRServerContext['request'],
): SSRServerContext['request'] => {
  const {
    cookie = '',
    'user-agent': userAgent = '',
    referer,
  } = request.headers || {};

  return {
    cookie,
    cookieMap: cookieTool.parse(cookie || '') || {},
    userAgent,
    referer,
    ...request,
  };
};

const getQuery = () =>
  window.location.search
    .substring(1)
    .split('&')
    .reduce<Record<string, string>>((res, item) => {
      const [key, value] = item.split('=');

      if (key) {
        res[key] = value;
      }
      return res;
    }, {});

export const formatClient = (
  request: BaseSSRServerContext['request'],
): SSRServerContext['request'] => {
  return {
    params: request.params || {},
    host: request.host || location.host,
    pathname: request.pathname || location.pathname,
    headers: request.headers || {},
    cookieMap: cookieTool.parse(document.cookie || '') || {},
    cookie: document.cookie || '',
    userAgent: request.headers?.['user-agent'] || navigator.userAgent,
    referer: request.referer || document.referrer,
    query: {
      ...getQuery(),
      ...request.query,
    },
    url: location.href,
  };
};

export const mockResponse = () => {
  return {
    setHeader() {
      console.warn('response.setHeader() can only be used in the server side');
    },
    status() {
      console.warn('response.status() can only be used in the server side');
    },
    get locals() {
      console.warn('response.locals can only be used in the server side');
      return {};
    },
  };
};
