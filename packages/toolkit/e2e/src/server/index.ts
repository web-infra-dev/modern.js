import createServer from 'connect';
import serveStaticMiddle from './static';
import getPort from 'get-port';

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

  const port = await getPort({ port: options?.port });
  const hostname = options?.hostname ?? '127.0.0.1';
  server.listen(port, hostname);

  return { port, hostname };
}
