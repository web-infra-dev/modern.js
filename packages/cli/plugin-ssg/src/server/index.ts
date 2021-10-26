import childProcess from 'child_process';
import path from 'path';
import { logger, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import { NormalizedConfig, useAppContext } from '@modern-js/core';
import { ModernRoute } from '@modern-js/server';
import { SsgRoute } from '../types';
import { CLOSE_SIGN } from './consts';

export const createServer = (
  ssgRoutes: SsgRoute[],
  apiRoutes: ModernRoute[],
  options: NormalizedConfig,
  appDirectory: string,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    // this side of the shallow copy of a route for subsequent render processing, to prevent the modification of the current field
    // manually enable the server-side rendering configuration for all routes that require SSG
    const backup: ModernRoute[] = ssgRoutes.map(ssgRoute => ({
      ...ssgRoute,
      isSSR: true,
      bundle: `${SERVER_BUNDLE_DIRECTORY}/${ssgRoute.entryName}.js`,
    }));

    const total = backup.concat(apiRoutes);

    const cp = childProcess.fork(path.join(__dirname, 'process'), {
      cwd: appDirectory,
      silent: true,
    });

    const appContext = useAppContext();
    const serverPlugins = appContext.plugins
      .filter((p: any) => p.server)
      .map((p: any) => p.server);
    const plugins = serverPlugins.map((p: any) => p.name);

    cp.send(
      JSON.stringify({
        options,
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

      if (htmlAry.length === backup.length) {
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
