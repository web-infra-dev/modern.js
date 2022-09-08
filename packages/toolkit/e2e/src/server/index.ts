import { createFsFromVolume } from 'memfs';
import { Volume } from 'memfs/lib/volume';
import createServer from 'connect';
import serveStatic from './static';
import getPort from 'get-port';

export interface ServeVolumeOptions {
  hostname?: string;
}

export async function serveVolume(
  root: string,
  vol: Volume,
  options?: ServeVolumeOptions,
) {
  const server = createServer();

  server.use(serveStatic(root, { vol }));

  const port = await getPort();
  const hostname = options?.hostname ?? '127.0.0.1';
  server.listen(port, hostname);

  return { port, hostname };
}
