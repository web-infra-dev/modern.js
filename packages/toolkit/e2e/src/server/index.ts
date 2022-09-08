import { Volume } from 'memfs/lib/volume';
import createServer from 'connect';
import serveStaticMiddle from './static';
import getPort from 'get-port';

export interface ServeVolumeOptions {
  hostname?: string;
  volume?: Volume;
}

export async function runStaticServer(
  root: string,
  options?: ServeVolumeOptions,
) {
  const server = createServer();

  server.use(serveStaticMiddle(root, { volume: options?.volume }));

  const port = await getPort();
  const hostname = options?.hostname ?? '127.0.0.1';
  server.listen(port, hostname);

  return { port, hostname };
}
