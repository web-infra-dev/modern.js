export interface ServerRoute {
  // modern js web entry name
  entryName?: string;
  // the url path for request match
  urlPath: string;
  // the default resource file to response to route
  entryPath: string;
  // if route is spa page
  isSPA?: boolean;
  // if route is ssr page
  isSSR?: boolean;
  // if route is stream response
  isStream?: boolean;
  // if route is api service
  isApi?: boolean;
  // worker js bundle for ssr page
  worker?: string;
  // ssr js bundle for ssr page
  bundle?: string;
  // response header for routes
  responseHeaders?: Record<string, unknown>;
}
