import { parseBrowserCookies } from './cookies';
export { parseBrowserCookies } from './cookies';
import type { SSRContainer, SSRServerContext } from '../types';

/** Copy only data emitted by the server's serializeJson bootstrap transport. */
export function cloneBootstrapData<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/** Browser platform data, supplied explicitly by both page and fragment sources. */
export function createBrowserRequestContext(
  url: URL,
  restored?: SSRContainer['context'],
  mode: 'string' | 'stream' = 'string',
): SSRServerContext {
  const restoredContext = cloneBootstrapData(restored);
  const request = restoredContext?.request;
  const query = Object.fromEntries(url.searchParams);
  return {
    ...restoredContext,
    mode,
    request: {
      ...request,
      params: request?.params || {},
      host: request?.host || url.host,
      pathname: request?.pathname || url.pathname,
      headers: request?.headers || {},
      cookieMap: parseBrowserCookies(document.cookie || ''),
      cookie: document.cookie || '',
      userAgent: request?.headers?.['user-agent'] || navigator.userAgent,
      referer: document.referrer,
      query: { ...query, ...request?.query },
      url: url.href,
    },
    response: {},
  } as SSRServerContext;
}
