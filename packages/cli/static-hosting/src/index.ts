import path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { logger, fs, isDev } from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';

const MAIN_ENTRY_NAME = 'main';

/**
 * plugin for serve dist by user self, not use modern server
 * if serve by a baseUrl, should config output.assetPrefix to './'
 * then if use client route, should config router basename
 * or server.baseUrl(automatically apply to basename)
 */

export default (): CliPlugin => ({
  name: '@modern-js/plugin-static-hosting',

  setup: api => {
    if (isDev()) {
      return {};
    } else {
      return {
        config() {
          return {
            output: {
              htmlPath: '.',
              disableHtmlFolder: true,
            },
          };
        },
        // simply handle some routes and make modern servers work as much as possible
        modifyServerRoutes({ routes }: { routes: ServerRoute[] }) {
          const updated = routes.map(route => {
            if (route.entryName === MAIN_ENTRY_NAME) {
              return {
                ...route,
                entryPath: route.entryPath.replace('main', 'index'),
              };
            }
            return route;
          });

          return { routes: updated };
        },
        async afterBuild() {
          const { distDirectory } = api.useAppContext();
          const mainHtml = path.join(distDirectory, 'main.html');
          const indexHtml = path.join(distDirectory, 'index.html');

          // set main entry to index, for access from root path
          if (fs.existsSync(mainHtml) && !fs.existsSync(indexHtml)) {
            logger.info('Moving main.html to index.html for static hosting');
            fs.moveSync(mainHtml, path.join(distDirectory, 'index.html'));
          }
        },
      };
    }
  },
});
