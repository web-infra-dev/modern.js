import path from 'path';
import { logger, fs } from '@modern-js/utils';
import { createPlugin, useAppContext } from '@modern-js/core';
import { ServerRoute } from '@modern-js/types';

const MAIN_ENTRY_NAME = 'main';

/**
 * plugin for serve dist by user self, not use modern server
 * if serve by a baseUrl, should config output.assetPrefix to './'
 * then if use client route, should config router basename
 * or server.baseUrl(automatically apply to basename)
 */

export default createPlugin(() => ({
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { distDirectory } = useAppContext();
    const mainHtml = path.join(distDirectory, 'main.html');
    const indexHtml = path.join(distDirectory, 'index.html');

    // set main entry to index, for access from root path
    if (fs.existsSync(mainHtml) && !fs.existsSync(indexHtml)) {
      logger.info('Moving main.html to index.html for static hosting');
      fs.moveSync(mainHtml, path.join(distDirectory, 'index.html'));
    }
  },
}));
