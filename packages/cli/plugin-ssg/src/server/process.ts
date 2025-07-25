import assert from 'node:assert';
import { type Server, request } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import path from 'path';
import type { AppNormalizedConfig } from '@modern-js/app-tools';
import {
  type ProdServerOptions,
  createProdServer,
  loadServerPlugins,
} from '@modern-js/prod-server';
import type {
  ServerRoute as ModernRoute,
  ServerPlugin,
} from '@modern-js/types';
import { SERVER_DIR, createLogger, getMeta } from '@modern-js/utils';
import portfinder from 'portfinder';
import { chunkArray } from '../libs/util';
import { CLOSE_SIGN } from './consts';

// SSG only interrupt when stderror, so we need to override the rslog's error to console.error
function getLogger() {
  const logger = createLogger({
    level: 'verbose',
  });
  return {
    ...logger,
    error: (...args: any[]) => {
      console.error(...args);
    },
  };
}

const MAX_CONCURRENT_REQUESTS = 10;

process.on('message', async (chunk: string) => {
  if (chunk === CLOSE_SIGN) {
    process.exit();
  }

  const context = JSON.parse(chunk as any);
  const {
    routes,
    renderRoutes,
    options,
    appContext,
    plugins,
    distDirectory,
  }: {
    routes: ModernRoute[];
    renderRoutes: ModernRoute[];
    options: AppNormalizedConfig;
    distDirectory: string;
    appContext: {
      appDirectory?: string;
      /** Directory for API modules */
      apiDirectory: string;
      /** Directory for lambda modules */
      lambdaDirectory: string;
      metaName: string;
    };
    plugins: ServerPlugin[];
  } = context;

  let nodeServer: Server | Http2SecureServer | null = null;
  try {
    const { server: serverConfig } = options;
    const meta = getMeta(appContext.metaName);

    const serverConfigPath = path.resolve(
      distDirectory,
      SERVER_DIR,
      `${meta}.server`,
    );
    // start server in default port
    const defaultPort = Number(process.env.PORT) || serverConfig.port;
    portfinder.basePort = defaultPort!;
    const port = await portfinder.getPortPromise();

    const serverOptions: ProdServerOptions = {
      pwd: distDirectory,
      config: options as any,
      appContext,
      serverConfigPath,
      routes,
      plugins: await loadServerPlugins(
        plugins,
        appContext.appDirectory || distDirectory,
      ),
      staticGenerate: true,
      logger: getLogger(),
    };

    assert(process.send, 'process.send is not available');
    const sendProcessMessage = process.send.bind(process);
    nodeServer = await createProdServer(serverOptions);

    nodeServer.listen(port, async () => {
      if (!nodeServer) return;

      const chunkedRoutes = chunkArray(renderRoutes, MAX_CONCURRENT_REQUESTS);

      for (const routes of chunkedRoutes) {
        const promises = routes.map(async route =>
          getHtml(`http://localhost:${port}${route.urlPath}`, port),
        );
        for (const result of await Promise.all(promises)) {
          sendProcessMessage(result);
          sendProcessMessage(null);
        }
      }
      nodeServer.close();
    });
  } catch (e) {
    nodeServer?.close();
    // throw error will lost the origin error and stack
    process.stderr.write(e instanceof Error ? e.stack : (e as any).toString());
  }
});

function getHtml(url: string, port: number): Promise<string> {
  const headers = { host: `localhost:${port}` };

  return new Promise((resolve, reject) => {
    request(
      url,
      {
        headers,
      },
      res => {
        const chunks: Uint8Array[] = [];

        res.on('error', error => {
          reject(error);
        });

        res.on('data', chunk => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const html = Buffer.concat(chunks).toString();
          resolve(html);
        });
      },
    ).end();
  });
}
