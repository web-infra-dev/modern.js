import cookieTool from 'cookie';
import type { SSRContainer, SSRServerContext } from '../types';

/** Browser platform data, supplied explicitly by both page and fragment sources. */
export function createBrowserRequestContext(
  url: URL,
  restored?: SSRContainer['context'],
  mode: 'string' | 'stream' = 'string',
): SSRServerContext {
  const request = restored?.request;
  const query = Object.fromEntries(url.searchParams);
  return {
    ...restored,
    mode,
    request: {
      ...request,
      params: request?.params || {},
      host: request?.host || url.host,
      pathname: request?.pathname || url.pathname,
      headers: request?.headers || {},
      cookieMap: cookieTool.parse(document.cookie || '') || {},
      cookie: document.cookie || '',
      userAgent: request?.headers?.['user-agent'] || navigator.userAgent,
      referer: document.referrer,
      query: { ...query, ...request?.query },
      url: url.href,
    },
    response: {},
  } as SSRServerContext;
}
