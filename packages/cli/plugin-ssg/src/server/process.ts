import server from '@modern-js/prod-server';
import { ServerRoute as ModernRoute } from '@modern-js/types';
import portfinder from 'portfinder';
import type { NormalizedConfig } from '@modern-js/core';
import { compatRequire } from '@modern-js/utils';
import { makeRender } from '../libs/make';
import { SsgRoute } from '../types';
import { compile as createRender } from './prerender';
import { CLOSE_SIGN } from './consts';

type Then<T> = T extends PromiseLike<infer U> ? U : T;

type ModernServer = Then<ReturnType<typeof server>>;

const safetyRequire = (filename: string, base: string) => {
  try {
    return compatRequire(
      require.resolve(`${filename}/server`, { paths: [base] }),
    );
  } catch (e) {
    return compatRequire(require.resolve(filename, { paths: [base] }));
  }
};

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
    options: NormalizedConfig;
    appDirectory: string;
    plugins: string[];
  } = context;

  const instances = plugins.map(plugin => {
    const mod = safetyRequire(plugin, appDirectory);
    return mod();
  });

  let modernServer: ModernServer | null = null;
  try {
    const { server: serverOptions } = options;

    // start server in default port
    const defaultPort = Number(process.env.PORT) || serverOptions.port;
    portfinder.basePort = defaultPort!;
    const port = await portfinder.getPortPromise();

    modernServer = await server({
      pwd: appDirectory,
      config: options,
      routes,
      staticGenerate: true,
      plugins: instances,
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
