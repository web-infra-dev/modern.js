import Server, { ModernRoute } from '@modern-js/server';
import portfinder from 'portfinder';
import { NormalizedConfig } from '@modern-js/core';
import { compatRequire } from '@modern-js/utils';
import { makeRender } from '../libs/make';
import { compile as createRender } from './prerender';
import { CLOSE_SIGN } from './consts';
import { SsgRoute } from '@/types';

type Then<T> = T extends PromiseLike<infer U> ? U : T;

type ModernServer = Then<ReturnType<typeof Server>>;

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
    options,
    appDirectory,
    plugins,
  }: {
    routes: ModernRoute[];
    options: NormalizedConfig;
    appDirectory: string;
    plugins: string[];
  } = context;

  const instances = plugins.map(plugin => safetyRequire(plugin, appDirectory));

  let modernServer: ModernServer | null = null;
  try {
    const { server } = options;

    // start server in default port
    const defaultPort = Number(process.env.PORT) || server.port;
    portfinder.basePort = defaultPort!;
    const port = await portfinder.getPortPromise();

    modernServer = await Server({
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

      // get server handler, render to ssr
      const render = createRender(modernServer!.getRequestHandler());
      const renderPromiseAry = makeRender(
        routes.filter(route => !route.isApi) as SsgRoute[],
        render,
        port,
      );

      // eslint-disable-next-line promise/no-promise-in-callback
      const htmlAry = await Promise.all(renderPromiseAry);
      htmlAry.forEach((html: string) => {
        process.send!(html);
        process.send!(null);
      });

      modernServer!.close();
    });
  } catch (e) {
    modernServer?.close();
    throw e;
  }
});
