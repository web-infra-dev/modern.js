import createServer from 'connect';
import { getPort } from '@modern-js/utils';
import serveStaticMiddle from './static';

export interface StaticServerOptions {
  hostname?: string;
  port?: number;
}

export async function runStaticServer(
  root: string,
  options?: StaticServerOptions,
) {
  const server = createServer();

  server.use(serveStaticMiddle(root));

  const port = await getPort(options?.port || '8080');
  const hostname = options?.hostname ?? '127.0.0.1';
  const listener = server.listen(port, hostname);

  return { port, hostname, close: () => listener.close() };
}
