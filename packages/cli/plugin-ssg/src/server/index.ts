import childProcess from 'child_process';
import path from 'path';
import { logger } from '@modern-js/utils';
import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import { ServerRoute as ModernRoute } from '@modern-js/types';
import { openRouteSSR } from '../libs/util';
import { SsgRoute } from '../types';
import { CLOSE_SIGN } from './consts';

export const createServer = (
  api: PluginAPI,
  ssgRoutes: SsgRoute[],
  pageRoutes: ModernRoute[],
  apiRoutes: ModernRoute[],
  options: NormalizedConfig,
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
    const plugins = appContext.plugins.filter(p => p.server).map(p => p.server);

    cp.send(
      JSON.stringify({
        options,
        renderRoutes: ssgRoutes,
        routes: total,
        appDirectory,
        plugins,
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

    cp.stderr!.on('data', chunk => {
      const str = chunk.toString();
      if (str.includes('Error')) {
        logger.error(str);
        reject(new Error('ssg render failed'));
        cp.kill('SIGKILL');
      } else {
        logger.info(str.replace(/[^\S\n]+/g, ' '));
      }
    });

    cp.stdout!.on('data', chunk => {
      const str = chunk.toString();
      if (str.includes('Error')) {
        logger.error(str);
        reject(new Error('ssg render failed'));
        cp.kill('SIGKILL');
      } else {
        logger.info(str.replace(/[^\S\n]+/g, ' '));
      }
    });
  });
