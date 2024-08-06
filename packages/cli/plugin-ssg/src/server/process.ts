import { Server, request } from 'http';
import { ServerRoute as ModernRoute, ServerPlugin } from '@modern-js/types';
import portfinder from 'portfinder';
import type { AppNormalizedConfig } from '@modern-js/app-tools';
import {
  ProdServerOptions,
  createProdServer,
  loadServerPlugins,
} from '@modern-js/prod-server';
import { CLOSE_SIGN } from './consts';

process.on('message', async (chunk: string) => {
  if (chunk === CLOSE_SIGN) {
    // eslint-disable-next-line no-process-exit
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

    nodeServer = await createProdServer(serverOptions);

    nodeServer.listen(port, async () => {
      if (!nodeServer) {
        return;
      }

      const htmlAry = await Promise.all(
        renderRoutes.map(route => {
          const url = `http://localhost:${port}${route.urlPath}`;

          return getHtml(url, port);
        }),
      );

      htmlAry.forEach(html => {
        process.send!(html);
        process.send!(null);
      });
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
