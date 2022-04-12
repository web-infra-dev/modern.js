import path from 'path';
import type { CliPlugin } from '@modern-js/core';
import {
  fs,
  API_DIR,
  SERVER_DIR,
  SHARED_DIR,
  SERVER_BUNDLE_DIRECTORY,
  ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import { api as apiGenerate, ssr, web } from './generate';

type Route = {
  isSSR: boolean;
  isApi: boolean;
};

const copyfile = (target: string, source: string, fl: string[]) => {
  fl.forEach(ff => {
    const filepath = path.join(source, ff);
    if (!fs.existsSync(filepath)) {
      return;
    }

    const targetPath = path.join(target, ff);
    fs.copySync(filepath, targetPath);
  });
};

const BOOTSTRAP = 'bootstrap.js';

export default (): CliPlugin => {
  return {
    name: '@modern-js/plugin-multiprocess',

    pre: ['@modern-js/plugin-bff', '@modern-js/plugin-server'],

    setup: api => {
      return {
        afterBuild() {
          const { distDirectory, plugins } = api.useAppContext();
          const serverPluginPkgs = plugins
            .map(p => p.serverPkg)
            .filter(Boolean);

          const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
          const { routes } = fs.readJSONSync(routeJSON);

          let useSSR = false;
          let useAPI = false;
          routes.forEach((route: Route) => {
            if (route.isSSR) {
              useSSR = true;
            }

            if (route.isApi) {
              useAPI = true;
            }
          });

          // if not ssr or api, there is no need to deploy multiprocess.
          if (!useSSR && !useAPI) {
            return;
          }

          // create web-server product
          const webServerDir = path.join(distDirectory, 'web-server');
          fs.mkdirSync(webServerDir);
          copyfile(webServerDir, distDirectory, [
            'html',
            SERVER_DIR,
            SHARED_DIR,
            'route.json',
          ]);
          fs.writeFileSync(
            path.join(webServerDir, BOOTSTRAP),
            web(serverPluginPkgs),
          );

          // create ssr-server product
          if (useSSR) {
            const ssrServerDir = path.join(distDirectory, 'ssr-server');
            fs.mkdirSync(ssrServerDir);
            copyfile(ssrServerDir, distDirectory, [
              'html',
              SERVER_BUNDLE_DIRECTORY,
              'route.json',
              'loadable-stats.json',
            ]);
            fs.writeFileSync(path.join(ssrServerDir, BOOTSTRAP), ssr());
          }

          // create api-server product
          if (useAPI) {
            const apiServerDir = path.join(distDirectory, 'api-server');
            fs.mkdirSync(apiServerDir);
            copyfile(apiServerDir, distDirectory, [
              SHARED_DIR,
              API_DIR,
              'route.json',
            ]);
            fs.writeFileSync(
              path.join(apiServerDir, BOOTSTRAP),
              apiGenerate(serverPluginPkgs),
            );
          }
        },
      };
    },
  };
};
