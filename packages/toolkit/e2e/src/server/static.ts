import http from 'http';
import serveStaticImpl from 'serve-static';

export type ServeStaticOptions<
  R extends http.ServerResponse = http.ServerResponse,
> = serveStaticImpl.ServeStaticOptions<R>;

function serveStaticMiddle<R extends http.ServerResponse>(
  root: string,
  options?: ServeStaticOptions<R>,
): serveStaticImpl.RequestHandler<R> {
  return serveStaticImpl(root, options);
}

export default serveStaticMiddle;
