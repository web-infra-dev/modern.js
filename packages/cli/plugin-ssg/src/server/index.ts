import childProcess from 'child_process';
import path from 'path';
import type {
  AppNormalizedConfig,
  AppTools,
  PluginAPI,
} from '@modern-js/app-tools';
import type { ServerRoute as ModernRoute } from '@modern-js/types';
import { logger } from '@modern-js/utils';
import { openRouteSSR } from '../libs/util';
import type { SsgRoute } from '../types';
import { CLOSE_SIGN } from './consts';

export const createServer = (
  api: PluginAPI<AppTools>,
  ssgRoutes: SsgRoute[],
  pageRoutes: ModernRoute[],
  apiRoutes: ModernRoute[],
  options: AppNormalizedConfig,
  appDirectory: string,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    // this side of the shallow copy of a route for subsequent render processing, to prevent the modification of the current field
    // manually enable the server-side rendering configuration for all routes that require SSG
    const entries = ssgRoutes.map(route => route.entryName!);
    const backup: ModernRoute[] = openRouteSSR(pageRoutes, entries);

    const total = backup.concat(apiRoutes);

    const cp = childProcess.fork(path.join(__dirname, 'process'), {
      cwd: appDirectory,
      silent: true,
    });

    const appContext = api.useAppContext();
    // Todo: need use collect server plugins
    // maybe build command need add collect, or just call collectServerPlugin hooks
    const plugins = appContext.serverPlugins;

    cp.send(
      JSON.stringify({
        options,
        renderRoutes: ssgRoutes,
        routes: total,
        appContext: {
          // Make sure that bff runs the product of the dist directory, because we dont register ts-node in the child process
          apiDirectory: path.join(
            appContext.distDirectory,
            path.relative(appContext.appDirectory, appContext.apiDirectory),
          ),
          lambdaDirectory: path.join(
            appContext.distDirectory,
            path.relative(appContext.appDirectory, appContext.lambdaDirectory),
          ),
          appDirectory: appContext.appDirectory,
        },
        plugins,
        distDirectory: appContext.distDirectory,
      }),
    );

    const htmlChunks: string[] = [];
    const htmlAry: string[] = [];

    cp.on('message', (chunk: string) => {
      if (chunk !== null) {
        htmlChunks.push(chunk);
      } else {
        const html = htmlChunks.join('');
        htmlAry.push(html);
        htmlChunks.length = 0;
      }

      if (htmlAry.length === ssgRoutes.length) {
        cp.send(CLOSE_SIGN);
        resolve(htmlAry);
      }
    });

    cp.stderr?.on('data', chunk => {
      const str = chunk.toString();
      if (str.includes('Error')) {
        logger.error(str);
        reject(new Error('ssg render failed'));
        cp.kill('SIGKILL');
      } else {
        logger.info(str.replace(/[^\S\n]+/g, ' '));
      }
    });

    cp.stdout?.on('data', chunk => {
      const str = chunk.toString();
      logger.info(str.replace(/[^\S\n]+/g, ' '));
    });
  });
