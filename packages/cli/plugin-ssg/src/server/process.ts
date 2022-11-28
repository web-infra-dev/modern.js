import server from '@modern-js/prod-server';
import { InternalPlugins, ServerRoute as ModernRoute } from '@modern-js/types';
import portfinder from 'portfinder';
import type { AppNormalizedConfig } from '@modern-js/app-tools';
import { makeRender } from '../libs/make';
import { SsgRoute } from '../types';
import { compile as createRender } from './prerender';
import { CLOSE_SIGN } from './consts';

type Then<T> = T extends PromiseLike<infer U> ? U : T;

type ModernServer = Then<ReturnType<typeof server>>;

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
    appDirectory,
    plugins,
  }: {
    routes: ModernRoute[];
    renderRoutes: ModernRoute[];
    options: AppNormalizedConfig;
    appDirectory: string;
    plugins: InternalPlugins;
  } = context;

  let modernServer: ModernServer | null = null;
  try {
    const { server: serverOptions } = options;

    // start server in default port
    const defaultPort = Number(process.env.PORT) || serverOptions.port;
    portfinder.basePort = defaultPort!;
    const port = await portfinder.getPortPromise();

    modernServer = await server({
      pwd: appDirectory,
      config: options as any,
      routes,
      staticGenerate: true,
      internalPlugins: plugins,
    });

    // listen just for bff request in ssr page
    modernServer.listen(port, async (err: Error) => {
      if (err) {
        throw err;
      }

      if (!modernServer) {
        return;
      }

      // get server handler, render to ssr
      const render = createRender(modernServer.getRequestHandler());
      const renderPromiseAry = makeRender(
        renderRoutes as SsgRoute[],
        render,
        port,
      );

      // eslint-disable-next-line promise/no-promise-in-callback
      const htmlAry = await Promise.all(renderPromiseAry);
      htmlAry.forEach((html: string) => {
        process.send!(html);
        process.send!(null);
      });

      modernServer.close();
    });
  } catch (e) {
    modernServer?.close();
    throw e;
  }
});
