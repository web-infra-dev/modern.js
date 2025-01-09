import assert from 'assert';
import { type Server, request } from 'http';
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
import portfinder from 'portfinder';
import { chunkArray } from '../libs/util';
import { CLOSE_SIGN } from './consts';

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
    };
    plugins: ServerPlugin[];
  } = context;

  let nodeServer: Server | null = null;
  try {
    const { server: serverConfig } = options;

    // start server in default port
    const defaultPort = Number(process.env.PORT) || serverConfig.port;
    portfinder.basePort = defaultPort!;
    const port = await portfinder.getPortPromise();

    const serverOptions: ProdServerOptions = {
      pwd: distDirectory,
      config: options as any,
      appContext,
      routes,
      plugins: await loadServerPlugins(
        plugins,
        appContext.appDirectory || distDirectory,
      ),
      staticGenerate: true,
    };

    assert(process.send, 'process.send is not available');
    const sendProcessMessage = process.send.bind(process);
    nodeServer = await createProdServer(serverOptions);

    nodeServer.listen(port, async () => {
      if (!nodeServer) return;

      const chunkedRoutes = chunkArray(renderRoutes, MAX_CONCURRENT_REQUESTS);

      for (const routes of chunkedRoutes) {
        await Promise.all(
          routes.map(async route => {
            const url = `http://localhost:${port}${route.urlPath}`;
            const html = await getHtml(url, port);
            sendProcessMessage(html);
            sendProcessMessage(null);
          }),
        );
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
        let html = '';

        res.on('error', error => {
          reject(error);
        });

        res.on('data', chunk => {
          html += chunk.toString();
        });

        res.on('end', () => {
          resolve(html);
        });
      },
    ).end();
  });
}
