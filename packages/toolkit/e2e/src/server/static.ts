import http from 'http';
import serveStaticImpl from 'serve-static';

export interface ServeStaticOptions<
  R extends http.ServerResponse = http.ServerResponse,
> extends serveStaticImpl.ServeStaticOptions<R> {
}

function serveStaticMiddle<R extends http.ServerResponse>(
  root: string,
  options?: ServeStaticOptions<R>,
): serveStaticImpl.RequestHandler<R> {
  return serveStaticImpl(root, options);
}

export default serveStaticMiddle;
