import sirv from 'sirv';
import compression from 'compression';
import polka from 'polka';
import { UserConfig } from 'shared/types';
import { OUTPUT_DIR } from './constants';

export interface CLIServeOption {
  base?: string;
  rootDir?: string;
  port?: number;
  host?: string;
}

// Serve ssg site in production
export async function serve(rootDir: string, config: UserConfig) {
  const port = 4173;
  const host = 'localhost';
  const base = config.doc?.base?.replace(/^\//, '').replace(/\/$/, '') || '';

  const compress = compression();
  const serve = sirv(config.doc?.outDir || OUTPUT_DIR, {
    etag: true,
    maxAge: 31536000,
    immutable: true,
  });

  if (base) {
    polka()
      .use(base, compress, serve)
      .listen(port, host, (err: Error) => {
        if (err) {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.log(`Built site served at http://${host}:${port}/${base}/\n`);
      });
  } else {
    polka()
      .use(compress, serve)
      .listen(port, host, (err: Error) => {
        if (err) {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.log(`Built site served at http://${host}:${port}/\n`);
      });
  }
}
